'use client';

import { useEffect, useState } from 'react';
import { api, getUser } from '@/lib/api';
import Modal from '@/components/Modal';
import { Plus, Shield, UserCheck, UserX } from 'lucide-react';

const ROLES = ['ADMIN', 'PM', 'DEV', 'INTERN'] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Админ',
  PM: 'Менеджер',
  DEV: 'Разработчик',
  INTERN: 'Стажёр',
};
const roleColors: Record<string, string> = {
  ADMIN: 'bg-amber-100 text-amber-800',
  PM: 'bg-blue-100 text-blue-800',
  DEV: 'bg-green-100 text-green-800',
  INTERN: 'bg-purple-100 text-purple-800',
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'DEV' });
  const currentUser = getUser();

  const load = async () => {
    setUsers(await api.getUsers());
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(form);
      setShowModal(false);
      setForm({ email: '', name: '', password: '', role: 'DEV' });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (user: any) => {
    await api.updateUser(user.id, { is_active: !user.is_active });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Команда</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} участников</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Добавить
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {users.map(u => (
          <div key={u.id} className="card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
              u.is_active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {u.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{u.name}</h3>
                {!u.is_active && <span className="badge bg-red-100 text-red-600 text-[10px]">Неактивен</span>}
              </div>
              <p className="text-sm text-slate-500 truncate">{u.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`badge ${roleColors[u.role]}`}>
                  <Shield size={10} className="mr-1" />
                  {ROLE_LABELS[u.role] || u.role}
                </span>
                {u.created_at && (
                  <span className="text-xs text-slate-400">В команде с {new Date(u.created_at).toLocaleDateString('ru-RU')}</span>
                )}
              </div>
            </div>
            {currentUser?.role === 'ADMIN' && currentUser.id !== u.id && (
              <button
                onClick={() => toggleActive(u)}
                className={`p-2 rounded-lg transition-colors ${
                  u.is_active ? 'hover:bg-red-50 text-slate-400 hover:text-red-600' : 'hover:bg-green-50 text-slate-400 hover:text-green-600'
                }`}
                title={u.is_active ? 'Деактивировать' : 'Активировать'}
              >
                {u.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Добавить участника">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Имя *</label>
            <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
            <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Пароль *</label>
              <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Роль</label>
              <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
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
