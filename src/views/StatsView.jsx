import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart, Pie, Cell,
    BarChart, Bar,
    LineChart, Line,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ScatterChart, Scatter,
    XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import {
    BarChart3, Users, Calendar, Clock, BookOpen, Search,
    TrendingUp, AlertCircle, GraduationCap, Check, Lightbulb, Target, HeartPulse
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES, getRoleLabel } from '../context/AuthContext';
import { useAdministrativeDays } from '../context/AdministrativeDaysContext';
import { useMedicalLeaves } from '../context/MedicalLeavesContext';
import { SUBJECTS, THRESHOLDS } from '../data/mockAnalyticsData';
import { useSimce } from '../context/SimceContext';
import { useAttendance } from '../context/AttendanceContext';
import { useCurriculum } from '../context/CurriculumContext';

// ============================================
// CONSTANTS
// ============================================

const PIE_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6'];
const SIMCE_COLORS = { lenguaje: '#6366f1', matematicas: '#f59e0b', ciencias: '#22c55e', historia: '#3b82f6' };
const BALANCE_DIST_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

// ============================================
// InsightCard component
// ============================================

const INSIGHT_STYLES = {
    positive: { bg: 'bg-green-50 border-green-200', icon: 'bg-gradient-to-br from-green-400 to-emerald-500', text: 'text-green-800', rec: 'bg-green-100 text-green-700' },
    warning: { bg: 'bg-amber-50 border-amber-200', icon: 'bg-gradient-to-br from-amber-400 to-orange-500', text: 'text-amber-800', rec: 'bg-amber-100 text-amber-700' },
    critical: { bg: 'bg-red-50 border-red-200', icon: 'bg-gradient-to-br from-red-400 to-rose-500', text: 'text-red-800', rec: 'bg-red-100 text-red-700' },
};

const INSIGHT_ICONS = {
    positive: Check,
    warning: AlertCircle,
    critical: AlertCircle,
    trend: TrendingUp,
    target: Target,
    idea: Lightbulb,
};

function InsightCard({ type = 'positive', icon, title, description, recommendation }) {
    const s = INSIGHT_STYLES[type] || INSIGHT_STYLES.positive;
    const IconComp = INSIGHT_ICONS[icon] || INSIGHT_ICONS[type];
    return (
        <div className={cn('rounded-xl border p-4 flex flex-col gap-2', s.bg)}>
            <div className="flex items-center gap-2">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0', s.icon)}>
                    <IconComp className="w-4 h-4" />
                </div>
                <span className={cn('text-sm font-bold', s.text)}>{title}</span>
            </div>
            <p className={cn('text-xs leading-relaxed', s.text)}>{description}</p>
            {recommendation && (
                <div className={cn('text-xs rounded-lg px-3 py-2 mt-1', s.rec)}>
                    <span className="font-semibold">Recomendación:</span> {recommendation}
                </div>
            )}
        </div>
    );
}

// ============================================
// Section wrapper
// ============================================

function Section({ title, subtitle, icon: Icon, children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="mb-8"
        >
            <div className="flex items-center gap-3 mb-4">
                {Icon && (
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                )}
                <div>
                    <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                    {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                </div>
            </div>
            {children}
        </motion.div>
    );
}

// ============================================
// Helpers
// ============================================

const shortName = (name) => {
    const parts = (name || '').split(' ');
    if (parts.length >= 2) return `${parts[0]} ${parts[1].charAt(0)}.`;
    return parts[0] || '';
};

const normalizeText = (text) =>
    text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

// ============================================
// MAIN COMPONENT
// ============================================

export default function StatsView() {
    const { users: allUsers } = useAuth();
    const { getBalance, getHoursUsed, getDiscountDays, getUserRequests } = useAdministrativeDays();
    const { getAllLeaves } = useMedicalLeaves();
    const { results: simceResults } = useSimce();
    const { records: attendanceRecords, initWithUsers: initAttendance } = useAttendance();
    const { records: curriculumRecords, initWithUsers: initCurriculum } = useCurriculum();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('resumen');
    const [academicTab, setAcademicTab] = useState('simce');

    // ── Relevant users ──
    const relevantUsers = useMemo(() =>
        allUsers.filter(u =>
            u.role === ROLES.TEACHER || u.role === ROLES.ADMIN ||
            u.role === ROLES.STAFF || u.role === ROLES.DIRECTOR
        ), [allUsers]);

    // ── Per-user stats ──
    const userStats = useMemo(() =>
        relevantUsers.map(u => {
            const balance = getBalance(u.id);
            const hoursUsed = getHoursUsed(u.id);
            const discountDays = getDiscountDays(u.id);
            const requests = getUserRequests(u.id);
            const daysUsed = 6 - balance;
            const hourReturns = requests
                .filter(r => r.type === 'hour_return')
                .reduce((sum, r) => {
                    const match = r.reason?.match(/\((\d+)\s*min\)/);
                    return sum + (match ? parseInt(match[1], 10) : 0);
                }, 0);
            return { id: u.id, name: u.name, role: u.role, balance, daysUsed, hoursUsed, discountDays, totalRecords: requests.length, hourReturns };
        }), [relevantUsers, getBalance, getHoursUsed, getDiscountDays, getUserRequests]);

    // ── Init seed data if needed ──
    React.useEffect(() => {
        if (allUsers.length > 0) {
            initAttendance(allUsers);
            initCurriculum(allUsers);
        }
    }, [allUsers, initAttendance, initCurriculum]);

    // ── Attendance from context ──
    const attendanceData = useMemo(() =>
        attendanceRecords.map(r => ({ userId: r.userId, name: r.userName, attendance: r.attendance })),
        [attendanceRecords]);

    // ── Curriculum data from context (reshape to match old format) ──
    const curriculumData = useMemo(() => {
        const byUser = {};
        curriculumRecords.forEach(r => {
            if (!byUser[r.userId]) byUser[r.userId] = { userId: r.userId, name: r.userName, subjects: [] };
            const subj = SUBJECTS.find(s => s.id === r.subjectId);
            byUser[r.userId].subjects.push({
                subjectId: r.subjectId,
                subjectName: r.subjectName,
                color: subj?.color || '#6366f1',
                coverage: r.coverage,
                unitsPlanned: 10,
                unitsCompleted: Math.round(10 * r.coverage / 100),
                hoursPlanned: 120,
                hoursExecuted: Math.round(120 * r.coverage / 100),
            });
        });
        return { subjects: SUBJECTS, teacherCoverage: Object.values(byUser) };
    }, [curriculumRecords]);

    const avgCurriculumCoverage = useMemo(() => {
        const all = curriculumData.teacherCoverage.flatMap(t => t.subjects.map(s => s.coverage));
        return all.length > 0 ? Math.round(all.reduce((s, v) => s + v, 0) / all.length * 10) / 10 : 0;
    }, [curriculumData]);

    const currSubjectBarData = useMemo(() => {
        const bySubject = {};
        curriculumData.teacherCoverage.forEach(t => {
            t.subjects.forEach(s => {
                if (!bySubject[s.subjectId]) bySubject[s.subjectId] = { name: s.subjectName, color: s.color, planned: 0, completed: 0 };
                bySubject[s.subjectId].planned += s.unitsPlanned;
                bySubject[s.subjectId].completed += s.unitsCompleted;
            });
        });
        return Object.values(bySubject);
    }, [curriculumData]);

    const currTeacherBarData = useMemo(() =>
        curriculumData.teacherCoverage.map(t => {
            const row = { name: shortName(t.name) };
            t.subjects.forEach(s => { row[s.subjectName] = s.coverage; });
            return row;
        }), [curriculumData]);

    const currTeacherSubjectKeys = useMemo(() => {
        const keys = new Set();
        curriculumData.teacherCoverage.forEach(t => t.subjects.forEach(s => keys.add(s.subjectName)));
        return [...keys];
    }, [curriculumData]);

    const currScatterData = useMemo(() =>
        curriculumData.teacherCoverage.map(t => {
            const att = attendanceData.find(a => a.userId === t.userId);
            const avgCov = t.subjects.reduce((s, sub) => s + sub.coverage, 0) / t.subjects.length;
            return { name: t.name, attendance: att ? att.attendance : 0, coverage: Math.round(avgCov * 10) / 10 };
        }), [curriculumData, attendanceData]);

    // ── SIMCE: separate latest-year results from historical ──
    const latestSimceYear = useMemo(() => {
        const years = [...new Set(simceResults.filter(r => r.grade !== 'Promedio').map(r => r.year))];
        return years.length > 0 ? Math.max(...years) : new Date().getFullYear();
    }, [simceResults]);

    const latestSimceResults = useMemo(() =>
        simceResults.filter(r => r.year === latestSimceYear && r.grade !== 'Promedio'),
        [simceResults, latestSimceYear]);

    // ── Historical trends computed from all results grouped by year ──
    const historicalTrends = useMemo(() => {
        const byYear = {};
        simceResults.forEach(r => {
            if (!byYear[r.year]) byYear[r.year] = {};
            const key = r.subject.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '');
            if (!byYear[r.year][key]) byYear[r.year][key] = { total: 0, count: 0 };
            byYear[r.year][key].total += r.score;
            byYear[r.year][key].count++;
        });
        return Object.entries(byYear)
            .map(([year, subjects]) => {
                const row = { year: Number(year) };
                Object.entries(subjects).forEach(([key, data]) => {
                    row[key] = Math.round(data.total / data.count);
                });
                return row;
            })
            .sort((a, b) => a.year - b.year);
    }, [simceResults]);

    // ── SIMCE chart data ──
    const simceBarData = useMemo(() =>
        latestSimceResults.map(r => ({
            name: `${r.grade} - ${r.subject}`,
            Escuela: r.score,
            Nacional: r.nationalAvg,
        })), [latestSimceResults]);

    const simceRadarData = useMemo(() => {
        const bySubject = {};
        latestSimceResults.forEach(r => {
            if (!bySubject[r.subject]) bySubject[r.subject] = { subject: r.subject, escuela: 0, nacional: 0, count: 0 };
            bySubject[r.subject].escuela += r.score;
            bySubject[r.subject].nacional += r.nationalAvg;
            bySubject[r.subject].count++;
        });
        return Object.values(bySubject).map(s => ({
            subject: s.subject,
            Escuela: Math.round(s.escuela / s.count),
            Nacional: Math.round(s.nacional / s.count),
        }));
    }, [latestSimceResults]);

    // ── Global KPIs ──
    const globalStats = useMemo(() => {
        const n = userStats.length;
        const avgBalance = n > 0 ? userStats.reduce((s, u) => s + u.balance, 0) / n : 0;
        const totalHoursUsed = userStats.reduce((s, u) => s + u.hoursUsed, 0);
        const totalDiscounts = userStats.reduce((s, u) => s + u.discountDays, 0);
        const simceAvg = latestSimceResults.length > 0 ? latestSimceResults.reduce((s, r) => s + r.score, 0) / latestSimceResults.length : 0;
        const attAvg = attendanceData.length > 0 ? attendanceData.reduce((s, a) => s + a.attendance, 0) / attendanceData.length : 0;
        return { totalUsers: n, avgBalance, totalHoursUsed, totalDiscounts, simceAvg: Math.round(simceAvg * 10) / 10, attAvg: Math.round(attAvg * 10) / 10 };
    }, [userStats, attendanceData, latestSimceResults]);

    // ── Type distribution (PieChart) ──
    const typeDistribution = useMemo(() => {
        let adminDays = 0, hours = 0, returns = 0, discounts = 0, exceptions = 0;
        relevantUsers.forEach(u => {
            getUserRequests(u.id).forEach(r => {
                if (r.reason?.startsWith('[Excepción]')) exceptions++;
                else if (r.type === 'hour_permission') hours++;
                else if (r.type === 'hour_return') returns++;
                else if (r.type === 'discount') discounts++;
                else adminDays++;
            });
        });
        return [
            { name: 'Días Admin', value: adminDays },
            { name: 'Horas', value: hours },
            { name: 'Devoluciones', value: returns },
            { name: 'Descuentos', value: discounts },
            { name: 'Excepciones', value: exceptions },
        ].filter(d => d.value > 0);
    }, [relevantUsers, getUserRequests]);

    // ── Attendance distribution ──
    const attendanceDistribution = useMemo(() => {
        let excelente = 0, bueno = 0, aceptable = 0, critico = 0;
        attendanceData.forEach(a => {
            if (a.attendance >= THRESHOLDS.attendance.excelente) excelente++;
            else if (a.attendance >= THRESHOLDS.attendance.bueno) bueno++;
            else if (a.attendance >= THRESHOLDS.attendance.aceptable) aceptable++;
            else critico++;
        });
        return [
            { name: 'Excelente (≥95%)', value: excelente, fill: '#22c55e' },
            { name: 'Bueno (90-95%)', value: bueno, fill: '#3b82f6' },
            { name: 'Aceptable (85-90%)', value: aceptable, fill: '#f59e0b' },
            { name: 'Crítico (<85%)', value: critico, fill: '#ef4444' },
        ];
    }, [attendanceData]);

    // ── Scatter: Asistencia vs Días usados ──
    const scatterData = useMemo(() =>
        attendanceData.map(a => {
            const stat = userStats.find(u => u.id === a.userId);
            return { name: a.name, attendance: a.attendance, daysUsed: stat ? Math.max(0, stat.daysUsed) : 0 };
        }), [attendanceData, userStats]);

    // ── Efficiency: balance distribution ──
    const balanceDistribution = useMemo(() => {
        let optimo = 0, saludable = 0, preocupante = 0, critico = 0;
        userStats.forEach(u => {
            if (u.balance >= THRESHOLDS.adminDays.optimo) optimo++;
            else if (u.balance >= THRESHOLDS.adminDays.saludable) saludable++;
            else if (u.balance >= THRESHOLDS.adminDays.preocupante) preocupante++;
            else critico++;
        });
        return [
            { name: 'Óptimo (5-6)', value: optimo },
            { name: 'Saludable (3-4)', value: saludable },
            { name: 'Preocupante (1-2)', value: preocupante },
            { name: 'Crítico (0)', value: critico },
        ];
    }, [userStats]);

    // ── Efficiency: hours bar (accumulated vs returned) ──
    const hoursBalanceData = useMemo(() => {
        const totalAccumulated = userStats.reduce((s, u) => s + Math.max(0, u.hoursUsed), 0);
        const totalReturned = userStats.reduce((s, u) => s + u.hourReturns, 0) / 60; // minutes → hours
        return [
            { name: 'Horas Acumuladas', value: Math.round(totalAccumulated * 10) / 10 },
            { name: 'Horas Devueltas', value: Math.round(totalReturned * 10) / 10 },
        ];
    }, [userStats]);

    // ── Medical Leaves stats ──
    const allLeaves = useMemo(() => getAllLeaves(), [getAllLeaves]);

    const medicalKpis = useMemo(() => {
        const total = allLeaves.length;
        const totalDays = allLeaves.reduce((s, l) => s + l.days, 0);
        const avgDays = total > 0 ? Math.round(totalDays / total * 10) / 10 : 0;
        const uniqueUsers = new Set(allLeaves.map(l => l.userId)).size;
        return { total, totalDays, avgDays, uniqueUsers };
    }, [allLeaves]);

    const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const leavesByMonth = useMemo(() => {
        const counts = Array(12).fill(0);
        const daysByMonth = Array(12).fill(0);
        allLeaves.forEach(l => {
            const m = parseInt(l.startDate.split('-')[1], 10) - 1;
            counts[m]++;
            daysByMonth[m] += l.days;
        });
        return MONTH_LABELS.map((name, i) => ({ name, licencias: counts[i], dias: daysByMonth[i] }));
    }, [allLeaves]);

    const leavesByUser = useMemo(() => {
        const map = {};
        allLeaves.forEach(l => {
            if (!map[l.userId]) map[l.userId] = { name: l.userName, count: 0, days: 0 };
            map[l.userId].count++;
            map[l.userId].days += l.days;
        });
        return Object.values(map)
            .sort((a, b) => b.days - a.days)
            .slice(0, 8)
            .map(u => ({ name: shortName(u.name), licencias: u.count, dias: u.days }));
    }, [allLeaves]);

    const leavesDurationDist = useMemo(() => {
        let corta = 0, media = 0, larga = 0;
        allLeaves.forEach(l => {
            if (l.days <= 3) corta++;
            else if (l.days <= 10) media++;
            else larga++;
        });
        return [
            { name: 'Corta (1-3 días)', value: corta },
            { name: 'Media (4-10 días)', value: media },
            { name: 'Larga (>10 días)', value: larga },
        ].filter(d => d.value > 0);
    }, [allLeaves]);

    const LEAVES_DURATION_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

    // ── Medical Leaves insights ──
    const medicalInsights = useMemo(() => {
        const insights = [];
        if (medicalKpis.total === 0) return insights;

        insights.push({
            type: medicalKpis.avgDays <= 5 ? 'positive' : medicalKpis.avgDays <= 10 ? 'warning' : 'critical',
            icon: 'target',
            title: `Promedio ${medicalKpis.avgDays} días por licencia`,
            description: `Se registran ${medicalKpis.total} licencia${medicalKpis.total > 1 ? 's' : ''} con un total de ${medicalKpis.totalDays} días hábiles.`,
        });

        if (medicalKpis.uniqueUsers > 0) {
            const ratio = medicalKpis.total / medicalKpis.uniqueUsers;
            if (ratio > 2) {
                insights.push({
                    type: 'warning',
                    icon: 'warning',
                    title: `Recurrencia: ${ratio.toFixed(1)} licencias por persona`,
                    description: `${medicalKpis.uniqueUsers} funcionario${medicalKpis.uniqueUsers > 1 ? 's' : ''} con ${medicalKpis.total} licencias totales. Posible patrón de ausentismo.`,
                    recommendation: 'Evaluar acompañamiento de salud laboral para funcionarios con licencias recurrentes.',
                });
            }
        }

        const longLeaves = allLeaves.filter(l => l.days > 10);
        if (longLeaves.length > 0) {
            insights.push({
                type: 'warning',
                icon: 'critical',
                title: `${longLeaves.length} licencia${longLeaves.length > 1 ? 's' : ''} prolongada${longLeaves.length > 1 ? 's' : ''} (>10 días)`,
                description: `Licencias largas pueden requerir suplencia y afectan la continuidad pedagógica.`,
                recommendation: 'Gestionar cobertura y plan de reincorporación anticipado.',
            });
        }

        return insights;
    }, [medicalKpis, allLeaves]);

    // ── INSIGHTS ──
    const simceInsights = useMemo(() => {
        const insights = [];
        latestSimceResults.forEach(r => {
            const diff = r.score - r.nationalAvg;
            if (diff >= 5) {
                insights.push({ type: 'positive', icon: 'positive', title: `${r.subject} ${r.grade}: +${diff} pts`, description: `Puntaje ${r.score} supera el promedio nacional (${r.nationalAvg}) por ${diff} puntos.`, recommendation: 'Mantener estrategias pedagógicas actuales y compartir buenas prácticas.' });
            } else if (diff <= -15) {
                insights.push({ type: 'critical', icon: 'critical', title: `${r.subject} ${r.grade}: ${diff} pts`, description: `Puntaje ${r.score} está ${Math.abs(diff)} puntos bajo el nacional (${r.nationalAvg}). Brecha crítica.`, recommendation: 'Intervención urgente: reforzamiento focalizado y apoyo pedagógico externo.' });
            } else if (diff < -5) {
                insights.push({ type: 'warning', icon: 'warning', title: `${r.subject} ${r.grade}: ${diff} pts`, description: `Puntaje ${r.score} está ${Math.abs(diff)} puntos bajo el nacional (${r.nationalAvg}).`, recommendation: 'Implementar talleres de reforzamiento y monitorear avance trimestral.' });
            }
        });
        // trend
        const t = historicalTrends;
        if (t.length >= 2) {
            const first = t[0], last = t[t.length - 1];
            const lenjDelta = (last.lenguaje || 0) - (first.lenguaje || 0);
            const matDelta = (last.matematicas || 0) - (first.matematicas || 0);
            const span = last.year - first.year;
            if (lenjDelta > 0) insights.push({ type: 'positive', icon: 'trend', title: `Tendencia Lenguaje: +${lenjDelta} pts (${span} años)`, description: `Mejora sostenida de ${first.lenguaje || 0} a ${last.lenguaje || 0} entre ${first.year} y ${last.year}.` });
            if (matDelta > 0) insights.push({ type: matDelta < 10 ? 'warning' : 'positive', icon: 'trend', title: `Tendencia Matemáticas: +${matDelta} pts (${span} años)`, description: `Avance de ${first.matematicas || 0} a ${last.matematicas || 0}. ${matDelta < 10 ? 'El ritmo de mejora es lento.' : 'Buen progreso sostenido.'}`, recommendation: matDelta < 10 ? 'Considerar cambios metodológicos para acelerar la mejora.' : undefined });
        }
        return insights;
    }, [latestSimceResults, historicalTrends]);

    const attendanceInsights = useMemo(() => {
        const insights = [];
        const avg = globalStats.attAvg;
        const critCount = attendanceData.filter(a => a.attendance < THRESHOLDS.attendance.aceptable).length;
        if (avg >= 90) {
            insights.push({ type: 'positive', icon: 'positive', title: `Asistencia promedio: ${avg}%`, description: `El promedio de asistencia (${avg}%) supera el estándar mínimo de 90%.`, recommendation: 'Mantener incentivos y seguimiento actual.' });
        } else if (avg >= 85) {
            insights.push({ type: 'warning', icon: 'warning', title: `Asistencia promedio: ${avg}%`, description: `El promedio (${avg}%) está bajo el estándar de 90%.`, recommendation: 'Revisar casos individuales y aplicar plan de mejora de asistencia.' });
        } else {
            insights.push({ type: 'critical', icon: 'critical', title: `Asistencia promedio: ${avg}%`, description: `El promedio (${avg}%) está significativamente bajo el estándar de 90%.`, recommendation: 'Acción inmediata: convocar reunión de gestión y establecer metas por equipo.' });
        }
        if (critCount > 0) {
            insights.push({ type: critCount > 3 ? 'critical' : 'warning', icon: 'target', title: `${critCount} docente${critCount > 1 ? 's' : ''} en zona crítica`, description: `${critCount} persona${critCount > 1 ? 's' : ''} con asistencia bajo 85% requiere${critCount > 1 ? 'n' : ''} seguimiento individual.`, recommendation: 'Generar entrevistas individuales y plan de apoyo.' });
        }
        // correlation insight
        const highAtt = scatterData.filter(s => s.attendance >= 92);
        const lowAtt = scatterData.filter(s => s.attendance < 88);
        const avgDaysHigh = highAtt.length > 0 ? highAtt.reduce((s, d) => s + d.daysUsed, 0) / highAtt.length : 0;
        const avgDaysLow = lowAtt.length > 0 ? lowAtt.reduce((s, d) => s + d.daysUsed, 0) / lowAtt.length : 0;
        if (highAtt.length > 0 && lowAtt.length > 0 && avgDaysHigh < avgDaysLow) {
            insights.push({ type: 'positive', icon: 'idea', title: 'Correlación positiva detectada', description: `Docentes con alta asistencia (≥92%) usan en promedio ${avgDaysHigh.toFixed(1)} días admin vs ${avgDaysLow.toFixed(1)} días para baja asistencia (<88%).`, recommendation: 'Alta asistencia se asocia a menor uso de días administrativos.' });
        }
        return insights;
    }, [globalStats.attAvg, attendanceData, scatterData]);

    const efficiencyInsights = useMemo(() => {
        const insights = [];
        const totalDaysAvailable = userStats.length * 6;
        const totalDaysUsed = userStats.reduce((s, u) => s + Math.max(0, u.daysUsed), 0);
        const usageRatio = totalDaysAvailable > 0 ? (totalDaysUsed / totalDaysAvailable * 100) : 0;
        const zeroBalance = userStats.filter(u => u.balance <= 0).length;
        const netHours = hoursBalanceData[0].value - hoursBalanceData[1].value;

        insights.push({
            type: usageRatio < 40 ? 'positive' : usageRatio < 70 ? 'warning' : 'critical',
            icon: 'target',
            title: `${usageRatio.toFixed(0)}% de días utilizados`,
            description: `Se han usado ${totalDaysUsed} de ${totalDaysAvailable} días disponibles (${usageRatio.toFixed(1)}%).`,
            recommendation: usageRatio >= 70 ? 'Alta utilización. Evaluar si la carga administrativa es excesiva.' : undefined,
        });

        if (zeroBalance > 0) {
            insights.push({
                type: zeroBalance > 3 ? 'critical' : 'warning',
                icon: 'critical',
                title: `${zeroBalance} docente${zeroBalance > 1 ? 's' : ''} sin saldo`,
                description: `${zeroBalance} persona${zeroBalance > 1 ? 's' : ''} ha${zeroBalance > 1 ? 'n' : ''} agotado sus días administrativos.`,
                recommendation: 'Verificar si requieren días excepcionales o redistribución de carga.',
            });
        }

        insights.push({
            type: netHours > 0 ? 'warning' : 'positive',
            icon: 'idea',
            title: `Balance horas neto: ${netHours > 0 ? '+' : ''}${netHours.toFixed(1)} hrs`,
            description: `${hoursBalanceData[0].value} hrs acumuladas, ${hoursBalanceData[1].value} hrs devueltas.`,
            recommendation: netHours > 5 ? 'Considerar políticas de compensación horaria.' : undefined,
        });

        if (globalStats.totalDiscounts > 0) {
            insights.push({
                type: globalStats.totalDiscounts > 5 ? 'critical' : 'warning',
                icon: 'critical',
                title: `${globalStats.totalDiscounts} descuento${globalStats.totalDiscounts > 1 ? 's' : ''} aplicado${globalStats.totalDiscounts > 1 ? 's' : ''}`,
                description: `Se registran ${globalStats.totalDiscounts} descuentos en el período.`,
                recommendation: 'Analizar causas recurrentes de descuento para prevenir reincidencia.',
            });
        }
        return insights;
    }, [userStats, hoursBalanceData, globalStats.totalDiscounts]);

    const curriculumInsights = useMemo(() => {
        const insights = [];
        const meta = 80;

        // Global average vs meta
        if (avgCurriculumCoverage >= meta) {
            insights.push({ type: 'positive', icon: 'positive', title: `Cobertura curricular: ${avgCurriculumCoverage}%`, description: `El promedio global de cobertura (${avgCurriculumCoverage}%) supera la meta del ${meta}%.`, recommendation: 'Mantener ritmo de avance y monitorear asignaturas rezagadas.' });
        } else {
            insights.push({ type: avgCurriculumCoverage >= 65 ? 'warning' : 'critical', icon: 'target', title: `Cobertura curricular: ${avgCurriculumCoverage}%`, description: `El promedio global (${avgCurriculumCoverage}%) está bajo la meta del ${meta}%.`, recommendation: 'Priorizar nivelación en asignaturas con menor avance.' });
        }

        // Subjects below meta
        const subjectAvgs = {};
        curriculumData.teacherCoverage.forEach(t => t.subjects.forEach(s => {
            if (!subjectAvgs[s.subjectName]) subjectAvgs[s.subjectName] = { total: 0, count: 0 };
            subjectAvgs[s.subjectName].total += s.coverage;
            subjectAvgs[s.subjectName].count++;
        }));
        const belowMeta = Object.entries(subjectAvgs)
            .map(([name, d]) => ({ name, avg: Math.round(d.total / d.count * 10) / 10 }))
            .filter(s => s.avg < meta);
        if (belowMeta.length > 0) {
            insights.push({ type: 'warning', icon: 'warning', title: `${belowMeta.length} asignatura${belowMeta.length > 1 ? 's' : ''} bajo meta`, description: `${belowMeta.map(s => `${s.name} (${s.avg}%)`).join(', ')} están bajo la meta del ${meta}%.`, recommendation: 'Revisar planificaciones y redistribuir tiempos pedagógicos.' });
        }

        // Teachers below meta
        const teachersBelow = curriculumData.teacherCoverage.filter(t => {
            const avg = t.subjects.reduce((s, sub) => s + sub.coverage, 0) / t.subjects.length;
            return avg < meta;
        });
        if (teachersBelow.length > 0) {
            insights.push({ type: teachersBelow.length > 3 ? 'critical' : 'warning', icon: 'critical', title: `${teachersBelow.length} docente${teachersBelow.length > 1 ? 's' : ''} bajo meta de cobertura`, description: `${teachersBelow.map(t => shortName(t.name)).join(', ')} tiene${teachersBelow.length > 1 ? 'n' : ''} cobertura promedio inferior al ${meta}%.`, recommendation: 'Acompañamiento pedagógico y revisión de carga horaria.' });
        }

        // Correlation: attendance vs coverage
        const highCov = currScatterData.filter(d => d.coverage >= 85);
        const lowCov = currScatterData.filter(d => d.coverage < 75);
        if (highCov.length > 0 && lowCov.length > 0) {
            const avgAttHigh = highCov.reduce((s, d) => s + d.attendance, 0) / highCov.length;
            const avgAttLow = lowCov.reduce((s, d) => s + d.attendance, 0) / lowCov.length;
            if (avgAttHigh > avgAttLow) {
                insights.push({ type: 'positive', icon: 'idea', title: 'Correlación asistencia-cobertura', description: `Docentes con alta cobertura (≥85%) promedian ${avgAttHigh.toFixed(1)}% asistencia vs ${avgAttLow.toFixed(1)}% de quienes tienen menor cobertura (<75%).`, recommendation: 'Alta asistencia docente se asocia a mejor avance curricular.' });
            }
        }

        return insights;
    }, [avgCurriculumCoverage, curriculumData, currScatterData]);

    const allInsights = useMemo(() => [...simceInsights, ...attendanceInsights, ...curriculumInsights, ...efficiencyInsights, ...medicalInsights], [simceInsights, attendanceInsights, curriculumInsights, efficiencyInsights, medicalInsights]);

    // ── Filtered table ──
    const filteredStats = useMemo(() =>
        userStats
            .filter(u => normalizeText(u.name).includes(normalizeText(searchQuery)))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [userStats, searchQuery]);

    // ── Color helpers ──
    const getBalanceColor = (balance) => {
        if (balance >= 4) return 'text-green-600 bg-green-50';
        if (balance >= 2) return 'text-amber-600 bg-amber-50';
        return 'text-red-600 bg-red-50';
    };

    const avgBalanceGradient = globalStats.avgBalance >= 4
        ? 'from-emerald-500 to-green-600'
        : globalStats.avgBalance >= 2
            ? 'from-amber-500 to-orange-500'
            : 'from-red-500 to-rose-600';

    const simceAvgGradient = globalStats.simceAvg >= 260
        ? 'from-emerald-500 to-green-600'
        : globalStats.simceAvg >= 240
            ? 'from-amber-500 to-orange-500'
            : 'from-red-500 to-rose-600';

    const attAvgGradient = globalStats.attAvg >= 90
        ? 'from-emerald-500 to-green-600'
        : globalStats.attAvg >= 85
            ? 'from-amber-500 to-orange-500'
            : 'from-red-500 to-rose-600';

    const SECTION_TABS = [
        { key: 'resumen', label: 'Resumen', icon: BarChart3 },
        { key: 'academico', label: 'Académico', icon: GraduationCap },
        { key: 'asistencia', label: 'Asistencia', icon: Users },
        { key: 'eficiencia', label: 'Días Admin', icon: Target },
        { key: 'licencias', label: 'Licencias', icon: HeartPulse },
        { key: 'detalle', label: 'Detalle', icon: Search },
    ];

    // =========================================================================
    // RENDER
    // =========================================================================
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* ── A: Header ── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-300/40">
                            <BarChart3 className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-bold text-slate-900">Panel de Análisis</h1>
                            <p className="text-slate-500 text-sm md:text-base">Rendimiento, asistencia y eficiencia operacional</p>
                        </div>
                    </div>
                </motion.div>

                {/* ── Navigation Tabs ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-8">
                    <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 overflow-x-auto">
                        {SECTION_TABS.map(tab => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveSection(tab.key)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
                                        activeSection === tab.key
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    )}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">

                {/* ══════════════════════════════════════════ */}
                {/* TAB: RESUMEN                              */}
                {/* ══════════════════════════════════════════ */}
                {activeSection === 'resumen' && (
                    <motion.div key="resumen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {/* KPI Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                            <KpiCard icon={Users} label="Total Docentes/Func." value={globalStats.totalUsers} iconClass="bg-indigo-50 text-indigo-600" />
                            <KpiCard icon={Calendar} label="Prom. Días Restantes" value={globalStats.avgBalance.toFixed(1)} iconClass={cn('bg-gradient-to-br text-white', avgBalanceGradient)} />
                            <KpiCard icon={GraduationCap} label="Puntaje SIMCE Prom." value={globalStats.simceAvg} iconClass={cn('bg-gradient-to-br text-white', simceAvgGradient)} />
                            <KpiCard icon={TrendingUp} label="Asistencia Promedio" value={`${globalStats.attAvg}%`} iconClass={cn('bg-gradient-to-br text-white', attAvgGradient)} />
                            <KpiCard icon={BookOpen} label="Cobertura Curricular" value={`${avgCurriculumCoverage}%`} iconClass={cn('bg-gradient-to-br text-white', avgCurriculumCoverage >= 85 ? 'from-emerald-500 to-green-600' : avgCurriculumCoverage >= 70 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-600')} />
                            <KpiCard icon={Clock} label="Total Horas Acum." value={globalStats.totalHoursUsed.toFixed(1)} iconClass="bg-amber-50 text-amber-600" />
                            <KpiCard icon={HeartPulse} label="Licencias Médicas" value={medicalKpis.total} iconClass="bg-rose-50 text-rose-500" />
                            <KpiCard icon={Calendar} label="Días en Licencia" value={medicalKpis.totalDays} iconClass="bg-pink-50 text-pink-500" />
                        </div>

                        {/* Conclusiones */}
                        <Section title="Conclusiones y Alertas" subtitle="Hallazgos principales detectados automáticamente" icon={Lightbulb}>
                            {allInsights.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {allInsights.slice(0, 6).map((ins, i) => <InsightCard key={i} {...ins} />)}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-lg">
                                    <Check className="w-10 h-10 text-green-400 mx-auto mb-3" />
                                    <p className="text-slate-600 font-medium">No se detectaron alertas. Todos los indicadores están dentro de rangos normales.</p>
                                </div>
                            )}
                            {allInsights.length > 6 && (
                                <p className="text-xs text-slate-400 mt-3 text-center">
                                    Mostrando 6 de {allInsights.length} hallazgos. Consulta cada sección para ver el detalle completo.
                                </p>
                            )}
                        </Section>
                    </motion.div>
                )}

                {/* ══════════════════════════════════════════ */}
                {/* TAB: ACADÉMICO                            */}
                {/* ══════════════════════════════════════════ */}
                {activeSection === 'academico' && (
                    <motion.div key="academico" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Section title="Sección Académica" subtitle="SIMCE, cobertura curricular y análisis por asignatura" icon={GraduationCap}>
                    {/* Tab pills */}
                    <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
                        {[{ key: 'simce', label: 'SIMCE' }, { key: 'curriculum', label: 'Cobertura Curricular' }].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setAcademicTab(tab.key)}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                                    academicTab === tab.key
                                        ? 'bg-white shadow-sm text-indigo-600'
                                        : 'text-slate-500 hover:text-slate-700'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {academicTab === 'simce' ? (
                            <motion.div key="simce" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                                    {/* C1: Bar — Escuela vs Nacional */}
                                    <ChartCard title="Escuela vs Promedio Nacional">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={simceBarData} barSize={14}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={70} />
                                                <YAxis domain={[200, 300]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <Tooltip />
                                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                                <Bar dataKey="Escuela" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="Nacional" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>

                                    {/* C2: Line — Tendencia histórica */}
                                    <ChartCard title="Tendencia Histórica (5 años)">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <LineChart data={historicalTrends}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                                <YAxis domain={[220, 280]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <Tooltip />
                                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                                <Line type="monotone" dataKey="lenguaje" name="Lenguaje" stroke={SIMCE_COLORS.lenguaje} strokeWidth={2} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="matematicas" name="Matemáticas" stroke={SIMCE_COLORS.matematicas} strokeWidth={2} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="ciencias" name="Ciencias" stroke={SIMCE_COLORS.ciencias} strokeWidth={2} dot={{ r: 3 }} />
                                                <Line type="monotone" dataKey="historia" name="Historia" stroke={SIMCE_COLORS.historia} strokeWidth={2} dot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </ChartCard>

                                    {/* C3: Radar — Comparación multidimensional */}
                                    <ChartCard title="Comparación Multidimensional">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <RadarChart data={simceRadarData}>
                                                <PolarGrid stroke="#e2e8f0" />
                                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                                                <PolarRadiusAxis domain={[200, 300]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                <Radar name="Escuela" dataKey="Escuela" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                                                <Radar name="Nacional" dataKey="Nacional" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} />
                                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                                <Tooltip />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                </div>
                                {simceInsights.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {simceInsights.map((ins, i) => <InsightCard key={i} {...ins} />)}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="curriculum" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                                    {/* Curr1: Horizontal Bar — Unidades por asignatura */}
                                    <ChartCard title="Unidades Completadas vs Planificadas">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={currSubjectBarData} layout="vertical" barSize={14}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                                                <Tooltip />
                                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                                <Bar dataKey="completed" name="Completadas" fill="#22c55e" radius={[0, 4, 4, 0]} />
                                                <Bar dataKey="planned" name="Planificadas" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>

                                    {/* Curr2: Grouped Bar — Cobertura % por docente */}
                                    <ChartCard title="Cobertura % por Docente">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={currTeacherBarData} barSize={10}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
                                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                                                <Tooltip formatter={(v) => [`${v}%`, '']} />
                                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                                {currTeacherSubjectKeys.map(key => {
                                                    const subj = SUBJECTS.find(s => s.name === key);
                                                    return <Bar key={key} dataKey={key} fill={subj?.color || '#6366f1'} radius={[4, 4, 0, 0]} />;
                                                })}
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>

                                    {/* Curr3: Scatter — Asistencia vs Cobertura */}
                                    <ChartCard title="Correlación: Asistencia vs Cobertura">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <ScatterChart>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis type="number" dataKey="attendance" name="Asistencia %" domain={[78, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                                                <YAxis type="number" dataKey="coverage" name="Cobertura %" domain={[55, 105]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                                                    if (active && payload?.length) {
                                                        const d = payload[0].payload;
                                                        return (
                                                            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-3 text-xs">
                                                                <p className="font-bold text-slate-800 mb-1">{d.name}</p>
                                                                <p className="text-slate-600">Asistencia: {d.attendance}%</p>
                                                                <p className="text-slate-600">Cobertura: {d.coverage}%</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }} />
                                                <Scatter data={currScatterData} fill="#8b5cf6" fillOpacity={0.7} />
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                </div>
                                {curriculumInsights.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {curriculumInsights.map((ins, i) => <InsightCard key={i} {...ins} />)}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Section>
                    </motion.div>
                )}

                {/* ══════════════════════════════════════════ */}
                {/* TAB: ASISTENCIA                           */}
                {/* ══════════════════════════════════════════ */}
                {activeSection === 'asistencia' && (
                    <motion.div key="asistencia" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Section title="Asistencia y Rendimiento" subtitle="Distribución, correlación con días administrativos e insights" icon={Users}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                                <ChartCard title="Distribución por Rango de Asistencia">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={attendanceDistribution} barSize={40}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip formatter={(v) => [`${v} persona${v !== 1 ? 's' : ''}`, 'Cantidad']} />
                                            <Bar dataKey="value" name="Docentes" radius={[8, 8, 0, 0]}>
                                                {attendanceDistribution.map((entry, i) => (
                                                    <Cell key={i} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>

                                <ChartCard title="Correlación: Asistencia vs Días Admin Usados">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <ScatterChart>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis type="number" dataKey="attendance" name="Asistencia %" domain={[78, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
                                            <YAxis type="number" dataKey="daysUsed" name="Días usados" domain={[0, 6]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v, name) => [name === 'Asistencia %' ? `${v}%` : v, name]} />
                                            <Scatter data={scatterData} fill="#6366f1" fillOpacity={0.7} />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </div>
                            {attendanceInsights.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {attendanceInsights.map((ins, i) => <InsightCard key={i} {...ins} />)}
                                </div>
                            )}
                        </Section>
                    </motion.div>
                )}

                {/* ══════════════════════════════════════════ */}
                {/* TAB: EFICIENCIA / DÍAS ADMIN              */}
                {/* ══════════════════════════════════════════ */}
                {activeSection === 'eficiencia' && (
                    <motion.div key="eficiencia" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Section title="Eficiencia Operacional" subtitle="Saldos, distribución de registros y balance de horas" icon={Target}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                <ChartCard title="Distribución de Saldos">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={balanceDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                                                {balanceDistribution.map((_, i) => (
                                                    <Cell key={i} fill={BALANCE_DIST_COLORS[i]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v, name) => [`${v} persona${v !== 1 ? 's' : ''}`, name]} />
                                            <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartCard>

                                {typeDistribution.length > 0 && (
                                    <ChartCard title="Distribución por Tipo de Registro">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                                    {typeDistribution.map((_, i) => (
                                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => {
                                                    const total = typeDistribution.reduce((s, d) => s + d.value, 0);
                                                    return [`${value} (${((value / total) * 100).toFixed(1)}%)`, 'Registros'];
                                                }} />
                                                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                )}

                                <ChartCard title="Balance de Horas">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={hoursBalanceData} layout="vertical" barSize={28}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
                                            <Tooltip formatter={(v) => [`${v} hrs`, 'Horas']} />
                                            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                                <Cell fill="#f59e0b" />
                                                <Cell fill="#22c55e" />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>
                            </div>
                            {efficiencyInsights.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {efficiencyInsights.map((ins, i) => <InsightCard key={i} {...ins} />)}
                                </div>
                            )}
                        </Section>
                    </motion.div>
                )}

                {/* ══════════════════════════════════════════ */}
                {/* TAB: LICENCIAS MÉDICAS                    */}
                {/* ══════════════════════════════════════════ */}
                {activeSection === 'licencias' && (
                    <motion.div key="licencias" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <Section title="Licencias Médicas" subtitle="Registro, distribución y análisis de licencias del personal" icon={HeartPulse}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                <ChartCard title="Licencias por Mes">
                                    <ResponsiveContainer width="100%" height={260}>
                                        <BarChart data={leavesByMonth} barSize={20}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                            <Tooltip formatter={(v, name) => [v, name === 'licencias' ? 'Licencias' : 'Días']} />
                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                            <Bar dataKey="licencias" name="Licencias" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="dias" name="Días" fill="#fb923c" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </ChartCard>

                                {leavesDurationDist.length > 0 && (
                                    <ChartCard title="Distribución por Duración">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie data={leavesDurationDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                                    {leavesDurationDist.map((_, i) => (
                                                        <Cell key={i} fill={LEAVES_DURATION_COLORS[i]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(v, name) => [`${v} licencia${v !== 1 ? 's' : ''}`, name]} />
                                                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                )}

                                {leavesByUser.length > 0 && (
                                    <ChartCard title="Días de Licencia por Funcionario">
                                        <ResponsiveContainer width="100%" height={260}>
                                            <BarChart data={leavesByUser} layout="vertical" barSize={14}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
                                                <Tooltip formatter={(v, name) => [v, name === 'dias' ? 'Días' : 'Licencias']} />
                                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                                                <Bar dataKey="dias" name="Días" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                                                <Bar dataKey="licencias" name="Licencias" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                )}
                            </div>
                            {medicalInsights.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {medicalInsights.map((ins, i) => <InsightCard key={i} {...ins} />)}
                                </div>
                            )}
                        </Section>
                    </motion.div>
                )}

                {/* ══════════════════════════════════════════ */}
                {/* TAB: DETALLE                              */}
                {/* ══════════════════════════════════════════ */}
                {activeSection === 'detalle' && (
                    <motion.div key="detalle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-lg border border-slate-100">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Detalle por Usuario</h3>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar usuario..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-3 px-3 font-semibold text-slate-600">Nombre</th>
                                            <th className="text-left py-3 px-3 font-semibold text-slate-600">Rol</th>
                                            <th className="text-center py-3 px-3 font-semibold text-slate-600">Días Rest.</th>
                                            <th className="text-center py-3 px-3 font-semibold text-slate-600">Días Usados</th>
                                            <th className="text-center py-3 px-3 font-semibold text-slate-600">Horas</th>
                                            <th className="text-center py-3 px-3 font-semibold text-slate-600">Devol.</th>
                                            <th className="text-center py-3 px-3 font-semibold text-slate-600">Descuentos</th>
                                            <th className="text-center py-3 px-3 font-semibold text-slate-600">Total Reg.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStats.map((u, i) => (
                                            <tr key={u.id} className={cn('border-b border-slate-100 hover:bg-slate-50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                                                <td className="py-3 px-3 font-medium text-slate-900">{u.name}</td>
                                                <td className="py-3 px-3 text-slate-500">{getRoleLabel(u.role)}</td>
                                                <td className="py-3 px-3 text-center">
                                                    <span className={cn('inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold', getBalanceColor(u.balance))}>
                                                        {Math.max(0, u.balance)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-center font-medium text-slate-700">{Math.max(0, u.daysUsed)}</td>
                                                <td className="py-3 px-3 text-center font-medium text-slate-700">{u.hoursUsed > 0 ? u.hoursUsed.toFixed(1) : '\u2014'}</td>
                                                <td className="py-3 px-3 text-center font-medium text-slate-700">{u.hourReturns > 0 ? `${u.hourReturns} min` : '\u2014'}</td>
                                                <td className="py-3 px-3 text-center">
                                                    {u.discountDays > 0 ? (
                                                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 bg-red-50">
                                                            {u.discountDays}
                                                        </span>
                                                    ) : '\u2014'}
                                                </td>
                                                <td className="py-3 px-3 text-center font-medium text-slate-500">{u.totalRecords}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredStats.length === 0 && (
                                <div className="text-center py-12">
                                    <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">No se encontraron usuarios</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                </AnimatePresence>
            </div>
        </div>
    );
}

// ============================================
// Small reusable sub-components
// ============================================

function KpiCard({ icon: Icon, label, value, iconClass }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconClass)}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">{title}</h3>
            {children}
        </div>
    );
}
