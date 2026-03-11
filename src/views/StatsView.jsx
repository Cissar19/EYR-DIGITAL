import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Users, CalendarCheck, Wrench, Table2,
    TrendingUp, TrendingDown, AlertCircle, Clock, Printer,
    Monitor, LifeBuoy, Package, Search, ChevronRight,
    Circle, Info, AlertTriangle, CheckCircle, HeartPulse, ChevronDown
} from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useAdministrativeDays } from '../context/AdministrativeDaysContext';
import { useTickets, TICKET_CATEGORIES } from '../context/TicketContext';
import { useLab } from '../context/LabContext';
import { usePrint } from '../context/PrintContext';
import { useEquipment } from '../context/EquipmentContext';
import { useMedicalLeaves } from '../context/MedicalLeavesContext';
import { useSchedule } from '../context/ScheduleContext';

// ============================================
// SHARED UI COMPONENTS
// ============================================

const TABS = [
    { id: 'resumen', label: 'Resumen', icon: BarChart3 },
    { id: 'dias', label: 'Dias Administrativos', icon: CalendarCheck },
    { id: 'operaciones', label: 'Operaciones', icon: Wrench },
    { id: 'detalle', label: 'Detalle', icon: Table2 },
    { id: 'licencias', label: 'Licencias Medicas', icon: HeartPulse },
];

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#64748b'];
const PIE_COLORS_BALANCE = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
const PIE_COLORS_STATUS = ['#3b82f6', '#f59e0b', '#10b981'];

const KpiCard = ({ icon: Icon, label, value, sublabel, color = 'indigo' }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/60"
    >
        <div className="flex items-center gap-3 mb-3">
            <div className={cn("p-2.5 rounded-xl", `bg-${color}-50 text-${color}-600`)}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
            {sublabel && <span className="text-sm text-slate-400 font-medium">{sublabel}</span>}
        </div>
    </motion.div>
);

const ChartCard = ({ title, children, className }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200/60", className)}
    >
        <h4 className="text-sm font-bold text-slate-700 mb-4">{title}</h4>
        {children}
    </motion.div>
);

const InsightCard = ({ icon: Icon, color, title, value }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
            "flex items-start gap-3 p-4 rounded-xl border",
            `bg-${color}-50 border-${color}-100`
        )}
    >
        <div className={cn("p-2 rounded-lg shrink-0", `bg-${color}-100 text-${color}-600`)}>
            <Icon className="w-4 h-4" />
        </div>
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
            <p className={cn("text-sm font-semibold mt-0.5", `text-${color}-700`)}>{value}</p>
        </div>
    </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200 text-xs">
            <p className="font-bold text-slate-700 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-medium">
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

// ============================================
// TAB 1: RESUMEN
// ============================================

const ResumenTab = ({ stats }) => {
    const kpis = [
        { icon: Users, label: 'Total Personal', value: stats.totalUsers, color: 'blue' },
        { icon: CalendarCheck, label: 'Promedio Dias Restantes', value: stats.avgBalance.toFixed(1), color: 'emerald' },
        { icon: LifeBuoy, label: 'Tickets Abiertos', value: stats.openTickets, color: 'amber' },
        { icon: Monitor, label: 'Reservas Lab (mes)', value: stats.labReservationsMonth, color: 'indigo' },
        { icon: Printer, label: 'Impresiones (mes)', value: stats.printRequestsMonth, color: 'purple' },
        { icon: Package, label: 'Items Stock Bajo', value: stats.lowStockCount, color: 'red' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi, i) => (
                <KpiCard key={i} {...kpi} />
            ))}
        </div>
    );
};

// ============================================
// TAB 2: DIAS ADMINISTRATIVOS
// ============================================

const DiasAdminTab = ({ users, requests, getBalance, getHoursUsed, getDiscountDays, schedules }) => {
    const [expandedAdminRow, setExpandedAdminRow] = useState(null);

    // Balance distribution
    const balanceDistribution = useMemo(() => {
        const categories = { optimo: 0, saludable: 0, preocupante: 0, critico: 0 };
        const teacherStaff = users.filter(u => ['teacher', 'staff'].includes(u.role));
        teacherStaff.forEach(u => {
            const b = getBalance(u.id);
            if (b >= 5) categories.optimo++;
            else if (b >= 3) categories.saludable++;
            else if (b >= 1) categories.preocupante++;
            else categories.critico++;
        });
        return [
            { name: 'Optimo (5-6)', value: categories.optimo },
            { name: 'Saludable (3-4)', value: categories.saludable },
            { name: 'Preocupante (1-2)', value: categories.preocupante },
            { name: 'Critico (0)', value: categories.critico },
        ].filter(d => d.value > 0);
    }, [users, getBalance]);

    // Type distribution
    const typeDistribution = useMemo(() => {
        const types = { day: 0, halfDay: 0, hour: 0, return: 0, discount: 0, exception: 0 };
        requests.forEach(r => {
            if (r.status !== 'approved') return;
            if (r.type === 'hour_permission') types.hour++;
            else if (r.type === 'hour_return') types.return++;
            else if (r.type === 'discount') types.discount++;
            else if (r.type === 'exception') types.exception++;
            else if (r.isHalfDay) types.halfDay++;
            else types.day++;
        });
        return [
            { name: 'Dias Admin', value: types.day },
            { name: '½ Dias Admin', value: types.halfDay },
            { name: 'Horas', value: types.hour },
            { name: 'Devoluciones', value: types.return },
            { name: 'Descuentos', value: types.discount },
            { name: 'Excepciones', value: types.exception },
        ].filter(d => d.value > 0);
    }, [requests]);

    // Hours balance
    const hoursBalance = useMemo(() => {
        let totalUsed = 0;
        let totalReturned = 0;
        requests.forEach(r => {
            if (r.status !== 'approved') return;
            if (r.type === 'hour_permission' && r.minutesUsed) totalUsed += r.minutesUsed;
            if (r.type === 'hour_return' && r.minutesReturned) totalReturned += r.minutesReturned;
        });
        return [
            { name: 'Horas Usadas', value: Math.round(totalUsed / 60 * 10) / 10 },
            { name: 'Horas Devueltas', value: Math.round(totalReturned / 60 * 10) / 10 },
        ];
    }, [requests]);

    // Insights
    const insights = useMemo(() => {
        const teacherStaff = users.filter(u => ['teacher', 'staff'].includes(u.role));
        const totalBalance = teacherStaff.reduce((sum, u) => sum + getBalance(u.id), 0);
        const maxBalance = teacherStaff.length * 6;
        const utilization = maxBalance > 0 ? ((maxBalance - totalBalance) / maxBalance * 100).toFixed(1) : 0;
        const noBalance = teacherStaff.filter(u => getBalance(u.id) <= 0).length;
        const netHours = hoursBalance[0].value - hoursBalance[1].value;

        return [
            { icon: TrendingUp, color: 'indigo', title: 'Utilizacion', value: `${utilization}% de dias utilizados` },
            { icon: AlertCircle, color: noBalance > 0 ? 'red' : 'emerald', title: 'Sin Saldo', value: noBalance > 0 ? `${noBalance} persona(s) sin dias` : 'Todos tienen saldo' },
            { icon: Clock, color: netHours > 0 ? 'amber' : 'emerald', title: 'Balance Horas', value: `${netHours > 0 ? '+' : ''}${netHours.toFixed(1)}h netas pendientes` },
        ];
    }, [users, getBalance, hoursBalance]);

    // Impact on student classes
    const adminImpact = useMemo(() => {
        let totalClasses = 0;
        const byCourse = {};
        const bySubject = {};
        const byRequest = [];
        const coursesSet = new Set();

        const absenceRequests = requests.filter(r =>
            r.status === 'approved' && r.type !== 'hour_return'
        );

        for (const req of absenceRequests) {
            if (!req.date || !req.userId) continue;

            const userBlocks = schedules[req.userId];
            if (!userBlocks || userBlocks.length === 0) {
                byRequest.push({ ...req, classesLost: 0, coursesAffected: [], blocksDetail: [], absenceType: getAbsenceTypeLabel(req) });
                continue;
            }

            const date = new Date(req.date + 'T00:00:00');
            const dow = date.getDay();
            if (dow === 0 || dow === 6) {
                byRequest.push({ ...req, classesLost: 0, coursesAffected: [], blocksDetail: [], absenceType: getAbsenceTypeLabel(req) });
                continue;
            }

            const dayName = DAY_NAMES[dow];
            const dayBlocks = userBlocks.filter(b => b.day === dayName && b.startTime !== '08:00');

            let affectedBlocks;
            if (req.type === 'hour_permission') {
                const match = req.reason?.match(/^\[Horas\] (\d{2}:\d{2}) - (\d{2}:\d{2})/);
                if (match) {
                    affectedBlocks = dayBlocks.filter(b => b.startTime >= match[1] && b.startTime < match[2]);
                } else {
                    const estBlocks = Math.ceil((req.minutesUsed || 0) / 45);
                    affectedBlocks = dayBlocks.slice(0, estBlocks);
                }
            } else {
                affectedBlocks = dayBlocks;
            }

            const reqCourses = new Set();
            affectedBlocks.forEach(b => {
                if (b.course) { byCourse[b.course] = (byCourse[b.course] || 0) + 1; reqCourses.add(b.course); coursesSet.add(b.course); }
                if (b.subject) { bySubject[b.subject] = (bySubject[b.subject] || 0) + 1; }
            });

            totalClasses += affectedBlocks.length;
            byRequest.push({
                ...req, classesLost: affectedBlocks.length, coursesAffected: [...reqCourses], absenceType: getAbsenceTypeLabel(req),
                blocksDetail: affectedBlocks.map(b => ({ startTime: b.startTime, subject: b.subject || '', course: b.course || '' })),
            });
        }

        const courseData = Object.entries(byCourse).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        const subjectData = Object.entries(bySubject).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
        byRequest.sort((a, b) => b.classesLost - a.classesLost);

        return { totalAbsences: absenceRequests.length, totalClasses, coursesAffected: coursesSet.size, courseData, subjectData, byRequest };
    }, [requests, schedules]);

    const impTopCourse = adminImpact.courseData[0];
    const impTopSubject = adminImpact.subjectData[0];
    const impTopTeacher = adminImpact.byRequest.find(r => r.classesLost > 0);

    return (
        <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ChartCard title="Distribucion de Saldos">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={balanceDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3} strokeWidth={0}>
                                {balanceDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS_BALANCE[i]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Tipos de Registro">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3} strokeWidth={0}>
                                {typeDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Hours Bar */}
            <ChartCard title="Balance de Horas">
                <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={hoursBalance} layout="vertical" barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                            <Cell fill="#6366f1" />
                            <Cell fill="#10b981" />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {insights.map((insight, i) => <InsightCard key={i} {...insight} />)}
            </div>

            {/* ── Impacto en Estudiantes ── */}
            <div className="pt-4 border-t border-slate-200">
                <h3 className="text-base font-extrabold text-slate-700 mb-4">Impacto en Estudiantes</h3>

                {/* Impact KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <KpiCard icon={CalendarCheck} label="Ausencias Aprobadas" value={adminImpact.totalAbsences} color="indigo" />
                    <KpiCard icon={AlertTriangle} label="Clases Perdidas" value={adminImpact.totalClasses} color="amber" />
                    <KpiCard icon={Clock} label="Horas Pedagogicas" value={adminImpact.totalClasses} sublabel="(45 min c/u)" color="purple" />
                    <KpiCard icon={Users} label="Cursos Afectados" value={adminImpact.coursesAffected} color="blue" />
                </div>

                {/* Impact Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <ChartCard title="Clases Perdidas por Curso">
                        {adminImpact.courseData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={adminImpact.courseData} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" name="Clases" fill="#6366f1" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-10">Sin datos de impacto por curso</p>
                        )}
                    </ChartCard>

                    <ChartCard title="Clases Perdidas por Asignatura">
                        {adminImpact.subjectData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={adminImpact.subjectData} barSize={28}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" name="Clases" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-10">Sin datos de impacto por asignatura</p>
                        )}
                    </ChartCard>
                </div>

                {/* Impact Detail Table */}
                <ChartCard title="Detalle por Ausencia" className="mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="w-8"></th>
                                    <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Docente</th>
                                    <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Fecha</th>
                                    <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Tipo</th>
                                    <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Clases Perdidas</th>
                                    <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Cursos Afectados</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adminImpact.byRequest.map((row, i) => {
                                    const rowKey = row.id || `admin-${i}`;
                                    const isExpanded = expandedAdminRow === rowKey;
                                    return (
                                        <React.Fragment key={rowKey}>
                                            <tr
                                                onClick={() => row.blocksDetail.length > 0 && setExpandedAdminRow(isExpanded ? null : rowKey)}
                                                className={cn(
                                                    "border-b border-slate-50 transition-colors",
                                                    row.blocksDetail.length > 0 ? 'cursor-pointer hover:bg-slate-50/50' : '',
                                                    i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                                )}
                                            >
                                                <td className="py-3 pl-3 pr-0">
                                                    {row.blocksDetail.length > 0 && (
                                                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-700">{row.userName}</td>
                                                <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{row.date}</td>
                                                <td className="py-3 px-4">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                                                        row.absenceType === 'Dia Admin' ? 'bg-indigo-50 text-indigo-700' :
                                                            row.absenceType === '½ Dia Admin' ? 'bg-blue-50 text-blue-700' :
                                                                row.absenceType === 'Horas' ? 'bg-cyan-50 text-cyan-700' :
                                                                    row.absenceType === 'Descuento' ? 'bg-red-50 text-red-700' :
                                                                        'bg-amber-50 text-amber-700'
                                                    )}>
                                                        {row.absenceType}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                                                        row.classesLost > 5 ? 'bg-red-50 text-red-700' :
                                                            row.classesLost > 2 ? 'bg-amber-50 text-amber-700' :
                                                                row.classesLost > 0 ? 'bg-blue-50 text-blue-700' :
                                                                    'bg-slate-50 text-slate-500'
                                                    )}>
                                                        {row.classesLost}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-xs">{row.coursesAffected.join(', ') || '-'}</td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                            {row.blocksDetail.map((block, j) => (
                                                                <div key={j} className="flex items-center gap-2 text-xs bg-white px-3 py-2 rounded-lg border border-slate-100">
                                                                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                                                    <span className="font-mono text-slate-500">{block.startTime}</span>
                                                                    <span className="font-semibold text-slate-700">{block.subject}</span>
                                                                    <span className="text-slate-300">·</span>
                                                                    <span className="text-slate-500">{block.course}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                {adminImpact.byRequest.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-slate-400">
                                            No hay ausencias aprobadas registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>

                {/* Impact Insights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InsightCard
                        icon={Info}
                        color={impTopCourse ? 'red' : 'emerald'}
                        title="Curso Mas Afectado"
                        value={impTopCourse ? `${impTopCourse.name}: ${impTopCourse.value} clases perdidas` : 'Sin impacto registrado'}
                    />
                    <InsightCard
                        icon={AlertCircle}
                        color={impTopSubject ? 'amber' : 'emerald'}
                        title="Asignatura Mas Afectada"
                        value={impTopSubject ? `${impTopSubject.name}: ${impTopSubject.value} clases perdidas` : 'Sin impacto registrado'}
                    />
                    <InsightCard
                        icon={Users}
                        color={impTopTeacher ? 'purple' : 'emerald'}
                        title="Docente con Mas Impacto"
                        value={impTopTeacher ? `${impTopTeacher.userName}: ${impTopTeacher.classesLost} clases` : 'Sin impacto registrado'}
                    />
                </div>
            </div>
        </div>
    );
};

// ============================================
// TAB 3: OPERACIONES
// ============================================

const OperacionesTab = ({ tickets, labReservations, printRequests, lowStockItems }) => {
    // Tickets by category
    const ticketsByCategory = useMemo(() => {
        const counts = {};
        TICKET_CATEGORIES.forEach(c => { counts[c.id] = 0; });
        tickets.forEach(t => { if (counts[t.category] !== undefined) counts[t.category]++; });
        return TICKET_CATEGORIES.map(c => ({
            name: c.label.split('/')[0].trim(),
            value: counts[c.id],
        }));
    }, [tickets]);

    // Tickets by status
    const ticketsByStatus = useMemo(() => {
        const counts = { open: 0, in_progress: 0, closed: 0 };
        tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });
        return [
            { name: 'Abierto', value: counts.open },
            { name: 'En Proceso', value: counts.in_progress },
            { name: 'Resuelto', value: counts.closed },
        ].filter(d => d.value > 0);
    }, [tickets]);

    // Lab reservations by day of week
    const labByDay = useMemo(() => {
        const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
        const counts = [0, 0, 0, 0, 0];
        labReservations.forEach(r => {
            const d = new Date(r.date);
            const dow = d.getDay(); // 0=Sun
            if (dow >= 1 && dow <= 5) counts[dow - 1]++;
        });
        return days.map((name, i) => ({ name, value: counts[i] }));
    }, [labReservations]);

    // Print requests by status
    const printsByStatus = useMemo(() => {
        const counts = { pending: 0, reviewing: 0, ready: 0, completed: 0, rejected: 0 };
        printRequests.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });
        return [
            { name: 'Pendiente', value: counts.pending },
            { name: 'Revisando', value: counts.reviewing },
            { name: 'Listo', value: counts.ready },
            { name: 'Completado', value: counts.completed },
            { name: 'Rechazado', value: counts.rejected },
        ].filter(d => d.value > 0);
    }, [printRequests]);

    // Insights
    const highPriorityOpen = tickets.filter(t => t.priority === 'high' && t.status !== 'closed').length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tickets by Category */}
                <ChartCard title="Tickets por Categoria">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={ticketsByCategory} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Tickets" fill="#6366f1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Tickets by Status */}
                <ChartCard title="Tickets por Estado">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={ticketsByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3} strokeWidth={0}>
                                {ticketsByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS_STATUS[i % PIE_COLORS_STATUS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Lab by Day */}
                <ChartCard title="Reservas Lab por Dia">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={labByDay} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Reservas" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Prints by Status */}
                <ChartCard title="Impresiones por Estado">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={printsByStatus} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="value" name="Solicitudes" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InsightCard
                    icon={AlertTriangle}
                    color={highPriorityOpen > 0 ? 'red' : 'emerald'}
                    title="Tickets Alta Prioridad"
                    value={highPriorityOpen > 0 ? `${highPriorityOpen} ticket(s) urgente(s) abierto(s)` : 'Sin tickets urgentes'}
                />
                <InsightCard
                    icon={Package}
                    color={lowStockItems.length > 0 ? 'amber' : 'emerald'}
                    title="Stock Bajo"
                    value={lowStockItems.length > 0 ? `${lowStockItems.length} item(s) con stock critico` : 'Stock saludable'}
                />
            </div>
        </div>
    );
};

// ============================================
// TAB 4: DETALLE
// ============================================

const DetalleTab = ({ users, requests, getBalance, getHoursUsed, getDiscountDays }) => {
    const [search, setSearch] = useState('');

    const tableData = useMemo(() => {
        const teacherStaff = users.filter(u => ['teacher', 'staff'].includes(u.role));
        return teacherStaff.map(u => {
            const userReqs = requests.filter(r => r.userId === u.id && r.status === 'approved');
            const daysUsed = userReqs.filter(r => !r.type || r.type === 'day')
                .reduce((sum, r) => sum + (r.isHalfDay ? 0.5 : 1), 0);
            const hours = userReqs.filter(r => r.type === 'hour_permission').length;
            const returns = userReqs.filter(r => r.type === 'hour_return').length;
            const discounts = userReqs.filter(r => r.type === 'discount').length;

            return {
                id: u.id,
                name: u.name,
                role: u.role === 'teacher' ? 'Docente' : 'Asistente',
                balance: getBalance(u.id),
                daysUsed,
                hours,
                returns,
                discounts,
                total: userReqs.length,
            };
        }).sort((a, b) => a.balance - b.balance);
    }, [users, requests, getBalance]);

    const filtered = search
        ? tableData.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
        : tableData;

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Nombre</th>
                                <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Rol</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Restantes</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Usados</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Horas</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Devol.</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Desc.</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((row, i) => (
                                <tr key={row.id} className={cn("border-b border-slate-50 hover:bg-slate-50/50 transition-colors", i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30')}>
                                    <td className="py-3 px-4 font-semibold text-slate-700">{row.name}</td>
                                    <td className="py-3 px-4 text-slate-500">{row.role}</td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                                            row.balance >= 5 ? 'bg-emerald-50 text-emerald-700' :
                                                row.balance >= 3 ? 'bg-blue-50 text-blue-700' :
                                                    row.balance >= 1 ? 'bg-amber-50 text-amber-700' :
                                                        'bg-red-50 text-red-700'
                                        )}>
                                            {row.balance}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-center text-slate-600">{row.daysUsed}</td>
                                    <td className="py-3 px-4 text-center text-slate-600">{row.hours}</td>
                                    <td className="py-3 px-4 text-center text-slate-600">{row.returns}</td>
                                    <td className="py-3 px-4 text-center text-slate-600">{row.discounts}</td>
                                    <td className="py-3 px-4 text-center font-bold text-slate-700">{row.total}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-10 text-center text-slate-400">
                                        No se encontraron resultados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ============================================
// TAB 5: LICENCIAS MEDICAS
// ============================================

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getAbsenceTypeLabel(req) {
    if (req.type === 'hour_permission') return 'Horas';
    if (req.type === 'discount') return 'Descuento';
    if (req.reason?.startsWith('[Excepcion]')) return 'Excepcion';
    if (req.isHalfDay) return req.isHalfDay === 'am' ? '½ AM' : req.isHalfDay === 'pm' ? '½ PM' : '½ Dia Admin';
    return 'Dia Admin';
}

function computeImpact(leaves, schedules) {
    let totalClasses = 0;
    const byCourse = {};
    const bySubject = {};
    const byLeave = [];
    const coursesSet = new Set();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let activeCount = 0;

    for (const leave of leaves) {
        if (!leave.startDate || !leave.endDate) continue;

        const end = new Date(leave.endDate + 'T00:00:00');
        if (end >= today) activeCount++;

        const userBlocks = schedules[leave.userId];
        if (!userBlocks || userBlocks.length === 0) {
            byLeave.push({
                ...leave,
                classesLost: 0,
                coursesAffected: [],
                blocksDetail: [],
            });
            continue;
        }

        let leaveClasses = 0;
        const leaveCourses = new Set();
        const blocksDetail = [];

        const start = new Date(leave.startDate + 'T00:00:00');
        const endDate = new Date(leave.endDate + 'T00:00:00');

        for (let d = new Date(start); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dow = d.getDay();
            if (dow === 0 || dow === 6) continue; // skip weekends

            const dayName = DAY_NAMES[dow];
            const dateStr = d.toISOString().split('T')[0];
            const dayBlocks = userBlocks.filter(b =>
                b.day === dayName && b.startTime !== '08:00'
            );

            leaveClasses += dayBlocks.length;
            dayBlocks.forEach(b => {
                blocksDetail.push({ date: dateStr, dayName, startTime: b.startTime, subject: b.subject || '', course: b.course || '' });
                if (b.course) {
                    byCourse[b.course] = (byCourse[b.course] || 0) + 1;
                    leaveCourses.add(b.course);
                    coursesSet.add(b.course);
                }
                if (b.subject) {
                    bySubject[b.subject] = (bySubject[b.subject] || 0) + 1;
                }
            });
        }

        totalClasses += leaveClasses;
        byLeave.push({
            ...leave,
            classesLost: leaveClasses,
            coursesAffected: [...leaveCourses],
            blocksDetail,
        });
    }

    const courseData = Object.entries(byCourse)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const subjectData = Object.entries(bySubject)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    byLeave.sort((a, b) => b.classesLost - a.classesLost);

    return {
        activeCount,
        totalClasses,
        totalHours: totalClasses,
        coursesAffected: coursesSet.size,
        courseData,
        subjectData,
        byLeave,
    };
}

const LicenciasTab = ({ leaves, schedules }) => {
    const [expandedLeaveRow, setExpandedLeaveRow] = useState(null);
    const impact = useMemo(() => computeImpact(leaves, schedules), [leaves, schedules]);

    const kpis = [
        { icon: HeartPulse, label: 'Licencias Activas', value: impact.activeCount, color: 'red' },
        { icon: AlertTriangle, label: 'Clases Perdidas', value: impact.totalClasses, color: 'amber' },
        { icon: Clock, label: 'Horas Pedagogicas', value: impact.totalHours, sublabel: '(45 min c/u)', color: 'purple' },
        { icon: Users, label: 'Cursos Afectados', value: impact.coursesAffected, color: 'blue' },
    ];

    const topCourse = impact.courseData[0];
    const topSubject = impact.subjectData[0];
    const topTeacher = impact.byLeave.find(l => l.classesLost > 0);

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ChartCard title="Clases Perdidas por Curso">
                    {impact.courseData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={impact.courseData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Clases" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-10">Sin datos de impacto por curso</p>
                    )}
                </ChartCard>

                <ChartCard title="Clases Perdidas por Asignatura">
                    {impact.subjectData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={impact.subjectData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" name="Clases" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-10">Sin datos de impacto por asignatura</p>
                    )}
                </ChartCard>
            </div>

            {/* Detail Table */}
            <ChartCard title="Detalle por Licencia">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="w-8"></th>
                                <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Docente</th>
                                <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Periodo</th>
                                <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Diagnostico</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Dias</th>
                                <th className="text-center py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Clases Perdidas</th>
                                <th className="text-left py-3 px-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Cursos Afectados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {impact.byLeave.map((row, i) => {
                                const rowKey = row.id || `leave-${i}`;
                                const isExpanded = expandedLeaveRow === rowKey;
                                return (
                                    <React.Fragment key={rowKey}>
                                        <tr
                                            onClick={() => row.blocksDetail.length > 0 && setExpandedLeaveRow(isExpanded ? null : rowKey)}
                                            className={cn(
                                                "border-b border-slate-50 transition-colors",
                                                row.blocksDetail.length > 0 ? 'cursor-pointer hover:bg-slate-50/50' : '',
                                                i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                                            )}
                                        >
                                            <td className="py-3 pl-3 pr-0">
                                                {row.blocksDetail.length > 0 && (
                                                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isExpanded && "rotate-180")} />
                                                )}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-slate-700">{row.userName}</td>
                                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{row.startDate} → {row.endDate}</td>
                                            <td className="py-3 px-4 text-slate-500">{row.diagnosis}</td>
                                            <td className="py-3 px-4 text-center text-slate-600">{row.days}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                                                    row.classesLost > 20 ? 'bg-red-50 text-red-700' :
                                                        row.classesLost > 10 ? 'bg-amber-50 text-amber-700' :
                                                            row.classesLost > 0 ? 'bg-blue-50 text-blue-700' :
                                                                'bg-slate-50 text-slate-500'
                                                )}>
                                                    {row.classesLost}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-500 text-xs">{row.coursesAffected.join(', ') || '-'}</td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                        {row.blocksDetail.map((block, j) => (
                                                            <div key={j} className="flex items-center gap-2 text-xs bg-white px-3 py-2 rounded-lg border border-slate-100">
                                                                <CalendarCheck className="w-3 h-3 text-slate-400 shrink-0" />
                                                                <span className="text-slate-400">{block.dayName} {block.date}</span>
                                                                <span className="font-mono text-slate-500">{block.startTime}</span>
                                                                <span className="font-semibold text-slate-700">{block.subject}</span>
                                                                <span className="text-slate-300">·</span>
                                                                <span className="text-slate-500">{block.course}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {impact.byLeave.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-slate-400">
                                        No hay licencias medicas registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </ChartCard>

            {/* Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InsightCard
                    icon={Info}
                    color={topCourse ? 'red' : 'emerald'}
                    title="Curso Mas Afectado"
                    value={topCourse ? `${topCourse.name}: ${topCourse.value} clases perdidas` : 'Sin impacto registrado'}
                />
                <InsightCard
                    icon={AlertCircle}
                    color={topSubject ? 'amber' : 'emerald'}
                    title="Asignatura Mas Afectada"
                    value={topSubject ? `${topSubject.name}: ${topSubject.value} clases perdidas` : 'Sin impacto registrado'}
                />
                <InsightCard
                    icon={Users}
                    color={topTeacher ? 'purple' : 'emerald'}
                    title="Docente con Mas Clases Perdidas"
                    value={topTeacher ? `${topTeacher.userName}: ${topTeacher.classesLost} clases` : 'Sin impacto registrado'}
                />
            </div>
        </div>
    );
};

// ============================================
// MAIN VIEW
// ============================================

export default function StatsView() {
    const [activeTab, setActiveTab] = useState('resumen');
    const { users } = useAuth();
    const { requests, getBalance, getHoursUsed, getDiscountDays } = useAdministrativeDays();
    const { tickets } = useTickets();
    const { reservations } = useLab();
    const { requests: printRequests } = usePrint();
    const { getLowStockItems } = useEquipment();
    const { leaves } = useMedicalLeaves();
    const { getAllSchedules } = useSchedule();

    // Compute global stats for Resumen
    const stats = useMemo(() => {
        const teacherStaff = users.filter(u => ['teacher', 'staff'].includes(u.role));
        const totalBalance = teacherStaff.reduce((sum, u) => sum + getBalance(u.id), 0);
        const avgBalance = teacherStaff.length > 0 ? totalBalance / teacherStaff.length : 0;

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const labReservationsMonth = reservations.filter(r => r.date >= monthStart && r.date <= monthEnd).length;
        const printRequestsMonth = printRequests.filter(r => {
            const d = r.createdAt?.split?.('T')?.[0] || '';
            return d >= monthStart && d <= monthEnd;
        }).length;

        return {
            totalUsers: users.length,
            avgBalance,
            openTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
            labReservationsMonth,
            printRequestsMonth,
            lowStockCount: getLowStockItems(3).length,
        };
    }, [users, getBalance, tickets, reservations, printRequests, getLowStockItems]);

    const lowStockItems = useMemo(() => getLowStockItems(3), [getLowStockItems]);
    const allSchedules = useMemo(() => getAllSchedules(), [getAllSchedules]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                        <BarChart3 className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Estadisticas</h1>
                        <p className="text-slate-400 text-sm">Datos en tiempo real del sistema</p>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all",
                                isActive
                                    ? "bg-white text-indigo-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'resumen' && <ResumenTab stats={stats} />}
                    {activeTab === 'dias' && (
                        <DiasAdminTab
                            users={users}
                            requests={requests}
                            getBalance={getBalance}
                            getHoursUsed={getHoursUsed}
                            getDiscountDays={getDiscountDays}
                            schedules={allSchedules}
                        />
                    )}
                    {activeTab === 'operaciones' && (
                        <OperacionesTab
                            tickets={tickets}
                            labReservations={reservations}
                            printRequests={printRequests}
                            lowStockItems={lowStockItems}
                        />
                    )}
                    {activeTab === 'detalle' && (
                        <DetalleTab
                            users={users}
                            requests={requests}
                            getBalance={getBalance}
                            getHoursUsed={getHoursUsed}
                            getDiscountDays={getDiscountDays}
                        />
                    )}
                    {activeTab === 'licencias' && (
                        <LicenciasTab
                            leaves={leaves}
                            schedules={allSchedules}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
