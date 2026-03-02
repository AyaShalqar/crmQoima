'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FolderKanban, Download, ExternalLink } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stunning-blessing-production-e9c1.up.railway.app';

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
  status: string;
  priority: string;
  budget: number;
  spent: number;
  progress: number;
  start_date?: string;
  deadline?: string;
}

export default function SharedProjectsPage() {
  const params = useParams();
  const token = params.token as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/projects/shared/${token}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Ссылка недействительна или доступ отозван');
          } else {
            setError('Ошибка загрузки');
          }
          return;
        }
        const data = await res.json();
        setProjects(data);
      } catch {
        setError('Ошибка подключения');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const fmt = (n: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n) + ' ₸';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Доступ ограничен</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold">Q</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FolderKanban size={20} className="text-brand-600" />
                  Проекты
                </h1>
                <p className="text-xs text-slate-500">Qoima CRM • Публичный просмотр</p>
              </div>
            </div>
            <a
              href="/login"
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Войти в CRM <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Проект</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Статус</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Приоритет</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Бюджет</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Потрачено</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Прогресс</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Дедлайн</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{p.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${statusColors[p.status]}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge ${priorityColors[p.priority]}`}>
                        {PRIORITY_LABELS[p.priority] || p.priority}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">{fmt(p.budget)}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className={p.spent > p.budget ? 'text-red-600 font-medium' : 'text-slate-600'}>
                        {fmt(p.spent)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-20">
                          <div
                            className={`h-full ${
                              p.progress >= 100 ? 'bg-emerald-500' : p.progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(p.progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 w-8">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {p.deadline ? (
                        <span className={new Date(p.deadline) < new Date() && p.status !== 'COMPLETED' ? 'text-red-600' : ''}>
                          {new Date(p.deadline).toLocaleDateString('ru-RU')}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-slate-400">
          Таблица обновлена: {new Date().toLocaleString('ru-RU')}
        </div>
      </main>
    </div>
  );
}
