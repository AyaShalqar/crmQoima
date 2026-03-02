'use client';

import { useEffect, useState, useRef } from 'react';
import { api, downloadProjectsExcel } from '@/lib/api';
import Modal from '@/components/Modal';
import {
  Plus, Trash2, Pencil, Download, Share2, Copy, Check, X, Link2,
  FolderKanban, MoreHorizontal
} from 'lucide-react';

const STATUSES = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;
const STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Планирование',
  IN_PROGRESS: 'В работе',
  ON_HOLD: 'На паузе',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};
const statusColors: Record<string, string> = {
  PLANNING: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ON_HOLD: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};
const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

interface Project {
  id: number;
  name: string;
  description?: string;
  client_id?: number;
  status: string;
  priority: string;
  budget: number;
  spent: number;
  currency: string;
  progress: number;
  start_date?: string;
  deadline?: string;
  owner_id: number;
  share_token?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', client_id: '', status: 'PLANNING', priority: 'MEDIUM',
    budget: '', spent: '', currency: 'KZT', progress: '0', start_date: '', deadline: ''
  });

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Share modal
  const [shareProject, setShareProject] = useState<Project | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const [p, c, u] = await Promise.all([api.getProjects(), api.getClients(), api.getUsers()]);
    setProjects(p);
    setClients(c);
    setUsers(u);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const clientName = (id?: number) => id ? clients.find(c => c.id === id)?.company_name || '—' : '—';
  const userName = (id: number) => users.find(u => u.id === id)?.name || '—';
  const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₸';

  const openNew = () => {
    setEditId(null);
    setForm({ name: '', description: '', client_id: '', status: 'PLANNING', priority: 'MEDIUM', budget: '', spent: '', currency: 'KZT', progress: '0', start_date: '', deadline: '' });
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      client_id: p.client_id ? String(p.client_id) : '',
      status: p.status,
      priority: p.priority,
      budget: String(p.budget),
      spent: String(p.spent),
      currency: p.currency,
      progress: String(p.progress),
      start_date: p.start_date ? p.start_date.split('T')[0] : '',
      deadline: p.deadline ? p.deadline.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      client_id: form.client_id ? Number(form.client_id) : null,
      budget: Number(form.budget) || 0,
      spent: Number(form.spent) || 0,
      progress: Number(form.progress) || 0,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    };
    if (editId) {
      await api.updateProject(editId, data);
    } else {
      await api.createProject(data);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить проект?')) return;
    await api.deleteProject(id);
    load();
  };

  // Inline editing handlers
  const startEdit = (project: Project, field: string, value: string) => {
    setEditingCell({ id: project.id, field });
    setEditValue(value);
  };

  const saveInlineEdit = async () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    let value: any = editValue;

    // Convert value based on field type
    if (['budget', 'spent', 'progress'].includes(field)) {
      value = Number(value) || 0;
    }
    if (['start_date', 'deadline'].includes(field) && value) {
      value = new Date(value).toISOString();
    }
    if (field === 'client_id') {
      value = value ? Number(value) : null;
    }

    await api.updateProject(id, { [field]: value });
    setEditingCell(null);
    load();
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveInlineEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  // Share handlers
  const openShare = async (project: Project) => {
    setShareProject(project);
    if (project.share_token) {
      setShareUrl(`${window.location.origin}/projects/shared/${project.share_token}`);
    } else {
      const result = await api.generateShareLink(project.id);
      setShareUrl(`${window.location.origin}/projects/shared/${result.share_token}`);
      load();
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revokeShare = async () => {
    if (!shareProject) return;
    await api.revokeShareLink(shareProject.id);
    setShareProject(null);
    setShareUrl('');
    load();
  };

  const handleExport = async () => {
    try {
      await downloadProjectsExcel();
    } catch (e) {
      alert('Ошибка при экспорте');
    }
  };

  // Render editable cell
  const renderCell = (project: Project, field: string, displayValue: string, rawValue: string, type: 'text' | 'number' | 'date' | 'select' = 'text', options?: { value: string; label: string }[]) => {
    const isEditing = editingCell?.id === project.id && editingCell?.field === field;

    if (isEditing) {
      if (type === 'select' && options) {
        return (
          <select
            ref={inputRef as any}
            className="w-full px-2 py-1 text-sm border border-brand-500 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={saveInlineEdit}
            onKeyDown={handleKeyDown}
          >
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      }
      return (
        <input
          ref={inputRef}
          type={type}
          className="w-full px-2 py-1 text-sm border border-brand-500 rounded focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={saveInlineEdit}
          onKeyDown={handleKeyDown}
        />
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded -mx-1 transition-colors"
        onClick={() => startEdit(project, field, rawValue)}
        title="Кликните для редактирования"
      >
        {displayValue || <span className="text-slate-300">—</span>}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderKanban className="text-brand-600" size={24} />
            Проекты
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{projects.length} проектов • Кликните на ячейку для редактирования</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download size={16} /> Excel
          </button>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Новый проект
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[200px]">Проект</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[150px]">Клиент</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[120px]">Статус</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[100px]">Приоритет</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[120px]">Бюджет</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[120px]">Потрачено</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[100px]">Прогресс</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[100px]">Начало</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[100px]">Дедлайн</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-[120px]">Ответств.</th>
                <th className="w-[100px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-4 py-3">
                    {renderCell(p, 'name', p.name, p.name)}
                    {p.description && (
                      <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{p.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {renderCell(
                      p, 'client_id', clientName(p.client_id), String(p.client_id || ''), 'select',
                      [{ value: '', label: '—' }, ...clients.map(c => ({ value: String(c.id), label: c.company_name }))]
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingCell?.id === p.id && editingCell?.field === 'status' ? (
                      <select
                        ref={inputRef as any}
                        className="text-xs px-2 py-1 border border-brand-500 rounded focus:outline-none"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={saveInlineEdit}
                        onKeyDown={handleKeyDown}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    ) : (
                      <span
                        className={`badge cursor-pointer ${statusColors[p.status]}`}
                        onClick={() => startEdit(p, 'status', p.status)}
                        title="Кликните для изменения"
                      >
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingCell?.id === p.id && editingCell?.field === 'priority' ? (
                      <select
                        ref={inputRef as any}
                        className="text-xs px-2 py-1 border border-brand-500 rounded focus:outline-none"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={saveInlineEdit}
                        onKeyDown={handleKeyDown}
                      >
                        {PRIORITIES.map(s => <option key={s} value={s}>{PRIORITY_LABELS[s]}</option>)}
                      </select>
                    ) : (
                      <span
                        className={`badge cursor-pointer ${priorityColors[p.priority]}`}
                        onClick={() => startEdit(p, 'priority', p.priority)}
                        title="Кликните для изменения"
                      >
                        {PRIORITY_LABELS[p.priority] || p.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {renderCell(p, 'budget', fmt(p.budget), String(p.budget), 'number')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={p.spent > p.budget ? 'text-red-600 font-medium' : ''}>
                      {renderCell(p, 'spent', fmt(p.spent), String(p.spent), 'number')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            p.progress >= 100 ? 'bg-emerald-500' : p.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(p.progress, 100)}%` }}
                        />
                      </div>
                      <span
                        className="text-xs text-slate-600 w-10 cursor-pointer hover:text-brand-600"
                        onClick={() => startEdit(p, 'progress', String(p.progress))}
                      >
                        {editingCell?.id === p.id && editingCell?.field === 'progress' ? (
                          <input
                            ref={inputRef}
                            type="number"
                            min="0"
                            max="100"
                            className="w-12 px-1 py-0.5 text-xs border border-brand-500 rounded"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveInlineEdit}
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          `${p.progress}%`
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {renderCell(
                      p, 'start_date',
                      p.start_date ? new Date(p.start_date).toLocaleDateString('ru-RU') : '—',
                      p.start_date ? p.start_date.split('T')[0] : '',
                      'date'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={p.deadline && new Date(p.deadline) < new Date() && p.status !== 'COMPLETED' ? 'text-red-600 font-medium' : 'text-slate-600'}>
                      {renderCell(
                        p, 'deadline',
                        p.deadline ? new Date(p.deadline).toLocaleDateString('ru-RU') : '—',
                        p.deadline ? p.deadline.split('T')[0] : '',
                        'date'
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{userName(p.owner_id)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openShare(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600" title="Поделиться">
                        <Share2 size={14} />
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700" title="Редактировать">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Удалить">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={11} className="text-center py-12 text-slate-400">Проектов пока нет</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Project Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Редактировать проект' : 'Новый проект'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Название *</label>
            <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
            <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Клиент</label>
            <select className="input-field" value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
              <option value="">Без клиента</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Приоритет</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(s => <option key={s} value={s}>{PRIORITY_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Бюджет</label>
              <input type="number" className="input-field" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Потрачено</label>
              <input type="number" className="input-field" value={form.spent} onChange={e => setForm({ ...form, spent: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Прогресс %</label>
              <input type="number" min="0" max="100" className="input-field" value={form.progress} onChange={e => setForm({ ...form, progress: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дата начала</label>
              <input type="date" className="input-field" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Дедлайн</label>
              <input type="date" className="input-field" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary btn-sm">Отмена</button>
            <button type="submit" className="btn-primary btn-sm">{editId ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </Modal>

      {/* Share Modal */}
      <Modal open={!!shareProject} onClose={() => { setShareProject(null); setShareUrl(''); }} title="Поделиться проектом">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Скопируйте ссылку для доступа к таблице проектов (только просмотр):
          </p>
          <div className="flex gap-2">
            <input
              className="input-field flex-1 text-sm"
              value={shareUrl}
              readOnly
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={copyShareUrl}
              className={`btn-primary btn-sm flex items-center gap-1 ${copied ? 'bg-emerald-600' : ''}`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <button
              onClick={revokeShare}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X size={14} /> Отозвать доступ
            </button>
            <button onClick={() => { setShareProject(null); setShareUrl(''); }} className="btn-secondary btn-sm">
              Закрыть
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
