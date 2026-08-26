"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, DollarSign, ShieldAlert, CheckCircle, Database, CheckSquare, XSquare, Settings, Check, Save } from 'lucide-react';

export default function CareerBrain() {
  const [profile, setProfile] = useState<any>(null);
  const [policy, setPolicy] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    Promise.all([
      fetch(`${baseUrl}/api/profile/intelligence`).then(r => r.json()),
      fetch(`${baseUrl}/api/policy`).then(r => r.json()),
      fetch(`${baseUrl}/api/evidence`).then(r => r.json())
    ]).then(([prof, pol, evi]) => {
      if (!prof.error) setProfile(prof);
      if (!pol.error) setPolicy(pol);
      if (Array.isArray(evi)) setEvidence(evi);
      setLoading(false);
    }).catch((err) => { console.error(err); setLoading(false); });
  }, []);

  const saveAll = async () => {
    setSaving(true);
    setMessage('');
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    
    try {
      // Validate bounds before save
      if (policy.minimumRate > policy.targetRate) {
        setMessage('Error: Minimum rate cannot exceed target rate.');
        setSaving(false);
        return;
      }
      
      await fetch(`${baseUrl}/api/profile/intelligence`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(profile)
      });
      const pRes = await fetch(`${baseUrl}/api/policy`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(policy)
      });
      const pData = await pRes.json();
      if (pData.error) {
         setMessage('Policy Error: ' + JSON.stringify(pData.details));
      } else {
         setMessage('Saved Successfully.');
      }
    } catch(e: any) {
      setMessage('Save failed: ' + e.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8">Loading Canonical Brain...</div>;
  if (!profile || !policy) return <div className="p-8 text-red-500">Failed to load canonical context.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 hover:bg-slate-800 rounded-full transition"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-3xl font-bold">Career Brain & Control Center</h1>
            <p className="text-slate-400">Canonical Identity, Policy Bounds & Evidence.</p>
          </div>
        </div>
        <button onClick={saveAll} disabled={saving} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition disabled:opacity-50">
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving...' : 'Save Context'}</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-medium ${message.includes('Error') || message.includes('failed') ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-green-100 text-green-800 border border-green-200'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* PROFILE */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center space-x-2 border-b pb-2"><User className="w-5 h-5 text-blue-500"/><span>Profile & Identity</span></h2>
          <div><label className="text-xs font-bold text-slate-500">Name</label><input type="text" value={profile.identity?.name || ''} onChange={e => setProfile({...profile, identity: {...profile.identity, name: e.target.value}})} className="w-full border p-2 rounded" /></div>
          <div><label className="text-xs font-bold text-slate-500">Headline</label><input type="text" value={profile.identity?.headline || ''} onChange={e => setProfile({...profile, identity: {...profile.identity, headline: e.target.value}})} className="w-full border p-2 rounded" /></div>
          <div><label className="text-xs font-bold text-slate-500">Skills (CSV)</label><textarea value={(profile.professional?.skills || []).join(', ')} onChange={e => setProfile({...profile, professional: {...profile.professional, skills: e.target.value.split(',').map(s=>s.trim())}})} className="w-full border p-2 rounded" rows={2}/></div>
        </div>

        {/* COMMERCIAL & POLICY */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center space-x-2 border-b pb-2"><DollarSign className="w-5 h-5 text-green-500"/><span>Commercial Policy</span></h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold text-slate-500">Target Rate ($)</label><input type="number" value={policy.targetRate} onChange={e => setPolicy({...policy, targetRate: Number(e.target.value)})} className="w-full border p-2 rounded" /></div>
            <div><label className="text-xs font-bold text-slate-500">Min Rate ($)</label><input type="number" value={policy.minimumRate} onChange={e => setPolicy({...policy, minimumRate: Number(e.target.value)})} className="w-full border p-2 rounded" /></div>
          </div>
          <div><label className="text-xs font-bold text-slate-500">Max Discount (%)</label><input type="number" value={policy.maximumNegotiationDiscount} onChange={e => setPolicy({...policy, maximumNegotiationDiscount: Number(e.target.value)})} className="w-full border p-2 rounded" /></div>
          <div><label className="text-xs font-bold text-slate-500">Daily App Limit</label><input type="number" value={policy.maxDailyApplications} onChange={e => setPolicy({...policy, maxDailyApplications: Number(e.target.value)})} className="w-full border p-2 rounded" /></div>
        </div>

        {/* AUTONOMY & SAFETY */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center space-x-2 border-b pb-2"><ShieldAlert className="w-5 h-5 text-red-500"/><span>Autonomy & Safety</span></h2>
          <div>
            <label className="text-xs font-bold text-slate-500">Autonomy Level</label>
            <select value={policy.autonomyLevel} onChange={e => setPolicy({...policy, autonomyLevel: e.target.value})} className="w-full border p-2 rounded bg-white">
              <option value="MANUAL">MANUAL (Draft Only)</option>
              <option value="SUPERVISED">SUPERVISED (Require Approvals)</option>
              <option value="HIGH_AUTONOMY">HIGH AUTONOMY (Auto-Execute)</option>
            </select>
          </div>
          <div className="space-y-2 mt-2">
            <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={policy.autoSendEnabled} onChange={e => setPolicy({...policy, autoSendEnabled: e.target.checked})} /><span>Auto Send Enabled</span></label>
            <label className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={policy.requireApprovalForProposalSubmission} onChange={e => setPolicy({...policy, requireApprovalForProposalSubmission: e.target.checked})} /><span>Require Approval to Submit</span></label>
          </div>
          <div><label className="text-xs font-bold text-slate-500 mt-2">Blocked Clients (CSV)</label><input type="text" value={(policy.blockedClients || []).join(', ')} onChange={e => setPolicy({...policy, blockedClients: e.target.value.split(',').map(s=>s.trim())})} className="w-full border p-2 rounded text-red-600" /></div>
        </div>

        {/* EVIDENCE REGISTRY */}
        <div className="lg:col-span-3 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold flex items-center space-x-2 border-b border-slate-200 pb-2 mb-4"><Database className="w-5 h-5 text-indigo-500"/><span>Evidence Registry</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidence.length === 0 ? <p className="text-slate-500 text-sm">No canonical evidence recorded.</p> : evidence.map(e => (
              <div key={e.id} className="bg-white p-3 rounded border shadow-sm flex justify-between items-start">
                <div>
                  <div className="text-xs font-bold text-slate-400">{e.category} &bull; {e.sourceType}</div>
                  <div className="font-medium">{e.claim}</div>
                </div>
                {e.verified ? <CheckSquare className="w-5 h-5 text-green-500" /> : <XSquare className="w-5 h-5 text-slate-300" />}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
