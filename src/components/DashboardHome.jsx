import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEquipment } from '../context/EquipmentContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calendar,
    Bell,
    ChevronRight,
    ChevronLeft,
    Sun,
    ArrowUpRight,
    Users,
    AlertCircle,
    Sparkles,
    Package,
    LifeBuoy,
    UserPlus,
    CalendarCheck,
    Clock,
    CheckCircle,
    Printer,
    Box,
    CalendarClock,
    UserX,
    HeartPulse,
    BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import NextClassWidget from './NextClassWidget';
import { useAdministrativeDays } from '../context/AdministrativeDaysContext';
import { useMedicalLeaves } from '../context/MedicalLeavesContext';
import UserDetailPanel from './UserDetailPanel';

// Helper for Role Labels (Critical Requirement)
const getRoleLabel = (role) => {
    switch (role) {
        case 'admin':
        case 'super_admin':
            return 'Administradora General'; // User requested "Administradora General" in Dashboard
        case 'director':
            return 'Directora';
        case 'utp_head':
            return 'Jefa UTP';
        case 'inspector':
            return 'Inspectoría';
        case 'teacher':
            return 'Docente';
        case 'staff':
            return 'Funcionario';
        case 'printer':
            return 'Encargado de Impresiones';
        default:
            return 'Usuario';
    }
};

// Reusable Bento Card Component
const BentoCard = ({ children, className, delay = 0, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        whileHover={onClick ? { y: -4, boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.1)" } : {}}
        onClick={onClick}
        className={cn(
            "bg-white rounded-2xl md:rounded-[2rem] p-5 md:p-6 shadow-sm border border-slate-200/60 relative overflow-hidden group transition-all duration-300 min-h-[150px]",
            onClick ? "cursor-pointer hover:border-slate-200" : "",
            className
        )}
    >
        {children}
    </motion.div>
);

// Teacher View (Preserved Logic)
const TeacherView = ({ user, notifications }) => {
    const { getBalance } = useAdministrativeDays();
    const balance = getBalance(user.id);
    const navigate = useNavigate();

    // Greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    return (
        <div className="space-y-6">
            {/* Greeting */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                    {greeting}, {user.name}
                </h1>
                <p className="text-slate-400 mt-1">Aquí tienes un resumen de tu día.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {/* Widget 1: Schedule */}
                <BentoCard delay={0.1} className="lg:col-span-1 border-indigo-100/50 bg-gradient-to-br from-white to-indigo-50/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-700">Tu Próxima Clase</h3>
                        </div>
                    </div>
                    <NextClassWidget />
                    <div className="mt-4 pt-4 border-t border-indigo-100/50">
                        <button
                            onClick={() => navigate('/schedule')}
                            className="w-full py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            Ver Horario Completo <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </BentoCard>

                {/* Widget 2: Admin Days Balance */}
                <BentoCard delay={0.2} className="lg:col-span-1 bg-gradient-to-br from-white to-purple-50/40">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-purple-900/60 font-bold text-xs uppercase tracking-wider">Días Administrativos</span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                        <span className={cn(
                            "text-6xl md:text-7xl font-black tracking-tighter",
                            balance > 0 ? "text-slate-800" : "text-red-500"
                        )}>
                            {balance}
                        </span>
                        <span className="text-lg md:text-xl text-slate-400 font-medium">disponibles</span>
                    </div>

                    <Link to="/administrative-days">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-slate-200 hover:from-slate-800 hover:to-slate-700 transition-all"
                        >
                            Solicitar Día <ArrowUpRight className="w-4 h-4" />
                        </motion.button>
                    </Link>
                </BentoCard>

                {/* Widget 3: Notifications */}
                <BentoCard delay={0.3} className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <div className="p-2 bg-orange-50 rounded-xl text-orange-500">
                                <Bell className="w-4 h-4" />
                            </div>
                            Avisos Recientes
                        </h3>
                    </div>

                    <div className="space-y-2.5">
                        {notifications.length > 0 ? notifications.slice(0, 3).map((notif, idx) => (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + idx * 0.1 }}
                                className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors"
                            >
                                <p className="text-sm font-medium text-slate-700">{notif.text}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block uppercase font-bold tracking-wide">Hace 2h</span>
                            </motion.div>
                        )) : (
                            <div className="text-center py-8">
                                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm">No hay notificaciones nuevas</p>
                            </div>
                        )}
                    </div>
                </BentoCard>
            </div>
        </div>
    );
};

// Weekly Absences Widget
const WeeklyAbsencesWidget = ({ onSelectUser }) => {
    const { requests } = useAdministrativeDays();
    const { users } = useAuth();
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedDay, setSelectedDay] = useState(null);

    const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const getWeekDays = (offset) => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday + offset * 7);

        return Array.from({ length: 5 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return { dateStr: `${yyyy}-${mm}-${dd}`, date: d, dayNum: d.getDate(), dayName: DAY_NAMES[i] };
        });
    };

    const weekDays = getWeekDays(weekOffset);
    const todayStr = new Date().toISOString().split('T')[0];

    const getAbsencesForDate = (dateStr) => {
        return requests
            .filter(r => r.status === 'approved' && r.date === dateStr)
            .map(r => {
                const userRecord = users.find(u => u.id === r.userId);
                const role = userRecord?.role;
                let roleLabel = 'Docente';
                if (role === 'staff') roleLabel = 'Funcionario';
                else if (role === 'admin' || role === 'super_admin') roleLabel = 'Administradora';
                else if (role === 'director') roleLabel = 'Directora';
                else if (role === 'utp_head') roleLabel = 'Jefa UTP';
                else if (role === 'inspector') roleLabel = 'Inspectoría';

                let typeLabel = 'Día Administrativo';
                if (r.type === 'hour_permission') typeLabel = 'Permiso de Horas';
                else if (r.type === 'discount') typeLabel = 'Descuento';

                return { ...r, roleLabel, typeLabel };
            });
    };

    // Week label: "Semana del 2 al 6 de Marzo"
    const firstDay = weekDays[0];
    const lastDay = weekDays[4];
    const sameMonth = firstDay.date.getMonth() === lastDay.date.getMonth();
    const weekLabel = sameMonth
        ? `Semana del ${firstDay.dayNum} al ${lastDay.dayNum} de ${MONTH_NAMES[lastDay.date.getMonth()]}`
        : `Semana del ${firstDay.dayNum} de ${MONTH_NAMES[firstDay.date.getMonth()]} al ${lastDay.dayNum} de ${MONTH_NAMES[lastDay.date.getMonth()]}`;

    const selectedAbsences = selectedDay ? getAbsencesForDate(selectedDay) : [];

    // Group by type
    const grouped = {};
    selectedAbsences.forEach(a => {
        if (!grouped[a.typeLabel]) grouped[a.typeLabel] = [];
        grouped[a.typeLabel].push(a);
    });

    return (
        <BentoCard delay={0.05} className="md:col-span-2 lg:col-span-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-50 rounded-xl text-red-500">
                        <UserX className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-700">Ausencias de la Semana</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setWeekOffset(w => w - 1); setSelectedDay(null); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold text-slate-600 min-w-[240px] text-center">{weekLabel}</span>
                    <button
                        onClick={() => { setWeekOffset(w => w + 1); setSelectedDay(null); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    {weekOffset !== 0 && (
                        <button
                            onClick={() => { setWeekOffset(0); setSelectedDay(null); }}
                            className="ml-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                        >
                            Hoy
                        </button>
                    )}
                </div>
            </div>

            {/* Days Row */}
            <div className="grid grid-cols-5 gap-2 md:gap-3">
                {weekDays.map(day => {
                    const absences = getAbsencesForDate(day.dateStr);
                    const count = absences.length;
                    const isToday = day.dateStr === todayStr;
                    const isSelected = selectedDay === day.dateStr;

                    return (
                        <button
                            key={day.dateStr}
                            onClick={() => setSelectedDay(isSelected ? null : day.dateStr)}
                            className={cn(
                                "flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all duration-200",
                                isSelected
                                    ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                    : isToday
                                        ? "border-indigo-200 bg-indigo-50/50 hover:border-indigo-300"
                                        : "border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-wider",
                                isToday ? "text-indigo-600" : "text-slate-400"
                            )}>
                                {day.dayName}
                            </span>
                            <span className={cn(
                                "text-2xl font-black mt-0.5",
                                isToday ? "text-indigo-700" : "text-slate-700"
                            )}>
                                {day.dayNum}
                            </span>
                            {count > 0 ? (
                                <span className={cn(
                                    "mt-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full",
                                    count >= 3
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                )}>
                                    {count} {count === 1 ? 'ausencia' : 'ausencias'}
                                </span>
                            ) : (
                                <span className="mt-1.5 text-xs font-medium text-slate-300 px-2.5 py-0.5">
                                    Sin ausencias
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Detail Panel */}
            {selectedDay && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-100"
                >
                    {selectedAbsences.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No hay ausencias registradas para este día.</p>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(grouped).map(([type, items]) => (
                                <div key={type}>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{type}</h4>
                                    <div className="space-y-1.5">
                                        {items.map(item => {
                                            const userRecord = users.find(u => u.id === item.userId);
                                            const initials = item.userName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
                                            return (
                                                <div key={item.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/80 transition-all">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-semibold text-slate-700 truncate">{item.userName}</span>
                                                                <span className={cn(
                                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0",
                                                                    item.roleLabel === 'Funcionario'
                                                                        ? "bg-blue-100 text-blue-700"
                                                                        : "bg-purple-100 text-purple-700"
                                                                )}>
                                                                    {item.roleLabel}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-slate-400 truncate block">{item.reason}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => userRecord && onSelectUser(userRecord)}
                                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition-all shrink-0 ml-3 hover:scale-105 active:scale-95"
                                                    >
                                                        Ver Detalle
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

        </BentoCard>
    );
};

// New Admin Command Center (Refined per User Request)
const AdminDashboardView = () => {
    const { user, users } = useAuth();
    const { getLowStockItems } = useEquipment();
    const { getAllLeaves } = useMedicalLeaves();
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState(null);

    // Data Integration
    const pendingTickets = 3; // Mocked as requested
    const staffCount = users.length;
    const lowStockCount = getLowStockItems(3).length;

    // Medical Leaves - active leaves (endDate >= today)
    const allLeaves = getAllLeaves();
    const todayStr = new Date().toISOString().split('T')[0];
    const activeLeaves = allLeaves.filter(l => l.endDate >= todayStr);
    const activeLeavesCount = activeLeaves.length;

    // Date Format
    const today = new Date().toLocaleDateString('es-CL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">

            {/* 1. Welcome Hero (Span 3 - Full Width) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="md:col-span-2 lg:col-span-3 relative overflow-hidden rounded-2xl md:rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-2xl shadow-slate-900/20 p-6 md:p-10 flex flex-col md:flex-row items-end justify-between min-h-[200px] md:min-h-[220px] group"
            >
                {/* Background Effects */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-600 blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-indigo-500 blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="relative z-10 w-full">
                    <div className="flex flex-col md:flex-row md:items-end justify-between w-full">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/5 text-xs font-semibold text-blue-200 uppercase tracking-wider mb-4">
                                <Calendar className="w-3 h-3" />
                                {today}
                            </div>
                            <h1 className="text-2xl md:text-5xl font-extrabold tracking-tight mb-1">
                                Hola, {user.name}
                            </h1>
                            <p className="text-slate-400 text-lg font-medium flex items-center gap-2">
                                {getRoleLabel(user.role)}
                            </p>
                        </div>

                        <div className="mt-6 md:mt-0">
                            <button
                                onClick={() => navigate('/settings')}
                                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                            >
                                Mi Perfil <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Weekly Absences Widget (Full Width) */}
            <WeeklyAbsencesWidget onSelectUser={setSelectedUser} />

            {/* 2. Solicitudes y Tickets (Urgent Action - Pixel Perfect) */}
            <BentoCard
                delay={0.1}
                onClick={() => navigate('/tickets')}
                className="bg-white border-l-4 border-l-amber-400 relative flex flex-col justify-between"
            >
                {/* Badge: PRIORIDAD ALTA */}
                <div className="absolute top-6 right-6 bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    PRIORIDAD ALTA
                </div>

                <div>
                    <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 w-fit mb-6">
                        <AlertCircle className="w-8 h-8" />
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-5xl font-black text-slate-800 tracking-tighter">
                            {pendingTickets}
                        </span>
                        <span className="text-xl text-slate-400 font-medium">Pendientes</span>
                    </div>
                </div>

                <div className="mt-4">
                    <h3 className="font-bold text-slate-800 text-lg mb-1">Solicitudes y Tickets</h3>
                    <p className="text-slate-500 text-sm mb-4">Profesores esperando aprobación.</p>

                    <div className="flex items-center text-amber-600 font-bold text-sm group-hover:gap-2 transition-all">
                        Revisar ahora <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                </div>
            </BentoCard>

            {/* 3. Equipo EYR (Staff Management) */}
            <BentoCard
                delay={0.2}
                onClick={() => navigate('/users')}
                className="bg-white group"
            >
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-8 h-8" />
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-slate-800 tracking-tighter">
                                {staffCount}
                            </span>
                            <span className="text-xl text-slate-400 font-medium">Miembros</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="font-bold text-slate-700 text-lg">Equipo EYR</h3>
                        <p className="text-slate-500 text-sm">Gestionar personal docente y administrativo.</p>
                    </div>
                </div>
            </BentoCard>

            {/* 4. Inventario (Quick Status) - HIDDEN TEMPORARILY
            <BentoCard
                delay={0.3}
                onClick={() => navigate('/inventory')}
                className="bg-white group"
            >
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 w-fit mb-4 group-hover:rotate-12 transition-transform duration-300">
                            <Box className="w-8 h-8" />
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "text-4xl font-black tracking-tighter",
                                lowStockCount > 0 ? "text-red-500" : "text-slate-800"
                            )}>
                                {lowStockCount > 0 ? `${lowStockCount} Críticos` : "36 Ítems"}
                            </span>
                        </div>
                        {lowStockCount === 0 && (
                            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 inline-block mt-1">
                                Stock Saludable
                            </span>
                        )}
                    </div>

                    <div className="mt-4">
                        <h3 className="font-bold text-slate-700 text-lg">Inventario</h3>
                        <p className="text-slate-500 text-sm">Estado general de recursos.</p>
                    </div>
                </div>
            </BentoCard>
            */}

            {/* 5. Días Administrativos (Shortcuts) */}
            <BentoCard
                delay={0.4}
                onClick={() => navigate('/admin/days-tracking')}
                className="bg-white group"
            >
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 w-fit mb-4">
                            <CalendarClock className="w-8 h-8" />
                        </div>

                        <h3 className="font-bold text-slate-700 text-xl mb-1">Días Administrativos</h3>
                    </div>

                    <div className="mt-2">
                        <p className="text-slate-500 text-sm mb-4">
                            Revisar solicitudes de permisos y balance de días del personal.
                        </p>
                        <div className="flex items-center text-emerald-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                            Gestionar Permisos <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </BentoCard>

            {/* 6. Licencias Médicas */}
            <BentoCard
                delay={0.5}
                onClick={() => navigate('/medical-leaves')}
                className="bg-white group"
            >
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 w-fit mb-4">
                            <HeartPulse className="w-8 h-8" />
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-slate-800 tracking-tighter">
                                {activeLeavesCount}
                            </span>
                            <span className="text-xl text-slate-400 font-medium">{activeLeavesCount === 1 ? 'Activa' : 'Activas'}</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="font-bold text-slate-700 text-lg">Licencias Médicas</h3>
                        <p className="text-slate-500 text-sm mb-4">
                            Registro y seguimiento de licencias del personal.
                        </p>
                        <div className="flex items-center text-rose-500 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                            Ver Licencias <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </BentoCard>

            {/* 7. Estadísticas */}
            <BentoCard
                delay={0.6}
                onClick={() => navigate('/admin/stats')}
                className="bg-white group"
            >
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 w-fit mb-4">
                            <BarChart3 className="w-8 h-8" />
                        </div>

                        <h3 className="font-bold text-slate-700 text-xl mb-1">Estadísticas</h3>
                    </div>

                    <div className="mt-2">
                        <p className="text-slate-500 text-sm mb-4">
                            Panel de análisis integral: rendimiento, asistencia y eficiencia.
                        </p>
                        <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                            Ver Análisis <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </BentoCard>

            {/* User Detail Panel (rendered outside grid to avoid overflow clipping) */}
            {selectedUser && (
                <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
            )}
        </div>
    );
};

export default function DashboardHome() {
    const { user } = useAuth();
    const notifications = [
        { id: 1, text: "Sistema actualizado a modo cloud.", read: false },
    ];
    const isAdmin = user?.role === 'director' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'utp_head' || user?.role === 'inspector';

    // Printer Role View
    if (user?.role === 'printer') {
        return (
            <div className="max-w-7xl mx-auto space-y-8 relative pb-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 bg-white rounded-2xl md:rounded-3xl text-center border border-dashed border-slate-200"
                >
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <Printer className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Panel de Impresiones</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">Accede a las solicitudes desde el menú lateral para gestionar los trabajos de impresión.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {isAdmin ? (
                <AdminDashboardView />
            ) : (
                <TeacherView user={user} notifications={notifications} />
            )}
        </div>
    );
}
