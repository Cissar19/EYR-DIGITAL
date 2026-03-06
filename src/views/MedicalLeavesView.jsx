import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HeartPulse, Search, ChevronLeft, ChevronRight, X, Plus, Check, Trash2, Calendar, CalendarCheck, Eye
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES, getRoleLabel } from '../context/AuthContext';
import { useMedicalLeaves } from '../context/MedicalLeavesContext';
import UserDetailPanel from '../components/UserDetailPanel';

const ITEMS_PER_PAGE = 8;

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const getDaysInMonth = (monthIndex) => {
    return new Date(2026, monthIndex + 1, 0).getDate();
};

const getToday2026 = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const calcBusinessDays = (start, end) => {
    const s = new Date(start + 'T12:00:00');
    const e = new Date(end + 'T12:00:00');
    if (e < s) return 0;
    let count = 0;
    const current = new Date(s);
    while (current <= e) {
        const day = current.getDay(); // 0=Sun, 6=Sat
        if (day !== 0 && day !== 6) count++;
        current.setDate(current.getDate() + 1);
    }
    return count;
};

const getReturnDate = (endDate) => {
    const d = new Date(endDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    // Avanzar hasta el próximo día hábil (lun-vie)
    while (d.getDay() === 0 || d.getDay() === 6) {
        d.setDate(d.getDate() + 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function MedicalLeavesView() {
    const { users: MOCK_USERS } = useAuth();
    const { getAllLeaves, addLeave, deleteLeave } = useMedicalLeaves();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form state
    const today = getToday2026();
    const [formData, setFormData] = useState({
        userId: '',
        startDate: today,
        endDate: today,
        diagnosis: ''
    });

    // Autocomplete state
    const [teacherSearch, setTeacherSearch] = useState('');
    const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
    const autocompleteRef = React.useRef(null);

    const normalizeText = (text) => {
        return text
            ?.toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") || "";
    };

    const relevantUsers = MOCK_USERS.filter(user =>
        user.role === ROLES.TEACHER ||
        user.role === ROLES.ADMIN ||
        user.role === ROLES.STAFF ||
        user.role === ROLES.DIRECTOR
    );

    // All leaves, filtered by search
    const allLeaves = getAllLeaves();
    const filteredLeaves = allLeaves.filter(leave =>
        normalizeText(leave.userName).includes(normalizeText(searchQuery))
    );

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedLeaves = filteredLeaves.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

    const filteredTeachers = relevantUsers.filter(user =>
        normalizeText(user.name).includes(normalizeText(teacherSearch))
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString.length === 10 ? dateString + 'T12:00:00' : dateString);
        return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatDateFull = (dateString) => {
        const date = new Date(dateString + 'T12:00:00');
        const str = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const showToast = (message) => {
        setToastMessage(message);
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
    };

    const handleOpenModal = () => {
        const t = getToday2026();
        setFormData({ userId: '', startDate: t, endDate: t, diagnosis: '' });
        setTeacherSearch('');
        setShowTeacherDropdown(false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ userId: '', startDate: today, endDate: today, diagnosis: '' });
        setTeacherSearch('');
        setShowTeacherDropdown(false);
    };

    const handleSelectTeacher = (user) => {
        setFormData({ ...formData, userId: user.id });
        setTeacherSearch(user.name);
        setShowTeacherDropdown(false);
    };

    const calculatedDays = calcBusinessDays(formData.startDate, formData.endDate);
    const returnDate = getReturnDate(formData.endDate);

    const handleSubmit = () => {
        if (!formData.userId || !formData.diagnosis.trim()) {
            alert('Por favor completa todos los campos');
            return;
        }
        if (calculatedDays <= 0) {
            alert('La fecha de término debe ser igual o posterior a la de inicio (y debe incluir al menos un día hábil)');
            return;
        }

        const selectedUser = relevantUsers.find(u => u.id === formData.userId);
        if (!selectedUser) return;

        addLeave(selectedUser.id, selectedUser.name, formData.startDate, formData.endDate, calculatedDays, formData.diagnosis, returnDate);
        showToast(`Licencia médica registrada para ${selectedUser.name}`);
        handleCloseModal();
    };

    const handleDelete = (id) => {
        deleteLeave(id);
        setDeleteConfirmId(null);
        showToast('Licencia médica eliminada');
    };

    // Date picker helper
    const renderDatePicker = (label, dateValue, onChange) => {
        const monthIndex = parseInt(dateValue.split('-')[1]) - 1;
        const dayValue = parseInt(dateValue.split('-')[2]);

        return (
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
                <div className="grid grid-cols-2 gap-3">
                    <select
                        value={monthIndex}
                        onChange={(e) => {
                            const newMonthIndex = parseInt(e.target.value);
                            const currentDay = parseInt(dateValue.split('-')[2]);
                            const daysInNewMonth = getDaysInMonth(newMonthIndex);
                            const newDay = Math.min(currentDay, daysInNewMonth);
                            onChange(`2026-${String(newMonthIndex + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`);
                        }}
                        className="w-full px-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all appearance-none text-sm"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={dayValue}
                        onChange={(e) => {
                            const newDay = parseInt(e.target.value);
                            onChange(`2026-${String(monthIndex + 1).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`);
                        }}
                        className="w-full px-3 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all appearance-none text-sm"
                    >
                        {Array.from({ length: getDaysInMonth(monthIndex) }, (_, i) => i + 1).map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/30 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 md:mb-10 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-xl shadow-rose-300/50 shrink-0">
                            <HeartPulse className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-light text-slate-900 tracking-tight">
                                Licencias Médicas
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Registro y consulta de licencias
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 border border-slate-200 shadow-sm">
                        <HeartPulse className="w-4 h-4 text-rose-500" />
                        <span className="text-sm font-medium text-slate-700">
                            {filteredLeaves.length} {filteredLeaves.length === 1 ? 'Licencia' : 'Licencias'}
                        </span>
                    </div>
                </div>

                {/* Search Bar and Register Button */}
                <div className="mb-8 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre de funcionario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-slate-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 focus:outline-none transition-all text-sm"
                        />
                    </div>

                    <button
                        onClick={handleOpenModal}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-medium text-sm shadow-md shadow-rose-300/40 hover:shadow-lg hover:shadow-rose-400/40 transition-all hover:scale-105 active:scale-[0.98] w-full md:w-auto"
                    >
                        <Plus className="w-4 h-4" />
                        Registrar Licencia
                    </button>
                </div>

                {/* Leaves List */}
                <div className="space-y-3 mb-8">
                    {paginatedLeaves.map((leave, index) => (
                        <motion.div
                            key={leave.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * index }}
                            onClick={() => {
                                const user = MOCK_USERS.find(u => u.id === leave.userId)
                                    || MOCK_USERS.find(u => u.name === leave.userName)
                                    || { id: leave.userId, name: leave.userName, role: 'teacher' };
                                setSelectedUser(user);
                            }}
                            className="group bg-white rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200 hover:border-slate-300 cursor-pointer"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br from-rose-400 to-pink-500 shrink-0">
                                        {leave.userName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-slate-900 truncate">
                                            {leave.userName}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                                            {leave.diagnosis}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Ver Detalle button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const user = MOCK_USERS.find(u => u.id === leave.userId)
                                                || MOCK_USERS.find(u => u.name === leave.userName)
                                                || { id: leave.userId, name: leave.userName, role: 'teacher' };
                                            setSelectedUser(user);
                                        }}
                                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        Ver Detalle
                                    </button>

                                    {/* Delete button */}
                                    {deleteConfirmId === leave.id ? (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDelete(leave.id)}
                                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setDeleteConfirmId(leave.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Metric chips */}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">
                                    {leave.days} {leave.days === 1 ? 'día hábil' : 'días hábiles'}
                                </div>
                                {leave.returnDate && (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                                        <CalendarCheck className="w-3.5 h-3.5" />
                                        Reintegro: {formatDateFull(leave.returnDate)}
                                    </div>
                                )}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-500">
                                    Registrado: {formatDate(leave.createdAt)}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Pagination */}
                {filteredLeaves.length > 0 && (
                    <div className="flex items-center justify-center gap-3 md:gap-6 py-8">
                        <button
                            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
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

                        <div className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-xl border-2 border-slate-200 shadow-sm">
                            <span className="text-sm font-medium text-slate-600">Página</span>
                            <span className="text-lg font-bold text-rose-600">{currentPage}</span>
                            <span className="text-sm font-medium text-slate-400">de</span>
                            <span className="text-lg font-bold text-slate-700">{totalPages}</span>
                        </div>

                        <button
                            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
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
                {filteredLeaves.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium text-lg mb-2">
                            No se encontraron licencias
                        </p>
                        <p className="text-slate-400 text-sm">
                            {searchQuery ? 'Intenta con otro término de búsqueda' : 'Registra la primera licencia médica'}
                        </p>
                    </div>
                )}
            </div>

            {/* Register Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
                                {/* Modal Header */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                                        <HeartPulse className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-semibold text-slate-900">
                                        Registrar Licencia
                                    </h2>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors absolute top-6 right-6"
                                >
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>

                                {/* Modal Body */}
                                <div className="space-y-5">
                                    {/* Teacher Autocomplete */}
                                    <div className="relative" ref={autocompleteRef}>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Seleccionar Funcionario
                                        </label>
                                        <input
                                            type="text"
                                            value={teacherSearch}
                                            onChange={(e) => {
                                                setTeacherSearch(e.target.value);
                                                setShowTeacherDropdown(true);
                                            }}
                                            onFocus={() => setShowTeacherDropdown(true)}
                                            placeholder="Buscar funcionario por nombre..."
                                            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-100 focus:outline-none transition-all"
                                        />

                                        {showTeacherDropdown && (
                                            <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border-2 border-slate-200 max-h-60 overflow-y-auto">
                                                {filteredTeachers.length > 0 ? (
                                                    filteredTeachers.map(user => (
                                                        <div
                                                            key={user.id}
                                                            onClick={() => handleSelectTeacher(user)}
                                                            className="p-3 hover:bg-rose-50 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0"
                                                        >
                                                            <div className="font-medium text-slate-900">{user.name}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{getRoleLabel(user.role)}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-slate-500">
                                                        <p className="text-sm font-medium">No se encontraron funcionarios</p>
                                                        <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Start Date */}
                                    {renderDatePicker('Fecha Inicio', formData.startDate, (val) => setFormData({ ...formData, startDate: val }))}

                                    {/* End Date */}
                                    {renderDatePicker('Fecha Término', formData.endDate, (val) => setFormData({ ...formData, endDate: val }))}

                                    {/* Calculated Business Days + Return Date */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <Calendar className="w-5 h-5 text-indigo-500" />
                                            <span className="text-sm font-semibold text-indigo-700">
                                                Días hábiles: {calculatedDays}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <CalendarCheck className="w-5 h-5 text-emerald-500" />
                                            <span className="text-sm font-semibold text-emerald-700">
                                                Reintegro: {formatDateFull(returnDate)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Diagnosis */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Diagnóstico / Motivo
                                        </label>
                                        <textarea
                                            placeholder="Ej: Reposo médico por..."
                                            value={formData.diagnosis}
                                            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-rose-400 focus:ring-4 focus:ring-rose-100 focus:outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex gap-3 mt-8">
                                    <button
                                        onClick={handleCloseModal}
                                        className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                    >
                                        Registrar Licencia
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

            {/* User Detail Panel */}
            {selectedUser && (
                <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} variant="medical" />
            )}
        </div>
    );
}
