
'use client';

import { useState, useEffect } from 'react';



export function DecisionTimeline({ opportunityId }: { opportunityId: string }) {
  const [trace, setTrace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agent/runs/opportunity/${opportunityId}/trace`)
      .then(res => res.json())
      .then(data => {
        setTrace(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [opportunityId]);

  if (loading) return <div>Loading timeline...</div>;
  if (!trace || !trace.steps || trace.steps.length === 0) return <div>No decision trace available yet.</div>;

  return (
    <div className="mt-8 border rounded-lg bg-white shadow-sm p-6">
      <div className="mb-4 border-b pb-4">
        <h2 className="text-xl font-bold">AGENT DECISION TIMELINE</h2>
      </div>
      <div>
        <div className="relative border-l-2 border-gray-200 ml-4 space-y-6">
          {trace.steps.map((step: any, idx: number) => {
             const statusColor = 
               step.status === 'SUCCESS' ? 'bg-green-500' :
               step.status === 'WARNING' ? 'bg-yellow-500' :
               step.status === 'ERROR' ? 'bg-red-500' : 'bg-blue-500';
             
             return (
               <div key={idx} className="relative pl-6">
                 <div className={`absolute -left-[9px] top-2 h-4 w-4 rounded-full border-2 border-white ${statusColor}`} />
                 
                 <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-semibold text-gray-500">{new Date(step.timestamp).toLocaleTimeString()}</span>
                     <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-gray-50 text-gray-700">{step.stepType}</span>
                   </div>
                   
                   <h4 className="font-semibold text-md">{step.title}</h4>
                   <p className="text-sm text-gray-600">{step.summary}</p>
                   
                   {step.reason && step.reason.length > 0 && (
                     <details className="mt-2 text-sm bg-gray-50 p-2 rounded border cursor-pointer">
                       <summary className="font-medium text-gray-700">Why?</summary>
                       <ul className="list-disc pl-4 mt-2 space-y-1">
                         {step.reason.map((r: string, rIdx: number) => (
                           <li key={rIdx}>{r}</li>
                         ))}
                       </ul>
                     </details>
                   )}
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
}
