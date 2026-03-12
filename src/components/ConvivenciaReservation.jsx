import React, { useState, useMemo } from 'react';
import { useConvivencia, TIME_BLOCKS, DAYS } from '../context/ConvivenciaContext';
import { useAuth } from '../context/AuthContext';
import { Shield, X, Check, ChevronLeft, ChevronRight, Lock, Trash2, Plus, Info, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConvivenciaReservation() {

    const { user, getUsersByRole } = useAuth();
    const { getReservation, addReservation, removeReservation } = useConvivencia();

    // Teachers list for "Profesor Jefe" select
    const teachers = useMemo(() => {
        const list = getUsersByRole('teacher') || [];
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [getUsersByRole]);

    // --- 1. Navigation Logic (Week Calculation) ---
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
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

    const weekDates = useMemo(() => {
        return DAYS.map((dayName, index) => {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + index);
            return {
                name: dayName,
                date: date,
                label: date.toLocaleDateString('es-CL', { month: '2-digit', day: '2-digit' }),
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
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [motivo, setMotivo] = useState('');
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

        const dateStr = dateObj.toLocaleDateString('en-CA');
        const reservation = getReservation(dateStr, block.id);

        setSelectedSlot({ day: dayName, block, reservation, dateObj, dateStr });

        if (!reservation) {
            setSelectedTeacher('');
            setMotivo('');
        }
        setIsModalOpen(true);
    };

    const handleConfirmReservation = () => {
        if (!selectedTeacher || !motivo.trim()) return;

        const success = addReservation(selectedSlot.block.id, selectedSlot.dateStr, motivo, selectedTeacher);
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
                            <Shield className="w-8 h-8 text-amber-500" />
                            Convivencia Escolar
                        </h1>
                        <p className="text-slate-500 mt-1 text-lg">Agenda de Reservas - Oficina de Convivencia</p>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
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

                {/* DESKTOP VIEW */}
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

                        <div className="w-[70px]"></div>
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
                                        <div className="text-xs text-amber-500 font-bold mt-0.5">{d.label}</div>
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
                                                    const dateStr = d.date.toLocaleDateString('en-CA');
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
                                                                        : "bg-amber-50/50 border border-amber-100/50 hover:bg-amber-100 hover:border-amber-200 hover:shadow-md cursor-pointer"
                                                                )}
                                                            >
                                                                {reservation ? (
                                                                    <>
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
                                                                                {reservation.teacher}
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                                                                            <div className="bg-amber-500 text-white p-1.5 rounded-full shadow-sm mb-1 transform group-hover:scale-110 transition-transform">
                                                                                <Plus className="w-4 h-4" />
                                                                            </div>
                                                                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Reservar</span>
                                                                        </div>
                                                                        <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                                                                            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Disponible</span>
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
                            <p className="text-xs text-amber-500 font-bold uppercase tracking-wide">
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
                                            : "border-l-amber-500 border-t border-r border-b border-slate-100"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex flex-col min-w-[80px]">
                                            <span className="text-lg font-bold text-slate-800">{block.start}</span>
                                            <span className="text-xs text-slate-500 font-medium">{block.label}</span>
                                        </div>

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
                                                        <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700">
                                                            {(reservation.teacher || '?').charAt(0)}
                                                        </div>
                                                        <span className="font-medium truncate">{reservation.teacher}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-amber-600">Disponible</span>
                                                    <button className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg uppercase tracking-wide border border-amber-100">
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
            <AnimatePresence>
                {isModalOpen && selectedSlot && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
                        >
                            {/* Modal Header */}
                            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                        {selectedSlot.reservation ? 'Detalle de Reserva' : 'Confirmar Reserva'}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                        <CalendarIcon className="w-4 h-4" />
                                        <span className="capitalize">{selectedSlot.dateObj.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                        <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                        <span>{selectedSlot.block.label}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                {selectedSlot.reservation ? (
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                                <Info className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800">{selectedSlot.reservation.subject}</h4>
                                                <p className="text-sm text-slate-500 mt-1">Profesor Jefe: <span className="font-semibold text-slate-700">{selectedSlot.reservation.teacher}</span></p>
                                            </div>
                                        </div>

                                        {(selectedSlot.reservation.userId === user?.id || user?.role === 'admin' || user?.role === 'director') ? (
                                            <div className="pt-4 border-t border-slate-100">
                                                <button
                                                    onClick={handleCancelReservation}
                                                    className="w-full py-3.5 px-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 className="w-5 h-5" /> Cancelar Reserva
                                                </button>
                                                <p className="text-xs text-center text-slate-400 mt-3">Esta accion liberara el bloque.</p>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-slate-50 text-slate-500 text-sm rounded-xl flex gap-3 items-start border border-slate-100">
                                                <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                                                <p>Este bloque esta reservado por otro usuario. Si necesitas el espacio, contacta a Direccion.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                Profesor Jefe
                                            </label>
                                            <select
                                                value={selectedTeacher}
                                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                                            >
                                                <option value="">Seleccionar Profesor...</option>
                                                {teachers.map(t => (
                                                    <option key={t.id} value={t.name}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                Motivo de la Reunion
                                            </label>
                                            <input
                                                type="text"
                                                value={motivo}
                                                onChange={(e) => setMotivo(e.target.value)}
                                                placeholder="Ej: Reunion apoderados, mediacion, entrevista..."
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                                            />
                                        </div>

                                        <button
                                            onClick={handleConfirmReservation}
                                            disabled={!selectedTeacher || !motivo.trim()}
                                            className="w-full py-4 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-lg"
                                        >
                                            <Check className="w-5 h-5" /> Confirmar Reserva
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
