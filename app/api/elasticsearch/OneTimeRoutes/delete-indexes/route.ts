import { NextResponse } from 'next/server';
import client from '../../../../../utils-ts/elasticsearch';

export async function DELETE() {
  try {
    await client.indices.delete({ index: 'videos' });
    await client.indices.delete({ index: 'video_snippets' });
    
    return NextResponse.json(
      { message: 'Indexes deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting indexes:', error);
    return NextResponse.json(
      { message: 'Error deleting indexes' },
      { status: 500 }
    );
  }
}