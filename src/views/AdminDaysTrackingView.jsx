import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarCheck, Search, TrendingDown, TrendingUp, Circle,
    Eye, AlertCircle, Users, ChevronLeft, ChevronRight, X, Calendar, Plus, Check, Clock, Ban
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES, getRoleLabel } from '../context/AuthContext';
import { useAdministrativeDays } from '../context/AdministrativeDaysContext';

// Pagination constant
const ITEMS_PER_PAGE = 8;

const DISCOUNT_REASONS = [
    'Inasistencia injustificada',
    'Abandono de labores',
    'Atraso reiterado',
    'Otro'
];

// Helper to get today's date restricted to 2026
const getToday2026 = () => {
    return new Date().toISOString().split('T')[0];
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
    const { users: MOCK_USERS } = useAuth();
    const { getBalance, getHoursUsed, getDiscountDays, getUserRequests, assignDayManual, assignSpecialPermission, assignHoursManual, assignDiscountDay } = useAdministrativeDays();
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
        mode: 'day', // 'day', 'hour', or 'discount'
        startTime: '',
        endTime: '',
        observation: ''
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

    // Get user history
    const userHistory = selectedUser ? getUserRequests(selectedUser.id) : [];

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
        const date = new Date(dateString);
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
            reason: mode === 'discount' ? DISCOUNT_REASONS[0] : '',
            mode,
            startTime: '',
            endTime: '',
            observation: ''
        });
        setTeacherSearch('');
        setShowTeacherDropdown(false);
        setIsAssignModalOpen(true);
    };

    const handleCloseAssignModal = () => {
        setIsAssignModalOpen(false);
        setFormData({ userId: '', date: '', reason: '', mode: 'day', startTime: '', endTime: '', observation: '' });
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

        const selectedUser = relevantUsers.find(u => u.id === formData.userId);
        if (!selectedUser) return;

        if (formData.mode === 'discount') {
            assignDiscountDay(selectedUser.id, selectedUser.name, formData.date, formData.reason, formData.observation);
            showToast('Día de descuento registrado');
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
            showToast('Horas registradas correctamente');
            handleCloseAssignModal();
            return;
        }

        // Day Mode Logic
        const currentBalance = getBalance(selectedUser.id);

        if (currentBalance <= 0) {
            // Special Permission Flow
            const confirmSpecial = window.confirm(
                `Este usuario no tiene días administrativos disponibles (Saldo ${currentBalance}).\n\n¿Desea registrar una Solicitud Especial (Permiso sin goce/Justificado)?\n\nEsto registrará el evento pero NO descontará días.`
            );

            if (confirmSpecial) {
                assignSpecialPermission(selectedUser.id, selectedUser.name, formData.date, formData.reason);
                showToast('Solicitud especial registrada');
                handleCloseAssignModal();
            }
            return;
        }

        // Call the manual assignment function (Normal Flow)
        assignDayManual(selectedUser.id, selectedUser.name, formData.date, formData.reason);
        showToast('¡Día asignado correctamente!');
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
                    <div className="w-full md:w-auto bg-white/80 backdrop-blur-xl rounded-2xl px-6 py-4 md:py-3 border border-white/20 shadow-lg flex items-center justify-between md:justify-center gap-3">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-indigo-600" />
                            <span className="text-sm font-semibold text-slate-700 md:hidden">Total Miembros</span>
                        </div>
                        <div>
                            <div className="text-2xl font-semibold text-slate-900 text-right md:text-left">{filteredUsers.length}</div>
                            <div className="text-xs text-slate-500 font-medium hidden md:block">
                                {filteredUsers.length === 1 ? 'Usuario' : 'Usuarios'}
                            </div>
                        </div>
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
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <button
                            onClick={() => handleOpenAssignModal('day')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-medium shadow-lg shadow-blue-300/50 hover:shadow-xl hover:shadow-blue-400/50 transition-all hover:scale-105 active:scale-[0.98]"
                        >
                            <Plus className="w-5 h-5" />
                            Asignar Día
                        </button>
                        <button
                            onClick={() => handleOpenAssignModal('hour')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-700 border border-slate-200 rounded-2xl font-medium shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-[0.98]"
                        >
                            <Clock className="w-5 h-5 text-amber-500" />
                            Registrar Horas
                        </button>
                        <button
                            onClick={() => handleOpenAssignModal('discount')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl font-medium shadow-lg shadow-red-300/50 hover:shadow-xl hover:shadow-red-400/50 transition-all hover:scale-105 active:scale-[0.98]"
                        >
                            <Ban className="w-5 h-5" />
                            Día de Descuento
                        </button>
                    </div>
                </div>

                {/* Users Grid */}
                <div className="space-y-4 mb-8">
                    {paginatedUsers.map((user, index) => {
                        const balance = getBalance(user.id);
                        const hoursUsed = getHoursUsed(user.id);
                        const discountDays = getDiscountDays(user.id);
                        const status = getBalanceStatus(balance);
                        const StatusIcon = status.icon;

                        const colorStyles = {
                            green: {
                                badge: 'from-green-100 to-emerald-200 text-green-700',
                                avatar: 'from-green-400 to-emerald-500',
                                number: 'text-green-600',
                                progress: 'from-green-400 to-emerald-500',
                                icon: 'text-green-600'
                            },
                            blue: {
                                badge: 'from-blue-100 to-indigo-200 text-blue-700',
                                avatar: 'from-blue-400 to-indigo-500',
                                number: 'text-blue-600',
                                progress: 'from-blue-400 to-indigo-500',
                                icon: 'text-blue-600'
                            },
                            orange: {
                                badge: 'from-orange-100 to-amber-200 text-orange-700',
                                avatar: 'from-orange-400 to-amber-500',
                                number: 'text-orange-600',
                                progress: 'from-orange-400 to-amber-500',
                                icon: 'text-orange-600'
                            },
                            red: {
                                badge: 'from-red-100 to-rose-200 text-red-700',
                                avatar: 'from-red-400 to-rose-500',
                                number: 'text-red-600',
                                progress: 'from-red-400 to-rose-500',
                                icon: 'text-red-600'
                            }
                        };

                        const colors = colorStyles[status.color];

                        return (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * index }}
                                className="group bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 border-slate-200 hover:border-slate-300"
                            >
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
                                    {/* Left: Avatar + Info */}
                                    <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full text-center md:text-left">
                                        {/* Avatar */}
                                        <div className={cn(
                                            "w-16 h-16 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br shadow-lg shrink-0",
                                            colors.avatar
                                        )}>
                                            {getInitials(user.name)}
                                        </div>

                                        {/* Name & Role */}
                                        <div className="flex-1 min-w-0 w-full">
                                            <h3 className="text-xl md:text-lg font-semibold text-slate-900 truncate">
                                                {user.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 font-medium">
                                                {getRoleLabel(user.role)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Center: Split Balance Indicator */}
                                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 w-full md:w-auto px-0 md:px-4">

                                        {/* Days Column */}
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <div className={cn(
                                                    "text-4xl md:text-5xl font-light tabular-nums",
                                                    colors.number
                                                )}>
                                                    {Math.max(0, balance)}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium mt-1">
                                                    Días Admin
                                                </div>
                                            </div>

                                            {/* Vertical Divider */}
                                            <div className="w-px h-12 bg-slate-200 hidden md:block" />
                                        </div>

                                        {/* Hours Column */}
                                        <div className="text-center">
                                            <div className="text-4xl md:text-5xl font-light tabular-nums text-amber-600">
                                                {Math.max(0, hoursUsed).toFixed(1).replace(/\.0$/, '')}
                                            </div>
                                            <div className="text-xs text-slate-500 font-medium mt-1">
                                                Horas por permiso
                                            </div>
                                        </div>

                                        {/* Discount Days Column */}
                                        {discountDays > 0 && (
                                            <>
                                                <div className="w-px h-12 bg-slate-200 hidden md:block" />
                                                <div className="text-center">
                                                    <div className="text-4xl md:text-5xl font-light tabular-nums text-red-600">
                                                        {discountDays}
                                                    </div>
                                                    <div className="text-xs text-red-500 font-medium mt-1">
                                                        Días descuento
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Status Badge */}
                                        <div className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-gradient-to-r md:order-3 order-3 w-full md:w-auto justify-center",
                                            colors.badge
                                        )}>
                                            <StatusIcon className={cn("w-4 h-4", colors.icon)} />
                                            {status.label}
                                        </div>
                                    </div>

                                    {/* Right: Action Button */}
                                    <div className="w-full md:w-auto md:ml-4">
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 rounded-xl text-base md:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 transition-all active:scale-[0.98]"
                                        >
                                            <Eye className="w-5 h-5 md:w-4 md:h-4" />
                                            Ver Historial
                                        </button>
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
                                        {formData.mode === 'hour' ? <Clock className="w-6 h-6 text-amber-500" /> : formData.mode === 'discount' ? <Ban className="w-6 h-6 text-red-500" /> : <Plus className="w-6 h-6 text-white" />}
                                    </div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        {formData.mode === 'hour' ? 'Registrar Horas' : formData.mode === 'discount' ? 'Registrar Día de Descuento' : 'Asignar Día'}
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

                                    {/* Time Inputs for Hours Mode */}
                                    {formData.mode === 'hour' && (
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
                                            formData.mode === 'hour' ? "from-amber-500 to-orange-600" : formData.mode === 'discount' ? "from-red-500 to-rose-600" : "from-blue-500 to-indigo-600"
                                        )}
                                    >
                                        {formData.mode === 'hour' ? 'Confirmar Horas' : formData.mode === 'discount' ? 'Confirmar Descuento' : 'Confirmar Asignación'}
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
            <AnimatePresence>
                {selectedUser && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        />

                        {/* Side Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-screen w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                                        {getInitials(selectedUser.name)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900">
                                            {selectedUser.name}
                                        </h2>
                                        <p className="text-sm text-slate-600">
                                            {getRoleLabel(selectedUser.role)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>

                            {/* Body - Scrollable History */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                                    Historial de Solicitudes
                                </h3>

                                {userHistory.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-10 h-10 text-slate-400" />
                                        </div>
                                        <p className="text-slate-600 font-medium">
                                            Sin historial
                                        </p>
                                        <p className="text-slate-400 text-sm mt-1">
                                            Este usuario no tiene solicitudes registradas
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {userHistory.map((request) => {
                                            const statusBadge = getStatusBadge(request.status);
                                            return (
                                                <motion.div
                                                    key={request.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-slate-50 rounded-2xl p-4 border border-slate-200 hover:shadow-md transition-shadow"
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-2 text-slate-600">
                                                            <Calendar className="w-4 h-4" />
                                                            <span className="text-sm font-medium">
                                                                {formatDate(request.date)}
                                                            </span>
                                                        </div>
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-lg text-xs font-semibold border",
                                                            statusBadge.className
                                                        )}>
                                                            {statusBadge.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 leading-relaxed">
                                                        {request.reason}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        Creado: {formatDate(request.createdAt)}
                                                    </p>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    );
}
