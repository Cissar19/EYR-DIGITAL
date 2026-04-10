import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Search, Trash2, ChevronLeft, ChevronRight, CheckCircle, Calendar, ChevronDown, Users, Star, BookOpen, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { useReplacementLogs } from '../context/ReplacementLogsContext';
import { useAuth, canEdit as canEditHelper } from '../context/AuthContext';
import { ReplacementsCard } from '../components/DashboardHome';

const MATCH_CFG = {
    exact: {
        label: 'Exacto',
        icon: Star,
        avatar: 'from-emerald-500 to-teal-600',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        ring: 'ring-emerald-400',
        dot: 'bg-emerald-500',
        glow: 'shadow-emerald-200',
    },
    related: {
        label: 'Afín',
        icon: BookOpen,
        avatar: 'from-amber-400 to-orange-500',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        ring: 'ring-amber-300',
        dot: 'bg-amber-400',
        glow: 'shadow-amber-100',
    },
    available: {
        label: 'Libre',
        icon: Zap,
        avatar: 'from-slate-400 to-slate-600',
        badge: 'bg-slate-100 text-slate-600 border-slate-200',
        ring: 'ring-slate-300',
        dot: 'bg-slate-400',
        glow: 'shadow-slate-100',
    },
};

const initials = (name = '') =>
    name.trim().split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();

function CandidateCard({ candidate, isChosen, rank }) {
    const cfg = MATCH_CFG[candidate.matchLevel] || MATCH_CFG.available;
    const Icon = cfg.icon;

    if (isChosen) {
        return (
            <div className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border-2 border-emerald-300 shadow-lg",
                cfg.glow, "shadow-md"
            )}>
                {/* Chosen badge */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        <CheckCircle className="w-2.5 h-2.5" /> Elegido
                    </span>
                </div>

                {/* Avatar */}
                <div className={cn(
                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-black text-lg shadow-md ring-2 ring-white",
                    cfg.avatar
                )}>
                    {initials(candidate.name)}
                </div>

                {/* Name */}
                <div className="text-center">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{candidate.name}</p>
                </div>

                {/* Match badge */}
                <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold", cfg.badge)}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/70 border border-slate-100 hover:border-slate-200 transition-colors">
            {/* Rank */}
            <span className="text-[10px] font-black text-slate-300 w-4 text-center shrink-0">#{rank}</span>

            {/* Avatar */}
            <div className={cn(
                "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shrink-0",
                cfg.avatar
            )}>
                {initials(candidate.name)}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{candidate.name}</p>
            </div>

            {/* Match badge */}
            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0", cfg.badge)}>
                <Icon className="w-2.5 h-2.5" />
                {cfg.label}
            </div>
        </div>
    );
}

function CandidatesPanel({ log }) {
    const candidates = log.candidates || [];
    const chosen = candidates.find(c => c.id === log.replacementId);
    const others = candidates.filter(c => c.id !== log.replacementId);

    const exactCount    = candidates.filter(c => c.matchLevel === 'exact').length;
    const relatedCount  = candidates.filter(c => c.matchLevel === 'related').length;
    const availCount    = candidates.filter(c => c.matchLevel === 'available').length;

    return (
        <div className="px-6 py-5 bg-gradient-to-br from-slate-50/80 to-indigo-50/30 border-t border-indigo-100/60">

            {/* Header stats */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                        {candidates.length} candidatos evaluados
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {exactCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <Star className="w-2.5 h-2.5" />{exactCount} exacto{exactCount !== 1 && 's'}
                        </span>
                    )}
                    {relatedCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                            <BookOpen className="w-2.5 h-2.5" />{relatedCount} afín{relatedCount !== 1 && 'es'}
                        </span>
                    )}
                    {availCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            <Zap className="w-2.5 h-2.5" />{availCount} libre{availCount !== 1 && 's'}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex gap-6 items-start">
                {/* Chosen candidate - prominent */}
                {chosen && (
                    <div className="shrink-0 w-36">
                        <CandidateCard candidate={chosen} isChosen rank={1} />
                    </div>
                )}

                {/* Divider */}
                {chosen && others.length > 0 && (
                    <div className="flex flex-col items-center justify-center self-stretch gap-1 shrink-0">
                        <div className="flex-1 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest rotate-0">vs</span>
                        <div className="flex-1 w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
                    </div>
                )}

                {/* Other candidates */}
                {others.length > 0 && (
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Otros disponibles
                        </p>
                        <div className="flex flex-col gap-1.5">
                            {others.map((c, i) => (
                                <CandidateCard key={c.id || i} candidate={c} isChosen={false} rank={i + 2} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Edge case: no chosen candidate saved */}
                {!chosen && candidates.length > 0 && (
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Candidatos</p>
                        <div className="flex flex-col gap-1.5">
                            {candidates.map((c, i) => (
                                <CandidateCard key={c.id || i} candidate={c} isChosen={false} rank={i + 1} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const ITEMS_PER_PAGE = 10;

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

const TYPE_COLORS = {
    'Licencia Médica': 'bg-rose-50 text-rose-700 border-rose-200',
    'Día Admin.':      'bg-purple-50 text-purple-700 border-purple-200',
    '½ Día Admin.':    'bg-purple-50 text-purple-700 border-purple-200',
    'Permiso Horas':   'bg-amber-50 text-amber-700 border-amber-200',
};

export default function ReplacementLogsView() {
    const { user } = useAuth();
    const userCanEdit = canEditHelper(user);
    const { logs, deleteLog } = useReplacementLogs();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [expandedLog, setExpandedLog] = useState(null);

    const today = new Date();
    const defaultStart = formatYMD(getMonday(today));
    const friday = new Date(getMonday(today));
    friday.setDate(friday.getDate() + 4);
    const defaultEnd = formatYMD(friday);

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    const filteredLogs = useMemo(() => {
        let result = logs;
        if (startDate) result = result.filter(l => l.date >= startDate);
        if (endDate)   result = result.filter(l => l.date <= endDate);
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

    const shiftWeek = (offset) => {
        const start = new Date(startDate + 'T12:00:00');
        start.setDate(start.getDate() + offset * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 4);
        setStartDate(formatYMD(start));
        setEndDate(formatYMD(end));
        setCurrentPage(1);
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
                            <span className="text-xs font-bold">✕</span>
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Posibles reemplazos hoy */}
            <ReplacementsCard />

            {/* Separador */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de asignaciones</span>
                <div className="flex-1 h-px bg-slate-200" />
            </div>

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

            {/* Logs */}
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
                                        {userCanEdit && <th className="text-right px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider" />}
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
                                                        isExpanded && "bg-indigo-50/20 border-b-0"
                                                    )}
                                                    onClick={() => hasCandidates && setExpandedLog(isExpanded ? null : log.id)}
                                                >
                                                    <td className="px-4 py-3.5 font-medium text-slate-700">{formatDateDisplay(log.date)}</td>
                                                    <td className="px-4 py-3.5 font-semibold text-slate-800">{log.absentName}</td>
                                                    <td className="px-4 py-3.5">
                                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide", typeClass)}>
                                                            {log.absenceType}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mr-1">{log.startTime}</span>
                                                        <span className="text-slate-600">{log.subject}</span>
                                                        {log.course && <span className="text-slate-400 ml-1">· {log.course}</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                                                {initials(log.replacementName)}
                                                            </div>
                                                            <span className="font-semibold text-emerald-700">{log.replacementName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-500 text-xs">{log.assignedByName}</td>
                                                    <td className="px-4 py-3.5">
                                                        {hasCandidates ? (
                                                            <div className="flex items-center gap-1.5">
                                                                {/* Mini avatar stack */}
                                                                <div className="flex -space-x-1.5">
                                                                    {log.candidates.slice(0, 4).map((c, i) => {
                                                                        const cfg = MATCH_CFG[c.matchLevel] || MATCH_CFG.available;
                                                                        return (
                                                                            <div
                                                                                key={i}
                                                                                className={cn(
                                                                                    "w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[9px] font-black ring-2 ring-white",
                                                                                    cfg.avatar
                                                                                )}
                                                                                title={c.name}
                                                                            >
                                                                                {initials(c.name)}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {log.candidates.length > 4 && (
                                                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[9px] font-black ring-2 ring-white">
                                                                            +{log.candidates.length - 4}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-300">—</span>
                                                        )}
                                                    </td>
                                                    {userCanEdit && (
                                                        <td className="px-4 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                                                            {confirmDelete === log.id ? (
                                                                <div className="flex items-center gap-1 justify-end">
                                                                    <button onClick={() => handleDelete(log.id)} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Confirmar</button>
                                                                    <button onClick={() => setConfirmDelete(null)} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Cancelar</button>
                                                                </div>
                                                            ) : (
                                                                <button onClick={() => setConfirmDelete(log.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>

                                                {/* Expanded candidates panel */}
                                                <AnimatePresence>
                                                    {isExpanded && hasCandidates && (
                                                        <tr className="border-b border-indigo-100">
                                                            <td colSpan={userCanEdit ? 8 : 7} className="p-0">
                                                                <motion.div
                                                                    initial={{ opacity: 0, height: 0 }}
                                                                    animate={{ opacity: 1, height: 'auto' }}
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                                                    style={{ overflow: 'hidden' }}
                                                                >
                                                                    <CandidatesPanel log={log} />
                                                                </motion.div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </AnimatePresence>
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
                                    <div key={log.id}>
                                        <div className={cn("p-4 space-y-2.5", isExpanded && "bg-indigo-50/20")}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-500">{formatDateDisplay(log.date)}</span>
                                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide", typeClass)}>
                                                    {log.absenceType}
                                                </span>
                                            </div>

                                            {/* Absent → Replacement */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ausente</p>
                                                    <p className="text-sm font-bold text-slate-800">{log.absentName}</p>
                                                </div>
                                                <div className="text-slate-300 text-lg">→</div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Reemplazante</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                                                            {initials(log.replacementName)}
                                                        </div>
                                                        <p className="text-sm font-bold text-emerald-700">{log.replacementName}</p>
                                                    </div>
                                                </div>
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
                                                            className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full transition-colors"
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
                                        </div>

                                        {/* Mobile candidates panel */}
                                        <AnimatePresence>
                                            {isExpanded && hasCandidates && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <CandidatesPanel log={log} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
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
                    <span className="text-sm font-semibold text-slate-600">{currentPage} / {totalPages}</span>
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
