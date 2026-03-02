const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stunning-blessing-production-e9c1.up.railway.app';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}

export function setUser(user: any) {
  localStorage.setItem('user', JSON.stringify(user));
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  
  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/api/auth/me'),

  // Users
  getUsers: () => request('/api/users/'),
  createUser: (data: any) => request('/api/users/', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Clients
  getClients: () => request('/api/clients/'),
  createClient: (data: any) => request('/api/clients/', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: number, data: any) => request(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: number) => request(`/api/clients/${id}`, { method: 'DELETE' }),

  // Deals
  getDeals: () => request('/api/deals/'),
  createDeal: (data: any) => request('/api/deals/', { method: 'POST', body: JSON.stringify(data) }),
  updateDeal: (id: number, data: any) => request(`/api/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDeal: (id: number) => request(`/api/deals/${id}`, { method: 'DELETE' }),
  getDealComments: (dealId: number) => request(`/api/deals/${dealId}/comments`),
  addDealComment: (dealId: number, content: string) =>
    request(`/api/deals/${dealId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Tasks
  getTasks: () => request('/api/tasks/'),
  createTask: (data: any) => request('/api/tasks/', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: number, data: any) => request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id: number) => request(`/api/tasks/${id}`, { method: 'DELETE' }),

  // Finance
  getIncomes: (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    return request(`/api/finance/incomes?${params.toString()}`);
  },
  createIncome: (data: any) => request('/api/finance/incomes', { method: 'POST', body: JSON.stringify(data) }),
  deleteIncome: (id: number) => request(`/api/finance/incomes/${id}`, { method: 'DELETE' }),
  getExpenses: (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    return request(`/api/finance/expenses?${params.toString()}`);
  },
  createExpense: (data: any) => request('/api/finance/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id: number) => request(`/api/finance/expenses/${id}`, { method: 'DELETE' }),
  getFinanceReport: (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    return request(`/api/finance/report?${params.toString()}`);
  },

  // Notes
  getNotes: () => request('/api/notes/'),
  createNote: (data: any) => request('/api/notes/', { method: 'POST', body: JSON.stringify(data) }),
  updateNote: (id: number, data: any) => request(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote: (id: number) => request(`/api/notes/${id}`, { method: 'DELETE' }),

  // Dashboard
  getKPI: (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('date_from', dateFrom);
    if (dateTo) params.set('date_to', dateTo);
    return request(`/api/dashboard/kpi?${params.toString()}`);
  },

  // Settings
  getBalance: () => request('/api/settings/balance'),
  updateBalance: (amount: number) => request('/api/settings/balance', { method: 'PUT', body: JSON.stringify({ amount }) }),

  // Events (Calendar)
  getEvents: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    return request(`/api/events/?${params.toString()}`);
  },
  createEvent: (data: any) => request('/api/events/', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: number, data: any) => request(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: number) => request(`/api/events/${id}`, { method: 'DELETE' }),
};
