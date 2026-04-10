import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Search, Trash2, ChevronLeft, ChevronRight, CheckCircle, Calendar, ChevronDown, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useReplacementLogs } from '../context/ReplacementLogsContext';
import { useAuth, canEdit as canEditHelper } from '../context/AuthContext';

const MATCH_STYLES = {
    exact:     { dot: 'bg-emerald-500', label: 'text-emerald-700 bg-emerald-50', text: 'exacto' },
    related:   { dot: 'bg-amber-400',   label: 'text-amber-700 bg-amber-50',     text: 'afín'   },
    available: { dot: 'bg-slate-400',   label: 'text-slate-600 bg-slate-100',    text: 'libre'  },
};

const ITEMS_PER_PAGE = 10;

// Get monday of the week containing `date`
const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
};

const formatYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return `${DAYS[date.getDay()]} ${d}/${m}`;
};

export default function ReplacementLogsView() {
    const { user } = useAuth();
    const userCanEdit = canEditHelper(user);
    const { logs, deleteLog } = useReplacementLogs();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [expandedLog, setExpandedLog] = useState(null);

    // Date range filter: default to current week
    const today = new Date();
    const defaultStart = formatYMD(getMonday(today));
    const friday = new Date(getMonday(today));
    friday.setDate(friday.getDate() + 4);
    const defaultEnd = formatYMD(friday);

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    const filteredLogs = useMemo(() => {
        let result = logs;

        // Filter by date range
        if (startDate) result = result.filter(l => l.date >= startDate);
        if (endDate) result = result.filter(l => l.date <= endDate);

        // Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(l =>
                (l.absentName || '').toLowerCase().includes(q) ||
                (l.replacementName || '').toLowerCase().includes(q) ||
                (l.subject || '').toLowerCase().includes(q) ||
                (l.course || '').toLowerCase().includes(q)
            );
        }

        return result;
    }, [logs, startDate, endDate, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE));
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleDelete = async (logId) => {
        await deleteLog(logId);
        setConfirmDelete(null);
    };

    // Shift week
    const shiftWeek = (offset) => {
        const start = new Date(startDate + 'T12:00:00');
        start.setDate(start.getDate() + offset * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 4);
        setStartDate(formatYMD(start));
        setEndDate(formatYMD(end));
        setCurrentPage(1);
    };

    const TYPE_COLORS = {
        'Licencia Médica': 'bg-rose-50 text-rose-700 border-rose-200',
        'Día Admin.': 'bg-purple-50 text-purple-700 border-purple-200',
        '½ Día Admin.': 'bg-purple-50 text-purple-700 border-purple-200',
        'Permiso Horas': 'bg-amber-50 text-amber-700 border-amber-200',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-100 rounded-2xl text-teal-600">
                        <Shuffle className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Registro de Reemplazos</h1>
                        <p className="text-slate-400 text-sm">Historial de reemplazos asignados</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, materia..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-48 md:w-64"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                            <span className="text-xs font-bold">X</span>
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Date Range Filter */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex flex-wrap items-center gap-3"
            >
                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
                    <button onClick={() => shiftWeek(-1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent text-sm text-slate-700 outline-none"
                    />
                    <span className="text-slate-300">—</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent text-sm text-slate-700 outline-none"
                    />
                    <button onClick={() => shiftWeek(1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    {filteredLogs.length} {filteredLogs.length === 1 ? 'registro' : 'registros'}
                </span>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
                {filteredLogs.length === 0 ? (
                    <div className="text-center py-16">
                        <Shuffle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">No hay registros en este rango</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Fecha</th>
                                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Ausente</th>
                                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Tipo</th>
                                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Bloque</th>
                                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Reemplazante</th>
                                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Asignado por</th>
                                        <th className="text-left px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Candidatos</th>
                                        {userCanEdit && <th className="text-right px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider"></th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedLogs.map((log) => {
                                        const typeClass = TYPE_COLORS[log.absenceType] || 'bg-slate-50 text-slate-600 border-slate-200';
                                        const isExpanded = expandedLog === log.id;
                                        const hasCandidates = log.candidates?.length > 0;
                                        return (
                                            <React.Fragment key={log.id}>
                                            <tr
                                                className={cn(
                                                    "border-b border-slate-50 transition-colors",
                                                    hasCandidates ? "cursor-pointer hover:bg-indigo-50/30" : "hover:bg-slate-50/50",
                                                    isExpanded && "bg-indigo-50/20"
                                                )}
                                                onClick={() => hasCandidates && setExpandedLog(isExpanded ? null : log.id)}
                                            >
                                                <td className="px-4 py-3 font-medium text-slate-700">{formatDateDisplay(log.date)}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-800">{log.absentName}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide", typeClass)}>
                                                        {log.absenceType}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mr-1">{log.startTime}</span>
                                                    <span className="text-slate-600">{log.subject}</span>
                                                    {log.course && <span className="text-slate-400 ml-1">· {log.course}</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span className="font-semibold text-emerald-700">{log.replacementName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{log.assignedByName}</td>
                                                <td className="px-4 py-3">
                                                    {hasCandidates && (
                                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                                            <Users className="w-3.5 h-3.5" />
                                                            <span>{log.candidates.length}</span>
                                                            <ChevronDown className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
                                                        </div>
                                                    )}
                                                </td>
                                                {userCanEdit && (
                                                <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                                    {confirmDelete === log.id ? (
                                                        <div className="flex items-center gap-1 justify-end">
                                                            <button
                                                                onClick={() => handleDelete(log.id)}
                                                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                                                            >
                                                                Confirmar
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDelete(null)}
                                                                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmDelete(log.id)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Eliminar registro"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                                )}
                                            </tr>
                                            {isExpanded && hasCandidates && (
                                                <tr className="bg-indigo-50/30 border-b border-indigo-100/50">
                                                    <td colSpan={userCanEdit ? 8 : 7} className="px-6 py-3">
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-0.5 shrink-0">Candidatos disponibles</span>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {log.candidates.map((c, i) => {
                                                                    const style = MATCH_STYLES[c.matchLevel] || MATCH_STYLES.available;
                                                                    const isChosen = c.id === log.replacementId;
                                                                    return (
                                                                        <span
                                                                            key={i}
                                                                            className={cn(
                                                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                                                                isChosen
                                                                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200 ring-1 ring-emerald-400"
                                                                                    : cn(style.label, "border-transparent")
                                                                            )}
                                                                        >
                                                                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                                                                            {c.name}
                                                                            {isChosen && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-slate-100">
                            {paginatedLogs.map((log) => {
                                const typeClass = TYPE_COLORS[log.absenceType] || 'bg-slate-50 text-slate-600 border-slate-200';
                                const isExpanded = expandedLog === log.id;
                                const hasCandidates = log.candidates?.length > 0;
                                return (
                                    <div key={log.id} className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-500">{formatDateDisplay(log.date)}</span>
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide", typeClass)}>
                                                {log.absenceType}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-sm font-semibold text-slate-800">{log.absentName}</span>
                                            <span className="text-slate-400 mx-1.5">&rarr;</span>
                                            <span className="text-sm font-semibold text-emerald-700">{log.replacementName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="font-bold bg-slate-100 px-2 py-0.5 rounded-md">{log.startTime}</span>
                                            <span>{log.subject}{log.course ? ` · ${log.course}` : ''}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400">por {log.assignedByName}</span>
                                            <div className="flex items-center gap-2">
                                                {hasCandidates && (
                                                    <button
                                                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                                        className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500 hover:text-indigo-700"
                                                    >
                                                        <Users className="w-3 h-3" />
                                                        {log.candidates.length} candidatos
                                                        <ChevronDown className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
                                                    </button>
                                                )}
                                                {userCanEdit && (confirmDelete === log.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleDelete(log.id)} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-600 text-white">Confirmar</button>
                                                        <button onClick={() => setConfirmDelete(null)} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600">Cancelar</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirmDelete(log.id)} className="p-1 text-slate-400 hover:text-red-500">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {isExpanded && hasCandidates && (
                                            <div className="pt-1 flex flex-wrap gap-1.5">
                                                {log.candidates.map((c, i) => {
                                                    const style = MATCH_STYLES[c.matchLevel] || MATCH_STYLES.available;
                                                    const isChosen = c.id === log.replacementId;
                                                    return (
                                                        <span key={i} className={cn(
                                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                                                            isChosen
                                                                ? "bg-emerald-100 text-emerald-800 border-emerald-200 ring-1 ring-emerald-400"
                                                                : cn(style.label, "border-transparent")
                                                        )}>
                                                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                                                            {c.name}
                                                            {isChosen && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold text-slate-600">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
