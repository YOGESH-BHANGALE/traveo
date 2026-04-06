export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const latlng = searchParams.get('latlng');
  if (!latlng) return Response.json({ results: [] });

  const params = new URLSearchParams({
    latlng,
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    language: 'en',
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
    { headers: { Referer: 'http://localhost:3000' } }
  );
  const data = await res.json();
  return Response.json(data);
}
