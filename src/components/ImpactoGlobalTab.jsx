import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle, Users, BarChart3, Clock, TrendingUp, TrendingDown,
    Info, Calendar, Layers, Target, ArrowRight, X
} from 'lucide-react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
    Tooltip, ResponsiveContainer, Legend, CartesianGrid,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import { cn } from '../lib/utils';
import { KpiCard, ChartCard, InsightCard, CustomTooltip, GLOBAL_SOURCE_COLORS } from './StatsShared';
import {
    computeWeeklyTrend, computeCumulativeTrend,
    computeNormalizedCourseImpact, computeHeatmap
} from '../lib/impactCalculations';

// ============================================
// CUSTOM TOOLTIPS
// ============================================

const NormalizedTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200 text-xs">
            <p className="font-bold text-slate-700 mb-1">{label}</p>
            <p className="text-indigo-600 font-medium">{d?.rate}% de clases perdidas</p>
            <p className="text-slate-500">{d?.lostTotal} de {d?.scheduledTotal} programadas</p>
        </div>
    );
};

// ============================================
// HEATMAP COMPONENT
// ============================================

const HeatmapGrid = ({ heatmap, expanded = false }) => {
    const { grid, dayLabels, blockLabels, maxValue } = heatmap;

    return (
        <div className="overflow-x-auto">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: `80px repeat(${blockLabels.length}, 1fr)` }}>
                {/* Header row */}
                <div />
                {blockLabels.map((label, i) => (
                    <div key={i} className={cn(
                        "text-center font-bold text-slate-500 py-1",
                        expanded ? "text-sm min-w-[72px]" : "text-xs min-w-[48px]"
                    )}>
                        {label}
                    </div>
                ))}

                {/* Data rows */}
                {dayLabels.map((day, di) => (
                    <React.Fragment key={day}>
                        <div className={cn("font-semibold text-slate-600 flex items-center pr-2", expanded ? "text-sm" : "text-xs")}>
                            {day}
                        </div>
                        {blockLabels.map((_, bi) => {
                            const value = grid[di]?.[bi] || 0;
                            const intensity = maxValue > 0 ? value / maxValue : 0;
                            return (
                                <div
                                    key={bi}
                                    className={cn(
                                        "rounded-md flex items-center justify-center font-bold transition-colors",
                                        expanded ? "min-h-[56px] min-w-[72px] text-sm" : "min-h-[36px] min-w-[48px] text-xs",
                                        value === 0 && "bg-slate-50 text-slate-300"
                                    )}
                                    style={value > 0 ? {
                                        backgroundColor: `rgba(99, 102, 241, ${0.15 + intensity * 0.85})`,
                                        color: intensity > 0.5 ? 'white' : '#4338ca',
                                    } : undefined}
                                    title={`${day} ${blockLabels[bi]} Hora: ${value} clases`}
                                >
                                    {value > 0 ? value : ''}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

// ============================================
// CHART METADATA
// ============================================

const CHART_META = {
    tendencia: {
        title: 'Tendencia Semanal',
        description: 'Evolucion temporal de las clases perdidas, desglosadas por fuente de ausencia. Permite identificar patrones ciclicos y cambios en el ritmo de impacto a lo largo del periodo.',
        formula: 'f(s) = \u03A3 bloques_afectados en semana s, agrupados por semana ISO. Cada linea representa una fuente: dias administrativos, licencias medicas y atrasos/ausencias. El eje X muestra la fecha del lunes de cada semana.',
    },
    acumulado: {
        title: 'Impacto Acumulado',
        description: 'Integral acumulativa del impacto total. La pendiente de la curva indica la velocidad de acumulacion: una curva mas empinada significa mayor ritmo de perdida de clases.',
        formula: 'F(n) = \u03A3 f(s) para s = 1..n. Cada area apilada representa la contribucion acumulada de una fuente. La diferencia entre dos puntos consecutivos equivale al impacto semanal puntual.',
    },
    tasa: {
        title: 'Tasa de Perdida por Curso (%)',
        description: 'Porcentaje de clases perdidas respecto a las programadas por curso. Permite comparar el impacto real independientemente de la carga horaria de cada curso.',
        formula: 'R(c) = (clases_perdidas(c) / clases_programadas(c)) \u00D7 100. Las clases programadas se calculan como: bloques_semanales(c) \u00D7 semanas_en_rango. Ordenado de mayor a menor tasa.',
    },
    heatmap: {
        title: 'Mapa de Calor: Dia x Bloque Horario',
        description: 'Distribucion espacial del impacto en la grilla semanal. Identifica las franjas horarias donde se concentra la mayor perdida de clases para priorizar cobertura.',
        formula: 'H(d, b) = total clases perdidas en dia d, bloque horario b, sumando las 3 fuentes. La intensidad del color es proporcional a H(d,b) / max(H). Bloques: 1a Hora (08:10) a 8a Hora (14:40).',
    },
    donut: {
        title: 'Proporcion por Fuente',
        description: 'Contribucion relativa de cada tipo de ausencia al total de clases perdidas. Permite identificar la causa dominante para focalizar acciones preventivas.',
        formula: 'P(f) = clases_fuente(f) / total_clases \u00D7 100. Las tres fuentes son: dias administrativos (permisos internos), licencias medicas (certificados) y atrasos/ausencias (control de asistencia).',
    },
    docentes: {
        title: 'Ranking de Docentes por Impacto',
        description: 'Concentracion del impacto por docente individual. Identifica si el impacto esta distribuido o focalizado en pocos funcionarios.',
        formula: 'T(d) = admin(d) + licencias(d) + atrasos(d). Se suman las clases perdidas de cada fuente por docente. Ordenado por total descendente. En vista expandida se muestran hasta 20 docentes.',
    },
};

// Apple-style easing curve
const APPLE_EASE = [0.25, 0.1, 0.25, 1.0];
const APPLE_EASE_OUT = [0.22, 1, 0.36, 1];

// ============================================
// MAIN COMPONENT
// ============================================

const SCHOOL_WEEKS_PER_YEAR = 38;
const SCHOOL_START_DATE = '2026-03-02';

export default function ImpactoGlobalTab({ adminImpact, medicalImpact, attendanceImpact, globalData, schedules, users }) {
    // ── Filter impacts to school start date ──
    const filteredImpacts = useMemo(() => {
        const start = SCHOOL_START_DATE;

        // Filter admin requests
        const adminByRequest = (adminImpact.byRequest || []).filter(r => r.date >= start);
        const filteredAdmin = {
            ...adminImpact,
            byRequest: adminByRequest,
            totalClasses: adminByRequest.reduce((s, r) => s + (r.classesLost || 0), 0),
        };

        // Filter medical leaves (filter individual block dates)
        const filteredLeaves = (medicalImpact.byLeave || []).map(l => {
            const filteredBlocks = (l.blocksDetail || []).filter(b => b.date >= start);
            return { ...l, blocksDetail: filteredBlocks, classesLost: filteredBlocks.length };
        }).filter(l => l.classesLost > 0);
        const filteredMedical = {
            ...medicalImpact,
            byLeave: filteredLeaves,
            totalClasses: filteredLeaves.reduce((s, l) => s + l.classesLost, 0),
        };

        // Filter attendance daily events
        const filteredEvents = (attendanceImpact.byDailyEvent || []).filter(e => e.dateStr >= start);
        const filteredAttendance = {
            ...attendanceImpact,
            byDailyEvent: filteredEvents,
            totalClasses: filteredEvents.reduce((s, e) => s + (e.classesLost || 0), 0),
        };

        return { admin: filteredAdmin, medical: filteredMedical, attendance: filteredAttendance };
    }, [adminImpact, medicalImpact, attendanceImpact]);

    // Weekly trend (from filtered data)
    const weeklyData = useMemo(
        () => computeWeeklyTrend(filteredImpacts.admin, filteredImpacts.medical, filteredImpacts.attendance),
        [filteredImpacts]
    );

    // Cumulative trend
    const cumulativeData = useMemo(
        () => computeCumulativeTrend(weeklyData),
        [weeklyData]
    );

    // Normalized course impact
    const normalizedCourses = useMemo(
        () => computeNormalizedCourseImpact(globalData.courseStacked, schedules, Math.max(weeklyData.length, 1)),
        [globalData.courseStacked, schedules, weeklyData.length]
    );

    // Heatmap (from filtered data)
    const heatmap = useMemo(
        () => computeHeatmap(filteredImpacts.admin, filteredImpacts.medical, filteredImpacts.attendance),
        [filteredImpacts]
    );

    // Filtered global data (recalculate totals from filtered impacts)
    const filteredGlobal = useMemo(() => {
        const fa = filteredImpacts.admin;
        const fm = filteredImpacts.medical;
        const ft = filteredImpacts.attendance;
        const totalClasses = fa.totalClasses + fm.totalClasses + ft.totalClasses;

        // Source breakdown
        const sourceBreakdown = [
            { name: 'Dias Administrativos', value: fa.totalClasses },
            { name: 'Licencias Medicas', value: fm.totalClasses },
            { name: 'Atrasos/Ausencias', value: ft.totalClasses },
        ].filter(d => d.value > 0);

        // Merged teacher ranking
        const teacherMap = {};
        (fa.byRequest || []).forEach(r => {
            if (!r.userId || r.classesLost <= 0) return;
            if (!teacherMap[r.userId]) teacherMap[r.userId] = { admin: 0, medical: 0, attendance: 0 };
            teacherMap[r.userId].admin += r.classesLost;
        });
        (fm.byLeave || []).forEach(l => {
            if (!l.userId || l.classesLost <= 0) return;
            if (!teacherMap[l.userId]) teacherMap[l.userId] = { admin: 0, medical: 0, attendance: 0 };
            teacherMap[l.userId].medical += l.classesLost;
        });
        (ft.byTeacher || []).forEach(t => {
            if (!t.userId || t.classesLost <= 0) return;
            if (!teacherMap[t.userId]) teacherMap[t.userId] = { admin: 0, medical: 0, attendance: 0 };
            teacherMap[t.userId].attendance += t.classesLost;
        });
        const teacherRanking = Object.entries(teacherMap).map(([userId, c]) => {
            const u = users.find(u => u.id === userId);
            return { userId, userName: u?.name || userId, admin: c.admin, medical: c.medical, attendance: c.attendance, total: c.admin + c.medical + c.attendance };
        }).sort((a, b) => b.total - a.total);

        // Unique courses/subjects from filtered data
        const coursesSet = new Set();
        const subjectsSet = new Set();
        [fa.byRequest, fm.byLeave].forEach(arr => {
            (arr || []).forEach(item => {
                (item.blocksDetail || []).forEach(b => { if (b.course) coursesSet.add(b.course); if (b.subject) subjectsSet.add(b.subject); });
            });
        });
        (ft.byDailyEvent || []).forEach(evt => {
            (evt.blocks || []).forEach(b => { if (b.course) coursesSet.add(b.course); if (b.subject) subjectsSet.add(b.subject); });
        });

        return {
            ...globalData,
            totalClasses,
            coursesAffected: coursesSet.size || globalData.coursesAffected,
            subjectsAffected: subjectsSet.size || globalData.subjectsAffected,
            teachersWithImpact: Object.keys(teacherMap).length,
            sourceBreakdown,
            teacherRanking,
        };
    }, [filteredImpacts, globalData, users]);

    // Annual projection
    const weeksElapsed = Math.max(weeklyData.length, 1);
    const annualProjection = Math.round((filteredGlobal.totalClasses / weeksElapsed) * SCHOOL_WEEKS_PER_YEAR);

    // ── Expanded chart state ──
    const [expandedChart, setExpandedChart] = useState(null);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') setExpandedChart(null); };
        if (expandedChart) {
            document.addEventListener('keydown', handleEsc);
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [expandedChart]);

    // ── Chart content renderer (shared between inline and fullscreen) ──
    const renderChartContent = (chartId, expanded = false) => {
        const h = expanded ? Math.max(450, window.innerHeight - 340) : 280;

        switch (chartId) {
            case 'tendencia':
                return weeklyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={h}>
                        <LineChart data={weeklyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="weekLabel" tick={{ fontSize: expanded ? 13 : 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: expanded ? 13 : 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={expanded ? 10 : 8} wrapperStyle={{ fontSize: expanded ? '14px' : '12px' }} />
                            <Line type="monotone" dataKey="admin" name="Dias Admin" stroke="#6366f1" strokeWidth={expanded ? 3 : 2} dot={{ r: expanded ? 4 : 3 }} />
                            <Line type="monotone" dataKey="medical" name="Licencias" stroke="#f43f5e" strokeWidth={expanded ? 3 : 2} dot={{ r: expanded ? 4 : 3 }} />
                            <Line type="monotone" dataKey="attendance" name="Atrasos" stroke="#f59e0b" strokeWidth={expanded ? 3 : 2} dot={{ r: expanded ? 4 : 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : <p className="text-sm text-slate-400 text-center py-10">Sin datos de tendencia semanal</p>;

            case 'acumulado':
                return cumulativeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={h}>
                        <AreaChart data={cumulativeData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="weekLabel" tick={{ fontSize: expanded ? 13 : 11 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: expanded ? 13 : 11 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={expanded ? 10 : 8} wrapperStyle={{ fontSize: expanded ? '14px' : '12px' }} />
                            <Area type="monotone" dataKey="adminCum" name="Dias Admin" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                            <Area type="monotone" dataKey="medicalCum" name="Licencias" stackId="1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
                            <Area type="monotone" dataKey="attendanceCum" name="Atrasos" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : <p className="text-sm text-slate-400 text-center py-10">Sin datos acumulados</p>;

            case 'tasa':
                return normalizedCourses.length > 0 ? (
                    <ResponsiveContainer width="100%" height={expanded ? Math.max(520, normalizedCourses.slice(0, 15).length * 38 + 40) : Math.max(280, normalizedCourses.slice(0, 15).length * 28 + 40)}>
                        <BarChart data={normalizedCourses.slice(0, 15)} layout="vertical" barSize={expanded ? 24 : 18}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: expanded ? 13 : 11 }} unit="%" domain={[0, 'auto']} />
                            <YAxis type="category" dataKey="name" width={expanded ? 120 : 80} tick={{ fontSize: expanded ? 13 : 10 }} />
                            <Tooltip content={<NormalizedTooltip />} />
                            <Bar dataKey="rate" name="Tasa %" fill="#6366f1" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <p className="text-sm text-slate-400 text-center py-10">Sin datos normalizados por curso</p>;

            case 'heatmap':
                return heatmap.maxValue > 0 ? (
                    <HeatmapGrid heatmap={heatmap} expanded={expanded} />
                ) : <p className="text-sm text-slate-400 text-center py-10">Sin datos para el mapa de calor</p>;

            case 'donut':
                return filteredGlobal.sourceBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={h}>
                        <PieChart>
                            <Pie data={filteredGlobal.sourceBreakdown} cx="50%" cy="50%" innerRadius={expanded ? 100 : 60} outerRadius={expanded ? 170 : 95} dataKey="value" paddingAngle={3} strokeWidth={0}>
                                {filteredGlobal.sourceBreakdown.map((_, i) => <Cell key={i} fill={GLOBAL_SOURCE_COLORS[i]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={expanded ? 10 : 8} wrapperStyle={{ fontSize: expanded ? '14px' : '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : <p className="text-sm text-slate-400 text-center py-10">Sin datos de impacto</p>;

            case 'docentes':
                return filteredGlobal.teacherRanking.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className={cn("w-full", expanded ? "text-base" : "text-sm")}>
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className={cn("text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider", expanded ? "text-sm py-3 px-4" : "text-xs")}>#</th>
                                    <th className={cn("text-left py-2 px-3 font-bold text-slate-500 uppercase tracking-wider", expanded ? "text-sm py-3 px-4" : "text-xs")}>Docente</th>
                                    <th className={cn("text-center py-2 px-3 font-bold text-indigo-500 uppercase tracking-wider", expanded ? "text-sm py-3 px-4" : "text-xs")}>Admin</th>
                                    <th className={cn("text-center py-2 px-3 font-bold text-rose-500 uppercase tracking-wider", expanded ? "text-sm py-3 px-4" : "text-xs")}>Lic.</th>
                                    <th className={cn("text-center py-2 px-3 font-bold text-amber-500 uppercase tracking-wider", expanded ? "text-sm py-3 px-4" : "text-xs")}>Atr.</th>
                                    <th className={cn("text-center py-2 px-3 font-bold text-slate-500 uppercase tracking-wider", expanded ? "text-sm py-3 px-4" : "text-xs")}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGlobal.teacherRanking.slice(0, expanded ? 20 : 10).map((row, i) => (
                                    <tr key={row.userId} className={cn("border-b border-slate-50", i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30')}>
                                        <td className={cn("py-2 px-3 text-slate-400 font-mono", expanded ? "text-sm py-3 px-4" : "text-xs")}>{i + 1}</td>
                                        <td className={cn("py-2 px-3 font-semibold text-slate-700", expanded ? "text-sm py-3 px-4" : "text-xs")}>{row.userName}</td>
                                        <td className={cn("py-2 px-3 text-center text-indigo-600 font-medium", expanded ? "text-sm py-3 px-4" : "text-xs")}>{row.admin || '-'}</td>
                                        <td className={cn("py-2 px-3 text-center text-rose-600 font-medium", expanded ? "text-sm py-3 px-4" : "text-xs")}>{row.medical || '-'}</td>
                                        <td className={cn("py-2 px-3 text-center text-amber-600 font-medium", expanded ? "text-sm py-3 px-4" : "text-xs")}>{row.attendance || '-'}</td>
                                        <td className={cn("py-2 px-3 text-center", expanded ? "py-3 px-4" : "")}>
                                            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700", expanded ? "text-sm px-3 py-1" : "text-xs")}>
                                                {row.total}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-sm text-slate-400 text-center py-10">Sin datos de impacto por docente</p>;

            default:
                return null;
        }
    };

    // ── Insight cards data ──
    const [activeInsight, setActiveInsight] = useState(null);

    const SOURCE_COLORS_MAP = { 'Dias Administrativos': '#6366f1', 'Licencias Medicas': '#f43f5e', 'Atrasos/Ausencias': '#f59e0b' };

    const insightCards = useMemo(() => {
        // 1. Tendencia
        let trendText = 'Sin datos suficientes';
        let trendIcon = TrendingUp;
        let trendColor = 'slate';
        if (weeklyData.length >= 6) {
            const recent3 = weeklyData.slice(-3).reduce((s, w) => s + w.admin + w.medical + w.attendance, 0) / 3;
            const prev3 = weeklyData.slice(-6, -3).reduce((s, w) => s + w.admin + w.medical + w.attendance, 0) / 3;
            if (prev3 > 0) {
                const pct = ((recent3 - prev3) / prev3 * 100).toFixed(0);
                const isUp = recent3 > prev3;
                trendText = `${isUp ? '+' : ''}${pct}% vs semanas anteriores`;
                trendIcon = isUp ? TrendingUp : TrendingDown;
                trendColor = isUp ? 'red' : 'emerald';
            } else {
                trendText = `${Math.round(recent3)} clases/semana`;
                trendColor = 'amber';
            }
        } else if (weeklyData.length >= 2) {
            const avg = weeklyData.reduce((s, w) => s + w.admin + w.medical + w.attendance, 0) / weeklyData.length;
            trendText = `Promedio: ${avg.toFixed(1)} clases/semana`;
            trendColor = 'blue';
        }

        // 2. Horario critico
        let criticalText = 'Sin datos';
        let criticalColor = 'emerald';
        if (heatmap.maxValue > 0) {
            const slots = [];
            for (let d = 0; d < 5; d++) for (let b = 0; b < 8; b++) if (heatmap.grid[d][b] > 0) slots.push({ d, b, v: heatmap.grid[d][b] });
            slots.sort((a, b) => b.v - a.v);
            const t = slots[0];
            criticalText = `${heatmap.dayLabels[t.d]} ${heatmap.blockLabels[t.b]} Hora: ${t.v} clases`;
            criticalColor = 'red';
        }

        // 3. Fuente principal
        let sourceText = 'Sin datos';
        let sourceColor = 'emerald';
        if (filteredGlobal.sourceBreakdown.length > 0) {
            const top = filteredGlobal.sourceBreakdown[0];
            const pct = filteredGlobal.totalClasses > 0 ? Math.round(top.value / filteredGlobal.totalClasses * 100) : 0;
            sourceText = `${top.name}: ${top.value} (${pct}%)`;
            sourceColor = 'purple';
        }

        return [
            { id: 'tendencia', icon: trendIcon, color: trendColor, title: 'Tendencia', value: trendText },
            { id: 'proyeccion', icon: Target, color: 'indigo', title: 'Proyeccion Anual', value: `~${annualProjection} clases (${SCHOOL_WEEKS_PER_YEAR} sem)` },
            { id: 'horario', icon: Calendar, color: criticalColor, title: 'Horario Critico', value: criticalText },
            { id: 'fuente', icon: Layers, color: sourceColor, title: 'Fuente Principal', value: sourceText },
        ];
    }, [weeklyData, heatmap, filteredGlobal, annualProjection]);

    // ── Detail panel content builders ──
    const perWeek = filteredGlobal.totalClasses / weeksElapsed;
    const displayWeeks = weeklyData.slice(-6);
    const recent3Avg = weeklyData.length >= 6 ? weeklyData.slice(-3).reduce((s, w) => s + w.admin + w.medical + w.attendance, 0) / 3 : 0;
    const prev3Avg = weeklyData.length >= 6 ? weeklyData.slice(-6, -3).reduce((s, w) => s + w.admin + w.medical + w.attendance, 0) / 3 : 0;

    const topHeatSlots = useMemo(() => {
        const slots = [];
        for (let d = 0; d < 5; d++) for (let b = 0; b < 8; b++) if (heatmap.grid[d][b] > 0) slots.push({ d, b, v: heatmap.grid[d][b] });
        return slots.sort((a, b) => b.v - a.v).slice(0, 5);
    }, [heatmap]);

    const activeCard = insightCards.find(c => c.id === activeInsight);

    // KPIs
    const kpis = [
        { icon: AlertTriangle, label: 'Total Clases Perdidas', value: filteredGlobal.totalClasses, color: 'red' },
        { icon: Users, label: 'Cursos Afectados', value: filteredGlobal.coursesAffected, color: 'blue' },
        { icon: BarChart3, label: 'Asignaturas', value: filteredGlobal.subjectsAffected, color: 'purple' },
        { icon: Users, label: 'Docentes', value: filteredGlobal.teachersWithImpact, color: 'indigo' },
        { icon: Target, label: 'Proyeccion Anual', value: `~${annualProjection}`, color: 'amber' },
    ];

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
            </div>

            {/* Row 2: Tendencia Semanal + Impacto Acumulado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ChartCard
                    title={CHART_META.tendencia.title}
                    description={CHART_META.tendencia.description}
                    onExpand={() => setExpandedChart('tendencia')}
                >
                    {renderChartContent('tendencia')}
                </ChartCard>

                <ChartCard
                    title={CHART_META.acumulado.title}
                    description={CHART_META.acumulado.description}
                    onExpand={() => setExpandedChart('acumulado')}
                >
                    {renderChartContent('acumulado')}
                </ChartCard>
            </div>

            {/* Row 3: Tasa por Curso + Heatmap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ChartCard
                    title={CHART_META.tasa.title}
                    description={CHART_META.tasa.description}
                    onExpand={() => setExpandedChart('tasa')}
                >
                    {renderChartContent('tasa')}
                </ChartCard>

                <ChartCard
                    title={CHART_META.heatmap.title}
                    description={CHART_META.heatmap.description}
                    onExpand={() => setExpandedChart('heatmap')}
                >
                    {renderChartContent('heatmap')}
                </ChartCard>
            </div>

            {/* Row 4: Donut + Teacher Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ChartCard
                    title={CHART_META.donut.title}
                    description={CHART_META.donut.description}
                    onExpand={() => setExpandedChart('donut')}
                >
                    {renderChartContent('donut')}
                </ChartCard>

                <ChartCard
                    title={CHART_META.docentes.title}
                    description={CHART_META.docentes.description}
                    onExpand={() => setExpandedChart('docentes')}
                >
                    {renderChartContent('docentes')}
                </ChartCard>
            </div>

            {/* Row 5: Insight cards + expandable detail panel */}
            <div className="space-y-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {insightCards.map((card) => (
                        <InsightCard
                            key={card.id}
                            icon={card.icon}
                            color={card.color}
                            title={card.title}
                            value={card.value}
                            active={activeInsight === card.id}
                            onClick={() => setActiveInsight(activeInsight === card.id ? null : card.id)}
                        />
                    ))}
                </div>

                {/* Full-width detail panel */}
                <AnimatePresence mode="wait">
                    {activeInsight && activeCard && (
                        <motion.div
                            key={activeInsight}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                                {/* Panel header */}
                                <div className={cn("flex items-center justify-between px-5 py-3 border-b", `bg-${activeCard.color}-50 border-${activeCard.color}-100`)}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", `bg-${activeCard.color}-100 text-${activeCard.color}-600`)}>
                                            <activeCard.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{activeCard.title}</p>
                                            <p className={cn("text-sm font-bold", `text-${activeCard.color}-700`)}>{activeCard.value}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveInsight(null)} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>

                                {/* Panel body — 2-column: detail left, conclusion right */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                                    {/* Detail (2/3 width) */}
                                    <div className="md:col-span-2 p-5 border-b md:border-b-0 md:border-r border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Como se calcula</p>

                                        {/* TENDENCIA */}
                                        {activeInsight === 'tendencia' && (
                                            <div className="space-y-4">
                                                {displayWeeks.length > 0 && (
                                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                                        {displayWeeks.map((w, i) => {
                                                            const total = w.admin + w.medical + w.attendance;
                                                            const isRecent = i >= displayWeeks.length - 3;
                                                            return (
                                                                <div key={w.week} className={cn(
                                                                    "rounded-xl px-3 py-3 text-center border transition-all",
                                                                    isRecent ? "bg-white border-indigo-200 shadow-sm" : "bg-slate-50/80 border-slate-100"
                                                                )}>
                                                                    <p className="text-[10px] font-bold text-slate-400 mb-1">Sem {w.weekLabel}</p>
                                                                    <p className="text-2xl font-black text-slate-800">{total}</p>
                                                                    <div className="flex justify-center gap-1.5 mt-2">
                                                                        <span className="text-[10px] text-indigo-500 font-bold">{w.admin}</span>
                                                                        <span className="text-slate-200">|</span>
                                                                        <span className="text-[10px] text-rose-500 font-bold">{w.medical}</span>
                                                                        <span className="text-slate-200">|</span>
                                                                        <span className="text-[10px] text-amber-500 font-bold">{w.attendance}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {weeklyData.length >= 6 && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-center">
                                                            <p className="text-[10px] text-slate-400 font-bold mb-1">SEMANAS ANTERIORES</p>
                                                            <p className="text-xl font-black text-slate-600">{prev3Avg.toFixed(1)}</p>
                                                            <p className="text-[10px] text-slate-400">clases/semana</p>
                                                        </div>
                                                        <ArrowRight className="w-5 h-5 text-slate-300 shrink-0" />
                                                        <div className="flex-1 bg-white rounded-xl px-4 py-3 text-center border border-slate-200 shadow-sm">
                                                            <p className="text-[10px] text-slate-400 font-bold mb-1">SEMANAS RECIENTES</p>
                                                            <p className="text-xl font-black text-slate-800">{recent3Avg.toFixed(1)}</p>
                                                            <p className="text-[10px] text-slate-400">clases/semana</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="bg-slate-50 rounded-xl px-4 py-2.5">
                                                    <p className="text-[10px] font-mono text-slate-400">Variacion % = (promedio_reciente - promedio_anterior) / promedio_anterior x 100</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* PROYECCION */}
                                        {activeInsight === 'proyeccion' && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {[
                                                        { label: 'TOTAL ACTUAL', val: filteredGlobal.totalClasses, color: 'text-slate-800' },
                                                        { op: '\u00F7' },
                                                        { label: 'SEMANAS', val: weeksElapsed, color: 'text-slate-800' },
                                                        { op: '=' },
                                                        { label: 'PROMEDIO/SEM', val: perWeek.toFixed(1), color: 'text-indigo-600' },
                                                        { op: '\u00D7' },
                                                        { label: 'A\u00D1O ESCOLAR', val: SCHOOL_WEEKS_PER_YEAR, color: 'text-slate-800' },
                                                        { op: '=' },
                                                        { label: 'PROYECCION', val: `~${annualProjection}`, color: 'text-indigo-700', highlight: true },
                                                    ].map((item, i) =>
                                                        item.op ? (
                                                            <span key={i} className="text-slate-300 font-bold text-xl">{item.op}</span>
                                                        ) : (
                                                            <div key={i} className={cn(
                                                                "rounded-xl px-4 py-2.5 text-center border",
                                                                item.highlight ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200 shadow-sm"
                                                            )}>
                                                                <p className="text-[10px] text-slate-400 font-bold">{item.label}</p>
                                                                <p className={cn("text-xl font-black", item.color)}>{item.val}</p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "text-xs font-bold px-3 py-1.5 rounded-full",
                                                        annualProjection > 500 ? "bg-red-100 text-red-700" :
                                                            annualProjection > 200 ? "bg-amber-100 text-amber-700" :
                                                                "bg-emerald-100 text-emerald-700"
                                                    )}>
                                                        {annualProjection > 500 ? 'NIVEL ALTO' : annualProjection > 200 ? 'NIVEL MODERADO' : 'NIVEL BAJO'}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                        Equivale a ~{Math.round(annualProjection * 45 / 60)} horas pedagogicas al a\u00F1o
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* HORARIO CRITICO */}
                                        {activeInsight === 'horario' && (
                                            <div className="space-y-3">
                                                {topHeatSlots.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {topHeatSlots.map((s, i) => (
                                                            <div key={i} className="flex items-center gap-2.5 bg-slate-50/80 px-3 py-2.5 rounded-xl border border-slate-100">
                                                                <span className={cn(
                                                                    "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                                                                    i === 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
                                                                )}>{i + 1}</span>
                                                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                <span className="font-semibold text-slate-700 text-sm">{heatmap.dayLabels[s.d]}</span>
                                                                <span className="text-slate-300">&middot;</span>
                                                                <span className="font-mono text-slate-500 text-sm">{heatmap.blockLabels[s.b]} Hora</span>
                                                                <span className="ml-auto">
                                                                    <span className={cn(
                                                                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                                                                        i === 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                                                                    )}>{s.v} cls</span>
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-400">No se registran clases perdidas en bloques horarios.</p>
                                                )}
                                                <div className="bg-slate-50 rounded-xl px-4 py-2.5">
                                                    <p className="text-[10px] font-mono text-slate-400">H(dia, bloque) = total clases perdidas por las 3 fuentes en esa franja horaria</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* FUENTE PRINCIPAL */}
                                        {activeInsight === 'fuente' && (
                                            <div className="space-y-3">
                                                {filteredGlobal.sourceBreakdown.map((s, i) => {
                                                    const p = filteredGlobal.totalClasses > 0 ? (s.value / filteredGlobal.totalClasses * 100) : 0;
                                                    const barColor = SOURCE_COLORS_MAP[s.name] || '#64748b';
                                                    return (
                                                        <div key={i} className="space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: barColor }} />
                                                                    <span className="font-semibold text-slate-700 text-sm">{s.name}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-sm font-black text-slate-800">{s.value}</span>
                                                                    <span className="text-xs text-slate-400 ml-1.5">({Math.round(p)}%)</span>
                                                                </div>
                                                            </div>
                                                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                                                                <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${p}%`, backgroundColor: barColor }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                    <span className="font-bold text-slate-500 text-sm">Total</span>
                                                    <span className="font-black text-slate-800">{filteredGlobal.totalClasses} clases</span>
                                                </div>
                                                <div className="bg-slate-50 rounded-xl px-4 py-2.5">
                                                    <p className="text-[10px] font-mono text-slate-400">P(fuente) = clases_fuente / total_clases x 100</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Conclusion (1/3 width) */}
                                    <div className="p-5 flex flex-col">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Conclusion</p>
                                        <div className={cn("flex-1 flex items-start gap-2.5 p-4 rounded-xl border", `bg-${activeCard.color}-50/50 border-${activeCard.color}-100`)}>
                                            <div className={cn("w-1 self-stretch rounded-full shrink-0", `bg-${activeCard.color}-400`)} />
                                            <p className={cn("text-sm leading-relaxed font-medium", `text-${activeCard.color}-800`)}>
                                                {activeInsight === 'tendencia' && (
                                                    weeklyData.length >= 6
                                                        ? (recent3Avg > prev3Avg
                                                            ? 'El impacto esta aumentando. Se recomienda revisar las causas de ausencia recientes y evaluar medidas de cobertura para las proximas semanas.'
                                                            : 'El impacto esta disminuyendo, lo que indica una mejora en la continuidad de clases. Mantener las practicas actuales de gestion.')
                                                        : 'Aun no hay suficientes semanas para comparar periodos. El promedio actual sirve como linea base inicial.'
                                                )}
                                                {activeInsight === 'proyeccion' && (
                                                    annualProjection > 500
                                                        ? 'La proyeccion es alta. Cada clase perdida representa 45 min de aprendizaje no entregado. Se recomienda priorizar cobertura en los cursos y horarios mas afectados.'
                                                        : annualProjection > 200
                                                            ? 'Nivel moderado de impacto proyectado. Monitorear las fuentes principales y evaluar si hay docentes o cursos que concentren el impacto.'
                                                            : 'Nivel bajo de impacto proyectado. La continuidad pedagogica se mantiene en niveles aceptables.'
                                                )}
                                                {activeInsight === 'horario' && (
                                                    topHeatSlots.length > 0
                                                        ? `La franja ${heatmap.dayLabels[topHeatSlots[0].d]} ${heatmap.blockLabels[topHeatSlots[0].b]} Hora concentra la mayor perdida. Considerar asignar cobertura prioritaria (suplentes, fusion de cursos) en estos bloques.`
                                                        : 'Sin impacto horario detectado. Excelente continuidad de clases.'
                                                )}
                                                {activeInsight === 'fuente' && (
                                                    filteredGlobal.sourceBreakdown.length > 0
                                                        ? (filteredGlobal.totalClasses > 0 && filteredGlobal.sourceBreakdown[0].value / filteredGlobal.totalClasses >= 0.5
                                                            ? `La fuente principal representa mas de la mitad del impacto. Focalizar acciones preventivas en esta causa generaria el mayor retorno.`
                                                            : 'El impacto esta distribuido entre las fuentes. Se recomienda abordar cada causa con estrategias diferenciadas segun su naturaleza.')
                                                        : 'Sin impacto detectado.'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Fullscreen chart overlay — rendered via portal to escape transforms ── */}
            {createPortal(
                <AnimatePresence>
                    {expandedChart && (() => {
                        const meta = CHART_META[expandedChart];
                        return (
                            <div key="chart-overlay">
                                {/* Backdrop — full viewport blur */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4, ease: APPLE_EASE }}
                                    className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-xl"
                                    onClick={() => setExpandedChart(null)}
                                />

                                {/* Modal — animation wrapper */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.96, y: 24 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: 24 }}
                                    transition={{ duration: 0.5, ease: APPLE_EASE_OUT }}
                                    className="fixed inset-4 md:inset-8 lg:inset-12 z-[9999]"
                                >
                                    {/* Scrollable container — plain div, no transforms */}
                                    <div className="w-full h-full overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-2xl">
                                        {/* Close button */}
                                        <button
                                            onClick={() => setExpandedChart(null)}
                                            className="sticky top-4 float-right mr-4 z-10 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors group"
                                        >
                                            <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                        </button>

                                        {/* Content */}
                                        <div className="px-8 md:px-10 pt-8 pb-10">
                                            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight pr-16">
                                                {meta?.title}
                                            </h3>

                                            <p className="text-sm md:text-base text-slate-500 mt-2 leading-relaxed max-w-3xl">
                                                {meta?.description}
                                            </p>

                                            <div className="mt-5 flex items-start gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-violet-50/50 border border-indigo-100/60 max-w-3xl">
                                                <div className="p-1.5 rounded-lg bg-indigo-100/80 text-indigo-500 shrink-0 mt-0.5">
                                                    <Info className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Modo de calculo</p>
                                                    <p className="text-sm text-indigo-700/80 leading-relaxed">{meta?.formula}</p>
                                                </div>
                                            </div>

                                            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6" />

                                            {renderChartContent(expandedChart, true)}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })()}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
