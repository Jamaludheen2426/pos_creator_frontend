'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Palette, Save, Building2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface CompanyBranding {
  id: number;
  name: string;
  email: string;
  settings: {
    logoUrl: string | null;
    primaryColor: string | null;
  } | null;
}

const PRESET_COLORS = [
  '#3b82f6', '#2563eb', '#6366f1', '#8b5cf6',
  '#ec4899', '#ef4444', '#f97316', '#f59e0b',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
];

export default function SettingsPage() {
  const [companies, setCompanies] = useState<CompanyBranding[]>([]);
  const [selected, setSelected] = useState<CompanyBranding | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/companies')
      .then(({ data }) => { setCompanies(data); setLoading(false); })
      .catch(() => { toast.error('Failed to load companies'); setLoading(false); });
  }, []);

  const selectCompany = (company: CompanyBranding) => {
    setSelected(company);
    setLogoUrl(company.settings?.logoUrl || '');
    setPrimaryColor(company.settings?.primaryColor || '#3b82f6');
  };

  const saveBranding = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/companies/${selected.id}/branding`, { logoUrl: logoUrl || null, primaryColor });
      toast.success(`Branding updated for ${selected.name}`);
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? { ...c, settings: { ...c.settings!, logoUrl: logoUrl || null, primaryColor } }
            : c,
        ),
      );
    } catch {
      toast.error('Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleForceLogout = async () => {
    if (!selected || !confirm(`Force logout all users of ${selected.name}?`)) return;
    try {
      const { data } = await api.post(`/companies/${selected.id}/force-logout`);
      toast.success(data.message);
    } catch {
      toast.error('Failed to force logout');
    }
  };

  if (loading) return <p className="text-gray-400">Loading…</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-1">Settings</h2>
      <p className="text-gray-400 text-sm mb-6">Client branding & session management</p>

      <div className="flex gap-6">
        {/* Company list */}
        <div className="w-72 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Select Client</p>
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCompany(c)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl text-sm transition flex items-center gap-3',
                selected?.id === c.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800',
              )}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: c.settings?.primaryColor || '#3b82f6' }}
              />
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs opacity-60">{c.email}</p>
              </div>
            </button>
          ))}
          {companies.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-8">No clients yet</p>
          )}
        </div>

        {/* Branding form */}
        {selected ? (
          <div className="flex-1 max-w-xl space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-5">
                <Palette size={16} /> Branding — {selected.name}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Logo URL</label>
                  <input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Primary Color</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setPrimaryColor(color)}
                        className={cn(
                          'w-8 h-8 rounded-lg transition ring-offset-2 ring-offset-gray-900',
                          primaryColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105',
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-gray-700"
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-800 rounded-xl p-4 mt-4">
                  <p className="text-xs text-gray-500 mb-2">Preview</p>
                  <div className="flex items-center gap-3">
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo" className="h-8 w-8 rounded object-contain bg-white" />
                    )}
                    <span className="font-bold text-white">{selected.name}</span>
                    <span className="ml-auto px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: primaryColor }}>
                      Sample Button
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={saveBranding}
                disabled={saving}
                className="mt-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Branding'}
              </button>
            </div>

            {/* Session management */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-4">
                <Building2 size={16} /> Session Management
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Force logout all active sessions for all users in this company.
                This revokes all refresh tokens — users must re-login.
              </p>
              <button
                onClick={handleForceLogout}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
              >
                Force Logout All Users
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-600">
            <p>Select a client to configure branding & sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}
