
"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function SimulatorPage({ params }: { params: { id: string } }) {
  const [minRate, setMinRate] = useState<number>(30);
  const [strategy, setStrategy] = useState<string>('APPLY_NOW');
  const [humanApproval, setHumanApproval] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/simulation/opportunity/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarios: [
            {
              name: 'Custom Override',
              overrides: {
                MIN_RATE: minRate,
                STRATEGY: strategy,
                REQUIRE_HUMAN_APPROVAL: humanApproval
              }
            }
          ]
        })
      });
      const data = await res.json();
      setResults(data);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 font-sans text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
             Opportunity Simulator
             <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-bold tracking-wider">READ-ONLY WHAT-IF</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Deterministically simulate decision boundaries without executing actions.</p>
        </div>
        <Link href={`/opportunity/${params.id}`} className="text-blue-500 hover:underline">← Back to Opportunity</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 border p-6 rounded bg-white shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-lg border-b pb-2">Simulation Overrides</h2>
          
          <div>
             <label className="block text-sm font-medium text-gray-700">Minimum Rate ($/hr)</label>
             <input type="number" value={minRate} onChange={e => setMinRate(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">Force Strategy</label>
             <select value={strategy} onChange={e => setStrategy(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2">
                <option value="APPLY_NOW">Apply Now</option>
                <option value="PREPARE_AND_APPLY">Prepare & Apply</option>
                <option value="NEGOTIATE_FIRST">Negotiate First</option>
                <option value="ASK_CLIENT_FIRST">Ask Client First</option>
                <option value="WAIT_FOR_MORE_INFORMATION">Wait for Info</option>
                <option value="WATCH">Watch</option>
                <option value="SKIP">Skip</option>
             </select>
          </div>

          <div className="flex items-center gap-2">
             <input type="checkbox" checked={humanApproval} onChange={e => setHumanApproval(e.target.checked)} />
             <label className="text-sm font-medium text-gray-700">Require Human Approval</label>
          </div>

          <button onClick={runSimulation} disabled={loading} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium">
             {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        <div className="col-span-2">
          {results.map((res, i) => (
             <div key={i} className="border p-6 rounded bg-white shadow-sm">
                <div className="grid grid-cols-2 gap-8 relative">
                   {/* Divider line */}
                   <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -ml-px"></div>

                   {/* Baseline */}
                   <div>
                     <h3 className="font-bold text-gray-500 mb-4 text-center tracking-widest text-sm">BASELINE</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                           <span className="text-gray-500">Priority Score</span>
                           <span className="font-bold">{res.baseline.priorityScore}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                           <span className="text-gray-500">Strategy</span>
                           <span className="font-bold text-blue-600">{res.baseline.strategy}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                           <span className="text-gray-500">Policy</span>
                           <span className={`font-bold ${res.baseline.policyDisposition === 'BLOCK_ACTION' ? 'text-red-600' : 'text-green-600'}`}>{res.baseline.policyDisposition}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                           <span className="text-gray-500">Readiness</span>
                           <span className="font-bold text-purple-600">{res.baseline.readinessState}</span>
                        </div>
                     </div>
                   </div>

                   {/* Scenario */}
                   <div>
                     <h3 className="font-bold text-purple-600 mb-4 text-center tracking-widest text-sm">WHAT-IF</h3>
                     <div className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                           <span className="text-gray-500">Priority Score</span>
                           <span className="font-bold">
                              {res.scenario.priorityScore}
                              {res.comparison.scoreDelta !== 0 && (
                                 <span className={`ml-2 text-xs ${res.comparison.scoreDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                   ({res.comparison.scoreDelta > 0 ? '+' : ''}{res.comparison.scoreDelta})
                                 </span>
                              )}
                           </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                           <span className="text-gray-500">Strategy</span>
                           <span className="font-bold text-blue-600">{res.scenario.strategy}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                           <span className="text-gray-500">Policy</span>
                           <span className={`font-bold ${res.scenario.policyDisposition === 'BLOCK_ACTION' ? 'text-red-600' : 'text-green-600'}`}>{res.scenario.policyDisposition}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                           <span className="text-gray-500">Readiness</span>
                           <span className="font-bold text-purple-600">{res.scenario.readinessState}</span>
                        </div>
                     </div>
                   </div>
                </div>

                {res.comparison.changed && (
                  <div className="mt-8 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-sm text-gray-800 mb-2">WHY DID IT CHANGE?</h4>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                       {res.comparison.explanation.map((reason: string, i: number) => (
                          <li key={i}>{reason}</li>
                       ))}
                    </ul>
                  </div>
                )}
                
                {!res.comparison.changed && (
                  <div className="mt-8 pt-4 border-t border-gray-200">
                    <h4 className="font-bold text-sm text-gray-800 mb-2">NO CHANGE</h4>
                    <p className="text-sm text-gray-600">The simulated overrides did not alter the fundamental decision boundaries for this opportunity.</p>
                  </div>
                )}
             </div>
          ))}

          {results.length === 0 && !loading && (
             <div className="border-2 border-dashed p-12 text-center text-gray-400 rounded">
                Configure overrides and run the simulation to compare outcomes.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
