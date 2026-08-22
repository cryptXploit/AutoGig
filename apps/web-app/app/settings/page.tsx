'use client';
import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export default function SettingsPage() {
  const { preferences, setPreferences, t } = useSettings();
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleChange = (key: string, value: any) => {
    setLocalPrefs((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localPrefs)
      });
      const data = await res.json();
      if (data.success) {
        setPreferences(data.data);
        setMessage(t('savedSuccessfully'));
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error: ' + data.error);
      }
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-8">
      <h1 className="text-3xl font-black mb-8">{t('settings')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Appearance & Language */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4">{t('appearance')} & {t('language')}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">{t('language')}</label>
              <select 
                className="w-full p-2 border border-slate-200 rounded-lg"
                value={localPrefs.language || 'EN'}
                onChange={e => handleChange('language', e.target.value)}
              >
                <option value="EN">English</option>
                <option value="BN">?????</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">{t('theme')}</label>
              <select 
                className="w-full p-2 border border-slate-200 rounded-lg"
                value={localPrefs.theme || 'SYSTEM'}
                onChange={e => handleChange('theme', e.target.value)}
              >
                <option value="SYSTEM">{t('system')}</option>
                <option value="LIGHT">{t('light')}</option>
                <option value="DARK">{t('dark')}</option>
                <option value="HACKER">{t('hacker')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Behavior */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold mb-4">{t('aiBehavior')}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">{t('reasoningDepth')}</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg"
                value={localPrefs.reasoningDepth || 'MEDIUM'}
                onChange={e => handleChange('reasoningDepth', e.target.value)}>
                <option value="LOW">{t('low')}</option>
                <option value="MEDIUM">{t('medium')}</option>
                <option value="HIGH">{t('high')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{t('proposalStrictness')}</label>
              <select className="w-full p-2 border border-slate-200 rounded-lg"
                value={localPrefs.proposalStrictness || 'MEDIUM'}
                onChange={e => handleChange('proposalStrictness', e.target.value)}>
                <option value="LOW">{t('low')}</option>
                <option value="MEDIUM">{t('medium')}</option>
                <option value="HIGH">{t('high')}</option>
              </select>
            </div>

            <div className="flex items-center mt-4">
              <input type="checkbox" className="mr-2"
                checked={localPrefs.humanApprovalRequired !== false}
                onChange={e => handleChange('humanApprovalRequired', e.target.checked)} />
              <label className="text-sm font-semibold">{t('humanApprovalRequired')}</label>
            </div>

            <div className="flex items-center">
              <input type="checkbox" className="mr-2"
                checked={localPrefs.learningEnabled !== false}
                onChange={e => handleChange('learningEnabled', e.target.checked)} />
              <label className="text-sm font-semibold">{t('learningEnabled')}</label>
            </div>
          </div>
        </div>

        {/* Opportunity Preferences */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
          <h2 className="text-lg font-bold mb-4">{t('opportunityPreferences')}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2">{t('minRate')}</label>
              <input type="number" className="w-full p-2 border border-slate-200 rounded-lg"
                value={localPrefs.minRate || 0}
                onChange={e => handleChange('minRate', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">{t('targetRate')}</label>
              <input type="number" className="w-full p-2 border border-slate-200 rounded-lg"
                value={localPrefs.targetRate || 0}
                onChange={e => handleChange('targetRate', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">{t('blockedClients')} (comma separated)</label>
            <input type="text" className="w-full p-2 border border-slate-200 rounded-lg"
              value={(localPrefs.blockedClients || []).join(', ')}
              onChange={e => handleChange('blockedClients', e.target.value.split(',').map(s=>s.trim()))} />
          </div>
        </div>

      </div>

      <div className="mt-8 flex items-center gap-4">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saving ? t('saving') : t('saveChanges')}
        </button>
        {message && <span className="font-semibold text-green-600">{message}</span>}
      </div>
    </div>
  );
}
