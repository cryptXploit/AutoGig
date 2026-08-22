const fs = require('fs');
const content = `"use client";
import { useEffect, useState } from 'react';

export default function RunsPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    fetch(\`\${baseUrl}/api/runs\`)
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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b"><th className="p-2">Run ID</th><th className="p-2">Stage</th><th className="p-2">Status</th><th className="p-2">Latency (ms)</th></tr>
          </thead>
          <tbody>
            {runs.map((r: any) => (
              <tr key={r.runId} className="border-b">
                <td className="p-2">{r.runId}</td>
                <td className="p-2">{r.stage}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">{r.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
`;
fs.writeFileSync('apps/web-app/app/runs/page.tsx', content);
