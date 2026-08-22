"use client";
import React, { useEffect, useState } from 'react';

export default function EvidencePage() {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    fetch(`${baseUrl}/api/evidence?page=1&limit=50`)
      .then(res => res.json())
      .then(d => {
         if (d.success) setEvidence(d.data || []);
         setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Evidence Sandbox</h1>
      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evidence.map((e: any) => {
            const status = e.metadata?.extractionStatus || 'UNKNOWN';
            const isSuccess = status === 'SUCCESS';
            
            return (
              <div key={e.id} className="border border-slate-200 p-4 rounded shadow-sm bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800">{e.metadata?.originalFilename || 'Unknown File'}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">Type: {e.type} | ID: <span className="font-mono">{e.id}</span></p>
                
                {e.metadata?.extractionError && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded mb-2 font-mono">
                    Error: {e.metadata.extractionError}
                  </div>
                )}
                
                <div className="text-xs bg-slate-50 p-2 overflow-auto max-h-32 border border-slate-100 rounded text-slate-600 font-mono">
                   {JSON.stringify(e.metadata, null, 2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

