import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Ban, X, ChevronRight, TrendingUp, TrendingDown, AlertCircle, FileText, RotateCcw, HeartPulse, CalendarCheck, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getRoleLabel } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { useAdministrativeDays } from '../context/AdministrativeDaysContext';
import { useMedicalLeaves } from '../context/MedicalLeavesContext';

const DELETE_HASH = '93f88608d4f448485a255f815515d0f730a00eb4ea05fb2c1ecd464a1428e420';

async function verifyPassword(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === DELETE_HASH;
}

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString.length === 10 ? dateString + 'T12:00:00' : dateString);
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateFull = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T12:00:00');
    const str = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
    return str.charAt(0).toUpperCase() + str.slice(1);
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
    if (request.isHalfDay) return { label: request.isHalfDay === 'am' ? '½ Día AM' : request.isHalfDay === 'pm' ? '½ Día PM' : '½ Día Admin.', icon: Calendar, color: 'text-blue-500' };
    return { label: 'Día Admin.', icon: Calendar, color: 'text-blue-500' };
};

// Medical leave status helper
const getLeaveStatus = (leave) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    if (todayStr < leave.startDate) return { label: 'Próxima', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' };
    if (todayStr > leave.endDate) return { label: 'Finalizada', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' };
    return { label: 'En curso', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' };
};

const getDaysLeft = (leave) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (todayStr > leave.endDate) return 0;
    const end = new Date(leave.endDate + 'T12:00:00');
    const now = new Date(todayStr + 'T12:00:00');
    return Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)));
};

export default function UserDetailPanel({ user, onClose, variant = 'default' }) {
    const isMedical = variant === 'medical';
    const { getUserRequests, getBalance, getHoursUsed, getDiscountDays, deleteRequest } = useAdministrativeDays();
    const { getLeavesByUser } = useMedicalLeaves();
    const { canEdit } = useAuth();
    const userCanEdit = canEdit();

    // Delete modal state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const handleDeleteClick = (request) => {
        setDeleteTarget(request);
        setDeletePassword('');
        setDeleteError('');
    };

    const handleDeleteConfirm = async () => {
        const valid = await verifyPassword(deletePassword);
        if (!valid) {
            setDeleteError('Contraseña incorrecta');
            return;
        }
        await deleteRequest(deleteTarget.id);
        setDeleteTarget(null);
        setDeletePassword('');
        setDeleteError('');
    };

    if (!user) return null;

    const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

    // Admin days data
    const userHistory = getUserRequests(user.id);
    const balance = getBalance(user.id);
    const hoursUsed = getHoursUsed(user.id);
    const discountDays = getDiscountDays(user.id);
    const approvedCount = userHistory.filter(r => r.status === 'approved').length;
    const pendingCount = userHistory.filter(r => r.status === 'pending').length;
    const balanceColor = balance >= 4 ? 'from-emerald-500 to-green-600' : balance >= 2 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600';

    // Medical leaves data
    const userLeaves = getLeavesByUser(user.id);
    const activeLeaves = userLeaves.filter(l => {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        return todayStr >= l.startDate && todayStr <= l.endDate;
    });
    const totalLeaveDays = userLeaves.reduce((sum, l) => sum + (l.days || 0), 0);

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
                className="fixed right-0 top-0 h-screen w-full md:w-[440px] max-w-full bg-slate-50 shadow-2xl z-[70] flex flex-col overflow-hidden"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors z-[80]"
                >
                    <X className="w-4 h-4 text-white" />
                </button>

                {/* Header */}
                <div className={cn(
                    "relative px-6 pt-6 pb-8 overflow-hidden bg-gradient-to-br",
                    isMedical
                        ? "from-rose-900 via-red-800 to-pink-950"
                        : "from-slate-900 via-slate-800 to-indigo-950"
                )}>
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
                    {isMedical ? (
                        <div className="relative z-10 grid grid-cols-3 gap-2 mt-5">
                            <div className="rounded-xl p-3 bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg">
                                <div className="flex items-center gap-1 mb-1">
                                    <HeartPulse className="w-3 h-3 text-white/80" />
                                    <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Activas</span>
                                </div>
                                <span className="text-2xl font-black text-white">{activeLeaves.length}</span>
                            </div>
                            <div className="rounded-xl p-3 bg-white/10 backdrop-blur-sm border border-white/10">
                                <div className="flex items-center gap-1 mb-1">
                                    <Calendar className="w-3 h-3 text-rose-300" />
                                    <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Total</span>
                                </div>
                                <span className="text-2xl font-black text-white">{userLeaves.length}</span>
                            </div>
                            <div className="rounded-xl p-3 bg-white/10 backdrop-blur-sm border border-white/10">
                                <div className="flex items-center gap-1 mb-1">
                                    <Clock className="w-3 h-3 text-amber-300" />
                                    <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">Días</span>
                                </div>
                                <span className="text-2xl font-black text-white">{totalLeaveDays}</span>
                            </div>
                        </div>
                    ) : (
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
                    )}
                </div>

                {/* Summary bar */}
                {isMedical ? (
                    <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-xs font-medium text-slate-600">{activeLeaves.length} en curso</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                            <span className="text-xs font-medium text-slate-600">{userLeaves.length - activeLeaves.length} finalizadas</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-xs font-medium text-slate-600">{totalLeaveDays} días totales</span>
                        </div>
                    </div>
                ) : (
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
                )}

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isMedical ? (
                        <>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                                Historial de Licencias Médicas
                            </h3>

                            {userLeaves.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <HeartPulse className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 font-semibold">Sin licencias</p>
                                    <p className="text-slate-400 text-sm mt-1">No hay licencias médicas registradas</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {userLeaves.map((leave, idx) => {
                                        const status = getLeaveStatus(leave);
                                        const daysLeft = getDaysLeft(leave);
                                        const isActive = status.label === 'En curso';

                                        return (
                                            <motion.div
                                                key={leave.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                className={cn(
                                                    "bg-white rounded-xl p-4 border hover:shadow-sm transition-all",
                                                    isActive ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200/80 hover:border-slate-300"
                                                )}
                                            >
                                                {/* Top row: status */}
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <HeartPulse className={cn("w-4 h-4", isActive ? "text-rose-500" : "text-slate-400")} />
                                                        <span className="text-xs font-semibold text-slate-500">Licencia Médica</span>
                                                    </div>
                                                    <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold", status.bg, status.text)}>
                                                        <div className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
                                                        {status.label}
                                                    </div>
                                                </div>

                                                {/* Date range */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-800">
                                                        {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                                                    </span>
                                                </div>

                                                {/* Info chips */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                                                        {leave.days} {leave.days === 1 ? 'día' : 'días'} corridos
                                                    </span>

                                                    {isActive && (
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold",
                                                            daysLeft === 0
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : daysLeft <= 2
                                                                    ? "bg-amber-50 text-amber-700"
                                                                    : "bg-rose-50 text-rose-700"
                                                        )}>
                                                            <Clock className="w-3 h-3" />
                                                            {daysLeft === 0 ? 'Último día' : `${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} restantes`}
                                                        </span>
                                                    )}

                                                    {leave.returnDate && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                                                            <CalendarCheck className="w-3 h-3" />
                                                            Reintegro: {formatDateFull(leave.returnDate)}
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
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
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-300 font-medium">
                                                            Creado {formatDate(request.createdAt)}
                                                        </span>
                                                        {userCanEdit && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(request); }}
                                                                className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                                title="Eliminar registro"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </motion.div>

            {/* Delete Password Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteTarget(null)}
                            className="fixed inset-0 bg-black/40 z-[80]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-red-100 rounded-xl">
                                        <Trash2 className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Eliminar registro</h3>
                                        <p className="text-xs text-slate-500">{deleteTarget.userName} — {formatDate(deleteTarget.date)}</p>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 mb-4">
                                    {deleteTarget.status === 'approved' && 'Se revertirá el descuento del saldo. '}
                                    Ingresa la contraseña para confirmar.
                                </p>

                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleDeleteConfirm()}
                                    placeholder="Contraseña"
                                    autoFocus
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-red-400 focus:ring-4 focus:ring-red-100 focus:outline-none transition-all mb-2"
                                />
                                {deleteError && (
                                    <p className="text-xs text-red-600 font-medium mb-2">{deleteError}</p>
                                )}

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setDeleteTarget(null)}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDeleteConfirm}
                                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>,
        document.body
    );
}
