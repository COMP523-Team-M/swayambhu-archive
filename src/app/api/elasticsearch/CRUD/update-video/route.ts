import { NextRequest, NextResponse } from "next/server";
import client from "@/utils-ts/elasticsearch";
import { generateEmbedding } from "@/utils-ts/generateEmbeddings";
import { v4 as uuidv4 } from "uuid";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

// Type definitions for transcript
interface TranscriptWord {
  startOffset?: string;
  endOffset: string;
  word: string;
  confidence: number;
}

interface TranscriptAlternative {
  transcript: string;
  confidence: number;
  words: TranscriptWord[];
}

interface TranscriptResult {
  alternatives: TranscriptAlternative[];
  resultEndOffset?: string;
  languageCode?: string;
}

interface TranscriptJson {
  results: TranscriptResult[];
}

// Request and response types
interface UpdateRequestBody {
  vidID: string;
  vidTitle?: string;
  vidDescription?: string;
  uploadDate?: string;
  recordDate?: string;
  location?: string;
  tags?: string[];
  baseVideoURL?: string;
  updateType?: "english" | "nepali" | "both";
  transcriptEnUpdates?: {
    segmentIndex: number;
    newTranscript: string;
  }[];
  transcriptNeUpdates?: {
    segmentIndex: number;
    newTranscript: string;
  }[];
}

interface VideoDocument {
  vidID: string;
  vidTitle: string;
  vidDescription: string;
  uploadDate: string;
  recordDate: string;
  location: string;
  transcript: string;
  englishTranslation: string;
  tags: string[];
  baseVideoURL: string;
  transcriptJson: TranscriptJson;
  englishTranscriptJson: TranscriptJson;
  transcriptEmbedding: number[];
}

function convertTimeToSeconds(timeString: string): number {
  timeString = timeString.replace("s", "");
  return Math.floor(parseFloat(timeString));
}

async function translateText(text: string): Promise<string> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATION_API_KEY}`;
  const body = {
    q: text,
    target: "en",
    format: "text",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Error during translation:", data.error);
    throw new Error(data.error.message || "Translation failed");
  }

  return data.data.translations[0].translatedText;
}

export async function PUT(request: NextRequest) {
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();
  if (!isLoggedIn) {
    redirect("/api/auth/login");
  }

  try {
    const body: UpdateRequestBody = await request.json();
    const {
      vidID,
      updateType,
      transcriptEnUpdates,
      transcriptNeUpdates,
      ...metadataUpdates
    } = body;

    const response = await client.get({
      index: "videos",
      id: vidID,
    });

    if (!response.found) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const currentVideo = response._source as VideoDocument;
    if (!currentVideo) {
      return NextResponse.json(
        { error: "Video data is missing" },
        { status: 404 },
      );
    }

    const updateBody: { doc: Partial<VideoDocument> } = {
      doc: { ...metadataUpdates },
    };

    const assignEnglishUpdate = () => {
      if (transcriptEnUpdates && transcriptEnUpdates.length > 0) {
        const englishTranscript = { ...currentVideo.englishTranscriptJson };

        for (const update of transcriptEnUpdates) {
          englishTranscript.results[
            update.segmentIndex
          ].alternatives[0].transcript = update.newTranscript;
        }

        return englishTranscript;
      }
    };

    const assignNepaliUpdate = async () => {
      if (transcriptNeUpdates && transcriptNeUpdates.length > 0) {
        const nepaliTranscript = { ...currentVideo.transcriptJson };

        for (const update of transcriptNeUpdates) {
          nepaliTranscript.results[
            update.segmentIndex
          ].alternatives[0].transcript = update.newTranscript;
        }

        const transcriptText = nepaliTranscript?.results
          .map((result: TranscriptResult) => result.alternatives[0].transcript)
          .join(" ");

        const transcriptEmbedding = await generateEmbedding(transcriptText);

        return {
          transcriptEmbedding: transcriptEmbedding,
          transcriptText: transcriptText,
          nepaliTranscript: nepaliTranscript,
        };
      }
      return {
        transcriptEmbedding: undefined,
        transcriptText: undefined,
        nepaliTranscript: undefined,
      };
    };

    let transcriptJson: TranscriptJson = currentVideo.transcriptJson;
    switch (updateType) {
      case "english": {
        const englishTranscript = assignEnglishUpdate();
        const translation = englishTranscript?.results
          .map((result: TranscriptResult) => result.alternatives[0].transcript)
          .join(" ");

        updateBody.doc = {
          ...updateBody.doc,
          transcriptJson: currentVideo.transcriptJson,
          englishTranscriptJson: englishTranscript,
          transcript: currentVideo.transcript,
          englishTranslation: translation,
          transcriptEmbedding: currentVideo.transcriptEmbedding,
        };
        break;
      }
      case "both": {
        const englishTranscript = assignEnglishUpdate();
        const { transcriptEmbedding, transcriptText, nepaliTranscript } =
          await assignNepaliUpdate();
        const translation = englishTranscript?.results
          .map((result: TranscriptResult) => result.alternatives[0].transcript)
          .join(" ");

        updateBody.doc = {
          ...updateBody.doc,
          transcriptJson: nepaliTranscript,
          englishTranscriptJson: englishTranscript,
          transcript: transcriptText,
          englishTranslation: translation,
          transcriptEmbedding,
        };
        if (nepaliTranscript) transcriptJson = nepaliTranscript;
        break;
      }
      case "nepali": {
        const { transcriptEmbedding, transcriptText, nepaliTranscript } =
          await assignNepaliUpdate();

        if (transcriptEmbedding && transcriptText && nepaliTranscript) {
          const englishTranscript = await translateText(transcriptText);

          const splitTranscriptByIntervals = (
            fullTranscript: string,
            nepaliIntervals: TranscriptJson["results"],
          ): TranscriptJson["results"] => {
            let currentPosition = 0;

            return nepaliIntervals.map((result) => {
              const { transcript: nepaliSegment } = result.alternatives[0];
              const segmentLength = nepaliSegment.length;

              // Extract the corresponding English segment
              const englishSegment = fullTranscript.slice(
                currentPosition,
                currentPosition + segmentLength,
              );

              // Update the position tracker
              currentPosition += segmentLength;

              return {
                alternatives: [
                  {
                    ...result.alternatives[0],
                    transcript: englishSegment,
                  },
                ],
              };
            });
          };

          // Use the splitting function to generate the English intervals
          const englishTranscriptJson: TranscriptJson = {
            results: splitTranscriptByIntervals(
              englishTranscript,
              nepaliTranscript.results,
            ),
          };

          console.log(englishTranscript);
          console.log(transcriptText);

          return;

          // const englishTranscriptJson: TranscriptJson = {
          //   results: await Promise.all(
          //     nepaliTranscript.results.map(
          //       async (result: TranscriptResult) => ({
          //         alternatives: [
          //           {
          //             ...result.alternatives[0],
          //             transcript: await translateText(
          //               result.alternatives[0].transcript,
          //             ),
          //           },
          //         ],
          //       }),
          //     ),
          //   ),
          // };

          updateBody.doc = {
            ...updateBody.doc,
            transcriptJson: nepaliTranscript,
            englishTranscriptJson,
            transcript: transcriptText,
            englishTranslation: englishTranscript,
            transcriptEmbedding,
          };
        }
        if (nepaliTranscript) transcriptJson = nepaliTranscript;
        break;
      }
    }

    // if (transcriptUpdates && transcriptUpdates.length > 0) {
    //   const transcriptJson = { ...currentVideo.transcriptJson };

    //   for (const update of transcriptUpdates) {
    //     transcriptJson.results[update.segmentIndex].alternatives[0].transcript =
    //       update.newTranscript;
    //   }

    //   const transcriptText = transcriptJson.results
    //     .map((result: TranscriptResult) => result.alternatives[0].transcript)
    //     .join(" ");

    //   const transcriptEmbedding = await generateEmbedding(transcriptText);
    //   const englishTranscript = await translateText(transcriptText);

    //   const englishTranscriptJson: TranscriptJson = {
    //     results: await Promise.all(
    //       transcriptJson.results.map(async (result: TranscriptResult) => ({
    //         alternatives: [
    //           {
    //             ...result.alternatives[0],
    //             transcript: await translateText(
    //               result.alternatives[0].transcript,
    //             ),
    //           },
    //         ],
    //       })),
    //     ),
    //   };

    //   updateBody.doc = {
    //     ...updateBody.doc,
    //     transcriptJson,
    //     englishTranscriptJson,
    //     transcript: transcriptText,
    //     englishTranslation: englishTranscript,
    //     transcriptEmbedding,
    //   };

    await client.deleteByQuery({
      index: "video_snippets",
      body: {
        query: {
          match: { vidID },
        },
      },
    });

    for (let i = 0; i < transcriptJson.results.length; i++) {
      const result: TranscriptResult = transcriptJson.results[i];
      const transcriptID = uuidv4();
      const transcriptSnippet = result.alternatives[0].transcript;

      const snippetEmbedding = await generateEmbedding(transcriptSnippet);
      const englishSnippet = await translateText(transcriptSnippet);

      const firstWord = result.alternatives[0].words[0];
      const lastWord =
        result.alternatives[0].words[result.alternatives[0].words.length - 1];
      const startTime = convertTimeToSeconds(
        firstWord.startOffset || firstWord.endOffset,
      );
      const endTime = convertTimeToSeconds(lastWord.endOffset);
      const videoLinkToSnippet = `${currentVideo.baseVideoURL}&t=${startTime}s`;

      await client.index({
        index: "video_snippets",
        id: transcriptID,
        body: {
          transcriptID,
          vidID,
          timeSegment: startTime,
          endTime,
          transcriptSnippet,
          englishTranslation: englishSnippet,
          videoLinkToSnippet,
          snippetEmbedding,
        },
      });
    }

    await client.update({
      index: "videos",
      id: vidID,
      body: updateBody,
    });

    return NextResponse.json({
      message: "Video updated successfully",
    });
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 },
    );
  }
}
