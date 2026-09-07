import React, { useState, useEffect } from 'react';
import { EvidenceRecord, EvidenceIntegrityViolation, DecisionEvidenceLedgerDTO } from '@autogig/core';

export function TruthCenter({ opportunityId }: { opportunityId: string }) {
  const [ledger, setLedger] = useState<DecisionEvidenceLedgerDTO | null>(null);
  const [violations, setViolations] = useState<EvidenceIntegrityViolation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/agent/runs/opportunity/${opportunityId}/evidence`, { headers: { 'Authorization': 'Bearer demo-token' }}).then(res => res.json()),
      fetch(`/api/agent/runs/opportunity/${opportunityId}/integrity`, { headers: { 'Authorization': 'Bearer demo-token' }}).then(res => res.json())
    ]).then(([evidenceRes, integrityRes]) => {
      if (evidenceRes.success) setLedger(evidenceRes.data);
      if (integrityRes.success) setViolations(integrityRes.data);
      setLoading(false);
    });
  }, [opportunityId]);

  if (loading) return <div>Loading Truth Center...</div>;
  if (!ledger) return <div>No evidence available.</div>;

  const grouped = ledger.evidence.reduce((acc, ev) => {
    if (!acc[ev.truthState]) acc[ev.truthState] = [];
    acc[ev.truthState].push(ev);
    return acc;
  }, {} as Record<string, EvidenceRecord[]>);

  const states = ['KNOWN', 'INFERRED', 'HISTORICAL', 'MEMORIZED', 'AUTHORIZED', 'REQUESTED', 'OBSERVED_RESULT', 'SIMULATED'];

  return (
    <div className="truth-center mt-8 p-4 border rounded bg-gray-50">
      <h2 className="text-xl font-bold mb-4">G4.18 Truth Center</h2>
      
      {violations.length > 0 && (
        <div className="violations mb-6 p-4 bg-red-100 border border-red-400 rounded">
          <h3 className="text-lg font-bold text-red-800">Integrity Violations ({violations.length})</h3>
          <ul className="list-disc pl-5">
            {violations.map(v => (
              <li key={v.id} className="text-red-700">
                <strong>{v.violatedRules.join(', ')}</strong>: {v.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {states.map(state => {
        const evs = grouped[state] || [];
        if (evs.length === 0) return null;
        
        let bgColor = 'bg-white';
        if (state === 'SIMULATED') bgColor = 'bg-purple-100 border-purple-300';
        else if (state === 'KNOWN' || state === 'OBSERVED_RESULT') bgColor = 'bg-green-50 border-green-200';
        
        return (
          <div key={state} className={`state-group mb-6 p-4 border rounded ${bgColor}`}>
            <h3 className="text-lg font-semibold mb-3 border-b pb-1">{state} Evidence</h3>
            <div className="grid gap-3">
              {evs.map(ev => (
                <div key={ev.id} className="evidence-card text-sm p-3 border rounded shadow-sm bg-white">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-gray-500">{ev.id}</span>
                    <span className="px-2 py-1 bg-gray-200 rounded text-xs">{ev.provenance}</span>
                  </div>
                  <div className="mt-2 font-medium">{ev.sourceDomain}: {ev.evidenceType}</div>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(ev.data, null, 2)}
                  </pre>
                  {ev.timestampSource === 'UNAVAILABLE' && (
                    <div className="mt-2 text-xs text-yellow-600">⚠ Timestamp Unavailable</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
