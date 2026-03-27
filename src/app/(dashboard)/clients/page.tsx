'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
  UserPlus,
  ShieldCheck,
  Pause,
  Play,
  Loader2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

/* ---------- types ---------- */

interface Company {
  id: number;
  name: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  plan: { name: string };
  _count: { users: number; stores: number };
  createdAt: string;
}

interface Plan {
  id: number;
  name: string;
}

/* ---------- status helpers ---------- */

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

/* ---------- page ---------- */

export default function ClientsPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  /* ---- fetch companies ---- */
  const fetchCompanies = useCallback(async () => {
    try {
      const { data } = await api.get('/companies');
      setCompanies(data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  /* ---- suspend / activate ---- */
  const handleToggleStatus = async (id: number, current: Company['status']) => {
    const status = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/companies/${id}/status`, { status });
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c)),
      );
      toast.success(`Client ${status.toLowerCase()}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  /* ---- impersonate ---- */
  const handleImpersonate = async (id: number) => {
    try {
      const { data } = await api.post(`/companies/${id}/impersonate`);
      await navigator.clipboard.writeText(data.accessToken);
      toast.success('Impersonation token copied to clipboard');
    } catch {
      toast.error('Failed to impersonate');
    }
  };

  /* ---- render ---- */
  return (
    <div>
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Clients</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {companies.length} total accounts
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          <Plus size={16} />
          New Client
        </button>
      </div>

      {/* create form modal */}
      {showForm && (
        <CreateClientForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            fetchCompanies();
          }}
        />
      )}

      {/* table */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Loading...
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
          <UserPlus size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 text-sm">No clients yet. Create your first one.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Company</th>
                <th className="text-left px-5 py-3">Plan</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Users</th>
                <th className="text-left px-5 py-3">Stores</th>
                <th className="text-left px-5 py-3">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {companies.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/clients/${c.id}`)}
                  className="bg-gray-950 hover:bg-gray-900/70 transition cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/clients/${c.id}`}
                      className="font-medium text-white hover:text-blue-400 transition"
                    >
                      {c.name}
                    </Link>
                    <p className="text-gray-500 text-xs">{c.email}</p>
                  </td>
                  <td className="px-5 py-4 text-gray-300 capitalize">
                    {c.plan.name}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        statusColor[c.status],
                      )}
                    >
                      {statusIcon[c.status]}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-300">{c._count.users}</td>
                  <td className="px-5 py-4 text-gray-300">{c._count.stores}</td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => handleImpersonate(c.id)}
                        title="Impersonate"
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
                      >
                        <Copy size={13} />
                        Impersonate
                      </button>
                      <button
                        onClick={() => handleToggleStatus(c.id, c.status)}
                        title={c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs transition',
                          c.status === 'ACTIVE'
                            ? 'text-yellow-400 hover:text-yellow-300'
                            : 'text-green-400 hover:text-green-300',
                        )}
                      >
                        {c.status === 'ACTIVE' ? (
                          <Pause size={13} />
                        ) : (
                          <Play size={13} />
                        )}
                        {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- create client inline form / modal ---------- */

function CreateClientForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [planId, setPlanId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  useEffect(() => {
    api
      .get('/plans')
      .then(({ data }) => setPlans(data))
      .catch(() => toast.error('Failed to load plans'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) {
      toast.error('Please select a plan');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/companies', {
        name,
        email,
        phone,
        planId: Number(planId),
        ownerName,
        ownerEmail,
        ownerPassword,
      });
      toast.success('Client created successfully');
      onCreated();
    } catch {
      toast.error('Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition';
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-400" />
            <h3 className="text-base font-semibold text-white">New Client</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* company info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Company Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Company Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@acme.com"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Plan</label>
              <select
                required
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className={inputCls}
              >
                <option value="">Select a plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
              Owner Account
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Owner Name</label>
                <input
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="John Doe"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Owner Email</label>
                <input
                  required
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="john@acme.com"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelCls}>Owner Password</label>
              <input
                required
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Min 8 characters"
                minLength={8}
                className={inputCls}
              />
            </div>
          </div>

          {/* actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition',
                submitting
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:bg-blue-500',
              )}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Create Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
