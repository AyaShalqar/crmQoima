'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { Plus, Trash2, Pencil, MessageSquare, Send } from 'lucide-react';

const STATUSES = ['LEAD', 'NEGOTIATION', 'PROPOSAL', 'WON', 'LOST'] as const;
const STATUS_LABELS: Record<string, string> = {
  LEAD: 'Лид',
  NEGOTIATION: 'Переговоры',
  PROPOSAL: 'Предложение',
  WON: 'Выиграна',
  LOST: 'Проиграна',
};
const statusColors: Record<string, string> = {
  LEAD: 'bg-slate-100 text-slate-700',
  NEGOTIATION: 'bg-blue-100 text-blue-700',
  PROPOSAL: 'bg-amber-100 text-amber-700',
  WON: 'bg-emerald-100 text-emerald-700',
  LOST: 'bg-red-100 text-red-700',
};

interface Deal {
  id: number;
  client_id: number;
  title: string;
  amount: number;
  currency: string;
  status: string;
  probability: number;
  expected_close_date?: string;
  owner_id: number;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ client_id: '', title: '', amount: '', currency: 'USD', status: 'LEAD', probability: '0', expected_close_date: '' });
  const [commentDeal, setCommentDeal] = useState<Deal | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  const load = async () => {
    const [d, c, u] = await Promise.all([api.getDeals(), api.getClients(), api.getUsers()]);
    setDeals(d);
    setClients(c);
    setUsers(u);
  };

  useEffect(() => { load(); }, []);

  const clientName = (id: number) => clients.find(c => c.id === id)?.company_name || '—';
  const userName = (id: number) => users.find(u => u.id === id)?.name || '—';
  const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const openNew = () => {
    setEditId(null);
    setForm({ client_id: '', title: '', amount: '', currency: 'USD', status: 'LEAD', probability: '0', expected_close_date: '' });
    setShowModal(true);
  };

  const openEdit = (d: Deal) => {
    setEditId(d.id);
    setForm({
      client_id: String(d.client_id),
      title: d.title,
      amount: String(d.amount),
      currency: d.currency,
      status: d.status,
      probability: String(d.probability),
      expected_close_date: d.expected_close_date ? d.expected_close_date.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      client_id: Number(form.client_id),
      amount: Number(form.amount),
      probability: Number(form.probability),
      expected_close_date: form.expected_close_date ? new Date(form.expected_close_date).toISOString() : null,
    };
    if (editId) {
      await api.updateDeal(editId, data);
    } else {
      await api.createDeal(data);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить сделку?')) return;
    await api.deleteDeal(id);
    load();
  };

  const openComments = async (d: Deal) => {
    setCommentDeal(d);
    setComments(await api.getDealComments(d.id));
  };

  const addComment = async () => {
    if (!newComment.trim() || !commentDeal) return;
    await api.addDealComment(commentDeal.id, newComment);
    setNewComment('');
    setComments(await api.getDealComments(commentDeal.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Сделки</h1>
          <p className="text-sm text-slate-500 mt-0.5">{deals.length} сделок в базе</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Новая сделка
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Сделка</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Клиент</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Сумма</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Статус</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Вер.</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Ответств.</th>
              <th className="w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deals.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-medium text-slate-900 text-sm">{d.title}</div>
                  {d.expected_close_date && (
                    <div className="text-xs text-slate-400 mt-0.5">Закрытие: {new Date(d.expected_close_date).toLocaleDateString('ru-RU')}</div>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{clientName(d.client_id)}</td>
                <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{fmt(d.amount)}</td>
                <td className="px-5 py-3.5"><span className={`badge ${statusColors[d.status]}`}>{STATUS_LABELS[d.status] || d.status}</span></td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{d.probability}%</td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{userName(d.owner_id)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openComments(d)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700" title="Комментарии">
                      <MessageSquare size={14} />
                    </button>
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {deals.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">Сделок пока нет</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Deal Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Редактировать сделку' : 'Новая сделка'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Название *</label>
            <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Клиент *</label>
            <select className="input-field" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} required>
              <option value="">Выберите клиента</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Сумма</label>
              <input type="number" className="input-field" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Вероятность %</label>
              <input type="number" min="0" max="100" className="input-field" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ожидаемая дата закрытия</label>
            <input type="date" className="input-field" value={form.expected_close_date} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary btn-sm">Отмена</button>
            <button type="submit" className="btn-primary btn-sm">{editId ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </Modal>

      {/* Comments Modal */}
      <Modal open={!!commentDeal} onClose={() => setCommentDeal(null)} title={commentDeal ? `Комментарии — ${commentDeal.title}` : ''}>
        <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
          {comments.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Комментариев пока нет</p>}
          {comments.map(c => (
            <div key={c.id} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">{userName(c.user_id)}</span>
                <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString('ru-RU')}</span>
              </div>
              <p className="text-sm text-slate-600">{c.content}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder="Добавить комментарий..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addComment()}
          />
          <button onClick={addComment} className="btn-primary btn-sm"><Send size={14} /></button>
        </div>
      </Modal>
    </div>
  );
}
