import speech from "@google-cloud/speech";
import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  process.env.GOOGLE_APPLICATION_CREDENTIALS =
    "classwork4-439721-7209a5dbe146.json";

  const file = formData.get("audio") as File;
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

  async function transcribeSpeech() {
    const transcriptionRequest = {
      recognizer:
        "projects/classwork4-439721/locations/us-central1/recognizers/_",
      config: recognitionConfig,
      files: audioFiles,
      recognitionOutputConfig: outputPath,
    };

    return client.batchRecognize(transcriptionRequest);
  }

  const response = await transcribeSpeech();
  console.log(response);

  return NextResponse.json(response);
}
