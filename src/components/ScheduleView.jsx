import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SCHEDULES } from '../data/mockSchedule';
import ScheduleTimeline from './ScheduleTimeline';
import ScheduleGrid from './ScheduleGrid';
import { Sparkles, LayoutList, CalendarDays, Clock, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScheduleView() {
    const { user } = useAuth();
    const schedule = SCHEDULES[user.id] || [];
    const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'

    // Stats
    const totalHours = schedule.length * 1.5; // Approx
    const uniqueRooms = [...new Set(schedule.map(c => c.room))].length;

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-indigo-500" />
                            Mi Horario Inteligente
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">Tu agenda académica adaptada en tiempo real.</p>
                    </div>

                    {/* View Toggle */}
                    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-1 self-start md:self-auto">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                            ${viewMode === 'day'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                        >
                            <LayoutList className="w-4 h-4" />
                            Día
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                            ${viewMode === 'week'
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                        >
                            <CalendarDays className="w-4 h-4" />
                            Semana
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800">{totalHours} hrs</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Carga Semanal</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-800">{uniqueRooms}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Salas Únicas</p>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {viewMode === 'day' ? (
                        <div className="flex justify-center">
                            <ScheduleTimeline schedule={schedule} />
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto">
                            <ScheduleGrid schedule={schedule} />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
