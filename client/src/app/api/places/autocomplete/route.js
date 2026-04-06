export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');
  if (!input) return Response.json({ predictions: [] });

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.error('Google Maps API key missing');
    return Response.json({ status: 'REQUEST_DENIED', predictions: [] });
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
    `?input=${encodeURIComponent(input)}` +
    `&key=${key}` +
    `&components=country:in` +
    `&location=19.0760,72.8777` +
    `&radius=500000` +
    `&language=en`;

  try {
    const res = await fetch(url, {
      headers: { Referer: 'http://localhost:3000' },
    });
    const data = await res.json();
    console.log('Places autocomplete status:', data.status, '| count:', data.predictions?.length);
    return Response.json(data);
  } catch (err) {
    console.error('Places autocomplete error:', err);
    return Response.json({ status: 'ERROR', predictions: [] });
  }
}
