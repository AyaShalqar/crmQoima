'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { Plus, ChevronLeft, ChevronRight, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  color: string;
}

const COLORS = [
  { value: '#3b82f6', label: 'Синий' },
  { value: '#10b981', label: 'Зелёный' },
  { value: '#f59e0b', label: 'Оранжевый' },
  { value: '#ef4444', label: 'Красный' },
  { value: '#8b5cf6', label: 'Фиолетовый' },
  { value: '#ec4899', label: 'Розовый' },
];

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '10:00',
    all_day: false,
    color: '#3b82f6',
  });

  const loadEvents = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const data = await api.getEvents(start, end);
    setEvents(data);
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = date.toISOString().split('T')[0];
    setForm({
      title: '',
      description: '',
      start_date: dateStr,
      start_time: '09:00',
      end_date: dateStr,
      end_time: '10:00',
      all_day: false,
      color: '#3b82f6',
    });
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    setSelectedEvent(event);
    const startDt = new Date(event.start_datetime);
    const endDt = event.end_datetime ? new Date(event.end_datetime) : startDt;
    setForm({
      title: event.title,
      description: event.description || '',
      start_date: startDt.toISOString().split('T')[0],
      start_time: startDt.toTimeString().slice(0, 5),
      end_date: endDt.toISOString().split('T')[0],
      end_time: endDt.toTimeString().slice(0, 5),
      all_day: event.all_day,
      color: event.color,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDatetime = form.all_day
      ? new Date(`${form.start_date}T00:00:00`).toISOString()
      : new Date(`${form.start_date}T${form.start_time}:00`).toISOString();
    const endDatetime = form.all_day
      ? new Date(`${form.end_date}T23:59:59`).toISOString()
      : new Date(`${form.end_date}T${form.end_time}:00`).toISOString();

    const data = {
      title: form.title,
      description: form.description || null,
      start_datetime: startDatetime,
      end_datetime: endDatetime,
      all_day: form.all_day,
      color: form.color,
    };

    if (selectedEvent) {
      await api.updateEvent(selectedEvent.id, data);
    } else {
      await api.createEvent(data);
    }

    setShowModal(false);
    setSelectedEvent(null);
    loadEvents();
  };

  const handleDelete = async () => {
    if (selectedEvent) {
      await api.deleteEvent(selectedEvent.id);
      setShowModal(false);
      setSelectedEvent(null);
      loadEvents();
    }
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Календарь</h1>
          <p className="text-sm text-slate-500 mt-0.5">Планирование и события</p>
        </div>
        <button
          onClick={() => {
            const dateStr = new Date().toISOString().split('T')[0];
            setForm({
              title: '',
              description: '',
              start_date: dateStr,
              start_time: '09:00',
              end_date: dateStr,
              end_time: '10:00',
              all_day: false,
              color: '#3b82f6',
            });
            setSelectedEvent(null);
            setShowModal(true);
          }}
          className="btn-primary btn-sm flex items-center gap-1.5"
        >
          <Plus size={14} /> Событие
        </button>
      </div>

      {/* Calendar Header */}
      <div className="card mb-4">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <ChevronRight size={20} />
            </button>
            <h2 className="text-lg font-semibold text-slate-900 ml-2">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          <button
            onClick={handleToday}
            className="btn-secondary btn-sm"
          >
            Сегодня
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Days header */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate-500 uppercase py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
            {days.map((date, idx) => {
              const isToday = date &&
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
              const dayEvents = date ? getEventsForDay(date) : [];

              return (
                <div
                  key={idx}
                  onClick={() => date && handleDayClick(date)}
                  className={`min-h-[100px] bg-white p-1.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                    !date ? 'bg-slate-50' : ''
                  }`}
                >
                  {date && (
                    <>
                      <div className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-brand-600 text-white' : 'text-slate-700'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => handleEventClick(e, event)}
                            className="text-xs px-1.5 py-0.5 rounded truncate text-white font-medium cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: event.color }}
                            title={event.title}
                          >
                            {!event.all_day && (
                              <span className="opacity-75 mr-1">{formatTime(event.start_datetime)}</span>
                            )}
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-slate-500 px-1.5">
                            +{dayEvents.length - 3} ещё
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSelectedEvent(null); }}
        title={selectedEvent ? 'Редактировать событие' : 'Новое событие'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Название *</label>
            <input
              className="input-field"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Название события"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
            <textarea
              className="input-field resize-none"
              rows={2}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Описание (опционально)"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="all_day"
              checked={form.all_day}
              onChange={e => setForm({ ...form, all_day: e.target.checked })}
              className="rounded border-slate-300"
            />
            <label htmlFor="all_day" className="text-sm text-slate-700">Весь день</label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <CalendarIcon size={12} className="inline mr-1" />
                Начало *
              </label>
              <input
                type="date"
                className="input-field"
                value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value, end_date: e.target.value })}
                required
              />
            </div>
            {!form.all_day && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Clock size={12} className="inline mr-1" />
                  Время
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={form.start_time}
                  onChange={e => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Конец</label>
              <input
                type="date"
                className="input-field"
                value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
            {!form.all_day && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Время</label>
                <input
                  type="time"
                  className="input-field"
                  value={form.end_time}
                  onChange={e => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Цвет</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, color: c.value })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === c.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <div>
              {selectedEvent && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="btn-secondary btn-sm text-red-600 hover:bg-red-50 flex items-center gap-1"
                >
                  <Trash2 size={14} /> Удалить
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowModal(false); setSelectedEvent(null); }} className="btn-secondary btn-sm">
                Отмена
              </button>
              <button type="submit" className="btn-primary btn-sm">
                {selectedEvent ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
