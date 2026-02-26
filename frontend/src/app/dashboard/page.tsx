'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  Wallet, TrendingUp, Target, PiggyBank,
  BarChart3, ArrowUpRight, ArrowDownRight, Minus, Banknote
} from 'lucide-react';

interface KPI {
  revenue: number;
  mrr: number;
  pipeline: number;
  profit: number;
  expenses: number;
  revenue_per_employee: number;
  growth_mom: number;
  active_users: number;
  deal_counts: Record<string, number>;
  balance: number;
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getKPI(dateFrom || undefined, dateTo || undefined);
      setKpi(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₸';
  const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  const GrowthIcon = kpi && kpi.growth_mom > 0 ? ArrowUpRight : kpi && kpi.growth_mom < 0 ? ArrowDownRight : Minus;
  const growthColor = kpi && kpi.growth_mom > 0 ? 'text-emerald-600' : kpi && kpi.growth_mom < 0 ? 'text-red-600' : 'text-slate-500';

  const metrics = kpi ? [
    { label: 'Баланс на счету', value: fmt(kpi.balance), icon: Wallet, color: kpi.balance >= 0 ? 'bg-brand-50 text-brand-600' : 'bg-red-50 text-red-600', ring: kpi.balance >= 0 ? 'ring-brand-100' : 'ring-red-100' },
    { label: 'Выручка', value: fmt(kpi.revenue), icon: Banknote, color: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100' },
    { label: 'MRR', value: fmt(kpi.mrr), icon: BarChart3, color: 'bg-blue-50 text-blue-600', ring: 'ring-blue-100' },
    { label: 'В работе', value: fmt(kpi.pipeline), icon: Target, color: 'bg-amber-50 text-amber-600', ring: 'ring-amber-100' },
    { label: 'Прибыль', value: fmt(kpi.profit), icon: PiggyBank, color: kpi.profit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600', ring: kpi.profit >= 0 ? 'ring-emerald-100' : 'ring-red-100' },
    { label: 'Расходы', value: fmt(kpi.expenses), icon: Banknote, color: 'bg-red-50 text-red-600', ring: 'ring-red-100' },
  ] : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Дашборд</h1>
          <p className="text-sm text-slate-500 mt-0.5">Обзор ключевых показателей компании</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="input-field w-auto text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-slate-400 text-sm">до</span>
          <input type="date" className="input-field w-auto text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          <button onClick={load} className="btn-primary btn-sm">Применить</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      ) : kpi ? (
        <>
          {/* Growth MoM banner */}
          <div className="card p-4 mb-6 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${kpi.growth_mom >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <TrendingUp size={20} className={growthColor} />
            </div>
            <div>
              <span className="text-sm text-slate-500">Рост за месяц</span>
              <span className={`ml-2 text-lg font-bold ${growthColor}`}>
                <GrowthIcon size={16} className="inline -mt-0.5" /> {pct(kpi.growth_mom)}
              </span>
            </div>
            <div className="ml-auto text-sm text-slate-400">{kpi.active_users} активных сотрудников</div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {metrics.map(m => (
              <div key={m.label} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ring-1 ${m.color} ${m.ring}`}>
                    <m.icon size={18} />
                  </div>
                  <span className="text-sm font-medium text-slate-500">{m.label}</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{m.value}</div>
              </div>
            ))}
          </div>

          {/* Deal Pipeline summary */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Воронка сделок</h2>
            <div className="grid grid-cols-5 gap-3">
              {[
                { key: 'LEAD', label: 'Лид' },
                { key: 'NEGOTIATION', label: 'Переговоры' },
                { key: 'PROPOSAL', label: 'Предложение' },
                { key: 'WON', label: 'Выиграна' },
                { key: 'LOST', label: 'Проиграна' },
              ].map(({ key, label }) => {
                const count = kpi.deal_counts[key] || 0;
                const colors: Record<string, string> = {
                  LEAD: 'bg-slate-100 text-slate-700',
                  NEGOTIATION: 'bg-blue-100 text-blue-700',
                  PROPOSAL: 'bg-amber-100 text-amber-700',
                  WON: 'bg-emerald-100 text-emerald-700',
                  LOST: 'bg-red-100 text-red-700',
                };
                return (
                  <div key={key} className={`rounded-xl p-4 text-center ${colors[key]}`}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs font-medium mt-1">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="text-slate-500 text-center py-20">Не удалось загрузить данные</div>
      )}
    </div>
  );
}
