export async function POST(req) {
  try {
    const { address } = await req.json();

    const inputObject = {
      "0": { "json": { "address": address } },
      "1": { "json": { "address": address } }
    };

    const encodedInput = encodeURIComponent(JSON.stringify(inputObject));
    const url = `https://claim.caldera.foundation/api/trpc/claims.getClaim,eligibility.getEthAddressEligibility?batch=1&input=${encodedInput}`;

    const res = await fetch(url, {
      headers: {
        'content-type': 'application/json',
      },
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Gagal mengambil data (server)' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  }
}
