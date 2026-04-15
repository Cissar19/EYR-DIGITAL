import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModalContainer from '../components/ModalContainer';
import {
    CalendarCheck, Search, TrendingDown, TrendingUp, Circle,
    Eye, AlertCircle, Users, ChevronLeft, ChevronRight, X, Calendar, Plus, Check, Clock, Ban, RotateCcw, Bell,
    ClipboardList, Filter, Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { exportAdminDaysHistoryPDF } from '../lib/pdfExport';
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
    const { requests, getBalance, getHoursUsed, getDiscountDays, getUserRequests, getPendingRequests, approveRequest, rejectRequest, assignDayManual, assignSpecialPermission, assignHoursManual, returnHoursManual, assignDiscountDay } = useAdministrativeDays();
    const { users: allUsers } = useAuth();
    const [activeTab, setActiveTab] = useState('usuarios'); // 'usuarios' | 'historial'
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    // History tab filters
    const [historySearch, setHistorySearch] = useState('');
    const [historyType, setHistoryType] = useState('all');
    const [historyMonth, setHistoryMonth] = useState('all');
    const [historyPage, setHistoryPage] = useState(1);
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
        user.role !== ROLES.SUPER_ADMIN &&
        user.role !== ROLES.PRINTER
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

    // --- Pending approval handlers ---
    const pendingRequests = getPendingRequests();

    const handleApprovePending = (id) => {
        const req = pendingRequests.find(r => r.id === id);
        const periodLabel = req?.isHalfDay === 'am' ? ' (Mañana)' : req?.isHalfDay === 'pm' ? ' (Tarde)' : '';
        const dayLabel = req?.isHalfDay ? `0.5 día${periodLabel}` : '1 día';
        if (confirm(`¿Aprobar solicitud de ${req?.userName}? Se descontará ${dayLabel}.`)) {
            approveRequest(id);
            if (req) {
                const reqUser = allUsers.find(u => u.id === req.userId);
                if (reqUser) {
                    const halfDetail = req.isHalfDay === 'am' ? 'Medio día (Mañana)' : req.isHalfDay === 'pm' ? 'Medio día (Tarde)' : '';
                    sendAssignmentEmail({ toEmail: reqUser.email, toName: reqUser.name, actionType: 'approval', date: req.date, reason: req.reason, details: halfDetail });
                }
            }
        }
    };

    const handleRejectPending = (id) => {
        const req = pendingRequests.find(r => r.id === id);
        if (confirm(`¿Rechazar solicitud de ${req?.userName}?`)) {
            rejectRequest(id);
            if (req) {
                const reqUser = allUsers.find(u => u.id === req.userId);
                if (reqUser) {
                    const halfDetail = req.isHalfDay === 'am' ? 'Medio día (Mañana)' : req.isHalfDay === 'pm' ? 'Medio día (Tarde)' : '';
                    sendAssignmentEmail({ toEmail: reqUser.email, toName: reqUser.name, actionType: 'rejection', date: req.date, reason: req.reason, details: halfDetail });
                }
            }
        }
    };

    // --- History helpers ---
    const getRequestTypeConfig = (request) => {
        if (request.type === 'hour_return') return { label: 'Devolución Horas', icon: RotateCcw, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
        if (request.type === 'hour_permission') return { label: 'Permiso Horas', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
        if (request.type === 'discount') return { label: 'Descuento', icon: Ban, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
        if (request.reason?.startsWith('[Excepcion]')) return { label: 'Excepción', icon: AlertCircle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' };
        if (request.isHalfDay) return { label: request.isHalfDay === 'am' ? '½ Día AM' : '½ Día PM', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
        return { label: 'Día Admin.', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
    };

    const getRequestTypeKey = (request) => {
        if (request.type === 'hour_return') return 'hour_return';
        if (request.type === 'hour_permission') return 'hour_permission';
        if (request.type === 'discount') return 'discount';
        if (request.reason?.startsWith('[Excepcion]')) return 'special';
        if (request.isHalfDay) return 'half_day';
        return 'day';
    };

    const approvedRequests = React.useMemo(() => {
        return requests
            .filter(r => r.status === 'approved')
            .filter(r => historySearch === '' || normalizeText(r.userName).includes(normalizeText(historySearch)))
            .filter(r => historyType === 'all' || getRequestTypeKey(r) === historyType)
            .filter(r => {
                if (historyMonth === 'all') return true;
                const month = r.date?.substring(5, 7);
                return month === historyMonth;
            })
            .sort((a, b) => b.date?.localeCompare(a.date));
    }, [requests, historySearch, historyType, historyMonth]);

    const HISTORY_PER_PAGE = 15;
    const historyTotalPages = Math.max(1, Math.ceil(approvedRequests.length / HISTORY_PER_PAGE));
    const effectiveHistoryPage = Math.min(historyPage, historyTotalPages);
    const historyStart = (effectiveHistoryPage - 1) * HISTORY_PER_PAGE;
    const paginatedHistory = approvedRequests.slice(historyStart, historyStart + HISTORY_PER_PAGE);

    const TYPE_LABELS = {
        day: 'Día Admin.', half_day: 'Medio Día', hour_permission: 'Permiso Horas',
        hour_return: 'Devolución Horas', discount: 'Descuento', special: 'Excepción'
    };

    const handleExportHistory = () => {
        exportAdminDaysHistoryPDF(approvedRequests, {
            month: historyMonth,
            monthLabel: historyMonth !== 'all' ? MONTHS[parseInt(historyMonth) - 1] : '',
            type: historyType,
            typeLabel: TYPE_LABELS[historyType] || '',
            search: historySearch,
        });
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

    const handleAssign = async () => {
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

        try {
            if (formData.mode === 'discount') {
                await assignDiscountDay(selectedUser.id, selectedUser.name, formData.date, formData.reason, formData.observation);
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
                    await assignSpecialPermission(selectedUser.id, selectedUser.name, formData.date, resolvedReason, formData.isHalfDay);
                    const halfLabel = formData.isHalfDay === 'am' ? 'Medio día (Mañana)' : formData.isHalfDay === 'pm' ? 'Medio día (Tarde)' : '';
                    sendAssignmentEmail({ toEmail: selectedUser.email, toName: selectedUser.name, actionType: 'special', date: formData.date, reason: resolvedReason, details: halfLabel });
                    showToast(`Solicitud especial registrada. Se notificó a ${selectedUser.name}`);
                    handleCloseAssignModal();
                }
                return;
            }

            // Call the manual assignment function (Normal Flow — goes to pending approval)
            await assignDayManual(selectedUser.id, selectedUser.name, formData.date, resolvedReason, formData.isHalfDay);
            const halfDetail = formData.isHalfDay === 'am' ? 'Medio día (Mañana)' : formData.isHalfDay === 'pm' ? 'Medio día (Tarde)' : '';
            sendAssignmentEmail({ toEmail: selectedUser.email, toName: selectedUser.name, actionType: 'day', date: formData.date, reason: resolvedReason, details: halfDetail });
            showToast(formData.isHalfDay ? `Medio día (${formData.isHalfDay === 'am' ? 'Mañana' : 'Tarde'}) asignado — pendiente de aprobación` : `Día asignado — pendiente de aprobación`);
            handleCloseAssignModal();
        } catch (error) {
            console.error('Error in request:', error);
            alert(error.message || 'Ocurrió un error al procesar la solicitud');
        }
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

                {/* Tabs */}
                <div className="flex gap-1 mb-8 bg-slate-100/80 p-1 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                            activeTab === 'usuarios'
                                ? "bg-white text-indigo-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Users className="w-4 h-4" />
                        Usuarios
                    </button>
                    <button
                        onClick={() => setActiveTab('historial')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                            activeTab === 'historial'
                                ? "bg-white text-indigo-700 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <ClipboardList className="w-4 h-4" />
                        Historial Aprobados
                        {approvedRequests.length > 0 && (
                            <span className="bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                {approvedRequests.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search Bar and Assign Button */}
                {activeTab === 'usuarios' && <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
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
                </div>}

                {/* Pending Approvals */}
                {activeTab === 'usuarios' && userCanEdit && pendingRequests.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                                <Bell className="w-3.5 h-3.5" />
                                {pendingRequests.length} pendiente{pendingRequests.length !== 1 && 's'}
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Solicitudes por Aprobar</h2>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-white rounded-2xl p-5 shadow-sm border border-amber-200 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-slate-800 text-sm">{req.userName}</span>
                                            {req.isHalfDay && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                                    ½ {req.isHalfDay === 'am' ? 'Mañana' : req.isHalfDay === 'pm' ? 'Tarde' : 'Día'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{formatDate(req.date)}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-4">
                                            {req.reason}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprovePending(req.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                                        >
                                            <Check className="w-4 h-4" /> Aprobar
                                        </button>
                                        <button
                                            onClick={() => handleRejectPending(req.id)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                                        >
                                            <X className="w-4 h-4" /> Rechazar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Users Grid */}
                {activeTab === 'usuarios' && <div className="space-y-3 mb-8">
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
                </div>}

                {/* Pagination Controls */}
                {activeTab === 'usuarios' && filteredUsers.length > 0 && (
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
                {activeTab === 'usuarios' && filteredUsers.length === 0 && (
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

                {/* Historial Tab */}
                {activeTab === 'historial' && (
                    <div>
                        {/* Filters + Export */}
                        <div className="flex flex-wrap gap-3 mb-6 items-center">
                            {/* Search by name */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none text-sm"
                                />
                            </div>
                            {/* Month filter */}
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                <select
                                    value={historyMonth}
                                    onChange={(e) => setHistoryMonth(e.target.value)}
                                    className="pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm appearance-none"
                                >
                                    <option value="all">Todos los meses</option>
                                    {MONTHS.map((m, i) => (
                                        <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Type filter */}
                            <select
                                value={historyType}
                                onChange={(e) => setHistoryType(e.target.value)}
                                className="px-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm"
                            >
                                <option value="all">Todos los tipos</option>
                                <option value="day">Día Admin.</option>
                                <option value="half_day">Medio Día</option>
                                <option value="hour_permission">Permiso Horas</option>
                                <option value="hour_return">Devolución Horas</option>
                                <option value="discount">Descuento</option>
                                <option value="special">Excepción</option>
                            </select>

                            {/* Export button */}
                            {approvedRequests.length > 0 && (
                                <button
                                    onClick={handleExportHistory}
                                    className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
                                >
                                    <Download className="w-4 h-4" />
                                    Exportar PDF
                                </button>
                            )}
                        </div>

                        {/* Summary chips */}
                        <div className="flex flex-wrap gap-2 mb-6 text-xs">
                            <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-medium">
                                {approvedRequests.length} {approvedRequests.length === 1 ? 'registro' : 'registros'}
                            </span>
                            {approvedRequests.filter(r => getRequestTypeKey(r) === 'day').length > 0 && (
                                <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-medium">
                                    {approvedRequests.filter(r => getRequestTypeKey(r) === 'day').length} días completos
                                </span>
                            )}
                            {approvedRequests.filter(r => getRequestTypeKey(r) === 'half_day').length > 0 && (
                                <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium">
                                    {approvedRequests.filter(r => getRequestTypeKey(r) === 'half_day').length} medios días
                                </span>
                            )}
                            {approvedRequests.filter(r => getRequestTypeKey(r) === 'hour_permission').length > 0 && (
                                <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-medium">
                                    {approvedRequests.filter(r => getRequestTypeKey(r) === 'hour_permission').length} permisos de horas
                                </span>
                            )}
                            {approvedRequests.filter(r => getRequestTypeKey(r) === 'discount').length > 0 && (
                                <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium">
                                    {approvedRequests.filter(r => getRequestTypeKey(r) === 'discount').length} descuentos
                                </span>
                            )}
                        </div>

                        {/* Records list */}
                        {paginatedHistory.length > 0 ? (
                            <div className="space-y-2 mb-6">
                                {paginatedHistory.map((req) => {
                                    const typeConfig = getRequestTypeConfig(req);
                                    const TypeIcon = typeConfig.icon;
                                    return (
                                        <div
                                            key={req.id}
                                            className="bg-white rounded-2xl px-5 py-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3"
                                        >
                                            {/* Date */}
                                            <div className="flex items-center gap-2 text-xs text-slate-500 sm:w-32 shrink-0">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatDate(req.date)}</span>
                                            </div>
                                            {/* User */}
                                            <div className="sm:w-44 shrink-0">
                                                <span className="text-sm font-semibold text-slate-800">{req.userName}</span>
                                            </div>
                                            {/* Type badge */}
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border shrink-0",
                                                typeConfig.bg, typeConfig.color, typeConfig.border
                                            )}>
                                                <TypeIcon className="w-3.5 h-3.5" />
                                                {typeConfig.label}
                                            </div>
                                            {/* Reason */}
                                            <p className="text-sm text-slate-600 truncate flex-1">{req.reason}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ClipboardList className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-slate-500 text-sm">No hay registros aprobados con los filtros seleccionados</p>
                            </div>
                        )}

                        {/* History Pagination */}
                        {historyTotalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 py-4">
                                <button
                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                    disabled={effectiveHistoryPage === 1}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border-2",
                                        effectiveHistoryPage === 1
                                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Anterior
                                </button>
                                <span className="text-sm text-slate-600 font-medium">
                                    {effectiveHistoryPage} / {historyTotalPages}
                                </span>
                                <button
                                    onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                                    disabled={effectiveHistoryPage === historyTotalPages}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border-2",
                                        effectiveHistoryPage === historyTotalPages
                                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                    )}
                                >
                                    Siguiente
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Assign Day Modal */}
            {isAssignModalOpen && (
                <ModalContainer onClose={handleCloseAssignModal} maxWidth="max-w-md">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-8 pt-7 pb-5">
                        <div className="flex items-center gap-3">
                            {formData.mode === 'return' ? <RotateCcw className="w-6 h-6 text-emerald-500" /> : formData.mode === 'hour' ? <Clock className="w-6 h-6 text-amber-500" /> : formData.mode === 'discount' ? <Ban className="w-6 h-6 text-red-500" /> : <Plus className="w-6 h-6 text-eyr-primary" />}
                            <h2 className="text-2xl font-headline font-extrabold text-eyr-on-surface">
                                {formData.mode === 'return' ? 'Devolver Horas' : formData.mode === 'hour' ? 'Registrar Horas' : formData.mode === 'discount' ? 'Registrar Día de Descuento' : 'Asignar Día'}
                            </h2>
                        </div>
                        <button
                            onClick={handleCloseAssignModal}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5 text-eyr-on-variant" />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="px-8 pb-6 space-y-5 overflow-y-auto">
                        {/* Teacher Autocomplete */}
                        <div className="relative" ref={autocompleteRef}>
                            <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
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
                                className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
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
                            <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
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
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all appearance-none text-eyr-on-surface"
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
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all appearance-none text-eyr-on-surface"
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
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                        Hora Inicio
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                        Hora Término
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reason Input */}
                        {formData.mode === 'discount' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                        Motivo del Descuento
                                    </label>
                                    <select
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all appearance-none text-eyr-on-surface"
                                    >
                                        {DISCOUNT_REASONS.map(r => (
                                            <option key={r} value={r}>{r}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                        Observaciones
                                    </label>
                                    <textarea
                                        placeholder="Detalles adicionales (opcional)"
                                        value={formData.observation}
                                        onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                                        rows={3}
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all resize-none text-eyr-on-surface"
                                    />
                                </div>
                            </>
                        ) : formData.mode === 'day' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                        Motivo
                                    </label>
                                    <select
                                        value={formData.reason === 'Personal' || formData.reason === 'Otro' ? formData.reason : 'Otro'}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value, observation: e.target.value === 'Personal' ? '' : formData.observation })}
                                        className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all appearance-none text-eyr-on-surface"
                                    >
                                        <option value="Personal">Personal</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                {formData.reason === 'Otro' && (
                                    <div>
                                        <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                            Especifique motivo
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ingrese el motivo..."
                                            value={formData.observation}
                                            onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                                            className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                        />
                                    </div>
                                )}
                                {/* Half Day Toggle */}
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={!!formData.isHalfDay}
                                            onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked ? 'am' : false })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-indigo-500 transition-colors" />
                                        <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                                    </div>
                                    <span className="text-sm font-medium text-eyr-on-surface group-hover:text-eyr-on-surface transition-colors">
                                        Medio dia (descuenta 0.5)
                                    </span>
                                </label>
                                {/* AM / PM selector */}
                                {formData.isHalfDay && (
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isHalfDay: 'am' })}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all",
                                                formData.isHalfDay === 'am'
                                                    ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                                            )}
                                        >
                                            Mañana (AM)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isHalfDay: 'pm' })}
                                            className={cn(
                                                "flex-1 py-2.5 rounded-2xl text-sm font-semibold border-2 transition-all",
                                                formData.isHalfDay === 'pm'
                                                    ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                                            )}
                                        >
                                            Tarde (PM)
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-2">
                                    Motivo
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Solicitado verbalmente"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full px-5 py-4 bg-eyr-surface-low border border-transparent rounded-2xl focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none transition-all text-eyr-on-surface"
                                />
                            </div>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0">
                        <button
                            onClick={handleCloseAssignModal}
                            className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAssign}
                            className={cn(
                                "bg-gradient-to-r text-white rounded-2xl font-extrabold px-8 py-3 shadow-xl hover:shadow-2xl hover:scale-105 transition-all",
                                formData.mode === 'return' ? "from-emerald-500 to-green-600" : formData.mode === 'hour' ? "from-amber-500 to-orange-600" : formData.mode === 'discount' ? "from-red-500 to-rose-600" : "from-eyr-primary to-[#742fe5]"
                            )}
                        >
                            {formData.mode === 'return' ? 'Confirmar Devolución' : formData.mode === 'hour' ? 'Confirmar Horas' : formData.mode === 'discount' ? 'Confirmar Descuento' : 'Confirmar Asignación'}
                        </button>
                    </div>
                </ModalContainer>
            )}

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
