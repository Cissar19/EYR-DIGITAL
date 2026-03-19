import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Users, CalendarCheck, Wrench, Table2,
    TrendingUp, TrendingDown, AlertCircle, Clock, Printer,
    Monitor, LifeBuoy, Package, Search, ChevronRight,
    Circle, Info, AlertTriangle, CheckCircle, HeartPulse, ChevronDown,
    Layers, FileCheck
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
import { useJustificatives } from '../context/JustificativesContext';
import { useStudents } from '../context/StudentsContext';
import { subscribeToCollection } from '../lib/firestoreService';
import { orderBy } from 'firebase/firestore';
import {
    DAY_NAMES, getAbsenceTypeLabel,
    computeAdminDaysImpact, computeMedicalLeavesImpact,
    computeAttendanceImpact, computeGlobalImpact,
} from '../lib/impactCalculations';
import {
    KpiCard, ChartCard, InsightCard, CustomTooltip,
    CHART_COLORS, PIE_COLORS_BALANCE, PIE_COLORS_STATUS,
} from '../components/StatsShared';
import ImpactoGlobalTab from '../components/ImpactoGlobalTab';

// ============================================
// CONSTANTS
// ============================================

const TABS = [
    { id: 'impacto', label: 'Impacto Global', icon: Layers },
    { id: 'dias', label: 'Dias Administrativos', icon: CalendarCheck },
    { id: 'licencias', label: 'Licencias Medicas', icon: HeartPulse },
    { id: 'justificativos', label: 'Justificativos', icon: FileCheck },
    { id: 'operaciones', label: 'Operaciones', icon: Wrench },
    { id: 'detalle', label: 'Detalle', icon: Table2 },
];

// ============================================
// TAB: DIAS ADMINISTRATIVOS
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
    const adminImpact = useMemo(() => computeAdminDaysImpact(requests, schedules), [requests, schedules]);

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

const LicenciasTab = ({ leaves, schedules }) => {
    const [expandedLeaveRow, setExpandedLeaveRow] = useState(null);
    const impact = useMemo(() => computeMedicalLeavesImpact(leaves, schedules), [leaves, schedules]);

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
// TAB: JUSTIFICATIVOS ALUMNOS
// ============================================

const JUST_TYPES = [
    { value: 'medico', label: 'Medico', color: '#ef4444' },
    { value: 'otro', label: 'Otro', color: '#64748b' },
];

const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const JustificativosTab = ({ justificatives, students }) => {
    const [expandedCurso, setExpandedCurso] = useState(null);

    // KPIs
    const kpis = useMemo(() => {
        const now = new Date();
        const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const thisMonth = justificatives.filter(j => j.date?.startsWith(monthPrefix));
        const medicos = justificatives.filter(j => j.type === 'medico').length;
        const uniqueStudents = new Set(justificatives.map(j => j.studentId)).size;
        return { total: justificatives.length, thisMonth: thisMonth.length, medicos, uniqueStudents };
    }, [justificatives]);

    // By type (pie)
    const byType = useMemo(() => {
        const counts = {};
        JUST_TYPES.forEach(t => { counts[t.value] = 0; });
        justificatives.forEach(j => { counts[j.type] = (counts[j.type] || 0) + 1; });
        return JUST_TYPES.map(t => ({ name: t.label, value: counts[t.value], color: t.color })).filter(d => d.value > 0);
    }, [justificatives]);

    // By month (bar chart - last 6 months)
    const byMonth = useMemo(() => {
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const count = justificatives.filter(j => j.date?.startsWith(prefix)).length;
            months.push({ name: MONTH_NAMES_SHORT[d.getMonth()], total: count });
        }
        return months;
    }, [justificatives]);

    // By curso (table)
    const byCurso = useMemo(() => {
        const map = {};
        justificatives.forEach(j => {
            const curso = j.studentCurso || 'Sin curso';
            if (!map[curso]) map[curso] = { curso, total: 0, medico: 0, otro: 0, students: new Set() };
            map[curso].total++;
            if (j.type === 'medico') map[curso].medico++;
            else map[curso].otro++;
            map[curso].students.add(j.studentId);
        });
        return Object.values(map)
            .map(c => ({ ...c, uniqueStudents: c.students.size }))
            .sort((a, b) => b.total - a.total);
    }, [justificatives]);

    // Top students (most justificatives)
    const topStudents = useMemo(() => {
        const map = {};
        justificatives.forEach(j => {
            if (!map[j.studentId]) map[j.studentId] = { id: j.studentId, name: j.studentName, curso: j.studentCurso, total: 0, medico: 0 };
            map[j.studentId].total++;
            if (j.type === 'medico') map[j.studentId].medico++;
        });
        return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
    }, [justificatives]);

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={FileCheck} label="Total" value={kpis.total} color="indigo" />
                <KpiCard icon={CalendarCheck} label="Este Mes" value={kpis.thisMonth} color="blue" />
                <KpiCard icon={HeartPulse} label="Medicos" value={kpis.medicos} color="red" />
                <KpiCard icon={Users} label="Alumnos" value={kpis.uniqueStudents} sublabel="con justificativos" color="emerald" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ChartCard title="Por Tipo">
                    {byType.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={byType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3} strokeWidth={0}>
                                    {byType.map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard title="Ultimos 6 Meses">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={byMonth} barSize={28}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="total" name="Justificativos" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* By Curso table */}
            <ChartCard title="Por Curso">
                {byCurso.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-2 px-2 text-xs font-bold text-slate-400 uppercase">Curso</th>
                                    <th className="text-center py-2 px-2 text-xs font-bold text-slate-400 uppercase">Total</th>
                                    <th className="text-center py-2 px-2 text-xs font-bold text-slate-400 uppercase">Medico</th>
                                    <th className="text-center py-2 px-2 text-xs font-bold text-slate-400 uppercase">Otro</th>
                                    <th className="text-center py-2 px-2 text-xs font-bold text-slate-400 uppercase">Alumnos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {byCurso.map(c => (
                                    <tr key={c.curso} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="py-2.5 px-2 font-semibold text-slate-700">{c.curso}</td>
                                        <td className="py-2.5 px-2 text-center">
                                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{c.total}</span>
                                        </td>
                                        <td className="py-2.5 px-2 text-center">
                                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{c.medico}</span>
                                        </td>
                                        <td className="py-2.5 px-2 text-center">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{c.otro}</span>
                                        </td>
                                        <td className="py-2.5 px-2 text-center text-slate-500">{c.uniqueStudents}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ChartCard>

            {/* Top students */}
            <ChartCard title="Alumnos con Mas Justificativos">
                {topStudents.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
                ) : (
                    <div className="space-y-2">
                        {topStudents.map((s, i) => (
                            <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-semibold text-slate-700 truncate block">{s.name}</span>
                                    {s.curso && <span className="text-[10px] text-slate-400">{s.curso}</span>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {s.medico > 0 && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{s.medico} med</span>}
                                    <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{s.total}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ChartCard>
        </div>
    );
};

// ============================================
// MAIN VIEW
// ============================================

export default function StatsView() {
    const [activeTab, setActiveTab] = useState('impacto');
    const { users } = useAuth();
    const { requests, getBalance, getHoursUsed, getDiscountDays } = useAdministrativeDays();
    const { tickets } = useTickets();
    const { reservations } = useLab();
    const { requests: printRequests } = usePrint();
    const { getLowStockItems } = useEquipment();
    const { leaves } = useMedicalLeaves();
    const { getAllSchedules } = useSchedule();
    const { justificatives } = useJustificatives();
    const { students } = useStudents();

    // Attendance data for Impacto Global tab
    const [attendanceReports, setAttendanceReports] = useState([]);
    const [teacherHours, setTeacherHours] = useState([]);

    useEffect(() => {
        const unsub = subscribeToCollection('attendance_reports', (docs) => {
            setAttendanceReports(docs);
        }, orderBy('createdAt', 'desc'));
        return () => unsub();
    }, []);

    useEffect(() => {
        const unsub = subscribeToCollection('teacher_hours', (docs) => {
            setTeacherHours(docs);
        });
        return () => unsub();
    }, []);

    const lowStockItems = useMemo(() => getLowStockItems(3), [getLowStockItems]);
    const allSchedules = useMemo(() => getAllSchedules(), [getAllSchedules]);

    // Compute impact data for Impacto Global
    const { globalData, adminImpactGlobal, medicalImpactGlobal, attendanceImpactGlobal } = useMemo(() => {
        const admin = computeAdminDaysImpact(requests, allSchedules);
        const medical = computeMedicalLeavesImpact(leaves, allSchedules);
        const attendance = computeAttendanceImpact(attendanceReports, users, allSchedules);
        const global = computeGlobalImpact(admin, medical, attendance, users);
        return { globalData: global, adminImpactGlobal: admin, medicalImpactGlobal: medical, attendanceImpactGlobal: attendance };
    }, [requests, leaves, attendanceReports, users, allSchedules]);

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
                    {activeTab === 'justificativos' && (
                        <JustificativosTab justificatives={justificatives} students={students} />
                    )}
                    {activeTab === 'impacto' && (
                        <ImpactoGlobalTab
                            adminImpact={adminImpactGlobal}
                            medicalImpact={medicalImpactGlobal}
                            attendanceImpact={attendanceImpactGlobal}
                            globalData={globalData}
                            schedules={allSchedules}
                            users={users}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
