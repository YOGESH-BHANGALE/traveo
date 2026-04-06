export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('place_id');
  if (!placeId) return Response.json({ result: null });

  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'geometry,formatted_address,address_components,name,types',
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    language: 'en',
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
    { headers: { Referer: 'http://localhost:3000' } }
  );
  const data = await res.json();
  return Response.json(data);
}
