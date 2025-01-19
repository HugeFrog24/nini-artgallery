import { NextRequest, NextResponse } from 'next/server';
import { getArtworks } from '@/data/artworks';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    console.log('API received search term:', searchTerm);
    
    // Only include search term if it's not empty
    const options = {
      category: searchParams.get('category') || undefined,
      year: searchParams.get('year') || undefined,
      medium: searchParams.get('medium') || undefined,
      search: searchTerm?.trim() || undefined, // Convert empty or null to undefined
      sortBy: searchParams.get('sortBy') || undefined,
      order: (searchParams.get('order') || 'asc') as 'asc' | 'desc'
    };
    console.log('Fetching artworks with options:', options);

    const sections = await getArtworks(options);
    console.log('API returning sections:', sections);

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error processing artworks request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}