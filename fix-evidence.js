const fs = require('fs');
const content = `"use client";
import { useEffect, useState } from 'react';

export default function EvidencePage() {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    fetch(\`\${baseUrl}/api/evidence?page=1&limit=50\`)
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
          {evidence.map((e: any) => (
            <div key={e.id} className="border p-4 rounded shadow-sm">
              <h3 className="font-bold">{e.type} - {e.id}</h3>
              <p className="text-sm text-gray-500">Storage Key: {e.storageKey}</p>
              {e.metadata && (
                <div className="text-xs mt-2 bg-gray-50 p-2 overflow-auto max-h-32">
                   {JSON.stringify(e.metadata, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('apps/web-app/app/evidence/page.tsx', content);
