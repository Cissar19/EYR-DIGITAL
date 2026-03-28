import React, { useState, useMemo } from 'react';
import { useLab, TIME_BLOCKS, DAYS } from '../context/LabContext';
import { useAuth } from '../context/AuthContext';
import { Monitor, X, Check, ChevronLeft, ChevronRight, Lock, Trash2, Plus, Info, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ModalContainer from './ModalContainer';

// Generate Course List (Pre-K, Kinder, 1-8 Basic A/B)
const COURSES = [
    "Pre-Kinder",
    "Kinder",
    ...Array.from({ length: 8 }, (_, i) => i + 1).flatMap(grade => [
        `${grade}° Básico A`,
        `${grade}° Básico B`
    ])
];

const ACTIVITY_TYPES = [
    "Clase Regular",
    "Evaluación DIA",
    "Ensayo SIMCE",
    "Otro"
];

export default function LabReservation() {

    const { user } = useAuth();
    const { getReservation, addReservation, removeReservation } = useLab();

    // --- 1. Navigation Logic (Week Calculation) ---
    // Start with the current week's Monday
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    });

    const handlePrevWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const handleToday = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        setCurrentWeekStart(d);
    };

    // Calculate dates for the header headers
    const weekDates = useMemo(() => {
        return DAYS.map((dayName, index) => {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + index);
            return {
                name: dayName,
                date: date,
                label: date.toLocaleDateString('es-CL', { month: '2-digit', day: '2-digit' }), // e.g. 10/02
                fullLabel: date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
            };
        });
    }, [currentWeekStart]);

    const weekRangeLabel = useMemo(() => {
        const end = new Date(currentWeekStart);
        end.setDate(currentWeekStart.getDate() + 4);
        return `${currentWeekStart.getDate()} - ${end.getDate()} ${currentWeekStart.toLocaleDateString('es-CL', { month: 'long' })}`;
    }, [currentWeekStart]);


    // --- 2. Modal State ---
    const [selectedSlot, setSelectedSlot] = useState(null); // { day, block, dateObj }
    const [course, setCourse] = useState('');
    const [activityType, setActivityType] = useState('');
    const [customActivity, setCustomActivity] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Mobile Day Navigation
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);

    const handlePrevDay = () => {
        if (selectedDayIndex > 0) {
            setSelectedDayIndex(prev => prev - 1);
        }
    };

    const handleNextDay = () => {
        if (selectedDayIndex < 4) {
            setSelectedDayIndex(prev => prev + 1);
        }
    };

    const handleSlotClick = (dayName, block, dateObj) => {
        if (block.type === 'break') return;

        // Context expects date string "YYYY-MM-DD"
        // dateObj is a JS Date object from weekDates
        const dateStr = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD format

        const reservation = getReservation(dateStr, block.id);

        setSelectedSlot({ day: dayName, block, reservation, dateObj, dateStr });

        if (!reservation) {
            setCourse('');
            setActivityType('');
            setCustomActivity('');
        }
        setIsModalOpen(true);
    };

    const handleConfirmReservation = () => {
        if (!course || !activityType) return;
        if (activityType === 'Otro' && !customActivity.trim()) return;

        const finalActivity = activityType === 'Otro' ? customActivity : activityType;
        const subject = `${course} - ${finalActivity}`;

        // Pass dateStr instead of dayName
        const success = addReservation(selectedSlot.block.id, selectedSlot.dateStr, subject);
        if (success) {
            setIsModalOpen(false);
        }
    };

    const handleCancelReservation = () => {
        if (selectedSlot.reservation) {
            removeReservation(selectedSlot.reservation.id);
            setIsModalOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <Monitor className="w-8 h-8 text-indigo-500" />
                            Reservar Enlace
                        </h1>
                        <p className="text-slate-500 mt-1 text-lg">Agenda del Laboratorio de Computación</p>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                            <span className="text-slate-600 font-medium">Disponible</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <span className="text-slate-600 font-medium">Ocupado</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                            <span className="text-slate-600 font-medium">Recreo/Almuerzo</span>
                        </div>
                    </div>
                </div>

                {/* DESKTOP VIEW: Legacy Table */}
                <div className="hidden md:block bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">

                    {/* Navigation Toolbar */}
                    <div className="border-b border-slate-200 bg-white p-4 flex items-center justify-between sticky left-0 right-0 top-0">
                        <button
                            onClick={handleToday}
                            className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors text-sm"
                        >
                            Hoy
                        </button>

                        <div className="flex items-center gap-6">
                            <button onClick={handlePrevWeek} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <h2 className="text-lg font-bold text-slate-800 capitalize w-48 text-center">
                                {weekRangeLabel}
                            </h2>
                            <button onClick={handleNextWeek} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        <div className="w-[70px]"></div> {/* Spacer for balance */}
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[1000px]">
                            {/* Grid Header */}
                            <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50">
                                <div className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center flex items-center justify-center">
                                    Horario
                                </div>
                                {weekDates.map((d) => (
                                    <div key={d.name} className="p-4 text-center border-l border-slate-200/50">
                                        <div className="text-sm font-bold text-slate-800 uppercase tracking-wide">{d.name}</div>
                                        <div className="text-xs text-indigo-500 font-bold mt-0.5">{d.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Grid Body */}
                            <div className="divide-y divide-slate-100 bg-white">
                                {TIME_BLOCKS.map((block) => {
                                    const isBreak = block.type === 'break';

                                    return (
                                        <div key={block.id} className="grid grid-cols-6">
                                            {/* Time Label */}
                                            <div className="p-3 flex flex-col justify-center items-center text-xs border-r border-slate-200/50 bg-slate-50/30">
                                                <span className={cn("font-bold block", isBreak ? "text-slate-400" : "text-slate-700")}>{block.label}</span>
                                                <span className="text-slate-400 font-mono mt-0.5 text-[10px]">{block.start} - {block.end}</span>
                                            </div>

                                            {isBreak ? (
                                                <div className="col-span-5 flex items-center justify-center p-2 bg-slate-100/50">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 tracking-widest uppercase opacity-70">
                                                        <div className="h-px w-8 bg-slate-300"></div>
                                                        {block.label === 'RECREO' ? 'RECREO' : 'ALMUERZO'}
                                                        <div className="h-px w-8 bg-slate-300"></div>
                                                    </div>
                                                </div>
                                            ) : (
                                                weekDates.map((d) => {
                                                    const dateStr = d.date.toLocaleDateString('en-CA'); // YYYY-MM-DD
                                                    const reservation = getReservation(dateStr, block.id);
                                                    const isMyReservation = reservation && user && reservation.userId === user.id;
                                                    const isAdmin = user && (user.role === 'admin' || user.role === 'director');

                                                    return (
                                                        <div key={d.name} className="p-1 border-l border-slate-100 h-[110px] relative">
                                                            <button
                                                                onClick={() => handleSlotClick(d.name, block, d.date)}
                                                                className={cn(
                                                                    "w-full h-full rounded-lg transition-all duration-200 flex flex-col p-3 text-left gap-1 relative overflow-hidden group",
                                                                    reservation
                                                                        ? "bg-red-50 border border-red-100 border-l-4 border-l-red-500 hover:shadow-md cursor-pointer"
                                                                        : "bg-emerald-50/50 border border-emerald-100/50 hover:bg-emerald-100 hover:border-emerald-200 hover:shadow-md cursor-pointer"
                                                                )}
                                                            >
                                                                {reservation ? (
                                                                    <>
                                                                        {/* Occupied State */}
                                                                        <div className="flex justify-between items-start w-full">
                                                                            <span className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight w-full pr-4">
                                                                                {reservation.subject}
                                                                            </span>
                                                                            <div className="absolute top-2 right-2">
                                                                                {(isMyReservation || isAdmin) ? (
                                                                                    <div className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded">
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </div>
                                                                                ) : (
                                                                                    <Lock className="w-3.5 h-3.5 text-slate-400 opacity-50" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-auto pt-2 border-t border-red-200/30 w-full">
                                                                            <span className="text-[10px] text-slate-600 font-semibold block truncate">
                                                                                {reservation.teacher || reservation.userName}
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {/* Available State */}
                                                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                                            <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-sm mb-1 transform group-hover:scale-110 transition-transform">
                                                                                <Plus className="w-4 h-4" />
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Reservar</span>
                                                                        </div>
                                                                        {/* Base State (Hidden on hover) */}
                                                                        <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                                                                            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Disponible</span>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* MOBILE VIEW: Agenda Mode */}
                <div className="block md:hidden space-y-4">
                    {/* Day Navigator (Sticky) */}
                    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between">
                        <button
                            onClick={handlePrevDay}
                            disabled={selectedDayIndex === 0}
                            className="p-2 bg-slate-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        <div className="text-center">
                            <h2 className="text-lg font-bold text-slate-800 capitalize">
                                {weekDates[selectedDayIndex].name} {weekDates[selectedDayIndex].date.getDate()}
                            </h2>
                            <p className="text-xs text-indigo-500 font-bold uppercase tracking-wide">
                                {weekDates[selectedDayIndex].date.toLocaleDateString('es-CL', { month: 'long' })}
                            </p>
                        </div>

                        <button
                            onClick={handleNextDay}
                            disabled={selectedDayIndex === 4}
                            className="p-2 bg-slate-100 rounded-full disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Timeline Cards */}
                    <div className="space-y-3 pb-20">
                        {TIME_BLOCKS.map(block => {
                            const isBreak = block.type === 'break';
                            const currentDay = weekDates[selectedDayIndex];
                            const dateStr = currentDay.date.toLocaleDateString('en-CA');
                            const reservation = getReservation(dateStr, block.id);
                            const isMyReservation = reservation && user && reservation.userId === user.id;
                            const isAdmin = user && (user.role === 'admin' || user.role === 'director');

                            if (isBreak) {
                                return (
                                    <div key={block.id} className="bg-slate-100/50 p-4 rounded-2xl flex items-center justify-center border border-slate-200 border-dashed">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                                            {block.label === 'RECREO' ? 'Recreo' : 'Almuerzo'}
                                            <span className="text-slate-300">|</span>
                                            {block.start} - {block.end}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={block.id}
                                    onClick={() => handleSlotClick(currentDay.name, block, currentDay.date)}
                                    className={cn(
                                        "bg-white p-4 rounded-2xl shadow-sm border-l-4 transition-all active:scale-[0.98]",
                                        reservation
                                            ? "border-l-red-500 border-t border-r border-b border-slate-100"
                                            : "border-l-emerald-500 border-t border-r border-b border-slate-100"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Left: Time & Label */}
                                        <div className="flex flex-col min-w-[80px]">
                                            <span className="text-lg font-bold text-slate-800">{block.start}</span>
                                            <span className="text-xs text-slate-500 font-medium">{block.label}</span>
                                        </div>

                                        {/* Right: Content */}
                                        <div className="flex-1">
                                            {reservation ? (
                                                <div>
                                                    <div className="flex items-start justify-between">
                                                        <h4 className="font-bold text-slate-800 text-sm line-clamp-2">
                                                            {reservation.subject}
                                                        </h4>
                                                        {(isMyReservation || isAdmin) && (
                                                            <Trash2 className="w-4 h-4 text-red-400 ml-2 shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                                                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                            {(reservation.teacher || reservation.userName || '?').charAt(0)}
                                                        </div>
                                                        <span className="font-medium truncate">{reservation.teacher || reservation.userName}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-emerald-600">Disponible</span>
                                                    <button className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg uppercase tracking-wide border border-emerald-100">
                                                        Reservar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Reservation Modal */}
            {isModalOpen && selectedSlot && (
                <ModalContainer onClose={() => setIsModalOpen(false)} maxWidth="max-w-lg">
                    {/* Modal Header */}
                    <div className="px-6 py-5 border-b border-eyr-outline-variant/30 flex justify-between items-start">
                        <div>
                            <h3 className="font-headline font-extrabold text-eyr-on-surface text-xl tracking-tight">
                                {selectedSlot.reservation ? 'Detalle de Reserva' : 'Confirmar Reserva'}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 text-sm text-eyr-on-variant">
                                <CalendarIcon className="w-4 h-4" />
                                <span className="capitalize">{selectedSlot.dateObj.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                <span className="w-1 h-1 bg-eyr-on-variant/40 rounded-full"></span>
                                <span>{selectedSlot.block.label}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="p-2 rounded-full hover:bg-red-50 hover:text-red-500 text-eyr-on-variant transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        {selectedSlot.reservation ? (
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-eyr-on-surface">{selectedSlot.reservation.subject}</h4>
                                        <p className="text-sm text-eyr-on-variant mt-1">Reservado por <span className="font-semibold text-eyr-on-surface">{selectedSlot.reservation.teacher || selectedSlot.reservation.userName}</span></p>
                                    </div>
                                </div>

                                {(selectedSlot.reservation.userId === user?.id || user?.role === 'admin' || user?.role === 'director') ? (
                                    <div className="pt-4 border-t border-eyr-outline-variant/30">
                                        <button
                                            onClick={handleCancelReservation}
                                            className="w-full py-3.5 px-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-5 h-5" /> Cancelar Reserva
                                        </button>
                                        <p className="text-xs text-center text-eyr-on-variant mt-3">Esta acción liberará el bloque para otros docentes.</p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-eyr-surface-low text-eyr-on-variant text-sm rounded-2xl flex gap-3 items-start border border-eyr-outline-variant/30">
                                        <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                                        <p>Este bloque está reservado por otro docente. Si necesitas el espacio urgente, contacta a Dirección.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                        Curso
                                    </label>
                                    <select
                                        value={course}
                                        onChange={(e) => setCourse(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                    >
                                        <option value="">Seleccionar Curso...</option>
                                        {COURSES.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                        Actividad / Motivo
                                    </label>
                                    <select
                                        value={activityType}
                                        onChange={(e) => setActivityType(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                    >
                                        <option value="">Seleccionar Motivo...</option>
                                        {ACTIVITY_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                {activityType === 'Otro' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                            Detalle de la Actividad
                                        </label>
                                        <input
                                            type="text"
                                            value={customActivity}
                                            onChange={(e) => setCustomActivity(e.target.value)}
                                            placeholder="Especifique el motivo..."
                                            className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                            autoFocus
                                        />
                                    </motion.div>
                                )}

                                <div className="pt-2 pb-1 flex items-center justify-between gap-3 bg-eyr-surface-mid px-6 py-4 -mx-6 -mb-6 border-t border-eyr-outline-variant/30">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmReservation}
                                        disabled={!course || !activityType || (activityType === 'Otro' && !customActivity.trim())}
                                        className="bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-2xl font-extrabold px-8 py-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Check className="w-5 h-5" /> Confirmar Reserva
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalContainer>
            )}
        </div>
    );
}
