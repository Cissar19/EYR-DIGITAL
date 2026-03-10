import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Ban, X, ChevronRight, TrendingUp, TrendingDown, AlertCircle, FileText, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { getRoleLabel } from '../context/AuthContext';
import { useAdministrativeDays } from '../context/AdministrativeDaysContext';

const formatDate = (dateString) => {
    const date = new Date(dateString.length === 10 ? dateString + 'T12:00:00' : dateString);
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getStatusConfig = (status) => {
    switch (status) {
        case 'approved': return { label: 'Aprobado', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
        case 'rejected': return { label: 'Rechazado', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
        case 'pending': return { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
        default: return { label: 'Desconocido', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500' };
    }
};

const getTypeConfig = (request) => {
    if (request.type === 'hour_return') return { label: 'Devolución Horas', icon: RotateCcw, color: 'text-emerald-500' };
    if (request.type === 'hour_permission') return { label: 'Permiso Horas', icon: Clock, color: 'text-amber-500' };
    if (request.type === 'discount') return { label: 'Descuento', icon: Ban, color: 'text-red-500' };
    if (request.reason?.startsWith('[Excepción]')) return { label: 'Excepción', icon: AlertCircle, color: 'text-purple-500' };
    if (request.isHalfDay) return { label: '½ Día Admin.', icon: Calendar, color: 'text-blue-500' };
    return { label: 'Día Admin.', icon: Calendar, color: 'text-blue-500' };
};

export default function UserDetailPanel({ user, onClose, variant = 'default' }) {
    const isMedical = variant === 'medical';
    const { getUserRequests, getBalance, getHoursUsed, getDiscountDays } = useAdministrativeDays();

    if (!user) return null;

    const userHistory = getUserRequests(user.id);
    const balance = getBalance(user.id);
    const hoursUsed = getHoursUsed(user.id);
    const discountDays = getDiscountDays(user.id);
    const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

    const approvedCount = userHistory.filter(r => r.status === 'approved').length;
    const pendingCount = userHistory.filter(r => r.status === 'pending').length;

    const balanceColor = balance >= 4 ? 'from-emerald-500 to-green-600' : balance >= 2 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600';

    return createPortal(
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            />

            {/* Side Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                className="fixed right-0 top-0 h-screen w-full md:w-[440px] bg-slate-50 shadow-2xl z-[70] flex flex-col"
            >
                {/* Close button - outside overflow-hidden header */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors z-[80]"
                >
                    <X className="w-4 h-4 text-white" />
                </button>

                {/* Header con gradiente */}
                <div className={cn(
                    "relative px-6 pt-6 pb-8 overflow-hidden bg-gradient-to-br",
                    isMedical
                        ? "from-rose-900 via-red-800 to-pink-950"
                        : "from-slate-900 via-slate-800 to-indigo-950"
                )}>
                    {/* Efectos de fondo */}
                    <div className={cn("absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none", isMedical ? "bg-rose-500" : "bg-blue-500")} />
                    <div className={cn("absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none", isMedical ? "bg-pink-500" : "bg-indigo-500")} />

                    {/* Profile info */}
                    <div className="relative z-10 flex items-center gap-4">
                        <div className={cn(
                            "w-16 h-16 bg-gradient-to-br rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg ring-2 ring-white/20",
                            isMedical ? "from-rose-400 to-pink-500 shadow-rose-500/30" : "from-blue-400 to-indigo-500 shadow-blue-500/30"
                        )}>
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{user.name}</h2>
                            <p className={cn("text-sm font-medium", isMedical ? "text-rose-200" : "text-blue-200")}>{getRoleLabel(user.role)}</p>
                        </div>
                    </div>

                    {/* Stats cards */}
                    <div className="relative z-10 grid grid-cols-3 gap-2 mt-5">
                        <div className={cn("rounded-xl p-3 bg-gradient-to-br", balanceColor, "shadow-lg")}>
                            <div className="flex items-center gap-1 mb-1">
                                <Calendar className="w-3 h-3 text-white/80" />
                                <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Días</span>
                            </div>
                            <span className="text-2xl font-black text-white">{Math.max(0, balance)}</span>
                        </div>
                        <div className="rounded-xl p-3 bg-white/10 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-1 mb-1">
                                <Clock className="w-3 h-3 text-amber-300" />
                                <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Horas</span>
                            </div>
                            <span className="text-2xl font-black text-white">{Math.max(0, hoursUsed).toFixed(1).replace(/\.0$/, '')}</span>
                        </div>
                        <div className="rounded-xl p-3 bg-white/10 backdrop-blur-sm border border-white/10">
                            <div className="flex items-center gap-1 mb-1">
                                <Ban className="w-3 h-3 text-red-300" />
                                <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Desc.</span>
                            </div>
                            <span className="text-2xl font-black text-white">{discountDays}</span>
                        </div>
                    </div>
                </div>

                {/* Resumen rápido */}
                <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-slate-600">{approvedCount} aprobados</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium text-slate-600">{pendingCount} pendientes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                        <span className="text-xs font-medium text-slate-600">{userHistory.length} total</span>
                    </div>
                </div>

                {/* Body - Scrollable History */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                        Historial de Solicitudes
                    </h3>

                    {userHistory.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-semibold">Sin historial</p>
                            <p className="text-slate-400 text-sm mt-1">Este usuario no tiene solicitudes registradas</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {userHistory.map((request, idx) => {
                                const statusCfg = getStatusConfig(request.status);
                                const typeCfg = getTypeConfig(request);
                                const TypeIcon = typeCfg.icon;

                                return (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="bg-white rounded-xl p-4 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all"
                                    >
                                        {/* Top row: type + status */}
                                        <div className="flex items-center justify-between mb-2.5">
                                            <div className="flex items-center gap-2">
                                                <TypeIcon className={cn("w-4 h-4", typeCfg.color)} />
                                                <span className="text-xs font-semibold text-slate-500">{typeCfg.label}</span>
                                            </div>
                                            <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold", statusCfg.bg, statusCfg.text)}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                                                {statusCfg.label}
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <p className="text-sm text-slate-800 font-medium leading-relaxed mb-2">
                                            {request.reason}
                                        </p>

                                        {/* Date row */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Calendar className="w-3 h-3" />
                                                <span className="text-xs font-medium">{formatDate(request.date)}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-300 font-medium">
                                                Creado {formatDate(request.createdAt)}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        </>,
        document.body
    );
}
