
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CareerMemoryPage() {
  const [memory, setMemory] = useState<any[]>([]);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildStats, setRebuildStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.json())
      .then(data => {
         if (Array.isArray(data)) setMemory(data);
      })
      .catch(console.error);
  }, []);

  const handleRebuild = async () => {
    setRebuilding(true);
    setRebuildStats(null);
    try {
      const res = await fetch('/api/memory/rebuild', { method: 'POST' });
      const data = await res.json();
      setRebuildStats(data);
      
      const refreshRes = await fetch('/api/memory');
      const refreshData = await refreshRes.json();
      if (Array.isArray(refreshData)) setMemory(refreshData);
    } catch (e) {
      console.error(e);
    }
    setRebuilding(false);
  };

  return (
    <div className="p-8 font-sans text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
             Career Memory Center
             <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-bold tracking-wider">ADVISORY SIGNAL</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Verified historical patterns extracted deterministically from outcomes. Memory cannot override canonical policy.</p>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={handleRebuild} disabled={rebuilding} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors">
              {rebuilding ? 'Rebuilding...' : 'Rebuild Memory'}
           </button>
           <Link href="/" className="text-blue-500 hover:underline">← Back Home</Link>
        </div>
      </div>

      {rebuildStats && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded text-sm">
           <strong>Memory Rebuilt Successfully.</strong> Processed {rebuildStats.recordsProcessed} historical records. Generated {rebuildStats.memoriesGenerated} memory patterns. Model version: {rebuildStats.modelVersion}.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memory.map((mem) => (
           <div key={mem.id} className="border p-4 rounded bg-white shadow-sm flex flex-col gap-2">
             <div className="flex justify-between items-start">
               <div className="text-xs font-bold text-gray-400 uppercase">{mem.category}</div>
               <div className="text-xs text-gray-400">Model {mem.modelVersion}</div>
             </div>
             
             <div className="text-lg font-semibold text-gray-900">{mem.key}</div>
             
             <div className="bg-gray-50 border p-3 rounded mt-2">
                <div className="flex justify-between items-center mb-2">
                   <div className="text-sm font-medium">Confidence</div>
                   <div className="text-sm font-bold">{mem.confidenceLevel} ({(mem.confidenceScore * 100).toFixed(0)}%)</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                   <div>Samples: <strong>{mem.sampleSize}</strong></div>
                   <div>Weighted Base: <strong>{mem.explanation.weightedSampleSize}</strong></div>
                   <div>Positive: <strong>{mem.explanation.positiveOutcomes}</strong></div>
                   <div>Weighted Pos: <strong>{mem.explanation.weightedPositive}</strong></div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 text-sm font-medium text-blue-700">
                   Weighted Success Rate: {(mem.explanation.weightedSuccessRate * 100).toFixed(1)}%
                </div>
             </div>

             <div className="text-sm text-gray-700 mt-2 italic bg-blue-50 p-3 rounded border border-blue-100">
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
