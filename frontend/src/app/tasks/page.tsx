'use client';

import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import Modal from '@/components/Modal';
import { Plus, ChevronLeft, ChevronRight, Trash2, Calendar, User } from 'lucide-react';

const COLUMNS = ['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;
const COLUMN_LABELS: Record<string, string> = {
  BACKLOG: 'Бэклог',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  DONE: 'Готово',
};
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочно',
};
const prioColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
};
const colColors: Record<string, string> = {
  BACKLOG: 'border-t-slate-400',
  IN_PROGRESS: 'border-t-blue-500',
  REVIEW: 'border-t-amber-500',
  DONE: 'border-t-emerald-500',
};

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee_id?: number;
  created_by: number;
  due_date?: string;
  labels?: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', assignee_id: '', due_date: '', status: 'BACKLOG' });
  const user = getUser();

  const load = async () => {
    const [t, u] = await Promise.all([api.getTasks(), api.getUsers()]);
    setTasks(t);
    setUsers(u);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createTask({
      ...form,
      assignee_id: form.assignee_id ? Number(form.assignee_id) : null,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
    });
    setShowModal(false);
    setForm({ title: '', description: '', priority: 'MEDIUM', assignee_id: '', due_date: '', status: 'BACKLOG' });
    load();
  };

  const moveTask = async (task: Task, direction: -1 | 1) => {
    const idx = COLUMNS.indexOf(task.status as any);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= COLUMNS.length) return;
    await api.updateTask(task.id, { status: COLUMNS[newIdx] });
    load();
  };

  const deleteTask = async (id: number) => {
    if (!confirm('Удалить задачу?')) return;
    await api.deleteTask(id);
    load();
  };

  const userName = (id?: number) => users.find(u => u.id === id)?.name || '—';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Задачи</h1>
          <p className="text-sm text-slate-500 mt-0.5">Канбан-доска для работы команды</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Новая задача
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col);
          return (
            <div key={col} className={`card border-t-4 ${colColors[col]} p-0`}>
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">{COLUMN_LABELS[col]}</h3>
                <span className="badge bg-slate-100 text-slate-600">{colTasks.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto">
                {colTasks.map(task => (
                  <div key={task.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium text-slate-900 leading-tight">{task.title}</h4>
                      <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <span className={`badge text-[10px] ${prioColors[task.priority]}`}>{PRIORITY_LABELS[task.priority] || task.priority}</span>
                      {task.due_date && (
                        <span className="badge text-[10px] bg-slate-50 text-slate-500">
                          <Calendar size={10} className="mr-0.5" />
                          {new Date(task.due_date).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <User size={10} /> {userName(task.assignee_id)}
                      </span>
                      <div className="flex gap-0.5">
                        {COLUMNS.indexOf(col) > 0 && (
                          <button onClick={() => moveTask(task, -1)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                            <ChevronLeft size={14} />
                          </button>
                        )}
                        {COLUMNS.indexOf(col) < COLUMNS.length - 1 && (
                          <button onClick={() => moveTask(task, 1)} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Новая задача">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Название *</label>
            <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
            <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Приоритет</label>
              <select className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {COLUMNS.map(c => <option key={c} value={c}>{COLUMN_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Исполнитель</label>
              <select className="input-field" value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
                <option value="">Не назначен</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Срок</label>
              <input type="date" className="input-field" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary btn-sm">Отмена</button>
            <button type="submit" className="btn-primary btn-sm">Создать</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
