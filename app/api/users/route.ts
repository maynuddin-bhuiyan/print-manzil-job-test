import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    // Get the URL parameters
    const { searchParams } = new URL(request.url);
    const paginate = searchParams.get('paginate');
    const search = searchParams.get('search');
    const page = searchParams.get('page');

    // Make the request to the external API
    const response = await axios.get('https://api.razzakfashion.com/', {
      params: {
        paginate,
        search: search || undefined,
        page
      }
    });

    // Return the response data
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
} 