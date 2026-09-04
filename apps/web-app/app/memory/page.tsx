
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CareerMemoryPage() {
  const [memory, setMemory] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.json())
      .then(data => {
         if (Array.isArray(data)) setMemory(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 font-sans text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Career Memory Center</h1>
          <p className="text-gray-500 text-sm mt-1">Verified historical patterns extracted deterministically from outcomes.</p>
        </div>
        <Link href="/" className="text-blue-500 hover:underline">← Back Home</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memory.map((mem) => (
           <div key={mem.id} className="border p-4 rounded bg-white shadow-sm flex flex-col gap-2">
             <div className="text-xs font-bold text-gray-400 uppercase">{mem.category}</div>
             <div className="text-lg font-semibold text-gray-900">{mem.key}</div>
             
             <div className="bg-gray-50 p-2 rounded mt-2">
                <div className="text-sm font-medium">Confidence: {mem.confidenceLevel} ({(mem.confidenceScore * 100).toFixed(0)}%)</div>
                <div className="text-sm text-gray-600 mt-1">Samples: {mem.sampleSize} | Success: {(mem.successRate * 100).toFixed(1)}%</div>
             </div>

             <div className="text-sm text-gray-700 mt-2 italic">
               "{mem.explanation.reasoning}"
             </div>
           </div>
        ))}
        
        {memory.length === 0 && (
          <div className="col-span-3 py-12 text-center text-gray-500 border-2 border-dashed rounded">
             No career memory patterns recorded yet. Patterns are automatically generated from execution outcomes.
          </div>
        )}
      </div>
    </div>
  );
}
