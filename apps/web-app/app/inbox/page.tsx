"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function Inbox() {
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    fetch(`${baseUrl}/api/opportunities`)
      .then(res => res.json())
      .then(d => {
        if (d.success) {
           setOpps(d.data || []);
        } else {
           setError(d.error || 'API returned an error');
        }
        setLoading(false);
      })
      .catch((e) => {
         setError('API Unavailable. Ensure web-api is running.');
         setLoading(false);
      });
  }, []);

  const filteredOpps = opps.filter(o => filter === 'ALL' || o.status === filter);
  const counts = opps.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    acc['ALL'] = (acc['ALL'] || 0) + 1;
    return acc;
  }, { 'ALL': 0 } as Record<string, number>);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse font-medium">Loading Inbox...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-3xl font-bold">Opportunity Inbox</h1>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
           <AlertCircle className="w-5 h-5 mr-3" />
           {error}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COUNTERED'].map(status => (
              <button 
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${filter === status ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600 hover:bg-slate-600'}`}
              >
                {status.replace('_', ' ')} ({counts[status] || 0})
              </button>
            ))}
          </div>

          {filteredOpps.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-slate-500">No opportunities found for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpps.map(opp => (
                <Link key={opp.id} href={`/opportunity/${opp.id}`}>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full 
                        ${opp.status === 'PENDING_APPROVAL' ? 'bg-blue-100 text-blue-800' : 
                          opp.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                          opp.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                          'bg-slate-100 text-slate-800'}`}>
                        {opp.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{new Date(opp.ingestionTimestamp).toLocaleDateString()}</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight mb-2">{opp.title}</h2>
                    <p className="text-sm text-slate-500 mb-4">{opp.client?.name || 'Unknown Client'}</p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                      <span className="text-slate-600 font-medium">Budget: ${opp.normalizedBudget}/hr</span>
                      <span className="text-blue-600 font-semibold flex items-center">
                        Review &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

