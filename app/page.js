'use client';

import { useState } from 'react';

export default function Home() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const fetchClaimData = async () => {
    setLoading(true);
    setResult(null);

    const allAddresses = address.split('\n').map(addr => addr.trim()).filter(addr => addr.length > 0);
    const addresses = [...new Set(allAddresses)];
    
    if (addresses.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setProgress({ current: 0, total: addresses.length });
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const batchResults = await response.json();
      
      setProgress({ current: addresses.length, total: addresses.length });
      
      const results = [];
      batchResults.forEach(item => {
        if (item.success && Array.isArray(item.data)) {
          results.push(...item.data);
        }
      });
      
      setResult(results);
    } catch (error) {
      console.error('Error fetching data:', error);
      setResult([{ result: { data: { json: { address: 'Error', eligibilityData: {} } } } }]);
    }

    setLoading(false);
  };

  const exportToCSV = () => {
    if (!Array.isArray(result)) return;

    const allKeys = new Set();
    result.forEach(item => {
      const eligibilities = item.result?.data?.json?.eligibilityData || {};
      Object.keys(eligibilities).forEach(k => allKeys.add(k));
    });
    const sortedKeys = Array.from(allKeys);

    const addressData = new Map();
    result.forEach(item => {
      const json = item.result?.data?.json;
      if (json && json.address) {
        const eligibilities = json.eligibilityData || {};
        
        if (addressData.has(json.address)) {
          const existing = addressData.get(json.address);
          Object.keys(eligibilities).forEach(key => {
            existing[key] = (existing[key] || 0) + eligibilities[key];
          });
        } else {
          addressData.set(json.address, { ...eligibilities });
        }
      }
    });

    const headers = ['Address', ...sortedKeys, 'Total Allocation'];
    const csvContent = [
      headers.join(','),
      ...Array.from(addressData.entries()).map(([addr, eligibilities]) => {
        const total = Object.values(eligibilities).reduce((a, b) => a + b, 0);
        
        const row = [
          addr,
          ...sortedKeys.map(key => eligibilities[key] !== undefined ? eligibilities[key].toFixed(4) : ''),
          total.toFixed(4)
        ];
        return row.join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caldera-checker-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderTable = () => {
    if (!Array.isArray(result)) return null;

    const allKeys = new Set();
    result.forEach(item => {
      const eligibilities = item.result?.data?.json?.eligibilityData || {};
      Object.keys(eligibilities).forEach(k => allKeys.add(k));
    });
    const sortedKeys = Array.from(allKeys);

    const uniqueAddresses = new Set();
    const addressAllocations = new Map();
    
    result.forEach(item => {
      const json = item.result?.data?.json;
      if (json && json.address) {
        uniqueAddresses.add(json.address);
        
        const eligibilities = json.eligibilityData || {};
        const addressTotal = Object.values(eligibilities).reduce((a, b) => a + b, 0);
        
        if (addressAllocations.has(json.address)) {
          addressAllocations.set(json.address, addressAllocations.get(json.address) + addressTotal);
        } else {
          addressAllocations.set(json.address, addressTotal);
        }
      }
    });
    
    const totalAddresses = uniqueAddresses.size;
    const addressesWithAllocation = Array.from(addressAllocations.values()).filter(total => total > 0).length;
    const totalAllocation = Array.from(addressAllocations.values()).reduce((sum, total) => sum + total, 0);

    return (
      <div className="mt-8 w-full overflow-x-auto">
        <div className="modern-summary">
          <h3 className="modern-summary-title">Summary Statistics</h3>
          <div className="modern-summary-grid">
            <div className="modern-summary-item">
              <div className="modern-summary-value" style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {totalAddresses}
              </div>
              <div className="modern-summary-label">Total Addresses</div>
            </div>
            <div className="modern-summary-item">
              <div className="modern-summary-value" style={{ background: 'linear-gradient(135deg, #06b6d4, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {addressesWithAllocation}
              </div>
              <div className="modern-summary-label">With Allocation</div>
            </div>
            <div className="modern-summary-item">
              <div className="modern-summary-value" style={{ background: 'linear-gradient(135deg, #f59e0b, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {totalAllocation.toFixed(4)}
              </div>
              <div className="modern-summary-label">Total Allocation</div>
            </div>
          </div>
          <div className="text-center">
            <button
              onClick={exportToCSV}
              className="modern-export-btn"
            >
              Export to CSV
            </button>
          </div>
        </div>

        <table className="modern-table w-full text-xs md:text-sm">
          <thead>
            <tr>
              <th className="w-[40%]">Address</th>
              {sortedKeys.map((key) => (
                <th key={key} className="w-[20%]">{key}</th>
              ))}
              <th className="w-[20%]">Total Allocation</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(addressAllocations.entries()).map(([addr, totalAllocation], i) => {
              const addressEligibilities = {};
              result.forEach(item => {
                const json = item.result?.data?.json;
                if (json && json.address === addr) {
                  const eligibilities = json.eligibilityData || {};
                  Object.keys(eligibilities).forEach(key => {
                    addressEligibilities[key] = (addressEligibilities[key] || 0) + eligibilities[key];
                  });
                }
              });

              return (
                <tr key={i}>
                  <td className="break-all text-center font-mono text-sm">{addr}</td>
                  {sortedKeys.map((key) => (
                    <td key={key} className="text-center">
                      {addressEligibilities[key] !== undefined ? addressEligibilities[key].toFixed(4) : '-'}
                    </td>
                  ))}
                  <td className="text-center font-semibold" style={{ color: '#06b6d4' }}>
                    {totalAllocation.toFixed(4)}
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
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="modern-card w-full max-w-4xl">
        <h1 className="modern-title">Caldera Airdrop Checker</h1>

        <textarea
          placeholder="Input addresses (one per line)&#10;Example:&#10;0x1234...&#10;0x5678...&#10;0x9abc..."
          className="modern-textarea w-full mb-6 resize-none"
          rows={6}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        
        {address && (
          <div className="text-sm mb-4 text-center" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {address.split('\n').map(addr => addr.trim()).filter(addr => addr.length > 0).length} address(es) detected
          </div>
        )}

        <button
          onClick={fetchClaimData}
          disabled={loading || !address}
          className="modern-btn w-full"
        >
          {loading ? 'Processing addresses...' : 'Check Eligibility'}
        </button>

        {loading && progress.total > 0 && (
          <div className="mt-6 text-center">
            <div className="text-sm mb-3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Processing {progress.current} of {progress.total} addresses...
            </div>
            <div className="modern-progress">
              <div 
                className="modern-progress-bar"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {result && renderTable()}
      </div>

      <footer className="modern-footer">
        Created by <a href="https://x.com/PandaEverX" target="_blank" rel="noopener noreferrer">PandaEverX</a>
      </footer>
    </main>
  );
}
