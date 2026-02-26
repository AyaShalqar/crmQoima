'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Landmark } from 'lucide-react';

const CATEGORIES = ['SALARY', 'TOOLS', 'MARKETING', 'OFFICE', 'OTHER'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  SALARY: 'Зарплата',
  TOOLS: 'Инструменты',
  MARKETING: 'Маркетинг',
  OFFICE: 'Офис',
  OTHER: 'Другое',
};

export default function FinancePage() {
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [report, setReport] = useState<any[]>([]);
  const [tab, setTab] = useState<'income' | 'expenses' | 'report'>('report');
  const [showModal, setShowModal] = useState<'income' | 'expense' | null>(null);
  const [form, setForm] = useState({ date: '', amount: '', source: '', comment: '', category: 'OTHER' });

  const load = async () => {
    const [i, e, r] = await Promise.all([api.getIncomes(), api.getExpenses(), api.getFinanceReport()]);
    setIncomes(i);
    setExpenses(e);
    setReport(r);
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₸';

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showModal === 'income') {
      await api.createIncome({ date: new Date(form.date).toISOString(), amount: Number(form.amount), source: form.source, comment: form.comment });
    } else {
      await api.createExpense({ date: new Date(form.date).toISOString(), amount: Number(form.amount), category: form.category, comment: form.comment });
    }
    setShowModal(null);
    setForm({ date: '', amount: '', source: '', comment: '', category: 'OTHER' });
    load();
  };

  const tabs = [
    { key: 'report', label: 'Отчёт', icon: Wallet },
    { key: 'income', label: 'Доходы', icon: TrendingUp },
    { key: 'expenses', label: 'Расходы', icon: TrendingDown },
  ] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Финансы</h1>
          <p className="text-sm text-slate-500 mt-0.5">Доходы, расходы и отчёты</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setForm({ date: '', amount: '', source: '', comment: '', category: 'OTHER' }); setShowModal('income'); }} className="btn-primary btn-sm flex items-center gap-1.5">
            <Plus size={14} /> Доход
          </button>
          <button onClick={() => { setForm({ date: '', amount: '', source: '', comment: '', category: 'OTHER' }); setShowModal('expense'); }} className="btn-secondary btn-sm flex items-center gap-1.5">
            <Plus size={14} /> Расход
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-brand-50"><Landmark size={16} className="text-brand-600" /></div>
            <span className="text-sm text-slate-500">Баланс на счету</span>
          </div>
          <div className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-brand-600' : 'text-red-600'}`}>{fmt(totalIncome - totalExpenses)}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-50"><TrendingUp size={16} className="text-emerald-600" /></div>
            <span className="text-sm text-slate-500">Всего доходов</span>
          </div>
          <div className="text-xl font-bold text-emerald-600">{fmt(totalIncome)}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-red-50"><TrendingDown size={16} className="text-red-600" /></div>
            <span className="text-sm text-slate-500">Всего расходов</span>
          </div>
          <div className="text-xl font-bold text-red-600">{fmt(totalExpenses)}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-blue-50"><Wallet size={16} className="text-blue-600" /></div>
            <span className="text-sm text-slate-500">Чистая прибыль</span>
          </div>
          <div className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(totalIncome - totalExpenses)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card overflow-hidden">
        {tab === 'report' && (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Месяц</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Выручка</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Расходы</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Прибыль</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Маржа</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.map(r => (
                <tr key={r.month} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-medium text-slate-900 text-sm">{r.month}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-emerald-600 font-medium">{fmt(r.revenue)}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-red-600 font-medium">{fmt(r.expenses)}</td>
                  <td className={`px-5 py-3.5 text-right text-sm font-bold ${r.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(r.profit)}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-slate-500">
                    {r.revenue > 0 ? `${((r.profit / r.revenue) * 100).toFixed(0)}%` : '—'}
                  </td>
                </tr>
              ))}
              {report.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">Нет данных</td></tr>}
            </tbody>
          </table>
        )}

        {tab === 'income' && (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Дата</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Источник</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Сумма</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Комментарий</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incomes.map(i => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-sm text-slate-600">{new Date(i.date).toLocaleDateString('ru-RU')}</td>
                  <td className="px-5 py-3 text-sm text-slate-700 font-medium">{i.source || '—'}</td>
                  <td className="px-5 py-3 text-right text-sm text-emerald-600 font-semibold">{fmt(i.amount)}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{i.comment || '—'}</td>
                  <td className="px-5 py-3">
                    <button onClick={async () => { await api.deleteIncome(i.id); load(); }} className="text-slate-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'expenses' && (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Дата</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Категория</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Сумма</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Комментарий</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-sm text-slate-600">{new Date(e.date).toLocaleDateString('ru-RU')}</td>
                  <td className="px-5 py-3"><span className="badge bg-slate-100 text-slate-700">{CATEGORY_LABELS[e.category] || e.category}</span></td>
                  <td className="px-5 py-3 text-right text-sm text-red-600 font-semibold">{fmt(e.amount)}</td>
                  <td className="px-5 py-3 text-sm text-slate-500">{e.comment || '—'}</td>
                  <td className="px-5 py-3">
                    <button onClick={async () => { await api.deleteExpense(e.id); load(); }} className="text-slate-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Income/Expense Modal */}
      <Modal open={!!showModal} onClose={() => setShowModal(null)} title={showModal === 'income' ? 'Добавить доход' : 'Добавить расход'}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата *</label>
              <input type="date" className="input-field" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Сумма *</label>
              <input type="number" step="0.01" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
          </div>
          {showModal === 'income' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Источник</label>
              <input className="input-field" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="напр. Консалтинг, Продукт" />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Категория</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Комментарий</label>
            <input className="input-field" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(null)} className="btn-secondary btn-sm">Отмена</button>
            <button type="submit" className="btn-primary btn-sm">Добавить</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
