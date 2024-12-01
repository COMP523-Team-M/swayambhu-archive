import client from "@/utils-ts/elasticsearch";
import { v4 as uuidv4 } from "uuid";
import { generateEmbedding } from "@/utils-ts/generateEmbeddings";
import { NextRequest } from "next/server";
import speech from "@google-cloud/speech";
import { Storage } from "@google-cloud/storage";

// Type definitions
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

interface RequestBody {
  vidDescription: string;
  uploadDate: string;
  recordDate: string;
  location: string;
  transcriptJson: TranscriptJson;
  tags: string[];
  baseVideoURL: string;
}

interface TranscriptSegment {
  transcriptSnippet: string;
  startTime: number;
  endTime: number;
  videoLinkToSnippet: string;
  transcriptSegmentIndex: number;
}

/**
 * Extracts YouTube video ID from a YouTube URL
 */
function extractYouTubeVideoId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  throw new Error("Invalid YouTube URL format");
}

/**
 * Converts a time string (e.g., "0.320s" or "00:00.4") to total seconds as an integer.
 */
function convertTimeToSeconds(timeString: string): number {
  timeString = timeString.replace("s", "");
  return Math.floor(parseFloat(timeString));
}

/**
 * Extracts segments from the JSON response with timestamps.
 */
function extractTranscriptSegments(
  results: TranscriptResult[],
  baseVideoURL: string,
): TranscriptSegment[] {
  return results.map((result, index) => {
    const alternative = result.alternatives[0];
    const transcriptSnippet = alternative.transcript;

    const firstWord = alternative.words[0];
    const lastWord = alternative.words[alternative.words.length - 1];

    const startTime = firstWord.startOffset || firstWord.endOffset;
    const endTime = lastWord.endOffset;

    const startTimeInSeconds = convertTimeToSeconds(startTime);
    const endTimeInSeconds = convertTimeToSeconds(endTime);

    const videoLinkToSnippet = `${baseVideoURL}&t=${startTimeInSeconds}s`;

    return {
      transcriptSnippet,
      startTime: startTimeInSeconds,
      endTime: endTimeInSeconds,
      videoLinkToSnippet,
      transcriptSegmentIndex: index,
    };
  });
}

/**
 * Transcribes a given text using Google Cloud Speech-to-Text API.
 */
async function transcribeAudio(file: File) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS =
    "classwork4-439721-7209a5dbe146.json";

  if (!file) throw new Error("No file provided");
  if (file.size < 1) throw new Error("File is empty");

  const buffer = await file.arrayBuffer();

  const storage = new Storage();
  await storage
    .bucket("test-speech123")
    .file("audio-files/" + file.name)
    .save(Buffer.from(buffer));

  // Instantiates a client
  const client = new speech.v2.SpeechClient({
    apiEndpoint: "us-central1-speech.googleapis.com",
  });

  const audioPath = `gs://test-speech123/audio-files/${file.name}`;

  const workspace = "gs://test-speech123/transcripts";

  const recognitionConfig = {
    autoDecodingConfig: {},
    model: "chirp_2",
    languageCodes: ["ne-NP"],
    features: {
      enableWordTimeOffsets: true,
      enable_word_confidence: true,
    },
  };

  const audioFiles = [{ uri: audioPath }];
  const outputPath = {
    gcsOutputConfig: {
      uri: workspace,
    },
  };

  const transcriptionRequest = {
    recognizer:
      "projects/classwork4-439721/locations/us-central1/recognizers/_",
    config: recognitionConfig,
    files: audioFiles,
    recognitionOutputConfig: outputPath,
  };

  const [operation] = await client.batchRecognize(transcriptionRequest);
  console.log(await operation.promise());

  const [files] = await storage.bucket("test-speech123").getFiles({
    prefix: "transcripts/",
  });

  const transcriptFile = files.find(
    (file) =>
      file.name.includes(file.name.split(".")[0]) &&
      file.name.includes("_transcript_"),
  );

  if (!transcriptFile) {
    throw new Error("Transcription result file not found.");
  }

  const [fileContent] = await transcriptFile.download();

  const transcriptJson = JSON.parse(fileContent.toString());

  console.log("Transcription result:", transcriptJson);

  return transcriptJson;
}

/**
 * Translates a given text from Nepali to English using Google Cloud Translation API.
 */
async function translateText(text: string): Promise<string> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATION_API_KEY}`;

  const body = {
    q: text,
    target: "en",
    format: "text",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error during translation:", data.error);
    throw new Error(data.error.message || "Translation failed");
  }

  return data.data.translations[0].translatedText;
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();

    const temp = form.get("tags") as string;
    const tempArr = temp.replace(/\s+/g, "").split(",");

    const body: RequestBody = {
      vidDescription: form.get("vidDescription")!.toString(),
      uploadDate: form.get("uploadDate")!.toString(),
      recordDate: form.get("recordDate")!.toString(),
      location: form.get("location")!.toString(),
      // transcriptJson: "yeet" as unknown as TranscriptJson,
      transcriptJson: await transcribeAudio(form.get("audio") as File),
      tags: tempArr,
      baseVideoURL: form.get("baseVideoURL")!.toString(),
    };

    const {
      vidDescription,
      uploadDate,
      recordDate,
      location,
      transcriptJson,
      tags,
      baseVideoURL,
    } = body;

    if (!transcriptJson || !transcriptJson.results) {
      return Response.json(
        { message: "Invalid transcript JSON format" },
        { status: 400 },
      );
    }

    // Extract YouTube video ID from URL
    const vidID = extractYouTubeVideoId(baseVideoURL);

    // Step 2: Convert JSON transcript to plain text and generate embedding
    const transcriptText = transcriptJson.results
      .map((result) => result.alternatives[0].transcript)
      .join(" ");

    const transcriptEmbedding = await generateEmbedding(transcriptText);

    // Step 3: Create English version of transcript JSON
    const englishTranscriptJson = {
      results: await Promise.all(
        transcriptJson.results.map(async (result) => ({
          alternatives: [
            {
              ...result.alternatives[0],
              transcript: await translateText(
                result.alternatives[0].transcript,
              ),
            },
          ],
        })),
      ),
    };

    // Step 4: Translate full transcript to English
    const englishTranscript = await translateText(transcriptText);

    // Step 5: Insert metadata and full transcript with embedding into the 'videos' index
    await client.index({
      index: "videos",
      id: vidID,
      body: {
        vidID,
        vidDescription,
        uploadDate,
        recordDate,
        location,
        transcript: transcriptText,
        englishTranslation: englishTranscript,
        tags,
        baseVideoURL,
        transcriptJson,
        englishTranscriptJson,
        transcriptEmbedding,
      },
    });

    // Step 6: Extract segments with timestamps from the transcript JSON
    const transcriptSegments = extractTranscriptSegments(
      transcriptJson.results,
      baseVideoURL,
    );

    // Step 7: Add each transcript snippet to the 'video_snippets' index with generated embeddings
    for (const segment of transcriptSegments) {
      const transcriptID = uuidv4();
      const snippetEmbedding = await generateEmbedding(
        segment.transcriptSnippet,
      );
      const englishSnippet = await translateText(segment.transcriptSnippet);

      await client.index({
        index: "video_snippets",
        id: transcriptID,
        body: {
          transcriptID,
          vidID,
          timeSegment: segment.startTime,
          endTime: segment.endTime,
          transcriptSnippet: segment.transcriptSnippet,
          englishTranslation: englishSnippet,
          videoLinkToSnippet: segment.videoLinkToSnippet,
          snippetEmbedding,
        },
      });
    }

    return Response.json({
      message: "Video and transcript snippets added successfully",
    });
  } catch (error) {
    console.error("Error adding video data:", error);
    return Response.json(
      { message: "Failed to add video data" },
      { status: 500 },
    );
  }
}
