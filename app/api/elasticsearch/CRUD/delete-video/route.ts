import { NextResponse } from 'next/server';
import client from '../../../../../utils-ts/elasticsearch';

export async function DELETE(request: Request) {
  try {
    // Get vidID from the URL search params
    const { searchParams } = new URL(request.url);
    const vidID = searchParams.get('vidID');

    if (!vidID) {
      return NextResponse.json(
        { message: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Step 1: Delete the main video document
    await client.delete({
      index: 'videos',
      id: vidID,
    });

    // Step 2: Delete all related snippets
    await client.deleteByQuery({
      index: 'video_snippets',
      body: {
        query: {
          match: { vidID },
        },
      },
    });

    return NextResponse.json(
      { message: 'Video and associated snippets deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting video and snippets:', error);
    return NextResponse.json(
      { message: 'Failed to delete video and snippets' },
      { status: 500 }
    );
  }
}