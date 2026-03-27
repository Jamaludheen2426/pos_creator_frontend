'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  X,
  Loader2,
  CreditCard,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

/* ---------- types ---------- */

interface Subscription {
  id: number;
  company: { id: number; name: string };
  plan: { id: number; name: string };
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
}

interface Company {
  id: number;
  name: string;
}

interface Plan {
  id: number;
  name: string;
}

interface AssignForm {
  companyId: string;
  planId: string;
  startDate: string;
  endDate: string;
}

const emptyForm: AssignForm = {
  companyId: '',
  planId: '',
  startDate: '',
  endDate: '',
};

const statusColor: Record<Subscription['status'], string> = {
  ACTIVE: 'text-green-400 bg-green-400/10',
  EXPIRED: 'text-red-400 bg-red-400/10',
  CANCELLED: 'text-yellow-400 bg-yellow-400/10',
};

/* ---------- helpers ---------- */

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ---------- page ---------- */

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AssignForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  /* ---- fetch subscriptions ---- */
  const fetchSubscriptions = useCallback(async () => {
    try {
      const { data } = await api.get('/subscriptions');
      setSubscriptions(Array.isArray(data) ? data : data.subscriptions ?? []);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---- fetch dropdown data ---- */
  const fetchDropdownData = useCallback(async () => {
    try {
      const [companiesRes, plansRes] = await Promise.all([
        api.get('/companies'),
        api.get('/plans'),
      ]);
      setCompanies(
        Array.isArray(companiesRes.data)
          ? companiesRes.data
          : companiesRes.data.companies ?? [],
      );
      setPlans(
        Array.isArray(plansRes.data)
          ? plansRes.data
          : plansRes.data.plans ?? [],
      );
    } catch {
      /* silently fail — dropdowns will be empty */
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    fetchDropdownData();
  }, [fetchSubscriptions, fetchDropdownData]);

  /* ---- open form ---- */
  const openAssign = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  /* ---- close form ---- */
  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  /* ---- submit ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyId || !form.planId || !form.startDate || !form.endDate) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/subscriptions', {
        companyId: Number(form.companyId),
        planId: Number(form.planId),
        startDate: form.startDate,
        endDate: form.endDate,
      });
      toast.success('Subscription assigned');
      closeForm();
      fetchSubscriptions();
    } catch {
      toast.error('Failed to assign subscription');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- update status ---- */
  const handleStatusChange = async (id: number, status: Subscription['status']) => {
    setUpdatingId(id);
    try {
      await api.patch(`/subscriptions/${id}`, { status });
      toast.success(`Subscription marked as ${status.toLowerCase()}`);
      fetchSubscriptions();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ---- loading state ---- */
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-20 justify-center">
        <Loader2 size={18} className="animate-spin" />
        Loading subscriptions...
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div className="max-w-6xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400">
            <CreditCard size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
            <p className="text-sm text-gray-500">
              {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={openAssign}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
        >
          <Plus size={16} />
          Assign Plan
        </button>
      </div>

      {/* inline form */}
      {showForm && (
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">Assign Plan to Company</h3>
            <button
              onClick={closeForm}
              className="text-gray-500 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* company dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Company
                </label>
                <div className="relative">
                  <select
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 pr-10 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  >
                    <option value="">Select company...</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                </div>
              </div>

              {/* plan dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Plan
                </label>
                <div className="relative">
                  <select
                    value={form.planId}
                    onChange={(e) => setForm({ ...form, planId: e.target.value })}
                    className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 pr-10 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  >
                    <option value="">Select plan...</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                </div>
              </div>

              {/* start date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <Calendar
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                </div>
              </div>

              {/* end date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                  <Calendar
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition',
                  submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-500',
                )}
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Assign Plan
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-gray-700 bg-gray-800 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-750 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* table */}
      {subscriptions.length === 0 ? (
        <div className="text-center py-20">
          <CreditCard size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No subscriptions found.</p>
          <button
            onClick={openAssign}
            className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
          >
            <Plus size={14} />
            Assign a plan
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Company</th>
                  <th className="text-left px-5 py-3">Plan</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Start Date</th>
                  <th className="text-left px-5 py-3">End Date</th>
                  <th className="text-left px-5 py-3">Next Billing</th>
                  <th className="text-left px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="bg-gray-900 hover:bg-gray-800/50 transition"
                  >
                    <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">
                      {sub.company?.name ?? '\u2014'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-300 whitespace-nowrap">
                      {sub.plan?.name ?? '\u2014'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                          statusColor[sub.status],
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            sub.status === 'ACTIVE' && 'bg-green-400',
                            sub.status === 'EXPIRED' && 'bg-red-400',
                            sub.status === 'CANCELLED' && 'bg-yellow-400',
                          )}
                        />
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                      {formatDate(sub.startDate)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                      {formatDate(sub.endDate)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                      {formatDate(sub.nextBillingDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="relative">
                        <select
                          value={sub.status}
                          onChange={(e) =>
                            handleStatusChange(sub.id, e.target.value as Subscription['status'])
                          }
                          disabled={updatingId === sub.id}
                          className={cn(
                            'appearance-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 pr-8 text-xs font-medium text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition',
                            updatingId === sub.id && 'opacity-50 cursor-not-allowed',
                          )}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="EXPIRED">Expired</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        <ChevronDown
                          size={12}
                          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
