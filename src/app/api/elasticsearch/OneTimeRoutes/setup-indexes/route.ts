import { NextResponse } from "next/server";
import client from "@/utils-ts/elasticsearch";

async function setupIndices() {
  try {
    // Create videos index
    await client.indices.create({
      index: "videos",
      body: {
        mappings: {
          properties: {
            vidID: { type: "keyword" },
            vidTitle: { type: "text" },
            vidDescription: { type: "text" },
            uploadDate: { type: "date" },
            recordDate: { type: "date" },
            location: { type: "text" },
            transcript: { type: "text" },
            englishTranslation: { type: "text" },
            tags: { type: "text" },
            baseVideoURL: { type: "text" },
            transcriptJson: {
              type: "object",
              enabled: false, // Non-searchable
            },
            englishTranscriptJson: {
              type: "object",
              enabled: false, // Non-searchable
            },
            transcriptEmbedding: {
              type: "dense_vector",
              dims: 3072,
              index: true,
              similarity: "cosine",
              index_options: {
                type: "hnsw",
                m: 16,
                ef_construction: 100,
              },
            },
          },
        },
      },
    });

    // Create video_snippets index
    await client.indices.create({
      index: "video_snippets",
      body: {
        mappings: {
          properties: {
            transcriptID: { type: "keyword" },
            vidID: { type: "keyword" },
            timeSegment: { type: "integer" },
            endTime: { type: "integer" },
            transcriptSnippet: { type: "text" },
            englishTranslation: { type: "text" },
            videoLinkToSnippet: { type: "text" },
            snippetEmbedding: {
              type: "dense_vector",
              dims: 3072,
              index: true,
              similarity: "cosine",
              index_options: {
                type: "hnsw",
                m: 16,
                ef_construction: 100,
              },
            },
          },
        },
      },
    });

    console.log("Indices created successfully");
    return { message: "Indices created successfully" };
  } catch (error) {
    console.error("Error creating indices:", error);
    throw error;
  }
}

export async function POST() {
  try {
    const result = await setupIndices();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create indices" },
      { status: 500 },
    );
  }
}
