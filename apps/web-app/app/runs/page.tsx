"use client";
import React, { useEffect, useState } from 'react';

export default function RunsPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    fetch(`${baseUrl}/api/runs`)
      .then(res => res.json())
      .then(d => {
         if (d.success) setRuns(d.data || []);
         setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pipeline Runs Observability</h1>
      {loading ? <p>Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead className="bg-slate-100">
              <tr className="border-b border-slate-200">
                <th className="p-2">Run ID</th>
                <th className="p-2">Stage</th>
                <th className="p-2">Status</th>
                <th className="p-2">Latency (ms)</th>
                <th className="p-2">Started At</th>
                <th className="p-2">Error / Info</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r: any, idx) => (
                <tr key={`${r.runId}-${idx}`} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-2 font-mono text-sm">{r.runId}</td>
                  <td className="p-2">{r.stage}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : r.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-2">{r.latency}</td>
                  <td className="p-2 text-sm">{r.startedAt}</td>
                  <td className="p-2 text-sm text-red-600">{r.error || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

