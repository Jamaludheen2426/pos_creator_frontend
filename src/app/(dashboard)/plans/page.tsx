'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  LayoutDashboard,
  Store,
  Users,
  Package,
  Smartphone,
  WifiOff,
  BarChart3,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

/* ---------- types ---------- */

interface Plan {
  id: number;
  name: string;
  maxStores: number;
  maxUsers: number;
  maxProducts: number;
  hasMobileApp: boolean;
  hasOfflineMode: boolean;
  hasAdvancedReports: boolean;
}

interface PlanForm {
  name: string;
  maxStores: number;
  maxUsers: number;
  maxProducts: number;
  hasMobileApp: boolean;
  hasOfflineMode: boolean;
  hasAdvancedReports: boolean;
}

const emptyForm: PlanForm = {
  name: '',
  maxStores: 1,
  maxUsers: 1,
  maxProducts: 100,
  hasMobileApp: false,
  hasOfflineMode: false,
  hasAdvancedReports: false,
};

/* ---------- helpers ---------- */

function displayLimit(value: number): string {
  return value === -1 ? 'Unlimited' : String(value);
}

/* ---------- page ---------- */

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /* ---- fetch ---- */
  const fetchPlans = useCallback(async () => {
    try {
      const { data } = await api.get('/plans');
      setPlans(Array.isArray(data) ? data : data.plans ?? []);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  /* ---- open create ---- */
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  /* ---- open edit ---- */
  const openEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      maxStores: plan.maxStores,
      maxUsers: plan.maxUsers,
      maxProducts: plan.maxProducts,
      hasMobileApp: plan.hasMobileApp,
      hasOfflineMode: plan.hasOfflineMode,
      hasAdvancedReports: plan.hasAdvancedReports,
    });
    setShowForm(true);
  };

  /* ---- close form ---- */
  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  /* ---- submit ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.patch(`/plans/${editingId}`, form);
        toast.success('Plan updated');
      } else {
        await api.post('/plans', form);
        toast.success('Plan created');
      }
      closeForm();
      fetchPlans();
    } catch {
      toast.error(editingId ? 'Failed to update plan' : 'Failed to create plan');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- delete ---- */
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/plans/${id}`);
      toast.success('Plan deleted');
      fetchPlans();
    } catch {
      toast.error('Failed to delete plan');
    } finally {
      setDeletingId(null);
    }
  };

  /* ---- loading state ---- */
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-20 justify-center">
        <Loader2 size={18} className="animate-spin" />
        Loading plans...
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div className="max-w-6xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Plans</h1>
            <p className="text-sm text-gray-500">
              {plans.length} plan{plans.length !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition"
        >
          <Plus size={16} />
          Create Plan
        </button>
      </div>

      {/* inline form */}
      {showForm && (
        <section className="rounded-xl border border-gray-800 bg-gray-900 p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? 'Edit Plan' : 'Create New Plan'}
            </h3>
            <button
              onClick={closeForm}
              className="text-gray-500 hover:text-white transition"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Plan Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Starter, Professional, Enterprise"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            {/* numeric fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Max Stores
                </label>
                <input
                  type="number"
                  value={form.maxStores}
                  onChange={(e) => setForm({ ...form, maxStores: Number(e.target.value) })}
                  min={-1}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
                <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Max Users
                </label>
                <input
                  type="number"
                  value={form.maxUsers}
                  onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })}
                  min={-1}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
                <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Max Products
                </label>
                <input
                  type="number"
                  value={form.maxProducts}
                  onChange={(e) => setForm({ ...form, maxProducts: Number(e.target.value) })}
                  min={-1}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
                <p className="text-xs text-gray-500 mt-1">Use -1 for unlimited</p>
              </div>
            </div>

            {/* boolean toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { key: 'hasMobileApp' as const, label: 'Mobile App', icon: Smartphone },
                { key: 'hasOfflineMode' as const, label: 'Offline Mode', icon: WifiOff },
                { key: 'hasAdvancedReports' as const, label: 'Advanced Reports', icon: BarChart3 },
              ]).map(({ key, label, icon: Icon }) => (
                <label
                  key={key}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition',
                    form[key]
                      ? 'border-blue-600 bg-blue-600/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded border transition',
                      form[key]
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-gray-600 bg-gray-700',
                    )}
                  >
                    {form[key] && <Check size={12} />}
                  </div>
                  <Icon size={16} className={form[key] ? 'text-blue-400' : 'text-gray-500'} />
                  <span className={cn('text-sm font-medium', form[key] ? 'text-white' : 'text-gray-400')}>
                    {label}
                  </span>
                </label>
              ))}
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
                {editingId ? 'Update Plan' : 'Create Plan'}
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

      {/* card grid */}
      {plans.length === 0 ? (
        <div className="text-center py-20">
          <LayoutDashboard size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No plans created yet.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
          >
            <Plus size={14} />
            Create your first plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col transition hover:border-gray-700"
            >
              {/* card header */}
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(plan)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition"
                    title="Edit plan"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    disabled={deletingId === plan.id}
                    className={cn(
                      'p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition',
                      deletingId === plan.id && 'opacity-50 cursor-not-allowed',
                    )}
                    title="Delete plan"
                  >
                    {deletingId === plan.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>

              {/* limits */}
              <div className="space-y-2.5 flex-1">
                <div className="flex items-center gap-3">
                  <Store size={14} className="text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-400">Max Stores</span>
                  <span className="ml-auto text-sm font-medium text-gray-200">
                    {displayLimit(plan.maxStores)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Users size={14} className="text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-400">Max Users</span>
                  <span className="ml-auto text-sm font-medium text-gray-200">
                    {displayLimit(plan.maxUsers)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Package size={14} className="text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-400">Max Products</span>
                  <span className="ml-auto text-sm font-medium text-gray-200">
                    {displayLimit(plan.maxProducts)}
                  </span>
                </div>
              </div>

              {/* feature badges */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    plan.hasMobileApp
                      ? 'bg-green-400/10 text-green-400'
                      : 'bg-gray-800 text-gray-500',
                  )}
                >
                  <Smartphone size={11} />
                  Mobile
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    plan.hasOfflineMode
                      ? 'bg-green-400/10 text-green-400'
                      : 'bg-gray-800 text-gray-500',
                  )}
                >
                  <WifiOff size={11} />
                  Offline
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    plan.hasAdvancedReports
                      ? 'bg-green-400/10 text-green-400'
                      : 'bg-gray-800 text-gray-500',
                  )}
                >
                  <BarChart3 size={11} />
                  Reports
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
