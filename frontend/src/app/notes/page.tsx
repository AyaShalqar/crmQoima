'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { Plus, Trash2, Pencil, FileText } from 'lucide-react';

interface Note {
  id: number;
  title: string;
  content?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });

  const load = async () => {
    const [n, u] = await Promise.all([api.getNotes(), api.getUsers()]);
    setNotes(n);
    setUsers(u);
  };

  useEffect(() => { load(); }, []);

  const userName = (id: number) => users.find(u => u.id === id)?.name || '—';

  const openNew = () => {
    setEditId(null);
    setForm({ title: '', content: '' });
    setShowModal(true);
  };

  const openEdit = (n: Note) => {
    setEditId(n.id);
    setForm({ title: n.title, content: n.content || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await api.updateNote(editId, form);
    } else {
      await api.createNote(form);
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить заметку?')) return;
    await api.deleteNote(id);
    if (selected?.id === id) setSelected(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Заметки</h1>
          <p className="text-sm text-slate-500 mt-0.5">Общая база знаний команды</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Новая заметка
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4" style={{ minHeight: '60vh' }}>
        {/* Notes list */}
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
            {notes.map(n => (
              <div
                key={n.id}
                onClick={() => setSelected(n)}
                className={`px-4 py-3 cursor-pointer transition-colors group ${
                  selected?.id === n.id ? 'bg-brand-50 border-l-2 border-brand-500' : 'hover:bg-slate-50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-900 truncate">{n.title}</h3>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); openEdit(n); }} className="p-1 rounded hover:bg-slate-200 text-slate-400">
                      <Pencil size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{userName(n.created_by)}</span>
                  {n.updated_at && <span className="text-xs text-slate-300">{new Date(n.updated_at).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">Заметок пока нет</div>
            )}
          </div>
        </div>

        {/* Note content */}
        <div className="col-span-2 card p-6">
          {selected ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">{selected.title}</h2>
                <button onClick={() => openEdit(selected)} className="btn-secondary btn-sm flex items-center gap-1.5">
                  <Pencil size={13} /> Редактировать
                </button>
              </div>
              <div className="text-xs text-slate-400 mb-4">
                Автор: {userName(selected.created_by)} · Обновлено: {selected.updated_at ? new Date(selected.updated_at).toLocaleString('ru-RU') : '—'}
              </div>
              <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {selected.content || 'Пустая заметка'}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FileText size={40} className="mb-3 text-slate-300" />
              <p className="text-sm">Выберите заметку для просмотра</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Редактировать заметку' : 'Новая заметка'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Название *</label>
            <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Содержимое (поддерживается Markdown)</label>
            <textarea className="input-field font-mono text-sm" rows={12} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary btn-sm">Отмена</button>
            <button type="submit" className="btn-primary btn-sm">{editId ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
