import React, { useState, useMemo } from 'react';
import { useConvivencia, TIME_BLOCKS, DAYS } from '../context/ConvivenciaContext';
import { useAuth } from '../context/AuthContext';
import { Shield, X, Check, ChevronLeft, ChevronRight, Lock, Trash2, Plus, Info, Calendar as CalendarIcon, BookOpen, User, Clock, CheckCircle2, AlertCircle, Sparkles, BarChart3, TrendingUp, UserX, ChevronDown, Users as UsersIcon, Search, AlertTriangle, Ban, Unlock } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import IncidentsView from './convivencia/IncidentsView';
import ModalContainer from './ModalContainer';

export default function ConvivenciaReservation() {

    const { user, getUsersByRole } = useAuth();

    // ── Tabs: only convivencia/admin/super_admin see Incidencias tab ──
    const showTabs = user && ['convivencia_head', 'convivencia', 'admin', 'super_admin'].includes(user.role);
    const [activeTab, setActiveTab] = useState('reservas');
    const { reservations, getReservation, addReservation, removeReservation, getBlockedSlot, blockSlot, unblockSlot } = useConvivencia();
    const { getSchedule } = useSchedule();

    // Teachers list
    const teachers = useMemo(() => {
        const list = (getUsersByRole('teacher') || []).filter(t => t.isHeadTeacher);
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }, [getUsersByRole]);

    // Can this user block/unblock slots?
    const canBlockSlots = user && ['convivencia_head', 'admin', 'super_admin'].includes(user.role);

    // Fridays end after Bloque 7 — hide blocks 8, 9, 10
    const FRIDAY_HIDDEN_BLOCKS = new Set(['b8', 'b9', 'b10']);
    const isFridayHidden = (dayName, blockId) => dayName === 'Viernes' && FRIDAY_HIDDEN_BLOCKS.has(blockId);

    // Filter: convivencia selects a teacher to see their schedule
    const [filterTeacherId, setFilterTeacherId] = useState('');
    const [teacherSearch, setTeacherSearch] = useState('');
    const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
    const teacherDropdownRef = React.useRef(null);

    // Close dropdown on outside click
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (teacherDropdownRef.current && !teacherDropdownRef.current.contains(e.target)) {
                setIsTeacherDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const normalizeSearch = (text) =>
        text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

    const filteredTeachersList = useMemo(() => {
        if (!teacherSearch.trim()) return teachers;
        const norm = normalizeSearch(teacherSearch);
        return teachers.filter(t => normalizeSearch(t.name).includes(norm));
    }, [teachers, teacherSearch]);

    const filterTeacher = useMemo(() => {
        if (!filterTeacherId) return null;
        return teachers.find(t => t.id === filterTeacherId) || null;
    }, [filterTeacherId, teachers]);

    // Schedule overlay: teachers see own, admin/convivencia see selected teacher's
    const isTeacherRole = user?.role === 'teacher';

    const overlaySchedule = useMemo(() => {
        if (!user) return [];
        if (isTeacherRole) return getSchedule(user.id);
        if (filterTeacherId) return getSchedule(filterTeacherId);
        return [];
    }, [user, isTeacherRole, filterTeacherId, getSchedule]);

    const normalizeDay = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const getTeacherClass = (dayName, startTime) => {
        if (!overlaySchedule.length) return null;
        return overlaySchedule.find(
            s => normalizeDay(s.day) === normalizeDay(dayName) && s.startTime === startTime
        );
    };

    // --- Today detection ---
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const todayStr = useMemo(() => today.toLocaleDateString('en-CA'), [today]);

    // --- Current time for "next available" hint ---
    const [currentTime, setCurrentTime] = useState(() => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    });

    // --- 1. Navigation Logic (Week Calculation) ---
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        // Start on the week of March 30, 2026
        return new Date(2026, 2, 30); // month is 0-indexed: 2 = March
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


    // --- Helper: is a given date today? ---
    const isToday = (dateObj) => {
        return dateObj.toLocaleDateString('en-CA') === todayStr;
    };

    // --- Quick stats for teacher banner ---
    const teacherStats = useMemo(() => {
        if (!isTeacherRole) return null;

        const classBlocks = TIME_BLOCKS.filter(b => b.type === 'class');
        let availableToday = 0;
        let myReservationsThisWeek = 0;
        let nextFreeBlock = null;

        // Count week reservations
        for (const wd of weekDates) {
            const dateStr = wd.date.toLocaleDateString('en-CA');
            for (const block of classBlocks) {
                const reservation = getReservation(dateStr, block.id);
                if (reservation && reservation.userId === user?.id) {
                    myReservationsThisWeek++;
                }
            }
        }

        // Count available blocks today & find next free
        const todayDate = weekDates.find(wd => isToday(wd.date));
        if (todayDate) {
            const todayDateStr = todayDate.date.toLocaleDateString('en-CA');
            for (const block of classBlocks) {
                const reservation = getReservation(todayDateStr, block.id);
                const teacherClass = getTeacherClass(todayDate.name, block.start);
                if (!reservation && !teacherClass) {
                    availableToday++;
                    if (!nextFreeBlock && block.start >= currentTime) {
                        nextFreeBlock = block;
                    }
                }
            }
        }

        return { availableToday, myReservationsThisWeek, nextFreeBlock };
    }, [isTeacherRole, weekDates, getReservation, user, overlaySchedule, currentTime]);

    // --- Dashboard data for non-teacher roles ---
    const weekDateStrings = useMemo(() => {
        return new Set(weekDates.map(wd => wd.date.toLocaleDateString('en-CA')));
    }, [weekDates]);

    const teacherIdsWithReservation = useMemo(() => {
        const ids = new Set();
        for (const r of reservations) {
            if (weekDateStrings.has(r.date)) {
                ids.add(r.userId);
            }
        }
        return ids;
    }, [reservations, weekDateStrings]);

    const teachersWithoutReservations = useMemo(() => {
        return teachers.filter(t => !teacherIdsWithReservation.has(t.id));
    }, [teachers, teacherIdsWithReservation]);

    const weekStats = useMemo(() => {
        const totalTeachers = teachers.length;
        const withReservation = teacherIdsWithReservation.size;
        const completionPct = totalTeachers > 0 ? Math.round((withReservation / totalTeachers) * 100) : 0;

        const weekReservations = reservations.filter(r => weekDateStrings.has(r.date));
        const totalReservations = weekReservations.length;

        const reservationsByDay = weekDates.map(wd => {
            const dateStr = wd.date.toLocaleDateString('en-CA');
            const count = weekReservations.filter(r => r.date === dateStr).length;
            return { dayName: wd.name, count };
        });

        const mostPopularDay = reservationsByDay.reduce((best, d) => d.count > best.count ? d : best, reservationsByDay[0]);

        return { totalTeachers, withReservation, completionPct, totalReservations, reservationsByDay, mostPopularDay };
    }, [teachers, teacherIdsWithReservation, reservations, weekDateStrings, weekDates]);

    const upcomingToday = useMemo(() => {
        const todayReservations = reservations
            .filter(r => r.date === todayStr)
            .map(r => {
                const block = TIME_BLOCKS.find(b => b.id === r.blockId);
                return { ...r, block };
            })
            .filter(r => r.block && r.block.start >= currentTime)
            .sort((a, b) => a.block.start.localeCompare(b.block.start));
        return todayReservations.slice(0, 3);
    }, [reservations, todayStr, currentTime]);

    // --- Dashboard collapse state ---
    const [dashboardCollapsed, setDashboardCollapsed] = useState(false);

    // --- ConvivenciaDashboard component ---
    const ConvivenciaDashboard = () => (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
            {/* Header */}
            <button
                onClick={() => setDashboardCollapsed(prev => !prev)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Resumen Semanal</h3>
                    <span className="text-xs text-slate-400 font-medium">{weekRangeLabel}</span>
                </div>
                <motion.div animate={{ rotate: dashboardCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {!dashboardCollapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-4">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* % Completado */}
                                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Completado</span>
                                    </div>
                                    <div className="flex items-end gap-1">
                                        <span className="text-2xl font-black text-emerald-700">{weekStats.completionPct}%</span>
                                    </div>
                                    <div className="mt-2 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${weekStats.completionPct}%` }} />
                                    </div>
                                </div>

                                {/* Con reserva */}
                                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <UsersIcon className="w-4 h-4 text-indigo-500" />
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Con Reserva</span>
                                    </div>
                                    <div className="flex items-end gap-1">
                                        <span className="text-2xl font-black text-indigo-700">{weekStats.withReservation}</span>
                                        <span className="text-sm font-bold text-indigo-400 mb-0.5">/ {weekStats.totalTeachers}</span>
                                    </div>
                                </div>

                                {/* Total bloques */}
                                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CalendarIcon className="w-4 h-4 text-amber-500" />
                                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Bloques</span>
                                    </div>
                                    <div className="flex items-end gap-1">
                                        <span className="text-2xl font-black text-amber-700">{weekStats.totalReservations}</span>
                                        <span className="text-xs font-bold text-amber-400 mb-0.5">reservados</span>
                                    </div>
                                </div>

                                {/* Sin reserva */}
                                <div className={cn(
                                    "rounded-xl p-3 border",
                                    teachersWithoutReservations.length > 0
                                        ? "bg-red-50 border-red-100"
                                        : "bg-slate-50 border-slate-100"
                                )}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <UserX className={cn("w-4 h-4", teachersWithoutReservations.length > 0 ? "text-red-500" : "text-slate-400")} />
                                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", teachersWithoutReservations.length > 0 ? "text-red-600" : "text-slate-500")}>Sin Reserva</span>
                                    </div>
                                    <div className="flex items-end gap-1">
                                        <span className={cn("text-2xl font-black", teachersWithoutReservations.length > 0 ? "text-red-700" : "text-slate-400")}>{teachersWithoutReservations.length}</span>
                                        <span className={cn("text-xs font-bold mb-0.5", teachersWithoutReservations.length > 0 ? "text-red-400" : "text-slate-300")}>profesores</span>
                                    </div>
                                </div>
                            </div>

                            {/* Two columns: teachers without + mini calendar */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Teachers without reservations */}
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <UserX className="w-3.5 h-3.5 text-slate-400" />
                                        Profesores sin reserva esta semana
                                    </h4>
                                    {teachersWithoutReservations.length === 0 ? (
                                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium py-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Todos los profesores tienen reserva
                                        </div>
                                    ) : (
                                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                                            {teachersWithoutReservations.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setFilterTeacherId(t.id)}
                                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all text-left group"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-[10px] font-bold text-red-600 shrink-0">
                                                        {(t.name || '?').charAt(0)}
                                                    </div>
                                                    <span className="text-sm text-slate-700 font-medium truncate group-hover:text-amber-700 transition-colors">{t.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Mini weekly calendar */}
                                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                                        Reservas por dia
                                    </h4>
                                    <div className="flex items-end gap-2 h-24">
                                        {weekStats.reservationsByDay.map(d => {
                                            const maxCount = Math.max(...weekStats.reservationsByDay.map(x => x.count), 1);
                                            const heightPct = (d.count / maxCount) * 100;
                                            const isMax = d.dayName === weekStats.mostPopularDay?.dayName && d.count > 0;
                                            return (
                                                <div key={d.dayName} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                                                    <span className={cn("text-xs font-bold", isMax ? "text-amber-600" : "text-slate-500")}>{d.count}</span>
                                                    <div
                                                        className={cn(
                                                            "w-full rounded-t-lg transition-all duration-300 min-h-[4px]",
                                                            isMax ? "bg-amber-400" : "bg-slate-300"
                                                        )}
                                                        style={{ height: `${Math.max(heightPct, 5)}%` }}
                                                    />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{d.dayName.slice(0, 3)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {weekStats.mostPopularDay && weekStats.mostPopularDay.count > 0 && (
                                        <div className="mt-2 text-xs text-slate-500 text-center">
                                            Dia mas popular: <span className="font-bold text-amber-600">{weekStats.mostPopularDay.dayName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upcoming today banner */}
                            {upcomingToday.length > 0 && (
                                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                                        Proximas reservas hoy
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {upcomingToday.map(r => (
                                            <div key={r.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-100 text-sm">
                                                <span className="font-bold text-amber-600">{r.block?.start}</span>
                                                <span className="text-slate-600 font-medium truncate max-w-[150px]">{r.teacher}</span>
                                                <span className="text-slate-400">-</span>
                                                <span className="text-slate-500 truncate max-w-[150px]">{r.subject}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    // --- 2. Modal State ---
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [motivo, setMotivo] = useState('Reuniones bimensuales');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('reserve'); // 'reserve' | 'block'
    const [blockReason, setBlockReason] = useState('');

    // Mobile Day Navigation - default to today if it's a weekday in the current week
    const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
        const todayDay = new Date().getDay(); // 0=Sun, 1=Mon...
        if (todayDay >= 1 && todayDay <= 5) return todayDay - 1;
        return 0;
    });

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
        const blocked = getBlockedSlot(dateStr, block.id);

        // Non-blocker users can't interact with blocked slots
        if (blocked && !canBlockSlots) return;

        setSelectedSlot({ day: dayName, block, reservation, dateObj, dateStr, blocked });
        setModalMode('reserve');
        setBlockReason('');

        if (!reservation && !blocked) {
            // Auto-fill: teachers get their own name, admins get the filtered teacher
            if (isTeacherRole) {
                setSelectedTeacher(user?.name || '');
            } else {
                setSelectedTeacher(filterTeacher ? filterTeacher.name : '');
            }
            setMotivo('Reuniones bimensuales');
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

    const handleConfirmBlock = async () => {
        if (!blockReason.trim()) return;
        const success = await blockSlot(selectedSlot.block.id, selectedSlot.dateStr, blockReason);
        if (success) setIsModalOpen(false);
    };

    const handleUnblock = async () => {
        if (selectedSlot?.blocked) {
            await unblockSlot(selectedSlot.blocked.id);
            setIsModalOpen(false);
        }
    };

    // ── Incidencias tab content ──
    if (showTabs && activeTab === 'incidencias') {
        return (
            <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 pb-24">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                <Shield className="w-8 h-8 text-amber-500" />
                                Convivencia Escolar
                            </h1>
                            <p className="text-slate-500 mt-1 text-lg">Gestion de Incidencias y Alumnos</p>
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('reservas')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px",
                                "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <CalendarIcon className="w-4 h-4" /> Reservas
                        </button>
                        <button
                            onClick={() => setActiveTab('incidencias')}
                            className="flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px border-amber-500 text-amber-700"
                        >
                            <AlertTriangle className="w-4 h-4" /> Incidencias
                        </button>
                    </div>

                    <IncidentsView />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 pb-24">
            <div className="max-w-7xl mx-auto">
                {/* Teacher Welcome Banner */}
                {isTeacherRole && teacherStats && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-2xl border border-amber-200/60 p-5 md:p-6"
                    >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    Hola, {user?.name?.split(' ')[0]}
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    Reserva un bloque en la oficina de Convivencia Escolar. Los bloques en <span className="text-indigo-500 font-semibold">azul</span> son tus horas de clase.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-amber-100 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <span className="text-lg font-bold text-slate-800">{teacherStats.availableToday}</span>
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight">Libres hoy</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-amber-100 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <CalendarIcon className="w-4 h-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <span className="text-lg font-bold text-slate-800">{teacherStats.myReservationsThisWeek}</span>
                                        <p className="text-[10px] text-slate-400 font-medium leading-tight">Mis reservas</p>
                                    </div>
                                </div>
                                {teacherStats.nextFreeBlock && (
                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-sm">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-emerald-700">{teacherStats.nextFreeBlock.start}</span>
                                            <p className="text-[10px] text-slate-400 font-medium leading-tight">Proximo libre</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                            <Shield className="w-8 h-8 text-amber-500" />
                            Convivencia Escolar
                        </h1>
                        <p className="text-slate-500 mt-1 text-lg">Agenda de Reservas - Oficina de Convivencia</p>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm flex-wrap">
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
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                            <span className="text-slate-600 font-medium">Bloqueado</span>
                        </div>
                        {overlaySchedule.length > 0 && (
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                                <span className="text-slate-600 font-medium">En Clase</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs for convivencia/admin/super_admin */}
                {showTabs && (
                    <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
                        <button
                            onClick={() => setActiveTab('reservas')}
                            className="flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px border-amber-500 text-amber-700"
                        >
                            <CalendarIcon className="w-4 h-4" /> Reservas
                        </button>
                        <button
                            onClick={() => setActiveTab('incidencias')}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px",
                                "border-transparent text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <AlertTriangle className="w-4 h-4" /> Incidencias
                        </button>
                    </div>
                )}

                {/* Teacher selector for Convivencia/Admin (teachers already see their own schedule) */}
                {!isTeacherRole && (
                    <div className="mb-6 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 whitespace-nowrap">
                            <User className="w-4 h-4 text-amber-500" />
                            Ver disponibilidad de:
                        </div>

                        {/* Custom searchable teacher selector */}
                        <div className="relative flex-1 w-full sm:w-auto" ref={teacherDropdownRef}>
                            <button
                                type="button"
                                onClick={() => { setIsTeacherDropdownOpen(prev => !prev); setTeacherSearch(''); }}
                                className={cn(
                                    "w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm",
                                    isTeacherDropdownOpen
                                        ? "border-amber-500 bg-white shadow-sm"
                                        : "border-slate-100 bg-slate-50/50 hover:border-slate-200",
                                    filterTeacher ? "text-slate-800" : "text-slate-400"
                                )}
                            >
                                <span className="truncate">
                                    {filterTeacher ? filterTeacher.name : 'Seleccionar docente...'}
                                </span>
                                <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", isTeacherDropdownOpen && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {isTeacherDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute z-30 top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
                                    >
                                        {/* Search input */}
                                        <div className="p-2 border-b border-slate-100">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={teacherSearch}
                                                    onChange={(e) => setTeacherSearch(e.target.value)}
                                                    placeholder="Buscar docente..."
                                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* Options list */}
                                        <div className="max-h-64 overflow-y-auto overscroll-contain">
                                            <button
                                                type="button"
                                                onClick={() => { setFilterTeacherId(''); setIsTeacherDropdownOpen(false); }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2",
                                                    !filterTeacherId ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:bg-slate-50"
                                                )}
                                            >
                                                <UsersIcon className="w-4 h-4 shrink-0" />
                                                Todos los docentes
                                            </button>
                                            {filteredTeachersList.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => { setFilterTeacherId(t.id); setIsTeacherDropdownOpen(false); }}
                                                    className={cn(
                                                        "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-3",
                                                        filterTeacherId === t.id ? "bg-amber-50 text-amber-700" : "text-slate-700 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                                                        filterTeacherId === t.id ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {t.name?.charAt(0)}
                                                    </div>
                                                    <span className="truncate">{t.name}</span>
                                                    {filterTeacherId === t.id && <Check className="w-4 h-4 ml-auto shrink-0 text-amber-500" />}
                                                </button>
                                            ))}
                                            {filteredTeachersList.length === 0 && (
                                                <div className="px-4 py-6 text-center text-sm text-slate-400">
                                                    No se encontraron docentes
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {filterTeacher && (
                            <button
                                onClick={() => setFilterTeacherId('')}
                                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                )}

                {/* Dashboard for non-teacher roles */}
                {!isTeacherRole && <ConvivenciaDashboard />}

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
                                {weekDates.map((d) => {
                                    const isTodayCol = isToday(d.date);
                                    return (
                                        <div key={d.name} className={cn(
                                            "p-4 text-center border-l border-slate-200/50 relative",
                                            isTodayCol && "bg-amber-50/60"
                                        )}>
                                            <div className={cn("text-sm font-bold uppercase tracking-wide", isTodayCol ? "text-amber-700" : "text-slate-800")}>{d.name}</div>
                                            <div className={cn("text-xs font-bold mt-0.5", isTodayCol ? "text-amber-600" : "text-amber-500")}>{d.label}</div>
                                            {isTodayCol && (
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-500 rounded-full" />
                                            )}
                                        </div>
                                    );
                                })}
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
                                                    const blocked = getBlockedSlot(dateStr, block.id);
                                                    const isMyReservation = reservation && user && reservation.userId === user.id;
                                                    const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'director');
                                                    const teacherClass = getTeacherClass(d.name, block.start);
                                                    const isTodayCol = isToday(d.date);

                                                    return (
                                                        <div key={d.name} className={cn("p-1 border-l border-slate-100 h-[110px] relative", isTodayCol && "bg-amber-50/30")}>
                                                            {isFridayHidden(d.name, block.id) ? (
                                                                <div className="w-full h-full rounded-lg bg-slate-50/50 flex items-center justify-center">
                                                                    <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">—</span>
                                                                </div>
                                                            ) : blocked ? (
                                                                // Blocked slot
                                                                <button
                                                                    onClick={() => canBlockSlots ? handleSlotClick(d.name, block, d.date) : null}
                                                                    className={cn(
                                                                        "w-full h-full rounded-lg bg-slate-100 border border-slate-200 border-l-4 border-l-slate-500 flex flex-col p-3 text-left gap-0.5 relative overflow-hidden",
                                                                        canBlockSlots ? "hover:bg-slate-200 cursor-pointer group" : "cursor-not-allowed opacity-70"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-1 mb-0.5">
                                                                        <Ban className="w-3 h-3 text-slate-500 shrink-0" />
                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bloqueado</span>
                                                                    </div>
                                                                    <span className="text-xs font-medium text-slate-600 line-clamp-2">{blocked.reason}</span>
                                                                    {canBlockSlots && (
                                                                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Unlock className="w-3.5 h-3.5 text-slate-400" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ) : teacherClass ? (
                                                                // Teacher is in class during this block
                                                                <button
                                                                    onClick={() => handleSlotClick(d.name, block, d.date)}
                                                                    className="w-full h-full rounded-lg bg-indigo-50/80 border border-indigo-100 border-l-4 border-l-indigo-400 flex flex-col p-3 text-left gap-0.5 relative overflow-hidden group hover:bg-indigo-100/80 transition-all cursor-pointer"
                                                                >
                                                                    {reservation && (
                                                                        <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-400 ring-2 ring-white" title="Convivencia reservada" />
                                                                    )}
                                                                    <div className="flex items-center gap-1 mb-0.5">
                                                                        <BookOpen className="w-3 h-3 text-indigo-400 shrink-0" />
                                                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">En Clase</span>
                                                                    </div>
                                                                    <span className="text-xs font-bold text-slate-700 line-clamp-1">{teacherClass.subject}</span>
                                                                    <span className="text-[10px] text-slate-400 mt-auto">{teacherClass.course}</span>
                                                                </button>
                                                            ) : (
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
                                                            )}
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
                            <h2 className="text-lg font-bold text-slate-800 capitalize flex items-center gap-2 justify-center">
                                {weekDates[selectedDayIndex].name} {weekDates[selectedDayIndex].date.getDate()}
                                {isToday(weekDates[selectedDayIndex].date) && (
                                    <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Hoy</span>
                                )}
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
                            const blocked = getBlockedSlot(dateStr, block.id);
                            const isMyReservation = reservation && user && reservation.userId === user.id;
                            const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'director');
                            const teacherClass = getTeacherClass(currentDay.name, block.start);

                            // Hide blocks after b7 on Fridays
                            if (isFridayHidden(currentDay.name, block.id)) return null;

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

                            if (blocked) {
                                return (
                                    <div
                                        key={block.id}
                                        onClick={() => canBlockSlots ? handleSlotClick(currentDay.name, block, currentDay.date) : null}
                                        className={cn(
                                            "bg-slate-100 p-4 rounded-2xl shadow-sm border-l-4 border-l-slate-500 border-t border-r border-b border-slate-200 transition-all",
                                            canBlockSlots ? "active:scale-[0.98] cursor-pointer" : "opacity-70 cursor-not-allowed"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex flex-col min-w-[80px]">
                                                <span className="text-lg font-bold text-slate-600">{block.start}</span>
                                                <span className="text-xs text-slate-400 font-medium">{block.label}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Ban className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bloqueado</span>
                                                </div>
                                                <h4 className="font-medium text-slate-600 text-sm">{blocked.reason}</h4>
                                            </div>
                                            {canBlockSlots && (
                                                <Unlock className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            if (teacherClass) {
                                return (
                                    <div
                                        key={block.id}
                                        onClick={() => handleSlotClick(currentDay.name, block, currentDay.date)}
                                        className="bg-indigo-50/80 p-4 rounded-2xl shadow-sm border-l-4 border-l-indigo-400 border-t border-r border-b border-indigo-100 transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex flex-col min-w-[80px]">
                                                <span className="text-lg font-bold text-slate-800">{block.start}</span>
                                                <span className="text-xs text-slate-500 font-medium">{block.label}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">En Clase</span>
                                                    {reservation && (
                                                        <div className="ml-auto w-2.5 h-2.5 rounded-full bg-red-400" title="Convivencia reservada" />
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-slate-700 text-sm">{teacherClass.subject}</h4>
                                                <span className="text-xs text-slate-400">{teacherClass.course}</span>
                                            </div>
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
                        {selectedSlot.blocked ? (
                            // ── Blocked slot: show info + unblock ──
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-eyr-surface-low flex items-center justify-center text-eyr-on-variant shrink-0">
                                        <Ban className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-eyr-on-surface">Bloque Bloqueado</h4>
                                        <p className="text-sm text-eyr-on-variant mt-1">Motivo: <span className="font-semibold text-eyr-on-surface">{selectedSlot.blocked.reason}</span></p>
                                        {selectedSlot.blocked.blockedByName && (
                                            <p className="text-xs text-eyr-on-variant mt-1">Bloqueado por: {selectedSlot.blocked.blockedByName}</p>
                                        )}
                                    </div>
                                </div>
                                {canBlockSlots && (
                                    <div className="pt-4 border-t border-eyr-outline-variant/30">
                                        <button
                                            onClick={handleUnblock}
                                            className="w-full py-3.5 px-4 bg-eyr-surface-low text-eyr-on-surface font-bold rounded-2xl border border-eyr-outline-variant/30 hover:bg-eyr-surface-mid transition-all flex items-center justify-center gap-2"
                                        >
                                            <Unlock className="w-5 h-5" /> Desbloquear
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : selectedSlot.reservation ? (
                            // ── Existing reservation ──
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                        <Info className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-eyr-on-surface">{selectedSlot.reservation.subject}</h4>
                                        <p className="text-sm text-eyr-on-variant mt-1">Profesor Jefe: <span className="font-semibold text-eyr-on-surface">{selectedSlot.reservation.teacher}</span></p>
                                    </div>
                                </div>

                                {(selectedSlot.reservation.userId === user?.id || user?.role === 'admin' || user?.role === 'director' || user?.role === 'convivencia' || user?.role === 'convivencia_head' || user?.role === 'super_admin') ? (
                                    <div className="pt-4 border-t border-eyr-outline-variant/30">
                                        <button
                                            onClick={handleCancelReservation}
                                            className="w-full py-3.5 px-4 bg-red-50 text-red-600 font-bold rounded-2xl border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Trash2 className="w-5 h-5" /> Cancelar Reserva
                                        </button>
                                        <p className="text-xs text-center text-eyr-on-variant mt-3">Esta accion liberara el bloque.</p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-eyr-surface-low text-eyr-on-variant text-sm rounded-2xl flex gap-3 items-start border border-eyr-outline-variant/30">
                                        <Lock className="w-5 h-5 shrink-0 mt-0.5" />
                                        <p>Este bloque esta reservado por otro usuario. Si necesitas el espacio, contacta a Convivencia Escolar.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // ── Empty slot: reserve or block ──
                            <div className="space-y-5">
                                {/* Mode toggle for users who can block */}
                                {canBlockSlots && (
                                    <div className="flex bg-eyr-surface-low rounded-xl p-1 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setModalMode('reserve')}
                                            className={cn(
                                                "flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5",
                                                modalMode === 'reserve'
                                                    ? "bg-white text-amber-700 shadow-sm"
                                                    : "text-eyr-on-variant hover:text-eyr-on-surface"
                                            )}
                                        >
                                            <Plus className="w-4 h-4" /> Reservar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setModalMode('block')}
                                            className={cn(
                                                "flex-1 py-2.5 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5",
                                                modalMode === 'block'
                                                    ? "bg-white text-eyr-on-surface shadow-sm"
                                                    : "text-eyr-on-variant hover:text-eyr-on-surface"
                                            )}
                                        >
                                            <Ban className="w-4 h-4" /> Bloquear
                                        </button>
                                    </div>
                                )}

                                {modalMode === 'block' ? (
                                    // Block form
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                                Motivo del Bloqueo
                                            </label>
                                            <input
                                                type="text"
                                                value={blockReason}
                                                onChange={(e) => setBlockReason(e.target.value)}
                                                placeholder="Ej: Reunion equipo convivencia, actividad interna..."
                                                className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex items-start gap-2 p-3 bg-eyr-surface-low rounded-2xl border border-eyr-outline-variant/30 text-xs text-eyr-on-variant">
                                            <Ban className="w-4 h-4 shrink-0 mt-0.5 text-eyr-on-variant" />
                                            <span>Al bloquear este bloque, ningun profesor podra reservarlo. Solo un Jefe de Convivencia o administrador puede desbloquearlo.</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 bg-eyr-surface-mid px-6 py-4 -mx-6 -mb-6 border-t border-eyr-outline-variant/30">
                                            <button
                                                onClick={() => setIsModalOpen(false)}
                                                className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleConfirmBlock}
                                                disabled={!blockReason.trim()}
                                                className="bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-2xl font-extrabold px-8 py-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <Ban className="w-5 h-5" /> Confirmar Bloqueo
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // Reserve form
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                                Profesor Jefe
                                            </label>
                                            {isTeacherRole ? (
                                                <div className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low font-medium text-eyr-on-surface flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                                        {user?.name?.charAt(0)}
                                                    </div>
                                                    {user?.name}
                                                </div>
                                            ) : (
                                                <select
                                                    value={selectedTeacher}
                                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                                    className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                                >
                                                    <option value="">Seleccionar Profesor...</option>
                                                    {teachers.map(t => (
                                                        <option key={t.id} value={t.name}>{t.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                                Motivo de la Reunion
                                            </label>
                                            <input
                                                type="text"
                                                value={motivo}
                                                onChange={(e) => setMotivo(e.target.value)}
                                                placeholder="Ej: Reunion apoderados, mediacion, entrevista..."
                                                className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Hint for teacher about schedule blocks */}
                                        {isTeacherRole && getTeacherClass(selectedSlot.day, selectedSlot.block.start) && (
                                            <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-700">
                                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                <span>Este bloque coincide con tu hora de clase. Puedes reservar igualmente si necesitas sacar a un alumno de clases.</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between gap-3 bg-eyr-surface-mid px-6 py-4 -mx-6 -mb-6 border-t border-eyr-outline-variant/30">
                                            <button
                                                onClick={() => setIsModalOpen(false)}
                                                className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleConfirmReservation}
                                                disabled={!selectedTeacher || !motivo.trim()}
                                                className="bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-2xl font-extrabold px-8 py-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                            >
                                                <Check className="w-5 h-5" /> Confirmar Reserva
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </ModalContainer>
            )}
        </div>
    );
}
