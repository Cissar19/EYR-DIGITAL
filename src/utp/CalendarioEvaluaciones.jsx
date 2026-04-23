import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Plus, Pin } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth, canEdit } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import CrearEvaluacionModal from './CrearEvaluacionModal';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const ASIG_COLORS = {
    MA: 'bg-blue-500 text-white',
    LE: 'bg-violet-500 text-white',
    CN: 'bg-emerald-500 text-white',
    HI: 'bg-amber-500 text-white',
    IN: 'bg-cyan-500 text-white',
    EF: 'bg-orange-500 text-white',
    AV: 'bg-pink-500 text-white',
    MU: 'bg-rose-500 text-white',
    TE: 'bg-slate-500 text-white',
    OR: 'bg-teal-500 text-white',
};

const ASIG_SHORT = {
    MA: 'Mate', LE: 'Leng', CN: 'C.N.', HI: 'Hist', IN: 'Ing',
    EF: 'Ed.F', AV: 'Arte', MU: 'Mús', TE: 'Tec', OR: 'Orien',
};

// Build Mon-Fri week grid for a given year+month (0-indexed)
function buildMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday of the week containing the first day
    const start = new Date(firstDay);
    const startDow = start.getDay();
    start.setDate(start.getDate() - (startDow === 0 ? 6 : startDow - 1));

    // Friday of the week containing the last day
    const end = new Date(lastDay);
    const endDow = end.getDay();
    if (endDow === 0) end.setDate(end.getDate() - 2);
    else if (endDow === 6) end.setDate(end.getDate() - 1);
    else if (endDow < 5) end.setDate(end.getDate() + (5 - endDow));

    const weeks = [];
    const cursor = new Date(start);
    while (cursor <= end) {
        const week = [];
        for (let d = 0; d < 5; d++) {
            const day = new Date(cursor);
            day.setDate(cursor.getDate() + d);
            week.push({
                dateStr: day.toISOString().slice(0, 10),
                inMonth: day.getMonth() === month && day.getFullYear() === year,
            });
        }
        weeks.push(week);
        cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
}

export default function CalendarioEvaluaciones() {
    const { user } = useAuth();
    const { evaluaciones } = useEvaluaciones();
    const canCreateEval = canEdit(user) || user?.role === 'teacher' || user?.role === 'utp_head';
    const [selectedDate, setSelectedDate] = useState(null);
    const [showFijar, setShowFijar] = useState(false);

    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => today.toISOString().slice(0, 10), [today]);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Available months from current to December
    const availableMonths = useMemo(() => {
        const months = [];
        for (let m = currentMonth; m <= 11; m++) {
            months.push({ value: m, label: `${MESES[m]} ${currentYear}` });
        }
        return months;
    }, [currentMonth, currentYear]);

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const weeks = useMemo(() => buildMonthGrid(currentYear, selectedMonth), [currentYear, selectedMonth]);

    const evalsByDate = useMemo(() => {
        const map = {};
        evaluaciones.forEach(e => {
            if (!e.date) return;
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }, [evaluaciones]);

    const canGoPrev = selectedMonth > currentMonth;
    const canGoNext = selectedMonth < 11;
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="p-2.5 bg-eyr-primary-container/40 rounded-xl shrink-0">
                        <CalendarDays className="w-6 h-6 text-eyr-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-eyr-on-surface font-headline">Calendario de Evaluaciones</h1>
                        <p className="text-sm text-eyr-on-variant">
                            {canCreateEval ? 'Haz clic en un día para programar una evaluación' : 'Vista general de evaluaciones programadas'}
                        </p>
                    </div>
                </div>

                {canCreateEval && (
                    <button
                        onClick={() => setShowFijar(true)}
                        className="flex items-center gap-2 bg-eyr-primary text-white px-5 py-3 rounded-xl hover:bg-eyr-primary-dim transition-all shadow-sm text-sm font-semibold shrink-0"
                    >
                        <Pin className="w-4 h-4" /> Fijar una prueba
                    </button>
                )}

                {/* Month selector */}
                <div className="flex items-center gap-1 shrink-0 bg-eyr-primary rounded-2xl p-1 shadow-md shadow-eyr-primary/30">
                    <button
                        onClick={() => canGoPrev && setSelectedMonth(m => m - 1)}
                        disabled={!canGoPrev}
                        className="p-2 rounded-xl text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Custom dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(o => !o)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                            style={{ minWidth: '190px' }}
                        >
                            <span className="flex-1 text-center text-base font-bold text-white">
                                {MESES[selectedMonth]} {currentYear}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-white/80 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border border-eyr-outline-variant/10 overflow-hidden z-50"
                                >
                                    {availableMonths.map(({ value, label }) => (
                                        <button
                                            key={value}
                                            onClick={() => { setSelectedMonth(value); setDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors
                                                ${value === selectedMonth
                                                    ? 'bg-eyr-primary text-white'
                                                    : 'text-eyr-on-surface hover:bg-eyr-surface-high'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => canGoNext && setSelectedMonth(m => m + 1)}
                        disabled={!canGoNext}
                        className="p-2 rounded-xl text-white/80 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="bg-white rounded-3xl border border-eyr-outline-variant/10 overflow-hidden shadow-sm">
                {/* Day headers */}
                <div className="grid grid-cols-5 border-b border-eyr-outline-variant/10">
                    {DIAS.map(d => (
                        <div key={d} className="px-4 py-3 text-center text-xs font-bold text-eyr-on-variant uppercase tracking-wider bg-eyr-surface-high/40">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, wi) => (
                    <div key={wi} className={`grid grid-cols-5 ${wi < weeks.length - 1 ? 'border-b border-eyr-outline-variant/10' : ''}`}>
                        {week.map(({ dateStr, inMonth }) => {
                            const isPast = dateStr < todayStr;
                            const isToday = dateStr === todayStr;
                            const evals = evalsByDate[dateStr] || [];
                            const dayNum = parseInt(dateStr.split('-')[2]);
                            const clickable = inMonth && !isPast && canCreateEval;
                            const dimmed = !inMonth;

                            return (
                                <div
                                    key={dateStr}
                                    onClick={() => clickable && setSelectedDate(dateStr)}
                                    className={`min-h-[140px] p-3 border-r last:border-r-0 border-eyr-outline-variant/10 group transition-colors flex flex-col gap-1.5
                                        ${dimmed ? 'bg-slate-50/60' : isPast ? 'bg-slate-50/30' : isToday ? 'bg-indigo-50/50' : 'bg-white'}
                                        ${clickable ? 'cursor-pointer hover:bg-eyr-primary-container/10' : ''}
                                    `}
                                >
                                    {/* Day number */}
                                    <div className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0 transition-colors
                                        ${isToday ? 'bg-eyr-primary text-white' : dimmed ? 'text-slate-300' : isPast ? 'text-slate-300' : 'text-eyr-on-surface'}
                                    `}>
                                        {dayNum}
                                    </div>

                                    {/* Evaluaciones */}
                                    <div className="flex flex-col gap-1 flex-1">
                                        {evals.map(e => (
                                            <div
                                                key={e.id}
                                                className={`text-[11px] font-semibold px-2 py-1 rounded-lg truncate ${ASIG_COLORS[e.asignatura] || 'bg-slate-100 text-slate-600'}`}
                                                title={`${e.curso} · ${e.name}`}
                                            >
                                                <span className="font-bold">{e.curso}</span>
                                                <span className="mx-1 opacity-50">·</span>
                                                {ASIG_SHORT[e.asignatura] || e.asignatura}
                                            </div>
                                        ))}
                                        {clickable && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-auto flex items-center gap-1 text-eyr-primary/60 text-xs">
                                                <Plus className="w-3 h-3" /> Agregar
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {selectedDate && (
                    <CrearEvaluacionModal
                        onClose={() => setSelectedDate(null)}
                        onCreated={() => setSelectedDate(null)}
                        user={user}
                        defaultDate={selectedDate}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showFijar && (
                    <CrearEvaluacionModal
                        onClose={() => setShowFijar(false)}
                        onCreated={() => setShowFijar(false)}
                        user={user}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
