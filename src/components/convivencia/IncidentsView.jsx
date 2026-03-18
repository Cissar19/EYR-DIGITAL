import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useIncidents, CATEGORIES, SEVERITIES, STATUSES } from '../../context/IncidentsContext';
import { useStudents } from '../../context/StudentsContext';
import { useAuth } from '../../context/AuthContext';
import {
    AlertTriangle, Plus, Search, X, Check, ChevronDown, ChevronLeft, ChevronRight,
    Clock, Calendar as CalendarIcon, FileText, Users, BarChart3, MessageSquare,
    Send, Filter, User, BookOpen, ArrowRight, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import StudentsManager from './StudentsManager';

const PAGE_SIZE = 12;

// ── Helpers ──
const normalizeSearch = (text) =>
    text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

const severityBorder = {
    leve: 'border-l-amber-400',
    grave: 'border-l-orange-500',
    muy_grave: 'border-l-red-600',
};

const severityBg = {
    leve: 'bg-amber-50',
    grave: 'bg-orange-50',
    muy_grave: 'bg-red-50',
};

const categoryBadgeColors = {
    conducta: 'bg-red-100 text-red-700',
    salud: 'bg-emerald-100 text-emerald-700',
    asistencia: 'bg-blue-100 text-blue-700',
    familia: 'bg-purple-100 text-purple-700',
    otro: 'bg-slate-100 text-slate-600',
};

const statusBadgeColors = {
    abierta: 'bg-amber-100 text-amber-700',
    en_seguimiento: 'bg-blue-100 text-blue-700',
    resuelta: 'bg-emerald-100 text-emerald-700',
};

export default function IncidentsView() {
    const { incidents, createIncident, addFollowUpNote, changeStatus, deleteIncident } = useIncidents();
    const { students } = useStudents();
    const { user, users } = useAuth();

    // ── State ──
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [showStudentsManager, setShowStudentsManager] = useState(false);
    const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
    const [page, setPage] = useState(0);

    // Filters
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // ── Dashboard KPIs ──
    const kpis = useMemo(() => {
        const open = incidents.filter(i => i.status === 'abierta').length;
        const bySeverity = SEVERITIES.map(s => ({
            ...s,
            count: incidents.filter(i => i.severity === s.value && i.status !== 'resuelta').length,
        }));
        const byCategory = CATEGORIES.map(c => ({
            ...c,
            count: incidents.filter(i => i.category === c.value).length,
        }));
        const pendingFollowUp = incidents.filter(i =>
            i.status === 'en_seguimiento' && i.followUpDate && i.followUpDate <= new Date().toLocaleDateString('en-CA')
        ).length;
        return { open, bySeverity, byCategory, pendingFollowUp };
    }, [incidents]);

    // ── Filtered list ──
    const filtered = useMemo(() => {
        let list = [...incidents];
        if (searchText.trim()) {
            const norm = normalizeSearch(searchText);
            list = list.filter(i =>
                normalizeSearch(i.studentName).includes(norm) ||
                normalizeSearch(i.studentRut).includes(norm) ||
                normalizeSearch(i.description).includes(norm)
            );
        }
        if (filterCategory) list = list.filter(i => i.category === filterCategory);
        if (filterSeverity) list = list.filter(i => i.severity === filterSeverity);
        if (filterStatus) list = list.filter(i => i.status === filterStatus);
        return list;
    }, [incidents, searchText, filterCategory, filterSeverity, filterStatus]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    // Reset page when filters change
    useEffect(() => { setPage(0); }, [searchText, filterCategory, filterSeverity, filterStatus]);

    // When selectedIncident changes in the incidents list, update it
    const detailIncident = useMemo(() => {
        if (!selectedIncident) return null;
        return incidents.find(i => i.id === selectedIncident) || null;
    }, [selectedIncident, incidents]);

    return (
        <div className="space-y-6">
            {/* ═══ DASHBOARD ═══ */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
                <button
                    onClick={() => setDashboardCollapsed(prev => !prev)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-red-600" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">Resumen Incidencias</h3>
                        <span className="text-xs text-slate-400 font-medium">{incidents.length} total</span>
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
                            <div className="px-4 pb-4">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {/* Abiertas */}
                                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Abiertas</span>
                                        </div>
                                        <span className="text-2xl font-black text-amber-700">{kpis.open}</span>
                                    </div>

                                    {/* Por Severidad */}
                                    <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Por Severidad</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {kpis.bySeverity.map(s => (
                                                <div key={s.value} className="text-center">
                                                    <span className={cn("text-lg font-black", `text-${s.color}-700`)}>{s.count}</span>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Por Categoria */}
                                    <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="w-4 h-4 text-indigo-500" />
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Por Categoria</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {kpis.byCategory.filter(c => c.count > 0).map(c => (
                                                <span key={c.value} className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", categoryBadgeColors[c.value])}>
                                                    {c.label} {c.count}
                                                </span>
                                            ))}
                                            {kpis.byCategory.every(c => c.count === 0) && (
                                                <span className="text-xs text-slate-400">Sin incidencias</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pendientes seguimiento */}
                                    <div className={cn(
                                        "rounded-xl p-3 border",
                                        kpis.pendingFollowUp > 0 ? "bg-blue-50 border-blue-100" : "bg-slate-50 border-slate-100"
                                    )}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className={cn("w-4 h-4", kpis.pendingFollowUp > 0 ? "text-blue-500" : "text-slate-400")} />
                                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", kpis.pendingFollowUp > 0 ? "text-blue-600" : "text-slate-500")}>Seguimiento</span>
                                        </div>
                                        <span className={cn("text-2xl font-black", kpis.pendingFollowUp > 0 ? "text-blue-700" : "text-slate-400")}>{kpis.pendingFollowUp}</span>
                                        <p className={cn("text-[9px] font-bold uppercase", kpis.pendingFollowUp > 0 ? "text-blue-400" : "text-slate-300")}>pendientes</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ═══ FILTERS + ACTIONS ═══ */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Buscar alumno, RUT o descripcion..."
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
                        />
                    </div>

                    {/* Filter selects */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:border-amber-400"
                        >
                            <option value="">Categoria</option>
                            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                        <select
                            value={filterSeverity}
                            onChange={(e) => setFilterSeverity(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:border-amber-400"
                        >
                            <option value="">Severidad</option>
                            {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:border-amber-400"
                        >
                            <option value="">Estado</option>
                            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowStudentsManager(true)}
                            className="px-3 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm flex items-center gap-1.5"
                        >
                            <Users className="w-4 h-4" />
                            <span className="hidden sm:inline">Alumnos</span>
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors text-sm flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Incidencia
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══ LIST ═══ */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">
                        {incidents.length === 0 ? 'No hay incidencias registradas' : 'No hay resultados con estos filtros'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {paginated.map(incident => (
                        <button
                            key={incident.id}
                            onClick={() => setSelectedIncident(incident.id)}
                            className={cn(
                                "w-full text-left bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 border-l-4",
                                severityBorder[incident.severity] || 'border-l-slate-300'
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="text-sm font-bold text-slate-800 truncate">{incident.studentName}</span>
                                        {incident.studentCurso && (
                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{incident.studentCurso}</span>
                                        )}
                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", categoryBadgeColors[incident.category])}>
                                            {CATEGORIES.find(c => c.value === incident.category)?.label}
                                        </span>
                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", statusBadgeColors[incident.status])}>
                                            {STATUSES.find(s => s.value === incident.status)?.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-1">{incident.description}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{incident.date}</span>
                                        {incident.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{incident.time}</span>}
                                        <span>por {incident.reportedBy?.name}</span>
                                        {incident.notes?.length > 0 && (
                                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{incident.notes.length} nota{incident.notes.length !== 1 ? 's' : ''}</span>
                                        )}
                                    </div>
                                </div>
                                <Eye className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                            </div>
                        </button>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-bold text-slate-600">{page + 1} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ CREATE MODAL ═══ */}
            <AnimatePresence>
                {showCreateModal && (
                    <CreateIncidentModal
                        onClose={() => setShowCreateModal(false)}
                        students={students}
                        users={users}
                        onCreate={createIncident}
                    />
                )}
            </AnimatePresence>

            {/* ═══ DETAIL MODAL ═══ */}
            <AnimatePresence>
                {detailIncident && (
                    <IncidentDetailModal
                        incident={detailIncident}
                        onClose={() => setSelectedIncident(null)}
                        onAddNote={addFollowUpNote}
                        onChangeStatus={changeStatus}
                        onDelete={deleteIncident}
                        canDelete={user && ['admin', 'super_admin'].includes(user.role)}
                    />
                )}
            </AnimatePresence>

            {/* ═══ STUDENTS MANAGER ═══ */}
            <AnimatePresence>
                {showStudentsManager && (
                    <StudentsManager onClose={() => setShowStudentsManager(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ════════════════════════════════════════
// CREATE INCIDENT MODAL
// ════════════════════════════════════════

function CreateIncidentModal({ onClose, students, users, onCreate }) {
    const [studentId, setStudentId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
    const [time, setTime] = useState(() => new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }));
    const [category, setCategory] = useState('');
    const [severity, setSeverity] = useState('');
    const [description, setDescription] = useState('');
    const [involvedStaff, setInvolvedStaff] = useState([]);
    const [followUpDate, setFollowUpDate] = useState('');
    const [saving, setSaving] = useState(false);
    const dropdownRef = useRef(null);

    const selectedStudent = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);

    const filteredStudents = useMemo(() => {
        if (!studentSearch.trim()) return students.slice(0, 20);
        const norm = normalizeSearch(studentSearch);
        return students.filter(s =>
            normalizeSearch(s.fullName).includes(norm) ||
            normalizeSearch(s.rut).includes(norm) ||
            normalizeSearch(s.curso).includes(norm)
        ).slice(0, 20);
    }, [students, studentSearch]);

    // Staff options (management users)
    const staffOptions = useMemo(() => {
        return users.filter(u => ['convivencia', 'admin', 'super_admin', 'director', 'utp_head', 'inspector'].includes(u.role));
    }, [users]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowStudentDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async () => {
        if (!studentId || !category || !severity || !description.trim()) return;
        setSaving(true);
        try {
            await onCreate({
                studentId,
                studentName: selectedStudent?.fullName || '',
                studentRut: selectedStudent?.rut || '',
                studentCurso: selectedStudent?.curso || '',
                date,
                time,
                category,
                severity,
                description,
                involvedStaff,
                followUpDate,
            });
            onClose();
        } catch (err) {
            // handled by context
        }
        setSaving(false);
    };

    const canSubmit = studentId && category && severity && description.trim();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col"
            >
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Nueva Incidencia
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Student selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alumno *</label>
                        <div className="relative" ref={dropdownRef}>
                            <div
                                onClick={() => setShowStudentDropdown(true)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium",
                                    showStudentDropdown ? "border-amber-500 bg-white" : "border-slate-100 bg-slate-50/50 hover:border-slate-200",
                                    selectedStudent ? "text-slate-800" : "text-slate-400"
                                )}
                            >
                                {selectedStudent ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                                            {selectedStudent.fullName?.charAt(0)}
                                        </div>
                                        <span className="truncate">{selectedStudent.fullName}</span>
                                        <span className="text-xs text-slate-400 font-mono">{selectedStudent.rut}</span>
                                        {selectedStudent.curso && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{selectedStudent.curso}</span>}
                                    </div>
                                ) : (
                                    <span>Seleccionar alumno...</span>
                                )}
                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            </div>

                            <AnimatePresence>
                                {showStudentDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        className="absolute z-30 top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
                                    >
                                        <div className="p-2 border-b border-slate-100">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={studentSearch}
                                                    onChange={(e) => setStudentSearch(e.target.value)}
                                                    placeholder="Buscar alumno..."
                                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {filteredStudents.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-sm text-slate-400">No se encontraron alumnos</div>
                                            ) : (
                                                filteredStudents.map(s => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => { setStudentId(s.id); setShowStudentDropdown(false); setStudentSearch(''); }}
                                                        className={cn(
                                                            "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-3",
                                                            studentId === s.id ? "bg-amber-50 text-amber-700" : "text-slate-700 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                                                            studentId === s.id ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                                                        )}>
                                                            {s.fullName?.charAt(0)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="truncate block">{s.fullName}</span>
                                                            <span className="text-xs text-slate-400 font-mono">{s.rut}</span>
                                                        </div>
                                                        {s.curso && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">{s.curso}</span>}
                                                        {studentId === s.id && <Check className="w-4 h-4 ml-auto shrink-0 text-amber-500" />}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Date + Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hora</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                            />
                        </div>
                    </div>

                    {/* Category (grid buttons) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoria *</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {CATEGORIES.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => setCategory(c.value)}
                                    className={cn(
                                        "px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all",
                                        category === c.value
                                            ? `border-${c.color}-400 bg-${c.color}-50 text-${c.color}-700`
                                            : "border-slate-100 bg-slate-50/50 text-slate-500 hover:border-slate-200"
                                    )}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Severity (3 buttons) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Severidad *</label>
                        <div className="grid grid-cols-3 gap-2">
                            {SEVERITIES.map(s => (
                                <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => setSeverity(s.value)}
                                    className={cn(
                                        "px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all",
                                        severity === s.value
                                            ? `border-${s.color}-400 bg-${s.color}-50 text-${s.color}-700`
                                            : "border-slate-100 bg-slate-50/50 text-slate-500 hover:border-slate-200"
                                    )}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descripcion *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Describe la incidencia..."
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700 resize-none"
                        />
                    </div>

                    {/* Involved staff */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Personal Involucrado</label>
                        <div className="flex flex-wrap gap-2">
                            {staffOptions.map(s => {
                                const isSelected = involvedStaff.some(is => is.id === s.id);
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                            if (isSelected) {
                                                setInvolvedStaff(prev => prev.filter(is => is.id !== s.id));
                                            } else {
                                                setInvolvedStaff(prev => [...prev, { id: s.id, name: s.name }]);
                                            }
                                        }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                            isSelected
                                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                                : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        {s.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Follow-up date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha de Seguimiento</label>
                        <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="w-full max-w-xs px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || saving}
                        className="w-full py-3.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base shadow-sm"
                    >
                        {saving ? 'Guardando...' : <><Check className="w-5 h-5" /> Registrar Incidencia</>}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ════════════════════════════════════════
// INCIDENT DETAIL MODAL
// ════════════════════════════════════════

function IncidentDetailModal({ incident, onClose, onAddNote, onChangeStatus, onDelete, canDelete }) {
    const [noteText, setNoteText] = useState('');
    const [sendingNote, setSendingNote] = useState(false);

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        setSendingNote(true);
        try {
            await onAddNote(incident.id, noteText);
            setNoteText('');
        } catch (err) {
            // handled
        }
        setSendingNote(false);
    };

    const handleStatusChange = async (newStatus) => {
        await onChangeStatus(incident.id, newStatus);
    };

    const severityInfo = SEVERITIES.find(s => s.value === incident.severity);
    const categoryInfo = CATEGORIES.find(c => c.value === incident.category);
    const statusInfo = STATUSES.find(s => s.value === incident.status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col"
            >
                {/* Header */}
                <div className={cn("px-6 py-4 border-b border-slate-100 shrink-0", severityBg[incident.severity] || 'bg-slate-50')}>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg font-black text-slate-800">{incident.studentName}</span>
                                {incident.studentCurso && (
                                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{incident.studentCurso}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {incident.studentRut && <span className="text-xs text-slate-400 font-mono">{incident.studentRut}</span>}
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", categoryBadgeColors[incident.category])}>
                                    {categoryInfo?.label}
                                </span>
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", statusBadgeColors[incident.status])}>
                                    {statusInfo?.label}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                    {severityInfo?.label}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Incident info */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" />{incident.date}</span>
                            {incident.time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{incident.time}</span>}
                            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{incident.reportedBy?.name}</span>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{incident.description}</p>
                        </div>

                        {incident.involvedStaff?.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Personal Involucrado</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {incident.involvedStaff.map((s, i) => (
                                        <span key={i} className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">{s.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {incident.followUpDate && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">Seguimiento: {incident.followUpDate}</span>
                            </div>
                        )}
                    </div>

                    {/* Status buttons */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cambiar Estado</h4>
                        <div className="flex gap-2 flex-wrap">
                            {STATUSES.map(s => (
                                <button
                                    key={s.value}
                                    onClick={() => handleStatusChange(s.value)}
                                    disabled={incident.status === s.value}
                                    className={cn(
                                        "px-3 py-2 rounded-xl text-sm font-bold transition-all border",
                                        incident.status === s.value
                                            ? `bg-${s.color}-100 text-${s.color}-700 border-${s.color}-200`
                                            : "bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-200"
                                    )}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes Timeline */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Notas de Seguimiento ({incident.notes?.length || 0})
                        </h4>

                        {incident.notes?.length > 0 ? (
                            <div className="space-y-3 mb-4">
                                {incident.notes.map((note, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 shrink-0 mt-0.5">
                                            {(note.author || '?').charAt(0)}
                                        </div>
                                        <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-slate-700">{note.author}</span>
                                                <span className="text-[10px] text-slate-400">
                                                    {note.timestamp ? new Date(note.timestamp).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{note.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 mb-4">Sin notas aun</p>
                        )}

                        {/* Add note form */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                placeholder="Agregar nota de seguimiento..."
                                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all text-sm font-medium text-slate-700"
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={!noteText.trim() || sendingNote}
                                className="px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Delete */}
                    {canDelete && (
                        <div className="pt-3 border-t border-slate-100">
                            <button
                                onClick={() => { onDelete(incident.id); onClose(); }}
                                className="text-sm text-red-500 hover:text-red-700 font-bold transition-colors"
                            >
                                Eliminar Incidencia
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
