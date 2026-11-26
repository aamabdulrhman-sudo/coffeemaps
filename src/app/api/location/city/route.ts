import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { resolveCityFromCoords } from '@/lib/geocoding';

const coordsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = coordsSchema.safeParse({
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Valid lat and lng are required' }, { status: 400 });
    }

    const shops = await prisma.shop.findMany({
      select: { city: true, latitude: true, longitude: true },
    });

    const city = await resolveCityFromCoords(parsed.data.lat, parsed.data.lng, shops);

    return NextResponse.json({ city });
  } catch (error) {
    console.error('GET /api/location/city error:', error);
    return NextResponse.json({ error: 'Failed to resolve city' }, { status: 500 });
  }
}
