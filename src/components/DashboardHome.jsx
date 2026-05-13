import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEquipment } from '../context/EquipmentContext';
import { useTickets } from '../context/TicketContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Bell,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
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
    BarChart3,
    Shuffle,
    FileDown,
    HeartPulse,
    BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import NextClassWidget from './NextClassWidget';
import { useAdministrativeDays } from '../context/AdministrativeDaysContext';
import { useMedicalLeaves } from '../context/MedicalLeavesContext';
import { useSchedule, SCHEDULE_BLOCKS } from '../context/ScheduleContext';
import { useReplacementLogs } from '../context/ReplacementLogsContext';
import UserDetailPanel from './UserDetailPanel';
import { exportWeeklyAbsencesPDF } from '../lib/pdfExport';
import { subscribeToCollection } from '../lib/firestoreService';
import { useAcademicYear } from '../context/AcademicYearContext';
import { useCoverageByGrade } from '../hooks/useCoverage';
import { SUBJECT_ORDER, SUBJECT_LABELS, getBasalesMineduc } from '../lib/coverageConstants';
import YearSelector from './coverage/YearSelector';

// Helper for Role Labels (Critical Requirement)
const getRoleLabel = (role) => {
    switch (role) {
        case 'admin':
        case 'super_admin':
            return 'Administradora EYR Huechuraba';
        case 'director':
            return 'Directora';
        case 'utp_head':
            return 'Jefa UTP';
        case 'inspector':
            return 'Inspectoría';
        case 'teacher':
            return 'Docente';
        case 'staff':
            return 'Asistente';
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

// ─── Cobertura helpers (misma fuente que CoberturaDashboard) ─────────────────
const SUBJ_CFG = {
    lenguaje:            { c1: '#4f7dd8', c2: '#7aa3e8', glyph: 'Aa' },
    lengua_y_literatura: { c1: '#4f7dd8', c2: '#7aa3e8', glyph: 'Aa' },
    matematica:          { c1: '#7c5bd8', c2: '#a08be8', glyph: 'π'  },
    ciencias:            { c1: '#2bae7e', c2: '#52c49a', glyph: '✿'  },
    historia:            { c1: '#e8853c', c2: '#f0a468', glyph: 'H'  },
    educacion_fisica:    { c1: '#e44d5c', c2: '#f07a85', glyph: '✮'  },
    musica:              { c1: '#c95fb8', c2: '#dc8cd0', glyph: '♪'  },
    artes:               { c1: '#f0a742', c2: '#f8c468', glyph: '✦'  },
    tecnologia:          { c1: '#2bb0cb', c2: '#58c8df', glyph: '{}'  },
    ingles:              { c1: '#6b7585', c2: '#9aa0ac', glyph: 'En' },
    orientacion:         { c1: '#1f9d4f', c2: '#52b87a', glyph: 'Or' },
    religion_evangelica: { c1: '#d4a853', c2: '#e8c47a', glyph: '✝'  },
    religion_catolica:   { c1: '#c47a3d', c2: '#d9a068', glyph: '†'  },
};
const DEFAULT_SUBJ_CFG = { c1: '#64748b', c2: '#94a3b8', glyph: '?' };

// Mapeo headTeacherOf → código de curso en colección coverage (cursos B)
const FULL_TO_GRADE = {
    '1° Básico': '1B', '2° Básico': '2B', '3° Básico': '3B', '4° Básico': '4B',
    '5° Básico': '5B', '6° Básico': '6B', '7° Básico': '7B', '8° Básico': '8B',
};

/**
 * Vista basal: igual que getBasalOaStats en CoberturaAdminList.
 * Denominador = basalesOas del bloque; fallback a BASALES_MINEDUC si está vacío.
 * Numerador   = intersección con legacyOaStatus (OAs marcados como pasados).
 */
function blockPct(b) {
    const basalesMap = b.basalesOas ?? {};
    let basales = Object.entries(basalesMap).filter(([, v]) => v === true).map(([k]) => k);
    if (!basales.length) basales = [...getBasalesMineduc(b.subject, b.grade)];
    if (!basales.length) return 0;
    const seen    = new Set(Object.entries(b.legacyOaStatus ?? {}).filter(([, v]) => v === true).map(([k]) => k));
    const pasados = basales.filter(c => seen.has(c)).length;
    return pasados / basales.length;
}

function buildSubjectStatsForGrade(coverageData) {
    return SUBJECT_ORDER.map(s => {
        const blocks = coverageData.filter(b => b.subject === s);
        if (!blocks.length) return null;
        const pct = blocks.reduce((acc, b) => acc + blockPct(b), 0) / blocks.length;
        const cfg = SUBJ_CFG[s] ?? DEFAULT_SUBJ_CFG;
        return { subject: s, label: SUBJECT_LABELS[s] ?? s, cfg, pct };
    }).filter(Boolean);
}

// ─── Profesor Jefe Home View ──────────────────────────────────────────────────
const ProfesorJefeView = ({ user }) => {
    const { year } = useAcademicYear();
    const gradeCode = FULL_TO_GRADE[user.headTeacherOf];  // '2B'
    const { data: coverageData } = useCoverageByGrade(year, gradeCode);
    const { getBalance } = useAdministrativeDays();
    const navigate = useNavigate();

    const balance = getBalance(user.id);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    const subjectStats = useMemo(() => buildSubjectStatsForGrade(coverageData), [coverageData]);

    const pct100 = subjectStats.length
        ? Math.round(subjectStats.reduce((s, x) => s + x.pct, 0) / subjectStats.length * 100)
        : 0;
    const withData   = subjectStats.filter(s => s.pct > 0).length;
    const sinInicio  = subjectStats.filter(s => s.pct === 0).length;

    return (
        <div className="space-y-5">

            {/* ── Saludo ── */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                    {greeting}, {user.name}
                </h1>
                <p className="text-slate-400 mt-1">
                    Profesor/a Jefe ·{' '}
                    <span className="font-semibold text-slate-600">{user.headTeacherOf}</span>
                </p>
            </motion.div>

            {/* ── Fila de stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Promedio global */}
                <BentoCard delay={0.1} className="col-span-2 md:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-500 !border-indigo-400/30 min-h-[110px]">
                    <>
                        <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Promedio del curso</p>
                        <div className="flex items-end gap-1">
                            <span className="text-5xl font-black text-white tabular-nums leading-none">{pct100}</span>
                            <span className="text-2xl font-bold text-indigo-200 mb-1">%</span>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
                            <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${pct100}%` }} />
                        </div>
                        <p className="text-indigo-200 text-[10px] mt-1.5 font-medium">{year}</p>
                    </>
                </BentoCard>

                {/* Con avance */}
                <BentoCard delay={0.15} className="bg-gradient-to-br from-white to-emerald-50/40 min-h-[110px]">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Con avance</p>
                    </div>
                    <p className="text-4xl font-black text-slate-800">{withData}</p>
                    <p className="text-slate-400 text-xs mt-1">asignatura{withData !== 1 ? 's' : ''} con OAs cubiertos</p>
                </BentoCard>

                {/* Sin inicio */}
                <BentoCard delay={0.2} className="bg-gradient-to-br from-white to-slate-50/60 min-h-[110px]">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sin inicio</p>
                    </div>
                    <p className="text-4xl font-black text-slate-800">{sinInicio}</p>
                    <p className="text-slate-400 text-xs mt-1">asignatura{sinInicio !== 1 ? 's' : ''} sin datos aún</p>
                </BentoCard>
            </div>

            {/* ── Grid de asignaturas ── */}
            <BentoCard delay={0.3} className="!p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-700">Cobertura por Asignatura</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">OAs Basales</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <YearSelector />
                        <button
                            onClick={() => navigate('/cobertura')}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Ver detalle <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {subjectStats.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                        <p className="text-sm font-medium">Sin datos de cobertura para {user.headTeacherOf}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {subjectStats.map(({ subject, label, cfg, pct }, i) => {
                            const p100 = Math.round(pct * 100);
                            return (
                                <motion.div
                                    key={subject}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: 0.32 + i * 0.04 }}
                                    className="rounded-2xl overflow-hidden flex flex-col border border-[#f0e3c8] shadow-sm"
                                >
                                    <div className="relative p-4 overflow-hidden" style={{ background: `linear-gradient(135deg, ${cfg.c1} 0%, ${cfg.c2} 100%)`, minHeight: 120 }}>
                                        <div style={{ position: 'absolute', right: -30, bottom: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.12)', pointerEvents: 'none' }} />
                                        <div className="flex items-center gap-2 relative z-10">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shrink-0 select-none"
                                                style={{ background: 'rgba(255,255,255,.25)', border: '1.5px solid rgba(255,255,255,.35)' }}>
                                                {cfg.glyph}
                                            </div>
                                            <p className="text-[11px] font-extrabold text-white leading-tight truncate flex-1">{label}</p>
                                        </div>
                                        <div className="mt-3 relative z-10">
                                            <span className="font-black text-white tabular-nums" style={{ fontSize: 40, letterSpacing: '-0.04em', lineHeight: 1 }}>
                                                {p100}<span style={{ fontSize: 18, opacity: 0.8, marginLeft: 1 }}>%</span>
                                            </span>
                                        </div>
                                        <div className="relative mt-2 h-1.5 rounded-full z-10 overflow-hidden" style={{ background: 'rgba(255,255,255,.22)' }}>
                                            <div className="absolute left-0 top-0 bottom-0 rounded-full bg-white" style={{ width: `${p100}%` }} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </BentoCard>

            {/* ── Fila inferior: Días administrativos + Próxima clase ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Días administrativos */}
                <BentoCard delay={0.5} className="bg-gradient-to-br from-white to-purple-50/40">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <span className="text-purple-900/60 font-bold text-xs uppercase tracking-wider">Días Administrativos</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <span className={cn('text-6xl font-black tracking-tighter', balance > 0 ? 'text-slate-800' : 'text-red-500')}>
                            {balance}
                        </span>
                        <span className="text-lg text-slate-400 font-medium">disponibles</span>
                    </div>
                    <Link to="/administrative-days">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3 rounded-xl font-semibold shadow-lg shadow-slate-200 hover:from-slate-800 hover:to-slate-700 transition-all"
                        >
                            Solicitar Día <ArrowUpRight className="w-4 h-4" />
                        </motion.button>
                    </Link>
                </BentoCard>

                {/* Próxima clase */}
                <BentoCard delay={0.55} className="border-indigo-100/50 bg-gradient-to-br from-white to-indigo-50/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-700">Tu Próxima Clase</h3>
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
            </div>
        </div>
    );
};

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
const WeeklyAbsencesWidget = ({ onSelectUser, onSelectMedicalUser, onDayChange }) => {
    const { requests } = useAdministrativeDays();
    const { leaves } = useMedicalLeaves();
    const { users } = useAuth();
    const [weekOffset, setWeekOffset] = useState(0);
    const [selectedDay, setSelectedDay] = useState(null);
    const [showConsolidado, setShowConsolidado] = useState(false);

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

    const getRoleLabelForUser = (role) => {
        if (role === 'staff') return 'Asistente';
        if (role === 'admin' || role === 'super_admin') return 'Administradora';
        if (role === 'director') return 'Directora';
        if (role === 'utp_head') return 'Jefa UTP';
        if (role === 'inspector') return 'Inspectoría';
        return 'Docente';
    };

    const getAbsencesForDate = (dateStr) => {
        // Admin day absences
        const adminAbsences = requests
            .filter(r => (r.status === 'approved' || r.status === 'pending') && r.date === dateStr)
            .map(r => {
                const userRecord = users.find(u => u.id === r.userId);
                const roleLabel = getRoleLabelForUser(userRecord?.role);

                let typeLabel = r.isHalfDay ? (r.isHalfDay === 'am' ? '½ Día Admin. (Mañana)' : r.isHalfDay === 'pm' ? '½ Día Admin. (Tarde)' : '½ Día Administrativo') : 'Día Administrativo';
                if (r.type === 'hour_permission') typeLabel = 'Permiso de Horas';
                else if (r.type === 'discount') typeLabel = 'Descuento';

                return { ...r, roleLabel, typeLabel };
            });

        // Medical leave absences (dateStr falls within startDate..endDate)
        const medicalAbsences = leaves
            .filter(l => l.startDate && l.endDate && dateStr >= l.startDate && dateStr <= l.endDate)
            .map(l => {
                const userRecord = users.find(u => u.id === l.userId);
                const roleLabel = getRoleLabelForUser(userRecord?.role);

                // Calculate days remaining from selected date to endDate
                const selDate = new Date(dateStr + 'T12:00:00');
                const endDate = new Date(l.endDate + 'T12:00:00');
                const diffMs = endDate - selDate;
                const daysLeft = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

                // Format return date for display
                let returnLabel = '';
                if (l.returnDate) {
                    const ret = new Date(l.returnDate + 'T12:00:00');
                    const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                    returnLabel = `${DAY_ABBR[ret.getDay()]} ${ret.getDate()}/${ret.getMonth() + 1}`;
                }

                return {
                    ...l,
                    roleLabel,
                    typeLabel: 'Licencia Médica',
                    reason: l.diagnosis || 'Licencia médica',
                    daysLeft,
                    returnLabel,
                };
            });

        return [...adminAbsences, ...medicalAbsences];
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

    // Weekly consolidado: all persons with absences this week grouped by userId
    const weekConsolidado = useMemo(() => {
        const days = getWeekDays(weekOffset);
        const byUser = new Map();
        days.forEach(day => {
            const absences = getAbsencesForDate(day.dateStr);
            absences.forEach(a => {
                if (!byUser.has(a.userId)) {
                    byUser.set(a.userId, { userId: a.userId, userName: a.userName, roleLabel: a.roleLabel, days: {}, hasMedical: false });
                }
                const entry = byUser.get(a.userId);
                entry.days[day.dateStr] = a;
                if (a.typeLabel === 'Licencia Médica') entry.hasMedical = true;
            });
        });
        return Array.from(byUser.values()).sort((a, b) => a.userName.localeCompare(b.userName));
    }, [weekOffset, requests, leaves, users]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleExportPDF = async () => {
        try {
            const d = new Date(selectedDay + 'T12:00:00');
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const dateLabel = `${dayNames[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
            await exportWeeklyAbsencesPDF({
                weekLabel,
                weekDays,
                weekConsolidado,
                dateLabel,
                dateStr: selectedDay,
                groupedAbsences: grouped,
            });
        } catch (err) {
            console.error('Error al exportar PDF:', err);
            toast.error('No se pudo generar el PDF');
        }
    };

    return (
        <BentoCard delay={0.05} className="md:col-span-2 lg:col-span-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-50 rounded-xl text-red-500">
                        <UserX className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-700">Ausencias de la Semana</h3>
                    <button
                        onClick={() => { setShowConsolidado(v => !v); setSelectedDay(null); onDayChange?.(null); }}
                        className={cn(
                            'text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors',
                            showConsolidado
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                        )}
                    >
                        {showConsolidado ? 'Ver por día' : 'Ver consolidado semanal'}
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setWeekOffset(w => w - 1); setSelectedDay(null); setShowConsolidado(false); onDayChange?.(null); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs md:text-sm font-semibold text-slate-600 min-w-0 md:min-w-[240px] text-center">{weekLabel}</span>
                    <button
                        onClick={() => { setWeekOffset(w => w + 1); setSelectedDay(null); setShowConsolidado(false); onDayChange?.(null); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    {weekOffset !== 0 && (
                        <button
                            onClick={() => { setWeekOffset(0); setSelectedDay(null); setShowConsolidado(false); onDayChange?.(null); }}
                            className="ml-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                        >
                            Hoy
                        </button>
                    )}
                </div>
            </div>

            {/* Days Row */}
            <div className="grid grid-cols-5 gap-1.5 md:gap-3">
                {weekDays.map(day => {
                    const absences = getAbsencesForDate(day.dateStr);
                    const count = absences.length;
                    const isToday = day.dateStr === todayStr;
                    const isSelected = selectedDay === day.dateStr;

                    return (
                        <button
                            key={day.dateStr}
                            onClick={() => { const next = isSelected ? null : day.dateStr; setSelectedDay(next); setShowConsolidado(false); onDayChange?.(next); }}
                            className={cn(
                                "flex flex-col items-center py-2 md:py-3 px-1 md:px-2 rounded-lg md:rounded-xl border-2 transition-all duration-200",
                                isSelected
                                    ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                    : isToday
                                        ? "border-indigo-200 bg-indigo-50/50 hover:border-indigo-300"
                                        : "border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200"
                            )}
                        >
                            <span className={cn(
                                "text-[10px] md:text-xs font-bold uppercase tracking-wider",
                                isToday ? "text-indigo-600" : "text-slate-400"
                            )}>
                                {day.dayName}
                            </span>
                            <span className={cn(
                                "text-xl md:text-2xl font-black mt-0.5",
                                isToday ? "text-indigo-700" : "text-slate-700"
                            )}>
                                {day.dayNum}
                            </span>
                            {count > 0 ? (
                                <>
                                    <span className={cn(
                                        "mt-1 md:mt-1.5 text-[10px] md:text-xs font-bold px-1.5 md:px-2.5 py-0.5 rounded-full",
                                        count >= 3
                                            ? "bg-red-100 text-red-700"
                                            : "bg-amber-100 text-amber-700"
                                    )}>
                                        {count}
                                        <span className="hidden md:inline"> {count === 1 ? 'ausencia' : 'ausencias'}</span>
                                    </span>
                                    <span className="mt-1 text-[10px] font-semibold text-indigo-500 hidden md:block">
                                        Ver detalle
                                    </span>
                                </>
                            ) : (
                                <span className="mt-1 md:mt-1.5 text-[10px] md:text-xs font-medium text-slate-300 px-1.5 md:px-2.5 py-0.5">
                                    <span className="hidden md:inline">Sin ausencias</span>
                                    <span className="md:hidden">—</span>
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Consolidado semanal */}
            {showConsolidado && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                            Consolidado semanal
                            {weekConsolidado.length > 0 && (
                                <span className="ml-2 text-slate-500 normal-case tracking-normal font-semibold">
                                    — {weekConsolidado.length} {weekConsolidado.length === 1 ? 'persona ausente' : 'personas ausentes'}
                                </span>
                            )}
                        </h3>
                    </div>
                    {weekConsolidado.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">Sin ausencias registradas esta semana.</p>
                    ) : (
                        <div className="space-y-1.5">
                            {weekConsolidado.map(person => {
                                const initials = person.userName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
                                const totalDays = Object.keys(person.days).length;
                                const avatarColor = person.hasMedical ? 'from-rose-500 to-red-600' : 'from-indigo-500 to-indigo-600';
                                return (
                                    <div key={person.userId} className="flex items-center gap-2 md:gap-3 py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-[11px] font-bold shrink-0', avatarColor)}>
                                            {initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-sm font-semibold text-slate-700 truncate">{person.userName}</span>
                                                <span className={cn(
                                                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0',
                                                    person.roleLabel === 'Asistente' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                )}>
                                                    {person.roleLabel}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Day indicators */}
                                        <div className="flex gap-1 shrink-0">
                                            {weekDays.map(day => {
                                                const absence = person.days[day.dateStr];
                                                const isToday2 = day.dateStr === todayStr;
                                                if (!absence) {
                                                    return (
                                                        <div key={day.dateStr} className="flex flex-col items-center w-7">
                                                            <span className={cn('text-[9px] font-bold uppercase', isToday2 ? 'text-indigo-400' : 'text-slate-300')}>{day.dayName}</span>
                                                            <div className={cn('w-6 h-5 rounded mt-0.5', isToday2 ? 'bg-slate-100 border border-indigo-100' : 'bg-transparent')} />
                                                        </div>
                                                    );
                                                }
                                                const isMedical = absence.typeLabel === 'Licencia Médica';
                                                const isHalfAm = absence.isHalfDay === 'am';
                                                const isHalfPm = absence.isHalfDay === 'pm';
                                                const isHalf = isHalfAm || isHalfPm || absence.isHalfDay === true;
                                                const dotColor = isMedical ? 'bg-rose-500' : isHalf ? 'bg-amber-400' : 'bg-indigo-500';
                                                const bgColor = isMedical ? 'bg-rose-50 border-rose-200' : isHalf ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200';
                                                const title = isMedical ? 'Licencia Médica' : isHalfAm ? '½ Mañana' : isHalfPm ? '½ Tarde' : 'Día Completo';
                                                return (
                                                    <div key={day.dateStr} className="flex flex-col items-center w-7" title={title}>
                                                        <span className={cn('text-[9px] font-bold uppercase', isToday2 ? 'text-indigo-600' : 'text-slate-500')}>{day.dayName}</span>
                                                        <div className={cn('w-6 h-5 rounded mt-0.5 border flex items-center justify-center', bgColor)}>
                                                            <div className={cn('w-2 h-2 rounded-full', dotColor)} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <span className={cn(
                                            'text-xs font-bold px-2 py-1 rounded-lg shrink-0',
                                            totalDays >= 3 ? 'bg-red-100 text-red-700' : totalDays >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                        )}>
                                            {totalDays}d
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Detail Panel */}
            {selectedDay && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-100"
                >
                    {(() => {
                        const d = new Date(selectedDay + 'T12:00:00');
                        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        const selectedDateLabel = `${dayNames[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
                        return (
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-base font-bold text-slate-700">
                                    Ausencias — {selectedDateLabel}
                                </h3>
                                {selectedAbsences.length > 0 && (
                                    <button
                                        onClick={handleExportPDF}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <FileDown className="w-3.5 h-3.5" />
                                        Exportar PDF
                                    </button>
                                )}
                            </div>
                        );
                    })()}
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
                                            const isMedical = item.typeLabel === 'Licencia Médica';
                                            const isHalfAm = item.isHalfDay === 'am';
                                            const isHalfPm = item.isHalfDay === 'pm';
                                            const isHalfGeneric = item.isHalfDay === true;

                                            // Color scheme per absence type
                                            const rowColor = isMedical
                                                ? "bg-rose-50/80 border-rose-100"
                                                : isHalfAm
                                                    ? "bg-amber-50/80 border-amber-200"
                                                    : isHalfPm
                                                        ? "bg-violet-50/80 border-violet-200"
                                                        : isHalfGeneric
                                                            ? "bg-teal-50/80 border-teal-200"
                                                            : "bg-slate-50/80 border-slate-100 hover:bg-slate-100/80";

                                            const avatarColor = isMedical
                                                ? "from-rose-500 to-red-600"
                                                : isHalfAm
                                                    ? "from-amber-500 to-orange-600"
                                                    : isHalfPm
                                                        ? "from-violet-500 to-purple-600"
                                                        : isHalfGeneric
                                                            ? "from-teal-500 to-cyan-600"
                                                            : "from-indigo-500 to-indigo-600";

                                            return (
                                                <div key={item.id} className={cn("flex items-center justify-between py-2.5 px-3 rounded-xl border hover:opacity-90 transition-all", rowColor)}>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-[11px] font-bold shrink-0", avatarColor)}>
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm font-semibold text-slate-700 truncate">{item.userName}</span>
                                                                <span className={cn(
                                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0",
                                                                    item.roleLabel === 'Asistente'
                                                                        ? "bg-blue-100 text-blue-700"
                                                                        : "bg-purple-100 text-purple-700"
                                                                )}>
                                                                    {item.roleLabel}
                                                                </span>
                                                                {isHalfAm && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-amber-100 text-amber-700">
                                                                        ½ Mañana
                                                                    </span>
                                                                )}
                                                                {isHalfPm && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-violet-100 text-violet-700">
                                                                        ½ Tarde
                                                                    </span>
                                                                )}
                                                                {isHalfGeneric && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-teal-100 text-teal-700">
                                                                        ½ Día
                                                                    </span>
                                                                )}
                                                                {isMedical && item.daysLeft !== undefined && (
                                                                    <span className={cn(
                                                                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                                                                        item.daysLeft === 0
                                                                            ? "bg-emerald-100 text-emerald-700"
                                                                            : item.daysLeft <= 2
                                                                                ? "bg-amber-100 text-amber-700"
                                                                                : "bg-rose-100 text-rose-700"
                                                                    )}>
                                                                        {item.daysLeft === 0 ? 'Último día' : `${item.daysLeft} ${item.daysLeft === 1 ? 'día' : 'días'} restantes`}
                                                                    </span>
                                                                )}
                                                                {isMedical && item.returnLabel && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                                                                        Reintegro: {item.returnLabel}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (!userRecord) return;
                                                            isMedical ? onSelectMedicalUser(userRecord) : onSelectUser(userRecord);
                                                        }}
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

// ============================================
// REPLACEMENT SUGGESTIONS
// ============================================

const RELATED_SUBJECTS = {
    'Matemática': ['T. Matemática'],
    'T. Matemática': ['Matemática'],
    'Lenguaje': ['T. Lenguaje', 'Leng. y Lit.', 'Taller Len'],
    'Leng. y Lit.': ['Lenguaje', 'T. Lenguaje', 'Taller Len'],
    'T. Lenguaje': ['Lenguaje', 'Leng. y Lit.', 'Taller Len'],
    'Taller Len': ['Lenguaje', 'T. Lenguaje', 'Leng. y Lit.'],
    'C. Nat': ['T. Ciencias', 'Ciencias'],
    'Ciencias': ['C. Nat', 'T. Ciencias'],
    'T. Ciencias': ['C. Nat', 'Ciencias'],
    'Historia': ['H. G. y Cs. S.', 'For. Ciud.'],
    'H. G. y Cs. S.': ['Historia', 'For. Ciud.'],
    'For. Ciud.': ['Historia', 'H. G. y Cs. S.'],
    'Religión': ['Religión / FC'],
    'Religión / FC': ['Religión'],
    'Música': ['Música/Arte'],
    'Música/Arte': ['Música'],
};

const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Parse "HH:MM" to minutes for comparison
const timeToMin = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
};

// Day name (e.g. "Lunes") → teacher_hours key (e.g. "lunes")
const DAY_NAME_TO_KEY = {
    'Lunes': 'lunes', 'Martes': 'martes', 'Miércoles': 'miercoles',
    'Jueves': 'jueves', 'Viernes': 'viernes',
};

export const ReplacementsCard = ({ externalDate }) => {
    const { requests } = useAdministrativeDays();
    const { leaves } = useMedicalLeaves();
    const { schedules } = useSchedule();
    const { users, user: currentUser } = useAuth();
    const { logs, assignReplacement } = useReplacementLogs();
    const [expandedTeacher, setExpandedTeacher] = useState(null);
    const [detailModal, setDetailModal] = useState(null); // { teacherName, absentId, absenceType, block }
    const [assigning, setAssigning] = useState(null); // "absentId-startTime" key while saving
    const [dayOffset, setDayOffset] = useState(0);
    const [teacherHours, setTeacherHours] = useState([]);

    // Load teacher_hours once
    React.useEffect(() => {
        const unsub = subscribeToCollection('teacher_hours', (docs) => setTeacherHours(docs));
        return () => unsub();
    }, []);

    // Reset dayOffset when external date changes
    React.useEffect(() => {
        if (externalDate) {
            setDayOffset(0);
            setExpandedTeacher(null);
        }
    }, [externalDate]);

    // Compute selected date based on offset (skip weekends), or use externalDate
    const { selectedDateStr, selectedDayName, selectedDateLabel, isToday } = useMemo(() => {
        if (externalDate && dayOffset === 0) {
            const d = new Date(externalDate + 'T12:00:00');
            const now = new Date();
            const todayCheck = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            return {
                selectedDateStr: externalDate,
                selectedDayName: DAY_NAMES_FULL[d.getDay()],
                selectedDateLabel: `${DAY_NAMES_FULL[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`,
                isToday: externalDate === todayCheck,
            };
        }

        const base = new Date();
        let offset = dayOffset;
        const dir = offset >= 0 ? 1 : -1;
        let remaining = Math.abs(offset);
        while (remaining > 0) {
            base.setDate(base.getDate() + dir);
            if (base.getDay() !== 0 && base.getDay() !== 6) remaining--;
        }
        const yyyy = base.getFullYear();
        const mm = String(base.getMonth() + 1).padStart(2, '0');
        const dd = String(base.getDate()).padStart(2, '0');
        const now = new Date();
        const todayCheck = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dateStr = `${yyyy}-${mm}-${dd}`;
        return {
            selectedDateStr: dateStr,
            selectedDayName: DAY_NAMES_FULL[base.getDay()],
            selectedDateLabel: `${DAY_NAMES_FULL[base.getDay()]} ${base.getDate()} de ${MONTH_NAMES[base.getMonth()]}`,
            isToday: dateStr === todayCheck,
        };
    }, [dayOffset, externalDate]);

    // Check if a block already has an assigned replacement for selected date
    const getAssignedLog = (absentId, startTime) => {
        return logs.find(l => l.date === selectedDateStr && l.absentId === absentId && l.startTime === startTime);
    };

    const handleAssign = async (teacher, block, candidate) => {
        const key = `${teacher.userId}-${block.startTime}`;
        setAssigning(key);
        await assignReplacement({
            date: selectedDateStr,
            absentId: teacher.userId,
            absentName: teacher.userName,
            absenceType: teacher.typeLabel,
            startTime: block.startTime,
            subject: block.subject,
            course: block.course,
            replacementId: candidate.userId,
            replacementName: candidate.name,
            assignedBy: currentUser.id,
            assignedByName: currentUser.name,
            candidates: block.candidates.map(c => ({
                id: c.userId,
                name: c.name,
                matchLevel: c.matchLevel,
            })),
        });
        setAssigning(null);
    };

    const replacementData = useMemo(() => {
        const targetStr = selectedDateStr;
        const dayName = selectedDayName;

        // Collect absent user IDs with absence type
        const absentMap = new Map();

        requests
            .filter(r => (r.status === 'approved' || r.status === 'pending') && r.date === targetStr && r.type !== 'discount' && r.type !== 'hour_return')
            .forEach(r => {
                let typeLabel = r.isHalfDay ? (r.isHalfDay === 'am' ? '½ AM' : r.isHalfDay === 'pm' ? '½ PM' : '½ Día Admin.') : 'Día Admin.';
                if (r.type === 'hour_permission') typeLabel = 'Permiso Horas';
                if (!absentMap.has(r.userId)) {
                    absentMap.set(r.userId, { userId: r.userId, userName: r.userName, typeLabel });
                }
            });

        leaves
            .filter(l => l.startDate && l.endDate && targetStr >= l.startDate && targetStr <= l.endDate)
            .forEach(l => {
                if (!absentMap.has(l.userId)) {
                    absentMap.set(l.userId, { userId: l.userId, userName: l.userName, typeLabel: 'Licencia Médica' });
                }
            });

        if (absentMap.size === 0) return null;

        const absentIds = new Set(absentMap.keys());

        // Build permanence lookup: userId → { entryMin, exitMin } for this day
        const dayKey = DAY_NAME_TO_KEY[dayName];
        const permanenceByUser = {};
        for (const th of teacherHours) {
            if (!th.userId) continue;
            const slot = th.schedule?.[dayKey];
            if (!slot?.entry || !slot?.exit) continue;
            permanenceByUser[th.userId] = {
                entryMin: timeToMin(slot.entry),
                exitMin: timeToMin(slot.exit),
            };
        }

        // Build lookup: which startTimes each user is busy on this day
        const busyByUser = {};
        for (const [uid, blocks] of Object.entries(schedules)) {
            if (!blocks) continue;
            busyByUser[uid] = new Set(
                blocks.filter(b => b.day === dayName).map(b => b.startTime)
            );
        }

        // Also mark users already assigned as replacements at a given time as busy
        logs.filter(l => l.date === targetStr).forEach(l => {
            if (!busyByUser[l.replacementId]) busyByUser[l.replacementId] = new Set();
            busyByUser[l.replacementId].add(l.startTime);
        });

        // For each absent teacher, find their blocks and candidates
        let totalUncovered = 0;
        const teacherSections = [];

        for (const absent of absentMap.values()) {
            const userBlocks = (schedules[absent.userId] || [])
                .filter(b => b.day === dayName && b.startTime !== '08:00');

            if (userBlocks.length === 0) continue;

            const blockDetails = [];
            for (const block of userBlocks) {
                totalUncovered++;

                // Find the block label from SCHEDULE_BLOCKS
                const schedBlock = SCHEDULE_BLOCKS.find(sb => sb.start === block.startTime);
                const timeLabel = schedBlock ? schedBlock.start : block.startTime;

                // Find candidates: users who are NOT busy at this time and NOT absent
                // Eligibility: teachers by default, others only if canReplace === true
                const candidates = [];
                for (const u of users) {
                    if (absentIds.has(u.id)) continue;
                    if (u.id === absent.userId) continue;
                    const eligible = u.canReplace !== undefined ? u.canReplace : u.role === 'teacher';
                    if (!eligible) continue;

                    const userBusy = busyByUser[u.id];
                    if (userBusy && userBusy.has(block.startTime)) continue;

                    // Check permanence: if we have data, verify the candidate is at school during this block
                    const perm = permanenceByUser[u.id];
                    if (perm) {
                        const blockMin = timeToMin(block.startTime);
                        if (blockMin < perm.entryMin || blockMin >= perm.exitMin) continue;
                    }

                    // Determine match level
                    const userSubjects = new Set(
                        (schedules[u.id] || []).map(b => b.subject).filter(Boolean)
                    );

                    let matchLevel = 'available'; // grey
                    let matchSubject = null;

                    if (block.subject && userSubjects.has(block.subject)) {
                        matchLevel = 'exact';
                        matchSubject = block.subject;
                    } else if (block.subject && RELATED_SUBJECTS[block.subject]) {
                        const related = RELATED_SUBJECTS[block.subject];
                        for (const rel of related) {
                            if (userSubjects.has(rel)) {
                                matchLevel = 'related';
                                matchSubject = rel;
                                break;
                            }
                        }
                    }

                    const ownBlocksToday = (schedules[u.id] || [])
                        .filter(b => b.day === dayName && b.startTime !== '08:00').length;
                    const subjectsList = [...new Set(
                        (schedules[u.id] || [])
                            .map(b => b.subject)
                            .filter(s => s && s !== 'Jefatura')
                    )];

                    candidates.push({
                        userId: u.id,
                        name: u.name,
                        firstName: u.name.split(' ')[0],
                        role: u.role,
                        matchLevel,
                        matchSubject,
                        ownBlocksToday,
                        subjectsList,
                    });
                }

                // Sort: exact > related > available
                const order = { exact: 0, related: 1, available: 2 };
                candidates.sort((a, b) => order[a.matchLevel] - order[b.matchLevel]);

                blockDetails.push({
                    startTime: timeLabel,
                    subject: block.subject,
                    course: block.course,
                    candidates,
                });
            }

            if (blockDetails.length > 0) {
                teacherSections.push({
                    ...absent,
                    blocks: blockDetails,
                });
            }
        }

        if (teacherSections.length === 0) return null;

        return { teacherSections, totalUncovered };
    }, [requests, leaves, schedules, users, logs, selectedDateStr, selectedDayName, teacherHours]);

    const teacherSections = replacementData?.teacherSections || [];
    const totalUncovered = replacementData?.totalUncovered || 0;

    const VISIBLE_COUNT = 5;

    const matchColors = {
        exact:     { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', avatar: 'bg-emerald-500', label: 'Ideal' },
        related:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   dot: 'bg-amber-400',   avatar: 'bg-amber-400',   label: 'Afín' },
        available: { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-600',   dot: 'bg-slate-400',   avatar: 'bg-slate-400',   label: 'Disponible' },
    };

    const absenceStyle = {
        'Día Administrativo': { border: 'border-l-amber-400',  avatar: 'from-amber-400 to-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
        'Licencia Médica':    { border: 'border-l-rose-400',   avatar: 'from-rose-400 to-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    };

    const totalAbsent = teacherSections.length;

    return (
        <BentoCard delay={0.08} className="md:col-span-2 lg:col-span-3 border-teal-100/50 bg-gradient-to-br from-white to-teal-50/20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600">
                        <Shuffle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-700">Posibles Reemplazos</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <button onClick={() => { setDayOffset(d => d - 1); setExpandedTeacher(null); }} className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold text-slate-600 min-w-[180px] text-center">{selectedDateLabel}</span>
                            <button onClick={() => { setDayOffset(d => d + 1); setExpandedTeacher(null); }} className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            {!isToday && (
                                <button onClick={() => { setDayOffset(0); setExpandedTeacher(null); }} className="ml-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 px-2 py-0.5 rounded-md hover:bg-indigo-50 transition-colors">
                                    Hoy
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                        {totalAbsent} {totalAbsent === 1 ? 'ausente' : 'ausentes'}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                        {totalUncovered} {totalUncovered === 1 ? 'bloque' : 'bloques'}
                    </span>
                </div>
            </div>

            {/* Teacher sections */}
            {teacherSections.length === 0 ? (
                <div className="text-center py-10">
                    <Shuffle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No hay ausencias registradas para este día.</p>
                </div>
            ) : (
            <div className="space-y-3">
                {teacherSections.map(teacher => {
                    const isExpanded = expandedTeacher === teacher.userId;
                    const initials = teacher.userName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
                    const totalCandidates = new Set(teacher.blocks.flatMap(b => b.candidates.map(c => c.userId))).size;
                    const aStyle = absenceStyle[teacher.typeLabel] || absenceStyle['Día Administrativo'];
                    const coveredBlocks = teacher.blocks.filter(b => getAssignedLog(teacher.userId, b.startTime)).length;

                    return (
                        <div key={teacher.userId} className={cn("border border-slate-200 border-l-4 rounded-xl overflow-hidden", aStyle.border)}>
                            {/* Teacher header */}
                            <button
                                onClick={() => setExpandedTeacher(isExpanded ? null : teacher.userId)}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-slate-50/80 transition-colors text-left"
                            >
                                {/* Avatar */}
                                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm", aStyle.avatar)}>
                                    {initials}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-bold text-slate-800 truncate">{teacher.userName}</span>
                                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", aStyle.badge)}>
                                            {teacher.typeLabel}
                                        </span>
                                    </div>
                                    {/* Block status pills */}
                                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                        {teacher.blocks.map((block, i) => {
                                            const assigned = getAssignedLog(teacher.userId, block.startTime);
                                            const schedBlock = SCHEDULE_BLOCKS.find(sb => sb.start === block.startTime);
                                            const label = schedBlock?.label?.replace(' Hora', '°') || block.startTime;
                                            return (
                                                <span key={i} title={`${label} · ${block.subject}${block.course ? ` · ${block.course}` : ''}`}
                                                    className={cn(
                                                        "text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
                                                        assigned
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                            : block.candidates.length > 0
                                                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                                : 'bg-red-50 text-red-500 border-red-200'
                                                    )}>
                                                    {assigned ? '✓ ' : ''}{label}
                                                </span>
                                            );
                                        })}
                                        <span className="text-[10px] text-slate-400 ml-1">
                                            {coveredBlocks}/{teacher.blocks.length} cubiertos · {totalCandidates} candidatos
                                        </span>
                                    </div>
                                </div>

                                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", isExpanded && "rotate-180")} />
                            </button>

                            {/* Expanded blocks */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="divide-y divide-slate-100 border-t border-slate-100">
                                            {teacher.blocks.map((block, idx) => {
                                                const assignedLog = getAssignedLog(teacher.userId, block.startTime);
                                                const blockKey = `${teacher.userId}-${block.startTime}`;
                                                const isAssigning = assigning === blockKey;
                                                const schedBlock = SCHEDULE_BLOCKS.find(sb => sb.start === block.startTime);
                                                const blockLabel = schedBlock?.label || block.startTime;
                                                const visibleCandidates = block.candidates.slice(0, VISIBLE_COUNT);
                                                const hiddenCount = block.candidates.length - VISIBLE_COUNT;

                                                return (
                                                    <div key={idx} className={cn("px-4 py-3", assignedLog ? 'bg-emerald-50/40' : 'bg-white')}>
                                                        {/* Block info row */}
                                                        <div className="flex items-center gap-2 mb-2.5">
                                                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                                                                {blockLabel}
                                                            </span>
                                                            <span className="text-sm font-semibold text-slate-700">{block.subject}</span>
                                                            {block.course && <span className="text-xs text-slate-400">· {block.course}</span>}
                                                        </div>

                                                        {/* Assigned state */}
                                                        {assignedLog ? (
                                                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-100/60 border border-emerald-200">
                                                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                                                <span className="text-sm font-bold text-emerald-700">{assignedLog.replacementName}</span>
                                                                <span className="text-xs text-emerald-500 ml-auto">Asignado</span>
                                                            </div>
                                                        ) : block.candidates.length > 0 ? (
                                                            /* Candidate avatars */
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {visibleCandidates.map(c => {
                                                                    const style = matchColors[c.matchLevel];
                                                                    const cInitials = c.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
                                                                    return (
                                                                        <button
                                                                            key={c.userId}
                                                                            disabled={isAssigning}
                                                                            onClick={() => handleAssign(teacher, block, c)}
                                                                            title={`${c.name}${c.matchSubject ? ` · ${c.matchSubject}` : ''} · ${style.label}`}
                                                                            className={cn(
                                                                                "flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border text-xs font-semibold transition-all",
                                                                                style.bg, style.border, style.text,
                                                                                isAssigning ? "opacity-50 cursor-wait" : "hover:shadow-md hover:scale-105 cursor-pointer active:scale-95"
                                                                            )}
                                                                        >
                                                                            <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0", style.avatar)}>
                                                                                {cInitials}
                                                                            </span>
                                                                            <span>{c.firstName}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                                {hiddenCount > 0 && (
                                                                    <button
                                                                        onClick={() => setDetailModal({ teacherName: teacher.userName, absentId: teacher.userId, absenceType: teacher.typeLabel, block })}
                                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-all"
                                                                    >
                                                                        +{hiddenCount} más
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-xs text-red-400">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-300 shrink-0" />
                                                                Sin candidatos disponibles
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
            )}

            {/* Detail Modal */}
            <AnimatePresence>
                {detailModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm"
                        onClick={() => setDetailModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        >
                            {/* Modal header */}
                            <div className="p-5 border-b border-slate-100 bg-slate-50/80">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Candidatos Disponibles</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Reemplazo para {detailModal.teacherName} · {detailModal.block.startTime} · {detailModal.block.subject}{detailModal.block.course ? ` · ${detailModal.block.course}` : ''}
                                        </p>
                                    </div>
                                    <button onClick={() => setDetailModal(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                        <ChevronDown className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Candidates list */}
                            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-1.5">
                                {(() => {
                                    const modalAssignedLog = getAssignedLog(detailModal.absentId, detailModal.block.startTime);
                                    if (modalAssignedLog) {
                                        return (
                                            <div className="flex items-center gap-2 px-3 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                                <span className="text-sm font-semibold text-emerald-700">Asignado: {modalAssignedLog.replacementName}</span>
                                            </div>
                                        );
                                    }
                                    const modalBlockKey = `${detailModal.absentId}-${detailModal.block.startTime}`;
                                    const isModalAssigning = assigning === modalBlockKey;
                                    return detailModal.block.candidates.map((c) => {
                                        const style = matchColors[c.matchLevel];
                                        const detail = [
                                            getRoleLabel(c.role),
                                            c.ownBlocksToday > 0 ? `${c.ownBlocksToday} ${c.ownBlocksToday === 1 ? 'bloque' : 'bloques'} hoy` : null,
                                            c.subjectsList.length > 0 ? c.subjectsList.join(', ') : null,
                                        ].filter(Boolean).join(' · ');
                                        return (
                                            <div
                                                key={c.userId}
                                                className={cn("flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border", style.bg, style.border)}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <span className={cn("w-2 h-2 rounded-full shrink-0", style.dot)} />
                                                    <div className="min-w-0">
                                                        <span className={cn("text-sm font-semibold block truncate leading-tight", style.text)}>{c.name}</span>
                                                        <span className="text-[11px] text-slate-400 truncate block leading-tight">{detail}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={isModalAssigning}
                                                    onClick={() => handleAssign(
                                                        { userId: detailModal.absentId, userName: detailModal.teacherName, typeLabel: detailModal.absenceType },
                                                        detailModal.block,
                                                        c
                                                    )}
                                                    className={cn(
                                                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0",
                                                        isModalAssigning
                                                            ? "bg-slate-100 text-slate-400 cursor-wait"
                                                            : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm"
                                                    )}
                                                >
                                                    <UserPlus className="w-3 h-3" />
                                                    Asignar
                                                </button>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </BentoCard>
    );
};

// New Admin Command Center (Refined per User Request)
const AdminDashboardView = () => {
    const { user, users } = useAuth();
    const { getLowStockItems } = useEquipment();
    const { tickets } = useTickets();
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState(null); // { user, variant }
    const [detailVariant, setDetailVariant] = useState('default');
    const [absenceSelectedDay, setAbsenceSelectedDay] = useState(null);

    // Data Integration
    const { getPendingRequests } = useAdministrativeDays();
    const pendingAdminDays = getPendingRequests().length;
    const pendingTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const staffCount = users.length;
    const lowStockCount = getLowStockItems(3).length;

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
            <WeeklyAbsencesWidget
                onSelectUser={(u) => { setSelectedUser(u); setDetailVariant('default'); }}
                onSelectMedicalUser={(u) => { setSelectedUser(u); setDetailVariant('medical'); }}
                onDayChange={setAbsenceSelectedDay}
            />

            {/* Replacement Suggestions (synced with selected day) */}
            <ReplacementsCard externalDate={absenceSelectedDay} />

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

            {/* 5. Días Administrativos (Shortcuts) */}
            <BentoCard
                delay={0.4}
                onClick={() => navigate('/admin/days-tracking')}
                className={cn("bg-white group relative", pendingAdminDays > 0 && "border-l-4 border-l-amber-400")}
            >
                {pendingAdminDays > 0 && (
                    <div className="absolute top-6 right-6 bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        {pendingAdminDays} POR APROBAR
                    </div>
                )}
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 w-fit mb-4">
                            <CalendarClock className="w-8 h-8" />
                        </div>

                        <h3 className="font-bold text-slate-700 text-xl mb-1">Días Administrativos</h3>
                    </div>

                    <div className="mt-2">
                        <p className="text-slate-500 text-sm mb-4">
                            {pendingAdminDays > 0
                                ? `${pendingAdminDays} solicitud${pendingAdminDays !== 1 ? 'es' : ''} pendiente${pendingAdminDays !== 1 ? 's' : ''} de aprobación.`
                                : 'Revisar solicitudes de permisos y balance de días del personal.'}
                        </p>
                        <div className={cn("flex items-center font-semibold text-sm group-hover:translate-x-1 transition-transform", pendingAdminDays > 0 ? "text-amber-600" : "text-emerald-600")}>
                            {pendingAdminDays > 0 ? 'Revisar ahora' : 'Gestionar Permisos'} <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </BentoCard>

            {/* 6. Licencias Médicas */}
            <BentoCard
                delay={0.5}
                onClick={() => navigate('/admin/medical-leaves')}
                className="bg-white group"
            >
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                            <HeartPulse className="w-8 h-8" />
                        </div>

                        <h3 className="font-bold text-slate-700 text-xl mb-1">Licencias Médicas</h3>
                    </div>

                    <div className="mt-2">
                        <p className="text-slate-500 text-sm mb-4">
                            Seguimiento de licencias médicas del personal.
                        </p>
                        <div className="flex items-center text-rose-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                            Ver Licencias <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </BentoCard>

            {/* 7. Atrasos */}
            <BentoCard
                delay={0.6}
                onClick={() => navigate('/admin/attendance')}
                className="bg-white group"
            >
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Clock className="w-8 h-8" />
                        </div>

                        <h3 className="font-bold text-slate-700 text-xl mb-1">Atrasos</h3>
                    </div>

                    <div className="mt-2">
                        <p className="text-slate-500 text-sm mb-4">
                            Monitor de asistencia y atrasos del personal.
                        </p>
                        <div className="flex items-center text-orange-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                            Ver Atrasos <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </BentoCard>

            {/* 8. Estadísticas */}
            <BentoCard
                delay={0.5}
                onClick={() => navigate('/admin/stats')}
                className="bg-white group"
            >
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                            <BarChart3 className="w-8 h-8" />
                        </div>

                        <h3 className="font-bold text-slate-700 text-xl mb-1">Estadísticas</h3>
                    </div>

                    <div className="mt-2">
                        <p className="text-slate-500 text-sm mb-4">
                            Datos y gráficos del sistema en tiempo real.
                        </p>
                        <div className="flex items-center text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                            Ver Estadísticas <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </BentoCard>

            {/* User Detail Panel (rendered outside grid to avoid overflow clipping) */}
            {selectedUser && (
                <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} variant={detailVariant} />
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
    const isProfesorJefe = !!(user?.isHeadTeacher && user?.headTeacherOf);

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
            ) : isProfesorJefe ? (
                <ProfesorJefeView user={user} />
            ) : (
                <TeacherView user={user} notifications={notifications} />
            )}
        </div>
    );
}
