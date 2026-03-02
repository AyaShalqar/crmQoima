'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUser, clearToken } from '@/lib/api';
import {
  LayoutDashboard, CheckSquare, Users, Briefcase, HandCoins,
  FileText, UserCog, LogOut, ChevronRight, Calendar, FolderKanban
} from 'lucide-react';

const nav = [
  { href: '/dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/calendar', label: 'Календарь', icon: Calendar },
  { href: '/tasks', label: 'Задачи', icon: CheckSquare },
  { href: '/projects', label: 'Проекты', icon: FolderKanban },
  { href: '/crm/clients', label: 'Клиенты', icon: Users },
  { href: '/crm/deals', label: 'Сделки', icon: Briefcase },
  { href: '/finance', label: 'Финансы', icon: HandCoins },
  { href: '/notes', label: 'Заметки', icon: FileText },
  { href: '/users', label: 'Команда', icon: UserCog, roles: ['ADMIN', 'PM'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = getUser();

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  const roleColor: Record<string, string> = {
    ADMIN: 'bg-amber-100 text-amber-800',
    PM: 'bg-blue-100 text-blue-800',
    DEV: 'bg-green-100 text-green-800',
    INTERN: 'bg-purple-100 text-purple-800',
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">Qoima</span>
          <span className="text-xs text-slate-400 font-medium ml-1">CRM</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {nav
            .filter(item => !item.roles || (user && item.roles.includes(user.role)))
            .map(item => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon size={18} className={active ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
                  {item.label}
                  {active && <ChevronRight size={14} className="ml-auto text-brand-400" />}
                </Link>
              );
            })}
        </div>
      </nav>

      {/* User info */}
      <div className="border-t border-slate-200 p-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
              <span className="text-brand-700 font-semibold text-sm">{user.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <span className={`badge text-[10px] ${roleColor[user.role] || 'bg-slate-100 text-slate-600'}`}>
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Выйти"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
