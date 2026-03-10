import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarCheck, Search, TrendingDown, TrendingUp, Circle,
    Eye, AlertCircle, Users, ChevronLeft, ChevronRight, X, Calendar, Plus, Check, Clock, Ban, RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES, getRoleLabel } from '../context/AuthContext';
import { useAdministrativeDays } from '../context/AdministrativeDaysContext';
import UserDetailPanel from '../components/UserDetailPanel';
import { sendAssignmentEmail } from '../lib/emailService';

// Pagination constant
const ITEMS_PER_PAGE = 8;

const DISCOUNT_REASONS = [
    'Inasistencia injustificada',
    'Abandono de labores',
    'Atraso reiterado',
    'Otro'
];

// Helper to get today's date in local time
const getToday2026 = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const getDaysInMonth = (monthIndex) => {
    // Month is 0-indexed (0 = Jan). Year fixed to 2026.
    return new Date(2026, monthIndex + 1, 0).getDate();
};

export default function AdminDaysTrackingView() {
    const { users: MOCK_USERS, canEdit, isUtpHead } = useAuth();
    const userCanEdit = canEdit();
    const canReturn = userCanEdit || isUtpHead();
    const { getBalance, getHoursUsed, getDiscountDays, getUserRequests, assignDayManual, assignSpecialPermission, assignHoursManual, returnHoursManual, assignDiscountDay } = useAdministrativeDays();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        userId: '',
        date: '',
        reason: '',
        mode: 'day', // 'day', 'hour', 'discount', or 'return'
        startTime: '',
        endTime: '',
        observation: '',
        isHalfDay: false
    });
    const [toastMessage, setToastMessage] = useState('');

    // Autocomplete state
    const [teacherSearch, setTeacherSearch] = useState('');
    const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
    const autocompleteRef = React.useRef(null);

    // Helper function for accent-insensitive and case-insensitive search
    const normalizeText = (text) => {
        return text
            ?.toString()
            .toLowerCase()
            .normalize("NFD") // Decompose accented characters (e.g., 'á' -> 'a' + accent)
            .replace(/[\u0300-\u036f]/g, "") || ""; // Remove accent marks
    };

    // Filter users by role (exclude super_admin and printer)
    const relevantUsers = MOCK_USERS.filter(user =>
        user.role === ROLES.TEACHER ||
        user.role === ROLES.ADMIN ||
        user.role === ROLES.STAFF ||
        user.role === ROLES.DIRECTOR
    );

    // Filter by search query (accent-insensitive, case-insensitive)
    const filteredUsers = relevantUsers.filter(user =>
        normalizeText(user.name).includes(normalizeText(searchQuery))
    );

    // Calculate pagination
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Click outside handler for autocomplete
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
                setShowTeacherDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter teachers based on search (accent-insensitive, case-insensitive)
    const filteredTeachers = relevantUsers.filter(user =>
        normalizeText(user.name).includes(normalizeText(teacherSearch))
    );

    // Get initials from name
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Determine balance status and color
    const getBalanceStatus = (balance) => {
        if (balance >= 5) {
            return { color: 'green', label: 'Óptimo', icon: TrendingUp };
        } else if (balance >= 3) {
            return { color: 'blue', label: 'Normal', icon: Circle };
        } else if (balance >= 1) {
            return { color: 'orange', label: 'Bajo', icon: TrendingDown };
        } else {
            return { color: 'red', label: 'Agotado', icon: AlertCircle };
        }
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const formatDate = (dateString) => {
        // Append T12:00:00 to date-only strings to prevent UTC timezone shift
        const date = new Date(dateString.length === 10 ? dateString + 'T12:00:00' : dateString);
        return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return {
                    label: 'Aprobado',
                    className: 'bg-green-100 text-green-700 border-green-200'
                };
            case 'rejected':
                return {
                    label: 'Rechazado',
                    className: 'bg-red-100 text-red-700 border-red-200'
                };
            case 'pending':
                return {
                    label: 'Pendiente',
                    className: 'bg-yellow-100 text-yellow-700 border-yellow-200'
                };
            default:
                return {
                    label: 'Desconocido',
                    className: 'bg-slate-100 text-slate-700 border-slate-200'
                };
        }
    };

    const handleOpenAssignModal = (mode = 'day') => {
        setFormData({
            userId: '',
            date: getToday2026(),
            reason: mode === 'discount' ? DISCOUNT_REASONS[0] : mode === 'day' ? 'Personal' : '',
            mode,
            startTime: '',
            endTime: '',
            observation: '',
            isHalfDay: false
        });
        setTeacherSearch('');
        setShowTeacherDropdown(false);
        setIsAssignModalOpen(true);
    };

    const handleCloseAssignModal = () => {
        setIsAssignModalOpen(false);
        setFormData({ userId: '', date: '', reason: '', mode: 'day', startTime: '', endTime: '', observation: '', isHalfDay: false });
        setTeacherSearch('');
        setShowTeacherDropdown(false);
    };

    const handleSelectTeacher = (user) => {
        setFormData({ ...formData, userId: user.id });
        setTeacherSearch(user.name);
        setShowTeacherDropdown(false);
    };

    const showToast = (message) => {
        setToastMessage(message);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    const handleAssign = () => {
        if (!formData.userId || !formData.date || !formData.reason.trim()) {
            alert('Por favor completa todos los campos básicos');
            return;
        }

        // Para modo day con "Otro", validar que se haya ingresado el detalle
        if (formData.mode === 'day' && formData.reason === 'Otro' && !formData.observation.trim()) {
            alert('Por favor especifique el motivo');
            return;
        }

        const selectedUser = relevantUsers.find(u => u.id === formData.userId);
        if (!selectedUser) return;

        // Resolver el motivo final para modo day
        const resolvedReason = formData.mode === 'day' && formData.reason === 'Otro'
            ? formData.observation.trim()
            : formData.reason;

        if (formData.mode === 'discount') {
            assignDiscountDay(selectedUser.id, selectedUser.name, formData.date, formData.reason, formData.observation);
            sendAssignmentEmail({ toEmail: selectedUser.email, toName: selectedUser.name, actionType: 'discount', date: formData.date, reason: formData.reason, details: formData.observation });
            showToast(`Descuento registrado. Se notificó a ${selectedUser.name}`);
            handleCloseAssignModal();
            return;
        }

        if (formData.mode === 'hour') {
            if (!formData.startTime || !formData.endTime) {
                alert('Por favor ingresa hora de inicio y término');
                return;
            }

            // Calculate duration
            const start = new Date(`2000-01-01T${formData.startTime}`);
            const end = new Date(`2000-01-01T${formData.endTime}`);
            const diffMs = end - start;
            const diffMinutes = Math.floor(diffMs / 60000);

            if (diffMinutes <= 0) {
                alert('La hora de término debe ser mayor a la de inicio');
                return;
            }

            assignHoursManual(selectedUser.id, selectedUser.name, formData.date, formData.startTime, formData.endTime, diffMinutes, formData.reason);
            sendAssignmentEmail({ toEmail: selectedUser.email, toName: selectedUser.name, actionType: 'hours', date: formData.date, reason: formData.reason, details: `${formData.startTime} - ${formData.endTime} (${diffMinutes} min)` });
            showToast(`Horas registradas. Se notificó a ${selectedUser.name}`);
            handleCloseAssignModal();
            return;
        }

        if (formData.mode === 'return') {
            if (!formData.startTime || !formData.endTime) {
                alert('Por favor ingresa hora de inicio y término');
                return;
            }

            const start = new Date(`2000-01-01T${formData.startTime}`);
            const end = new Date(`2000-01-01T${formData.endTime}`);
            const diffMs = end - start;
            const diffMinutes = Math.floor(diffMs / 60000);

            if (diffMinutes <= 0) {
                alert('La hora de término debe ser mayor a la de inicio');
                return;
            }

            returnHoursManual(selectedUser.id, selectedUser.name, formData.date, formData.startTime, formData.endTime, diffMinutes, formData.reason);
            showToast('Horas devueltas registradas');
            handleCloseAssignModal();
            return;
        }

        // Day Mode Logic
        const currentBalance = getBalance(selectedUser.id);
        const needed = formData.isHalfDay ? 0.5 : 1;

        if (currentBalance < needed) {
            // Special Permission Flow
            const confirmSpecial = window.confirm(
                `Este usuario no tiene días administrativos disponibles (Saldo ${currentBalance}).\n\n¿Desea registrar una Solicitud Especial (Permiso sin goce/Justificado)?\n\nEsto registrará el evento pero NO descontará días.`
            );

            if (confirmSpecial) {
                assignSpecialPermission(selectedUser.id, selectedUser.name, formData.date, resolvedReason, formData.isHalfDay);
                sendAssignmentEmail({ toEmail: selectedUser.email, toName: selectedUser.name, actionType: 'special', date: formData.date, reason: resolvedReason, details: formData.isHalfDay ? 'Medio día' : '' });
                showToast(`Solicitud especial registrada. Se notificó a ${selectedUser.name}`);
                handleCloseAssignModal();
            }
            return;
        }

        // Call the manual assignment function (Normal Flow)
        assignDayManual(selectedUser.id, selectedUser.name, formData.date, resolvedReason, formData.isHalfDay);
        sendAssignmentEmail({ toEmail: selectedUser.email, toName: selectedUser.name, actionType: 'day', date: formData.date, reason: resolvedReason, details: formData.isHalfDay ? 'Medio día' : '' });
        showToast(formData.isHalfDay ? `¡Medio día asignado! Se notificó a ${selectedUser.name}` : `¡Día asignado! Se notificó a ${selectedUser.name}`);
        handleCloseAssignModal();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/30 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-300/50 shrink-0">
                            <CalendarCheck className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-light text-slate-900 tracking-tight">
                                Control de Días
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Supervisión de saldos • Equipo docente
                            </p>
                        </div>
                    </div>

                    {/* Stats Badge */}
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 border border-slate-200 shadow-sm">
                        <Users className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-slate-700">
                            {filteredUsers.length} {filteredUsers.length === 1 ? 'Usuario' : 'Usuarios'}
                        </span>
                    </div>
                </div>

                {/* Search Bar and Assign Button */}
                <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre de usuario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all text-sm"
                        />
                    </div>

                    {/* Buttons Group */}
                    {(userCanEdit || canReturn) && (
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {userCanEdit && (
                                <>
                                    <button
                                        onClick={() => handleOpenAssignModal('day')}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium text-sm shadow-md shadow-blue-300/40 hover:shadow-lg hover:shadow-blue-400/40 transition-all hover:scale-105 active:scale-[0.98]"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Asignar Día
                                    </button>
                                    <button
                                        onClick={() => handleOpenAssignModal('hour')}
                                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl font-medium text-sm shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-[0.98]"
                                    >
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        Horas
                                    </button>
                                    <button
                                        onClick={() => handleOpenAssignModal('discount')}
                                        className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium text-sm hover:bg-red-100 transition-all active:scale-[0.98]"
                                    >
                                        <Ban className="w-4 h-4" />
                                        Descuento
                                    </button>
                                </>
                            )}
                            {canReturn && (
                                <button
                                    onClick={() => handleOpenAssignModal('return')}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-medium text-sm hover:bg-emerald-100 transition-all active:scale-[0.98]"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Devolver
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Users Grid */}
                <div className="space-y-3 mb-8">
                    {paginatedUsers.map((user, index) => {
                        const balance = getBalance(user.id);
                        const hoursUsed = getHoursUsed(user.id);
                        const discountDays = getDiscountDays(user.id);
                        const status = getBalanceStatus(balance);
                        const StatusIcon = status.icon;

                        const colorStyles = {
                            green: { avatar: 'from-green-400 to-emerald-500' },
                            blue: { avatar: 'from-blue-400 to-indigo-500' },
                            orange: { avatar: 'from-orange-400 to-amber-500' },
                            red: { avatar: 'from-red-400 to-rose-500' }
                        };

                        const colors = colorStyles[status.color];

                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * index }}
                                onClick={() => setSelectedUser(user)}
                                className="group bg-white rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-slate-300 cursor-pointer"
                            >
                                {/* Row 1: Avatar + Name/Role ... History Button */}
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br shrink-0",
                                            colors.avatar
                                        )}>
                                            {getInitials(user.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-slate-900 truncate">
                                                {user.name}
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {getRoleLabel(user.role)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition-all shrink-0 hover:scale-105 active:scale-95"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Ver Detalle
                                    </button>
                                </div>

                                {/* Row 2: Metric chips */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Days chip */}
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                                        status.color === 'green' && "bg-green-50 text-green-700",
                                        status.color === 'blue' && "bg-blue-50 text-blue-700",
                                        status.color === 'orange' && "bg-orange-50 text-orange-700",
                                        status.color === 'red' && "bg-red-50 text-red-700"
                                    )}>
                                        <Calendar className="w-3.5 h-3.5" />
                                        Días: {Math.max(0, balance)}
                                    </div>

                                    {/* Hours chip */}
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700">
                                        <Clock className="w-3.5 h-3.5" />
                                        Horas: {Math.max(0, hoursUsed).toFixed(1).replace(/\.0$/, '')}
                                    </div>

                                    {/* Discount chip (only if > 0) */}
                                    {discountDays > 0 && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700">
                                            <Ban className="w-3.5 h-3.5" />
                                            Descuentos: {discountDays}
                                        </div>
                                    )}

                                    {/* Status badge */}
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
                                        status.color === 'green' && "bg-green-100 text-green-700",
                                        status.color === 'blue' && "bg-blue-100 text-blue-700",
                                        status.color === 'orange' && "bg-orange-100 text-orange-700",
                                        status.color === 'red' && "bg-red-100 text-red-700"
                                    )}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        {status.label}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Pagination Controls */}
                {filteredUsers.length > 0 && (
                    <div className="flex items-center justify-center gap-3 md:gap-6 py-8">
                        {/* Previous Button */}
                        <button
                            onClick={handlePrevious}
                            disabled={currentPage === 1}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all border-2",
                                currentPage === 1
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md"
                            )}
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden md:inline">Anterior</span>
                        </button>

                        {/* Page Indicator */}
                        <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl border-2 border-slate-200 shadow-sm">
                            <span className="text-sm font-medium text-slate-600">
                                Página
                            </span>
                            <span className="text-lg font-bold text-indigo-600">
                                {currentPage}
                            </span>
                            <span className="text-sm font-medium text-slate-400">
                                de
                            </span>
                            <span className="text-lg font-bold text-slate-700">
                                {totalPages}
                            </span>
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all border-2",
                                currentPage === totalPages
                                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm hover:shadow-md"
                            )}
                        >
                            <span className="hidden md:inline">Siguiente</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {filteredUsers.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium text-lg mb-2">
                            No se encontraron usuarios
                        </p>
                        <p className="text-slate-400 text-sm">
                            Intenta con otro término de búsqueda
                        </p>
                    </div>
                )}
            </div>

            {/* Assign Day Modal */}
            <AnimatePresence>
                {isAssignModalOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseAssignModal}
                            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                                {/* Modal Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        {formData.mode === 'return' ? <RotateCcw className="w-6 h-6 text-emerald-500" /> : formData.mode === 'hour' ? <Clock className="w-6 h-6 text-amber-500" /> : formData.mode === 'discount' ? <Ban className="w-6 h-6 text-red-500" /> : <Plus className="w-6 h-6 text-white" />}
                                    </div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        {formData.mode === 'return' ? 'Devolver Horas' : formData.mode === 'hour' ? 'Registrar Horas' : formData.mode === 'discount' ? 'Registrar Día de Descuento' : 'Asignar Día'}
                                    </h2>
                                </div>
                                <button
                                    onClick={handleCloseAssignModal}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors absolute top-6 right-6"
                                >
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>

                                {/* Modal Body */}
                                <div className="space-y-5">
                                    {/* Teacher Autocomplete */}
                                    <div className="relative" ref={autocompleteRef}>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Seleccionar Docente
                                        </label>
                                        <input
                                            type="text"
                                            value={teacherSearch}
                                            onChange={(e) => {
                                                setTeacherSearch(e.target.value);
                                                setShowTeacherDropdown(true);
                                            }}
                                            onFocus={() => setShowTeacherDropdown(true)}
                                            placeholder="Buscar docente por nombre..."
                                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all"
                                        />

                                        {/* Dropdown List */}
                                        {showTeacherDropdown && (
                                            <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border-2 border-slate-200 max-h-60 overflow-y-auto">
                                                {filteredTeachers.length > 0 ? (
                                                    filteredTeachers.map(user => (
                                                        <div
                                                            key={user.id}
                                                            onClick={() => handleSelectTeacher(user)}
                                                            className="p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0"
                                                        >
                                                            <div className="font-medium text-slate-900">
                                                                {user.name}
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-0.5">
                                                                {getRoleLabel(user.role)}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-slate-500">
                                                        <p className="text-sm font-medium">No se encontraron docentes</p>
                                                        <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Date Picker (Dropdowns) */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Fecha (2026)
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Month Select */}
                                            <div>
                                                <select
                                                    value={parseInt(formData.date.split('-')[1]) - 1}
                                                    onChange={(e) => {
                                                        const newMonthIndex = parseInt(e.target.value);
                                                        const currentDay = parseInt(formData.date.split('-')[2]);
                                                        const daysInNewMonth = getDaysInMonth(newMonthIndex);
                                                        const newDay = Math.min(currentDay, daysInNewMonth);
                                                        const newDate = `2026-${String(newMonthIndex + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
                                                        setFormData({ ...formData, date: newDate });
                                                    }}
                                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all appearance-none"
                                                >
                                                    {MONTHS.map((m, i) => (
                                                        <option key={i} value={i}>{m}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Day Select */}
                                            <div>
                                                <select
                                                    value={parseInt(formData.date.split('-')[2])}
                                                    onChange={(e) => {
                                                        const newDay = parseInt(e.target.value);
                                                        const currentMonthIndex = parseInt(formData.date.split('-')[1]) - 1;
                                                        const newDate = `2026-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;
                                                        setFormData({ ...formData, date: newDate });
                                                    }}
                                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all appearance-none"
                                                >
                                                    {Array.from({ length: getDaysInMonth(parseInt(formData.date.split('-')[1]) - 1) }, (_, i) => i + 1).map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Inputs for Hours/Return Mode */}
                                    {(formData.mode === 'hour' || formData.mode === 'return') && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Hora Inicio
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formData.startTime}
                                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 focus:outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Hora Término
                                                </label>
                                                <input
                                                    type="time"
                                                    value={formData.endTime}
                                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-100 focus:outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Reason Input */}
                                    {formData.mode === 'discount' ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Motivo del Descuento
                                                </label>
                                                <select
                                                    value={formData.reason}
                                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-red-400 focus:ring-4 focus:ring-red-100 focus:outline-none transition-all appearance-none"
                                                >
                                                    {DISCOUNT_REASONS.map(r => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Observaciones
                                                </label>
                                                <textarea
                                                    placeholder="Detalles adicionales (opcional)"
                                                    value={formData.observation}
                                                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                                                    rows={3}
                                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-red-400 focus:ring-4 focus:ring-red-100 focus:outline-none transition-all resize-none"
                                                />
                                            </div>
                                        </>
                                    ) : formData.mode === 'day' ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Motivo
                                                </label>
                                                <select
                                                    value={formData.reason === 'Personal' || formData.reason === 'Otro' ? formData.reason : 'Otro'}
                                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value, observation: e.target.value === 'Personal' ? '' : formData.observation })}
                                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all appearance-none"
                                                >
                                                    <option value="Personal">Personal</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                            </div>
                                            {formData.reason === 'Otro' && (
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        Especifique motivo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ingrese el motivo..."
                                                        value={formData.observation}
                                                        onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                                                    />
                                                </div>
                                            )}
                                            {/* Half Day Toggle */}
                                            <label className="flex items-center gap-3 cursor-pointer select-none group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.isHalfDay}
                                                        onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-500 transition-colors" />
                                                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                                    Medio dia (descuenta 0.5)
                                                </span>
                                            </label>
                                        </>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Motivo
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Solicitado verbalmente"
                                                value={formData.reason}
                                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={handleCloseAssignModal}
                                        className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAssign}
                                        className={cn(
                                            "flex-1 px-6 py-3 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all bg-gradient-to-r",
                                            formData.mode === 'return' ? "from-emerald-500 to-green-600" : formData.mode === 'hour' ? "from-amber-500 to-orange-600" : formData.mode === 'discount' ? "from-red-500 to-rose-600" : "from-blue-500 to-indigo-600"
                                        )}
                                    >
                                        {formData.mode === 'return' ? 'Confirmar Devolución' : formData.mode === 'hour' ? 'Confirmar Horas' : formData.mode === 'discount' ? 'Confirmar Descuento' : 'Confirmar Asignación'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Success Toast */}
            <AnimatePresence>
                {showSuccessToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 right-8 z-50"
                    >
                        <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <Check className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold">{toastMessage || '¡Operación exitosa!'}</p>
                                <p className="text-sm opacity-90">El registro se ha actualizado</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Side Panel (Slide-over) */}
            {selectedUser && (
                <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
            )}
        </div >
    );
}
