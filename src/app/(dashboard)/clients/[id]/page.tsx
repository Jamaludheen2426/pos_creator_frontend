'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Copy,
  Pause,
  Play,
  Loader2,
  Save,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

/* ---------- types ---------- */

interface Company {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  plan: { name: string };
  settings?: Modules;
  _count: { users: number; stores: number };
  createdAt: string;
}

interface Modules {
  multiStore: boolean;
  productVariants: boolean;
  weightBasedProducts: boolean;
  expiryTracking: boolean;
  loyaltyPoints: boolean;
  suppliers: boolean;
  stockTransfer: boolean;
  discountRules: boolean;
  gstBilling: boolean;
  customerProfiles: boolean;
  reports: boolean;
  offlineMode: boolean;
  offlineAllowedDays: number;
}

interface CompanyUser {
  id: number;
  name: string;
  email: string;
  role: string;
  store?: { name: string } | null;
  isActive: boolean;
}

const MODULE_LABELS: Record<string, string> = {
  multiStore: 'Multi-store (multiple branches)',
  productVariants: 'Product Variants (size/color)',
  weightBasedProducts: 'Weight-based Products',
  expiryTracking: 'Expiry Tracking',
  loyaltyPoints: 'Loyalty Points',
  suppliers: 'Suppliers & Purchase Orders',
  stockTransfer: 'Stock Transfer',
  discountRules: 'Discount Rules & Promo Codes',
  gstBilling: 'GST Billing',
  customerProfiles: 'Customer Profiles',
  reports: 'Reports (PDF + Excel)',
  offlineMode: 'Offline Mode',
};

const MODULE_KEYS = Object.keys(MODULE_LABELS) as (keyof Omit<Modules, 'offlineAllowedDays'>)[];

const statusIcon: Record<Company['status'], React.ReactNode> = {
  ACTIVE: <CheckCircle size={14} className="text-green-400" />,
  SUSPENDED: <AlertCircle size={14} className="text-yellow-400" />,
  EXPIRED: <XCircle size={14} className="text-red-400" />,
};

const statusColor: Record<Company['status'], string> = {
  ACTIVE: 'text-green-400 bg-green-400/10',
  SUSPENDED: 'text-yellow-400 bg-yellow-400/10',
  EXPIRED: 'text-red-400 bg-red-400/10',
};

const OFFLINE_OPTIONS = [
  { value: 0, label: '0 — Always online required' },
  { value: 3, label: '3 days' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

/* ---------- page ---------- */

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [modules, setModules] = useState<Modules | null>(null);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingModules, setSavingModules] = useState(false);
  const [savingOffline, setSavingOffline] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  /* ---- fetch data ---- */
  const fetchCompany = useCallback(async () => {
    try {
      const { data } = await api.get('/companies');
      const found = data.find(
        (c: Company) => c.id === Number(companyId),
      );
      if (!found) {
        toast.error('Client not found');
        router.push('/clients');
        return;
      }
      setCompany(found);
      if (found.settings) {
        setModules(found.settings);
      }
    } catch {
      toast.error('Failed to load client');
    } finally {
      setLoading(false);
    }
  }, [companyId, router]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/users', {
        params: { companyId: Number(companyId) },
      });
      setUsers(Array.isArray(data) ? data : data.users ?? []);
    } catch {
      /* users list may not be available for all companies */
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompany();
    fetchUsers();
  }, [fetchCompany, fetchUsers]);

  /* ---- module toggle ---- */
  const toggleModule = (key: keyof Omit<Modules, 'offlineAllowedDays'>) => {
    if (!modules) return;
    setModules({ ...modules, [key]: !modules[key] });
  };

  const saveModules = async () => {
    if (!modules) return;
    setSavingModules(true);
    try {
      await api.patch(`/companies/${companyId}/modules`, modules);
      toast.success('Modules updated');
    } catch {
      toast.error('Failed to save modules');
    } finally {
      setSavingModules(false);
    }
  };

  /* ---- offline days ---- */
  const saveOfflineDays = async (days: number) => {
    if (!modules) return;
    setModules({ ...modules, offlineAllowedDays: days });
    setSavingOffline(true);
    try {
      await api.patch(`/companies/${companyId}/offline-days`, {
        offlineAllowedDays: days,
      });
      toast.success('Offline duration updated');
    } catch {
      toast.error('Failed to update offline duration');
    } finally {
      setSavingOffline(false);
    }
  };

  /* ---- status ---- */
  const handleToggleStatus = async () => {
    if (!company) return;
    const status = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setTogglingStatus(true);
    try {
      await api.patch(`/companies/${companyId}/status`, { status });
      setCompany({ ...company, status });
      toast.success(`Client ${status.toLowerCase()}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingStatus(false);
    }
  };

  /* ---- impersonate ---- */
  const handleImpersonate = async () => {
    try {
      const { data } = await api.post(
        `/companies/${companyId}/impersonate`,
      );
      await navigator.clipboard.writeText(data.accessToken);
      toast.success('Impersonation token copied to clipboard');
    } catch {
      toast.error('Failed to impersonate');
    }
  };

  /* ---- loading state ---- */
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-20 justify-center">
        <Loader2 size={18} className="animate-spin" />
        Loading client...
      </div>
    );
  }

  if (!company) return null;

  /* ---- render ---- */
  return (
    <div className="max-w-5xl mx-auto">
      {/* back link */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-6"
      >
        <ArrowLeft size={14} />
        Back to Clients
      </Link>

      {/* ===================== 1. COMPANY INFO ===================== */}
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{company.name}</h2>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
                  statusColor[company.status],
                )}
              >
                {statusIcon[company.status]}
                {company.status}
              </span>
            </div>
          </div>

          {/* status controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleImpersonate}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-blue-400 hover:bg-gray-750 hover:text-blue-300 transition"
            >
              <Copy size={14} />
              Impersonate
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition',
                company.status === 'ACTIVE'
                  ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                  : 'bg-green-500/10 text-green-400 hover:bg-green-500/20',
                togglingStatus && 'opacity-50 cursor-not-allowed',
              )}
            >
              {togglingStatus ? (
                <Loader2 size={14} className="animate-spin" />
              ) : company.status === 'ACTIVE' ? (
                <Pause size={14} />
              ) : (
                <Play size={14} />
              )}
              {company.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
            </button>
          </div>
        </div>

        {/* info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <Mail size={15} className="text-gray-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-200 truncate">{company.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={15} className="text-gray-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm text-gray-200">
                {company.phone || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard size={15} className="text-gray-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Plan</p>
              <p className="text-sm text-gray-200 capitalize">
                {company.plan.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={15} className="text-gray-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm text-gray-200">
                {new Date(company.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 2. MODULE TOGGLES ===================== */}
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-blue-400" />
            <h3 className="text-lg font-semibold text-white">
              Module Configuration
            </h3>
          </div>
          <button
            onClick={saveModules}
            disabled={savingModules || !modules}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition',
              savingModules || !modules
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-blue-500',
            )}
          >
            {savingModules ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {savingModules ? 'Saving...' : 'Save Modules'}
          </button>
        </div>

        {!modules ? (
          <p className="text-sm text-gray-500">
            No module configuration found for this client.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODULE_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 px-4 py-3"
              >
                <span className="text-sm text-gray-200">
                  {MODULE_LABELS[key]}
                </span>
                <button
                  onClick={() => toggleModule(key)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors shrink-0 ml-3',
                    modules[key] ? 'bg-blue-600' : 'bg-gray-700',
                  )}
                  role="switch"
                  aria-checked={!!modules[key]}
                  aria-label={`Toggle ${MODULE_LABELS[key]}`}
                >
                  <span
                    className={cn(
                      'absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      modules[key] ? 'translate-x-5' : 'translate-x-0',
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===================== 3. OFFLINE DURATION ===================== */}
      {modules?.offlineMode && (
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <WifiOff size={18} className="text-orange-400" />
            <h3 className="text-lg font-semibold text-white">
              Offline Duration
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={modules.offlineAllowedDays}
              onChange={(e) => saveOfflineDays(Number(e.target.value))}
              disabled={savingOffline}
              className={cn(
                'rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition',
                savingOffline && 'opacity-50 cursor-not-allowed',
              )}
            >
              {OFFLINE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {savingOffline && (
              <Loader2 size={16} className="animate-spin text-gray-400" />
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            How long the client POS can operate without an internet
            connection before requiring re-sync.
          </p>
        </section>
      )}

      {/* ===================== 5. COMPANY USERS ===================== */}
      <section className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Users size={18} className="text-purple-400" />
          <h3 className="text-lg font-semibold text-white">
            Company Users
          </h3>
          <span className="ml-auto text-xs text-gray-500">
            {users.length} user{users.length !== 1 ? 's' : ''}
          </span>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users size={32} className="mx-auto text-gray-700 mb-2" />
            <p className="text-sm text-gray-500">
              No users found for this company.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Role</th>
                  <th className="text-left px-5 py-3">Store</th>
                  <th className="text-left px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="bg-gray-950 hover:bg-gray-900/70 transition"
                  >
                    <td className="px-5 py-3 font-medium text-white">
                      {u.name}
                    </td>
                    <td className="px-5 py-3 text-gray-300">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-md bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-300 capitalize">
                        {u.role?.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {u.store?.name || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium',
                          u.isActive
                            ? 'text-green-400'
                            : 'text-red-400',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            u.isActive ? 'bg-green-400' : 'bg-red-400',
                          )}
                        />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
