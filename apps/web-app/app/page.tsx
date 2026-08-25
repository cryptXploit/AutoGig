"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {  ArrowRight, Activity, ShieldCheck, XCircle, Search, Clock, FileText, Database, Server, RefreshCw , Target } from 'lucide-react';

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [opps, setOpps] = useState<any[]>([]);
  const [radarOpps, setRadarOpps] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    
    Promise.all([
      fetch(`${baseUrl}/api/dashboard/stats`).then(res => res.json()),
      fetch(`${baseUrl}/api/opportunities`).then(res => res.json()),
      fetch(`${baseUrl}/api/health`).then(res => res.json()).catch(() => ({ success: false, data: { api: 'DOWN', database: 'DOWN' } })),
      fetch(`${baseUrl}/api/strategy/opportunities`).then(res => res.json()).catch(() => ([]))
    ])
    .then(([statsRes, oppsRes, healthRes, stratRes]) => {
      if (statsRes.success) setStats(statsRes.data);
      if (oppsRes.success) setOpps(oppsRes.data.slice(0, 10));
      if (stratRes && stratRes.length) setRadarOpps(stratRes.slice(0, 5));
      if (healthRes.data) setHealth(healthRes.data);
      setLastUpdated(new Date());
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setError('Failed to connect to AutoGig API.');
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse font-medium">Booting AutoGig Command Center...</div>;
  if (error) return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <Server className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-slate-900 mb-2">API Unavailable</h2>
      <p className="text-slate-500">{error}</p>
    </div>
  );

  const isDbDown = health?.database === 'DOWN';
  const isApiDown = health?.api === 'DOWN';
  const isIdle = stats?.scanned === 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {isDbDown && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center shadow-sm">
          <Database className="w-5 h-5 mr-3" />
          <strong>Database Unavailable:</strong> SQLite connection failed.
        </div>
      )}

      {isIdle && !isDbDown && !isApiDown && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center shadow-sm">
          <Activity className="w-5 h-5 mr-3" />
          <strong>Pipeline Idle:</strong> No opportunities scanned. Run `npm run ingest:demo:once` to begin.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Command Center</h1>
          <p className="text-lg text-slate-500 mt-2">Local-first autonomous gig intelligence.</p>
        </div>
        <div className="flex flex-col items-end">
          <div className={`flex space-x-2 items-center px-4 py-2 rounded-full border shadow-sm ${!isIdle ? 'bg-green-50 border-green-200' : 'bg-slate-100 border-slate-200'}`}>
            <span className={`w-2 h-2 rounded-full ${!isIdle ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className={`text-sm font-semibold ${!isIdle ? 'text-green-700' : 'text-slate-600'}`}>
               {!isIdle ? 'Pipeline Active' : 'Pipeline Idle'}
            </span>
          </div>
          {lastUpdated && (
            <div className="flex items-center text-xs text-slate-400 mt-2 font-medium">
              <RefreshCw className="w-3 h-3 mr-1" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <Search className="text-slate-400 mb-2 w-5 h-5" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scanned</h3>
          <p className="text-3xl font-black mt-1 text-slate-900">{stats?.scanned || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <XCircle className="text-red-400 mb-2 w-5 h-5" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Funnel Rejected</h3>
          <p className="text-3xl font-black mt-1 text-red-600">{stats?.rejected || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <Activity className="text-indigo-400 mb-2 w-5 h-5" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deep Reasoning</h3>
          <p className="text-3xl font-black mt-1 text-indigo-600">{stats?.deepReasoningCompleted || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <FileText className="text-emerald-400 mb-2 w-5 h-5" />
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Props</h3>
          <p className="text-3xl font-black mt-1 text-emerald-600">{stats?.verifiedProposals || 0}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-blue-500 ring-2 ring-blue-100 flex flex-col justify-between">
          <div>
            <ShieldCheck className="text-blue-500 mb-2 w-5 h-5" />
            <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Needs Approval</h3>
          </div>
          <p className="text-3xl font-black mt-1 text-blue-600">{stats?.awaitingApproval || 0}</p>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-3">
          <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-700 overflow-hidden text-white">
            <div className="border-b border-slate-700 p-6 bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Target className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-xl font-bold">STRATEGIC OPPORTUNITY RADAR</h2>
                  <p className="text-slate-400 text-sm mt-1">AI-assisted priority mapping based on expected value, freshness, and policy rules.</p>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-slate-700/50 p-6 space-y-4">
              {radarOpps.length === 0 ? (
                 <div className="text-slate-400 text-center py-8">No strategies generated yet.</div>
              ) : (
                radarOpps.map((strat: any, idx: number) => (
                  <div key={strat.opportunityId} className="flex flex-col md:flex-row md:items-start gap-4 pt-4 first:pt-0">
                    <div className="flex-shrink-0 w-16 text-center">
                       <div className="text-2xl font-black text-slate-300">#{idx + 1}</div>
                    </div>
                    
                    <div className="flex-grow space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <Link href={`/opportunity/${strat.opportunityId}`}>
                          <h3 className="font-bold text-lg text-blue-300 hover:underline">{strat.opportunityTitle}</h3>
                        </Link>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-black text-white">{strat.priorityScore}<span className="text-slate-500 text-sm">/100</span></span>
                          <span className="px-2 py-1 text-xs font-bold rounded-sm bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            {strat.priority.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs font-black rounded uppercase ${strat.strategy === 'APPLY_NOW' ? 'bg-green-500 text-white' : strat.strategy === 'SKIP' || strat.strategy === 'BLOCK' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                          {strat.strategy.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-medium text-slate-400">&rarr; {strat.recommendedNextAction}</span>
                      </div>
                      
                      <div className="bg-slate-800/80 p-3 rounded border border-slate-700/50">
                        <div className="text-xs font-bold text-slate-500 mb-1">WHY NOW</div>
                        <ul className="list-disc pl-4 text-sm text-slate-300 space-y-1">
                          {strat.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-blue rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-00 p-6 bg-slate-800/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Recent Opportunities</h2>
                <p className="text-slate-500 mt-1 text-sm">Latest items processed by the pipeline.</p>
              </div>
              <Link href="/inbox">
                <span className="text-blue-600 font-semibold text-sm hover:underline">View All &rarr;</span>
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {opps.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-slate-500 text-sm">
                   <Search className="w-8 h-8 text-slate-300 mb-3" />
                   No opportunities ingested yet.
                </div>
              ) : (
                opps.map(opp => (
                  <Link key={opp.id} href={`/opportunity/${opp.id}`}>
                    <div className="p-4 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between group gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate">{opp.title}</h3>
                        <p className="text-sm text-slate-500">{opp.client?.name || 'Unknown Client'} &bull; ${opp.normalizedBudget}/hr</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full whitespace-nowrap self-start sm:self-auto
                        ${opp.status === 'PENDING_APPROVAL' ? 'bg-blue-100 text-blue-800' : 
                          opp.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                          opp.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                          'bg-slate-100 text-slate-800'}`}>
                        {opp.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 text-white">
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Time Saved</span>
            </h2>
            <p className="text-slate-300 mt-2 text-sm leading-relaxed">
              AutoGig securely parsed {stats?.scanned || 0} jobs, safely filtering {stats?.rejected || 0} mismatches and verifying claims for the top {stats?.verifiedProposals || 0} candidates.
            </p>
            <div className="mt-6 pt-6 border-t border-slate-700">
               <Link href="/inbox">
                <span className="w-full inline-flex justify-center items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-400 transition">
                  <span>Review {stats?.awaitingApproval || 0} Pending</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
