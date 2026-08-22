"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, User, Briefcase, Award, Code, DollarSign, ShieldAlert, X } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>({
    name: '',
    skills: [],
    experience: [],
    projects: [],
    certifications: [],
    preferredTechnologies: []
  });
  
  const [pref, setPref] = useState<any>({
    minRate: 50,
    targetRate: 100,
    preferredProjectTypes: [],
    blockedClients: [],
    riskTolerance: 'MEDIUM'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    Promise.all([
      fetch(`${baseUrl}/api/profile`).then(res => res.json()),
      fetch(`${baseUrl}/api/preferences`).then(res => res.json())
    ]).then(([profRes, prefRes]) => {
      if (profRes.success && profRes.data) {
        setProfile({
          name: profRes.data.name || '',
          skills: profRes.data.skills || [],
          experience: profRes.data.experience || [],
          projects: profRes.data.projects || [],
          certifications: profRes.data.certifications || [],
          preferredTechnologies: profRes.data.preferredTechnologies || []
        });
      }
      if (prefRes.success && prefRes.data?.preferences) {
        setPref({
          minRate: prefRes.data.preferences.minRate || 50,
          targetRate: prefRes.data.preferences.targetRate || 100,
          preferredProjectTypes: prefRes.data.preferences.preferredProjectTypes || [],
          blockedClients: prefRes.data.preferences.blockedClients || [],
          riskTolerance: prefRes.data.preferences.riskTolerance || 'MEDIUM'
        });
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [baseUrl]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      await fetch(`${baseUrl}/api/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pref)
      });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setMessage('Failed to save.');
    }
    setSaving(false);
  };

  const handleArrayChange = (stateObj: any, setState: any, field: string, value: string) => {
    const arr = value.split(',').map(s => s.trim()).filter(Boolean);
    setState({ ...stateObj, [field]: arr });
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse font-medium">Loading Profile...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-3xl font-bold">User Profile</h1>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
      
      {message && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Core Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-bold flex items-center space-x-2 border-b border-slate-100 pb-2">
            <User className="w-5 h-5 text-slate-400" />
            <span>Identity & Skills</span>
          </h2>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Core Skills (comma separated)</label>
            <textarea 
              value={profile.skills.join(', ')} 
              onChange={e => handleArrayChange(profile, setProfile, 'skills', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={3}
              placeholder="React, TypeScript, Node.js..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Preferred Technologies</label>
            <input 
              type="text" 
              value={profile.preferredTechnologies.join(', ')} 
              onChange={e => handleArrayChange(profile, setProfile, 'preferredTechnologies', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Next.js, Postgres, Redis..."
            />
          </div>
        </div>

        {/* Financial Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-bold flex items-center space-x-2 border-b border-slate-100 pb-2">
            <DollarSign className="w-5 h-5 text-slate-400" />
            <span>Economics & Risk</span>
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target Rate ($/hr)</label>
              <input 
                type="number" 
                value={pref.targetRate} 
                onChange={e => setPref({...pref, targetRate: Number(e.target.value)})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Minimum Rate ($/hr)</label>
              <input 
                type="number" 
                value={pref.minRate} 
                onChange={e => setPref({...pref, minRate: Number(e.target.value)})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Risk Tolerance</label>
            <select 
              value={pref.riskTolerance}
              onChange={e => setPref({...pref, riskTolerance: e.target.value})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="LOW">Low (Verified clients only, strict scope)</option>
              <option value="MEDIUM">Medium (Balanced)</option>
              <option value="HIGH">High (Startups, unverified ok)</option>
            </select>
          </div>
        </div>

        {/* Experience & Projects */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-bold flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Briefcase className="w-5 h-5 text-slate-400" />
            <span>Experience & Projects</span>
          </h2>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Experience History</label>
            <textarea 
              value={profile.experience.join('\n')} 
              onChange={e => setProfile({...profile, experience: e.target.value.split('\n').filter(Boolean)})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={4}
              placeholder="Senior Engineer at X (2020-2023)&#10;Lead Developer at Y..."
            />
            <p className="text-xs text-slate-400 mt-1">One entry per line</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notable Projects</label>
            <textarea 
              value={profile.projects.join('\n')} 
              onChange={e => setProfile({...profile, projects: e.target.value.split('\n').filter(Boolean)})}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={4}
              placeholder="Built AutoGig AI Agent&#10;Migrated legacy system to React..."
            />
            <p className="text-xs text-slate-400 mt-1">One entry per line</p>
          </div>
        </div>

        {/* Exclusions & Other */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-bold flex items-center space-x-2 border-b border-slate-100 pb-2">
            <ShieldAlert className="w-5 h-5 text-slate-400" />
            <span>Targeting & Exclusions</span>
          </h2>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Preferred Project Types (comma separated)</label>
            <input 
              type="text" 
              value={pref.preferredProjectTypes.join(', ')} 
              onChange={e => handleArrayChange(pref, setPref, 'preferredProjectTypes', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="MVP, Migration, Bug fixes..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Blocked Clients (comma separated names)</label>
            <input 
              type="text" 
              value={pref.blockedClients.join(', ')} 
              onChange={e => handleArrayChange(pref, setPref, 'blockedClients', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Client A, Problematic Corp..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Certifications (comma separated)</label>
            <input 
              type="text" 
              value={profile.certifications.join(', ')} 
              onChange={e => handleArrayChange(profile, setProfile, 'certifications', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="AWS Architect, CKA..."
            />
          </div>

        </div>

      </div>
    </div>
  );
}
