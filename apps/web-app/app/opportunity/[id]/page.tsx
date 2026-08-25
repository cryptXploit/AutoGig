"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertTriangle, XOctagon, Loader2, DollarSign, Target, Shield, Clock, Activity, FileText, CheckSquare, Zap, AlertCircle, MessageSquare } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function OpportunityDetail({ params }: { params: { id: string } }) {
  const { preferences, t } = useSettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    fetch(`${baseUrl}/api/opportunities/${params.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d.data);
        else setError(d.error);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch opportunity data.');
        setLoading(false);
      });
  }, [params.id, baseUrl]);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse font-medium flex items-center gap-3"><Loader2 className="animate-spin w-5 h-5"/> Loading Intelligence Console...</div>;
  if (error) return <div className="p-8 text-red-500 font-bold">{error}</div>;
  if (!data || !data.opportunity) return <div className="p-8">Not Found</div>;

  const { opportunity, evaluation, proposal, claims, evidence, events, verificationRuns } = data;
  const isPending = opportunity.status === 'PENDING_APPROVAL';
  const hasBlockedClaims = claims?.some((c: any) => c.verificationStatus === 'BLOCK');

  const handleApprove = async () => {
    if (hasBlockedClaims) {
      alert("Cannot approve a proposal with BLOCKED claims.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/opportunities/${opportunity.id}/approve`, { method: 'POST' });
      const d = await res.json();
      if (d.success) window.location.reload();
      else alert(d.error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounter = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/opportunities/${opportunity.id}/counter`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: 'Counter proposal initiated by user' })
       });
      const d = await res.json();
      if (d.success) window.location.reload();
      else alert(d.error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/opportunities/${opportunity.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reasonCategory: reason })
      });
      const d = await res.json();
      if (d.success) window.location.reload();
      else alert(d.error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (ds: string) => ds ? new Date(ds).toLocaleString() : 'N/A';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-32">
      <div className="flex items-center space-x-4 mb-2">
        <Link href="/" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Agent Decision Console</h1>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Target</div>
          <h2 className="text-xl font-bold text-slate-800">{opportunity.title}</h2>
          <div className="text-sm text-slate-500 mt-1">{(typeof opportunity.client === 'string' ? opportunity.client : opportunity.client?.name) || 'Unknown Client'} • {opportunity.url}</div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-400 uppercase">State</span>
          <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm border
            ${opportunity.status === 'PENDING_APPROVAL' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
              opportunity.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
              opportunity.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' : 
              'bg-slate-50 text-slate-700 border-slate-200'}`}>
            {opportunity.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Intelligence & WHY */}
        <div className="lg:col-span-2 space-y-6">
          {evaluation && (
            <>
              {/* 1. Decision Intelligence Panel */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500"/>
                    Intelligence Telemetry
                  </h3>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase">
                    Deep Reasoning {evaluation.route ? 'COMPLETED' : 'PENDING'}
                  </span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Score</div>
                      <div className="text-3xl font-black text-indigo-600">{evaluation.finalScore || evaluation.overall || '--'}/100</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Action</div>
                      <div className={`text-lg font-bold ${evaluation.route === 'RECOMMEND' ? 'text-emerald-600' : evaluation.route === 'COUNTER' ? 'text-amber-600' : 'text-red-600'}`}>
                        {evaluation.route || 'UNKNOWN'}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Tech Fit</div>
                      <div className="text-xl font-bold text-slate-700">{evaluation.technicalFit || '--'}/100</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-1">Risk</div>
                      <div className={`text-lg font-bold ${evaluation.clientRiskAssessment === 'LOW_RISK' ? 'text-emerald-600' : evaluation.clientRiskAssessment === 'ELEVATED_RISK' ? 'text-amber-600' : 'text-slate-600'}`}>
                        {evaluation.clientRiskAssessment ? evaluation.clientRiskAssessment.replace('_', ' ') : 'UNKNOWN'}
                      </div>
                    </div>
                  </div>

                  {/* 2. Explainable WHY Section - ONLY SHOWING PERSISTED DATA */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b pb-2">Explainable AI Analysis</h4>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Automated Explanations</div>
                        <p className="text-sm text-slate-800 leading-relaxed">{evaluation.explanations || 'No explanations recorded.'}</p>
                      </div>
                      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                        <div className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Qualification Flags</div>
                        <p className="text-sm text-amber-900 leading-relaxed">
                          {evaluation.qualificationFlags && evaluation.qualificationFlags !== '[]' ? evaluation.qualificationFlags : 'No flags identified.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Economic Analysis */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-500"/>
                  <h3 className="font-bold text-slate-800">Economic Analysis</h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <div className="text-xs text-slate-400 font-bold uppercase">Opportunity Budget</div>
                      <div className="text-xl font-bold text-slate-800">{opportunity.budget ? `${opportunity.currency || '$'}${opportunity.budget}` : 'Unspecified'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-bold uppercase">Budget Fit</div>
                      <div className="text-xl font-bold text-indigo-600">{evaluation.budgetFit || '--'}/100</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          ﻿          {/* G4.2 Application Intelligence Console */}
          {/* G4.5 Conversation Intelligence Console */}
          {data.conversations && data.conversations.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 border-b border-emerald-800 flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5"/>
                  Conversation Intelligence
                </h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {data.conversations.map((msg: any) => (
                    <div key={msg.id} className={`p-4 rounded-xl border ${msg.sender === 'CLIENT' ? 'bg-slate-50 border-slate-200 ml-0 mr-12' : 'bg-emerald-50 border-emerald-200 ml-12 mr-0'}`}>
                       <div className="flex justify-between items-center mb-2">
                         <span className="font-bold text-sm text-slate-700">{msg.sender}</span>
                         <span className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleString()}</span>
                       </div>
                       <p className="text-slate-800 whitespace-pre-wrap">{msg.text}</p>
                       
                       {msg.intelligence && (
                         <div className="mt-4 p-4 bg-white rounded border border-slate-200 text-sm">
                            <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">AI Analysis</h4>
                            <div className="grid grid-cols-2 gap-4">
                               <div>
                                 <span className="text-slate-500 text-xs">STAGE</span>
                                 <p className="font-medium text-slate-800">{msg.intelligence.conversationStage}</p>
                               </div>
                               <div>
                                 <span className="text-slate-500 text-xs">INTENT</span>
                                 <p className="font-medium text-slate-800">{msg.intelligence.clientIntent}</p>
                               </div>
                               <div>
                                 <span className="text-slate-500 text-xs">ACTION</span>
                                 <p className="font-medium text-blue-700">{msg.intelligence.recommendedAction}</p>
                               </div>
                               <div>
                                 <span className="text-slate-500 text-xs">VALIDATION</span>
                                 <p className={`font-medium ${msg.validationResult?.status === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
                                   {msg.validationResult?.status || 'PENDING'}
                                 </p>
                               </div>
                            </div>
                            
                            {msg.status === 'PENDING_APPROVAL' && (
                              <div className="mt-4 flex gap-3">
                                 <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">Approve & Send</button>
                                 <button className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2 px-4 rounded-lg transition-colors">Edit</button>
                                 <button className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors">Reject</button>
                              </div>
                            )}
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {data.applicationIntelligence && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 border-b border-blue-800 flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center gap-2">
                  <Zap className="w-5 h-5"/>
                  Application Intelligence
                </h3>
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase">
                  SCORE: {data.applicationIntelligence.readinessScore}/100
                </span>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Recommendation</div>
                    <div className={data.applicationIntelligence.recommendation === 'APPLY' ? 'text-emerald-600 text-lg font-bold' : data.applicationIntelligence.recommendation === 'SKIP' ? 'text-red-600 text-lg font-bold' : 'text-amber-600 text-lg font-bold'}>
                      {data.applicationIntelligence.recommendation}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Suggested Rate</div>
                    <div className="text-lg font-bold text-slate-800">{"$"}{data.applicationIntelligence.suggestedRate || '--'}/hr</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Timeline</div>
                    <div className="text-lg font-bold text-slate-800">{data.applicationIntelligence.suggestedTimeline || '--'}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b pb-2 mb-4">Tailored Profile</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.applicationIntelligence.tailoredResume?.map((skill: any, idx: number) => (
                      <div key={idx} className="p-3 border border-slate-200 rounded-lg flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-800">{skill.name}</span>
                          <span className={skill.relevance === 'HIGH' ? 'text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-blue-100 text-blue-700' : skill.relevance === 'MEDIUM' ? 'text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-slate-100 text-slate-700' : 'text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-slate-50 text-slate-400'}>
                            {skill.relevance}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mb-2">{skill.reason}</div>
                        <div className="flex items-center gap-2 mt-auto">
                          <span className={skill.matchType === 'DIRECT_MATCH' ? 'text-[10px] font-bold uppercase px-2 py-1 rounded bg-emerald-100 text-emerald-700' : skill.matchType === 'RELATED_MATCH' ? 'text-[10px] font-bold uppercase px-2 py-1 rounded bg-blue-100 text-blue-700' : skill.matchType === 'EVIDENCE_WEAK' ? 'text-[10px] font-bold uppercase px-2 py-1 rounded bg-amber-100 text-amber-700' : 'text-[10px] font-bold uppercase px-2 py-1 rounded bg-red-100 text-red-700'}>
                            {skill.matchType}
                          </span>
                          {skill.evidenceId && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono">EV:{skill.evidenceId.substring(0,6)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {data.applicationIntelligence.screeningAnswers && Object.keys(data.applicationIntelligence.screeningAnswers).length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b pb-2 mb-4">Screening Answers</h4>
                    <div className="space-y-4">
                      {Object.entries(data.applicationIntelligence.screeningAnswers).map(([q, a]: any, idx) => (
                        <div key={idx} className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                          <div className="text-sm font-bold text-blue-900 mb-2">Q: {q}</div>
                          <div className="text-sm text-blue-800 whitespace-pre-wrap">{a}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Evidence -> Claim -> Verification Trace */}

          {proposal && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500"/>
                  Verified Proposal & Evidence Trace
                </h3>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full uppercase">
                  DRAFT V{proposal.version}
                </span>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap font-serif leading-relaxed">
                  {proposal.text}
                </div>
                
                {claims && claims.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b pb-2 mb-4">Claim Verification Ledger</h4>
                    <div className="space-y-3">
                      {claims.map((c: any) => {
                        const relatedEv = evidence?.find((e: any) => e.id === c.evidenceId);
                        return (
                          <div key={c.id} className={`flex flex-col text-sm p-4 rounded-xl border ${c.verificationStatus === 'PASS' ? 'bg-emerald-50/50 border-emerald-100' : c.verificationStatus === 'BLOCK' ? 'bg-red-50/50 border-red-200' : 'bg-amber-50/50 border-amber-200'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-semibold text-slate-800">{c.text}</span>
                              <div className="flex items-center gap-2 ml-4">
                                <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 bg-white rounded border border-slate-100">{c.category}</span>
                                {c.verificationStatus === 'PASS' && <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded"><CheckCircle className="w-3 h-3" /> PASS</span>}
                                {c.verificationStatus === 'BLOCK' && <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded"><XOctagon className="w-3 h-3" /> BLOCK</span>}
                                {c.verificationStatus === 'FLAG' && <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded"><AlertTriangle className="w-3 h-3" /> FLAG</span>}
                              </div>
                            </div>
                            {relatedEv && (
                              <div className="mt-2 pt-2 border-t border-slate-200/50 border-dashed text-xs text-slate-600">
                                <strong className="text-slate-700">Source Evidence:</strong> {relatedEv.title} - <span className="italic text-slate-500 line-clamp-1">{relatedEv.content}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: State, Human Approval, Logs */}
        <div className="space-y-6">
          
          {/* 6. Human Approval Gate */}
          {isPending && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-400">
              <h2 className="text-lg font-black mb-4 text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-blue-600"/>
                Human Approval Gate
              </h2>
              
              {hasBlockedClaims ? (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm mb-4">
                  <div className="font-bold flex items-center gap-2 mb-1"><XOctagon className="w-4 h-4"/> Approval Blocked</div>
                  Proposal contains hallucinations or unverified claims. Must resolve before dispatch.
                </div>
              ) : (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded text-sm mb-4">
                  <div className="font-bold flex items-center gap-2 mb-1"><CheckCircle className="w-4 h-4"/> Ready for Dispatch</div>
                  All claims verified against source evidence.
                </div>
              )}
              
              <div className="flex flex-col space-y-3 mb-4">
                <button 
                  onClick={handleApprove} 
                  disabled={actionLoading || hasBlockedClaims}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-sm hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center">
                  {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'APPROVE & SEND'}
                </button>
                <button 
                  onClick={handleCounter} 
                  disabled={actionLoading}
                  className="w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl shadow-sm hover:bg-slate-200 transition disabled:opacity-50">
                  COUNTER PROPOSAL
                </button>
              </div>
              
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Reject & Learn</p>
                <div className="flex flex-wrap gap-2">
                  {['LOW_BUDGET', 'BAD_CLIENT_SIGNAL', 'SKILL_MISMATCH', 'BORING_SCOPE', 'OTHER'].map(reason => (
                    <button 
                      key={reason}
                      onClick={() => handleReject(reason)}
                      disabled={actionLoading}
                      className="text-xs font-semibold py-2 px-3 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-lg border border-slate-200 transition">
                      {reason.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 9. Agent Auditability */}
          <div className="bg-slate-800 rounded-2xl shadow-sm border border-slate-700 overflow-hidden text-slate-300">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400"/>
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">Why did this reach here?</h3>
            </div>
            <div className="p-6 text-sm space-y-3">
              <p>The <strong>AutoGig Intelligent Agent</strong> scanned this opportunity via <span className="text-indigo-400">{opportunity.source}</span>.</p>
              <p>It matched your baseline profile and was routed to the <strong>Deep Reasoning</strong> engine, scoring <strong className="text-white">{evaluation?.overall || '--'}/100</strong>.</p>
              {proposal && <p>A <strong className="text-white">DRAFT V{proposal.version}</strong> proposal was automatically generated and verified through the strict evidence-check gate.</p>}
              {!isPending && <p>The workflow is currently concluded at <strong className="text-white">{opportunity.status}</strong>.</p>}
            </div>
          </div>

          {/* 4. State Machine Timeline */}
          {events && events.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400"/>
                <h3 className="font-bold text-slate-800">State Machine Timeline</h3>
              </div>
              <div className="p-6">
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                  {events.map((evt: any) => (
                    <div key={evt.id} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                      <div className="text-xs font-bold text-slate-400 mb-0.5">{formatDate(evt.timestamp)}</div>
                      <div className="text-sm font-bold text-slate-800">
                        {evt.previousState} <ArrowLeft className="w-3 h-3 inline rotate-180 mx-1 text-slate-400"/> {evt.nextState}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Actor: <span className="font-semibold">{evt.actor}</span></div>
                      {evt.reason && (
                        <div className="text-xs text-slate-600 bg-slate-50 p-2 mt-2 rounded border border-slate-100 italic">
                          "{evt.reason}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. Proposal Verification History */}
          {verificationRuns && verificationRuns.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400"/>
                <h3 className="font-bold text-slate-800">Verification Engine Runs</h3>
              </div>
              <div className="p-6 space-y-4">
                {verificationRuns.map((run: any) => (
                  <div key={run.id} className="text-sm border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-700">Attempt #{run.attempt}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${run.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{run.status}</span>
                    </div>
                    <div className="text-xs text-slate-500 mb-1">{formatDate(run.createdAt)}</div>
                    {run.result && (
                       <div className="text-xs bg-slate-50 p-2 rounded text-slate-600 line-clamp-2" title={run.result}>{run.result}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}