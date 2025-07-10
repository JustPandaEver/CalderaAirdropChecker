'use client';

import { useState } from 'react';

export default function Home() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchClaimData = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult([{ result: { data: { json: { address, eligibilityData: {} } } } }]);
    }

    setLoading(false);
  };

  const renderTable = () => {
    if (!Array.isArray(result)) return null;

    const allKeys = new Set();
    result.forEach(item => {
      const eligibilities = item.result?.data?.json?.eligibilityData || {};
      Object.keys(eligibilities).forEach(k => allKeys.add(k));
    });
    const sortedKeys = Array.from(allKeys);

    return (
      <div className="mt-6 w-full overflow-x-auto">
        <table className="w-full text-xs md:text-sm border border-white table-fixed">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border border-white px-2 py-2 text-center w-[40%]">Address</th>
              {sortedKeys.map((key) => (
                <th key={key} className="border border-white px-2 py-2 text-center w-[20%]">{key}</th>
              ))}
              <th className="border border-white px-2 py-2 text-center w-[20%]">Total Allocation</th>
            </tr>
          </thead>
          <tbody>
            {result.map((item, i) => {
              const json = item.result?.data?.json;
              if (!json) return null;

              const eligibilities = json.eligibilityData || {};
              const total = Object.values(eligibilities).reduce((a, b) => a + b, 0);

              return (
                <tr key={i} className="bg-gray-900 text-white hover:bg-gray-800">
                  <td className="border border-white px-2 py-2 break-all text-center">{json.address}</td>
                  {sortedKeys.map((key) => (
                    <td key={key} className="border border-white px-2 py-2 text-center">
                      {eligibilities[key] !== undefined ? eligibilities[key].toFixed(4) : '-'}
                    </td>
                  ))}
                  <td className="border border-white px-2 py-2 text-center font-semibold text-green-400">
                    {total.toFixed(4)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="border border-white p-6 rounded w-full max-w-3xl shadow-lg">
        <h1 className="text-xl md:text-2xl mb-6 text-center font-bold">Caldera Checker</h1>

        <input
          type="text"
          placeholder="Masukkan address Ethereum..."
          className="w-full p-3 mb-4 bg-black text-white border border-white rounded focus:outline-none focus:ring-2 focus:ring-sky-400 text-sm md:text-base"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button
          onClick={fetchClaimData}
          disabled={loading || !address}
          className="w-full bg-sky-400 text-black font-bold py-2 rounded hover:bg-sky-300 text-sm md:text-base"
        >
          {loading ? 'Memproses...' : 'Cek'}
        </button>

        {result && renderTable()}
      </div>

      {/* Footer */}
      <footer className="text-white mt-6 text-sm opacity-60">
        Created by <a href="https://x.com/lunairefine" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-400">Lunairefine</a>
      </footer>
    </main>
  );
}
