'use client';
import { useState } from 'react';
import { User, Key, Shield, Save, Loader2, Copy, Check } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/axios';
import { formatDateTime } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName]  = useState(user?.lastName || '');
  const [phone, setPhone]         = useState(user?.phone || '');
  const [timezone, setTimezone]   = useState(user?.timezone || 'UTC');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/v1/users/me', { firstName, lastName, phone, timezone });
      setUser(data.data);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleGenerateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const { data } = await api.post('/v1/users/me/api-key');
      setUser({ ...user!, apiKey: data.data.apiKey });
    } catch { /* ignore */ }
    finally { setGeneratingKey(false); }
  };

  const copyApiKey = () => {
    if (user?.apiKey) {
      navigator.clipboard.writeText(user.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Profile Settings</h1>
          <p className="text-dark-400 mt-1">Manage your account and API credentials.</p>
        </div>

        {successMsg && (
          <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {successMsg}
          </div>
        )}

        {/* Profile */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-dark-800">
            <User className="w-4 h-4 text-dark-400" />
            <h2 className="font-bold text-sm">Personal Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">First Name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-dark" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Last Name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-dark" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Email</label>
              <input value={user?.email || ''} disabled className="input-dark opacity-50 cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" className="input-dark" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Timezone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input-dark cursor-pointer">
                  {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'].map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* API Key */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-dark-800">
            <Key className="w-4 h-4 text-dark-400" />
            <h2 className="font-bold text-sm">API Key</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-dark-400">Use this key to authenticate API requests from your server.</p>
            {user?.apiKey ? (
              <div className="flex items-center gap-3">
                <code className="flex-1 px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-xs font-mono text-dark-300 truncate">
                  {user.apiKey}
                </code>
                <button onClick={copyApiKey} className="btn-ghost p-2.5">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <p className="text-sm text-dark-500">No API key generated yet.</p>
            )}
            <button onClick={handleGenerateApiKey} disabled={generatingKey} className="btn-ghost flex items-center gap-2 text-sm">
              {generatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              {user?.apiKey ? 'Regenerate Key' : 'Generate Key'}
            </button>
            <p className="text-xs text-dark-600">Regenerating your key will immediately invalidate the previous one.</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-dark-800">
            <Shield className="w-4 h-4 text-dark-400" />
            <h2 className="font-bold text-sm">Account Information</h2>
          </div>
          <dl className="divide-y divide-dark-800/50">
            {[
              { label: 'Account ID', value: user?.id },
              { label: 'Role', value: user?.role },
              { label: 'Status', value: user?.status },
              { label: 'Email Verified', value: user?.emailVerified ? 'Yes' : 'No' },
              { label: 'Member Since', value: user?.createdAt ? formatDateTime(user.createdAt) : '—' },
              { label: 'Last Login', value: user?.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between px-6 py-3.5">
                <dt className="text-sm text-dark-400">{label}</dt>
                <dd className="text-sm font-medium font-mono truncate max-w-[260px]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </DashboardLayout>
  );
}
