export async function POST(req) {
  try {
    const { addresses } = await req.json();

    if (!Array.isArray(addresses) || addresses.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid addresses array' }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      });
    }

    const batchSize = 10;
    const results = [];

    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (address) => {
        try {
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

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const data = await res.json();
          return { address, data, success: true };
        } catch (error) {
          return { 
            address, 
            data: { result: { data: { json: { address, eligibilityData: {} } } } }, 
            success: false,
            error: error.message 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data from server' }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
      },
    });
  }
}
