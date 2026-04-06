import React, { useState, useMemo, useEffect } from 'react';
import {
    BarChart3, AlertTriangle, Clock, Users, HeartPulse,
    ClipboardX, Award, TrendingUp, Calendar,
} from 'lucide-react';
import { subscribeToCollection } from '../lib/firestoreService';
import { orderBy } from 'firebase/firestore';
import { useStudents } from '../context/StudentsContext';

// ── Helpers ──
const CURSOS_CLAP = ['4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico'];

const todayStr  = () => new Date().toISOString().split('T')[0];
const monthStr  = () => new Date().toISOString().slice(0, 7); // YYYY-MM
const yearStr   = () => new Date().getFullYear().toString();

function startOf(period) {
    const now = new Date();
    if (period === 'semana') {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)); // lunes
        return d.toISOString().split('T')[0];
    }
    if (period === 'mes') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    if (period === 'año') return `${now.getFullYear()}-01-01`;
    return '2000-01-01'; // todo
}

function rankBy(items, key, topN = 6) {
    const counts = {};
    items.forEach(item => {
        const v = item[key];
        if (v) counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([label, count]) => ({ label, count }));
}

// ── Mini bar chart ──
function BarList({ items, color = 'teal', emptyMsg = 'Sin datos' }) {
    if (!items.length) return <p className="text-sm text-slate-400 py-4 text-center">{emptyMsg}</p>;
    const max = items[0].count;
    const colors = {
        teal:   { bar: 'bg-teal-500',   text: 'text-teal-700',   bg: 'bg-teal-50'   },
        rose:   { bar: 'bg-rose-500',   text: 'text-rose-700',   bg: 'bg-rose-50'   },
        amber:  { bar: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50'  },
        indigo: { bar: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
        orange: { bar: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
    };
    const c = colors[color] || colors.teal;
    return (
        <div className="space-y-2">
            {items.map(({ label, count }, i) => (
                <div key={label} className="flex items-center gap-3">
                    <span className={`text-[11px] font-bold w-4 shrink-0 text-center ${c.text}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-slate-700 truncate">{label}</span>
                            <span className={`text-xs font-bold ml-2 shrink-0 ${c.text}`}>{count}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${c.bar} rounded-full transition-all duration-500`}
                                style={{ width: `${(count / max) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Stat card ──
function StatCard({ label, value, sub, color = 'teal', icon: Icon }) {
    const colors = {
        teal:   'bg-teal-50  text-teal-700  border-teal-100',
        rose:   'bg-rose-50  text-rose-700  border-rose-100',
        amber:  'bg-amber-50 text-amber-700 border-amber-100',
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        orange: 'bg-orange-50 text-orange-700 border-orange-100',
        slate:  'bg-slate-50  text-slate-600  border-slate-200',
    };
    const iconColors = {
        teal:   'bg-teal-100   text-teal-600',
        rose:   'bg-rose-100   text-rose-600',
        amber:  'bg-amber-100  text-amber-600',
        indigo: 'bg-indigo-100 text-indigo-600',
        orange: 'bg-orange-100 text-orange-600',
        slate:  'bg-slate-100  text-slate-500',
    };
    return (
        <div className={`rounded-2xl p-4 border ${colors[color]}`}>
            <div className="flex items-start gap-3">
                {Icon && (
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColors[color]}`}>
                        <Icon className="w-4.5 h-4.5" />
                    </div>
                )}
                <div className="min-w-0">
                    <p className="text-2xl font-black leading-none">{value}</p>
                    <p className="text-xs font-semibold mt-0.5 truncate">{label}</p>
                    {sub && <p className="text-[11px] opacity-70 mt-0.5 truncate">{sub}</p>}
                </div>
            </div>
        </div>
    );
}

// ── Section wrapper ──
function Section({ title, icon: Icon, iconColor = 'text-teal-600', iconBg = 'bg-teal-100', children }) {
    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
            </div>
            {children}
        </div>
    );
}

const PERIODS = [
    { key: 'semana', label: 'Esta semana' },
    { key: 'mes',    label: 'Este mes' },
    { key: 'año',    label: 'Este año' },
    { key: 'todo',   label: 'Siempre' },
];

export default function EnfermeriaResumenView() {
    const { students } = useStudents();
    const [atenciones,  setAtenciones]  = useState([]);
    const [fichasClap,  setFichasClap]  = useState([]);
    const [period, setPeriod] = useState('mes');

    useEffect(() => {
        const u1 = subscribeToCollection('atenciones_diarias', setAtenciones, orderBy('fecha', 'desc'));
        const u2 = subscribeToCollection('ficha_clap',         setFichasClap, orderBy('createdAt', 'desc'));
        return () => { u1(); u2(); };
    }, []);

    // Filtrar atenciones por período
    const atencionesDelPeriodo = useMemo(() => {
        const desde = startOf(period);
        return atenciones.filter(a => a.fecha >= desde);
    }, [atenciones, period]);

    // ── Stats atenciones ──
    const statsAtenciones = useMemo(() => {
        const total       = atencionesDelPeriodo.length;
        const aCasa       = atencionesDelPeriodo.filter(a => a.enviadoCasa === 'SI').length;
        const notificados = atencionesDelPeriodo.filter(a => a.notificoApoderado === 'SI').length;
        const cursos      = rankBy(atencionesDelPeriodo, 'curso');
        const motivos     = rankBy(atencionesDelPeriodo, 'motivo');

        // Alumnos con más visitas
        const visitasPorAlumno = {};
        atencionesDelPeriodo.forEach(a => {
            const k = a.studentId || a.nombreEstudiante;
            if (!k) return;
            if (!visitasPorAlumno[k]) visitasPorAlumno[k] = { nombre: a.nombreEstudiante, curso: a.curso, count: 0 };
            visitasPorAlumno[k].count++;
        });
        const topAlumnos = Object.values(visitasPorAlumno)
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        // Horarios con más incidentes
        const porUbicacion = { recreo: 0, clases: 0, fuera_horario: 0 };
        const porBloque = {};
        atencionesDelPeriodo.forEach(a => {
            const u = a.ubicacion;
            if (!u) return;
            porUbicacion[u.tipo] = (porUbicacion[u.tipo] || 0) + 1;
            if (u.label) porBloque[u.label] = (porBloque[u.label] || 0) + 1;
        });
        const topBloques = Object.entries(porBloque)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([label, count]) => ({ label, count }));

        return { total, aCasa, notificados, cursos, motivos, topAlumnos, porUbicacion, topBloques };
    }, [atencionesDelPeriodo]);

    // ── Stats CLAP ──
    const statsClap = useMemo(() => {
        const estudiantesClap = students.filter(s => CURSOS_CLAP.includes(s.curso));

        // Último registro por estudiante
        const ultimoPorEstudiante = {};
        fichasClap.forEach(r => {
            if (!ultimoPorEstudiante[r.studentId] || r.fecha > ultimoPorEstudiante[r.studentId].fecha) {
                ultimoPorEstudiante[r.studentId] = r;
            }
        });

        const conFicha   = estudiantesClap.filter(s => ultimoPorEstudiante[s.id]).length;
        const sinFicha   = estudiantesClap.length - conFicha;
        const sinControl = estudiantesClap.filter(s => !ultimoPorEstudiante[s.id]);

        const nutricion = { NORMOPESO: 0, SOBREPESO: 0, OBESIDAD: 0, 'EXCESO DE PESO': 0, 'BAJO PESO': 0 };
        Object.values(ultimoPorEstudiante).forEach(r => {
            if (r.estadoNutricional && nutricion[r.estadoNutricional] !== undefined) {
                nutricion[r.estadoNutricional]++;
            }
        });

        // Sobrepeso/Obesidad por curso
        const excesoPorCurso = {};
        fichasClap.forEach(r => {
            const esUltimo = ultimoPorEstudiante[r.studentId]?.fecha === r.fecha;
            if (!esUltimo) return;
            if (['SOBREPESO', 'OBESIDAD', 'EXCESO DE PESO'].includes(r.estadoNutricional)) {
                excesoPorCurso[r.studentCurso] = (excesoPorCurso[r.studentCurso] || 0) + 1;
            }
        });
        const topCursosExceso = Object.entries(excesoPorCurso)
            .sort((a, b) => b[1] - a[1])
            .map(([label, count]) => ({ label, count }));

        // Derivaciones pendientes (horasAgendadas con asistio vacío o PENDIENTE)
        const conDerivacionPendiente = [];
        fichasClap.forEach(r => {
            const esUltimo = ultimoPorEstudiante[r.studentId]?.fecha === r.fecha;
            if (!esUltimo) return;
            const pendientes = (r.horasAgendadas || []).filter(h =>
                h.tipo && (!h.asistio || h.asistio === 'PENDIENTE')
            );
            if (pendientes.length > 0) {
                conDerivacionPendiente.push({
                    nombre: r.studentName,
                    curso: r.studentCurso,
                    pendientes,
                });
            }
        });

        return {
            total: estudiantesClap.length,
            conFicha,
            sinFicha,
            sinControl,
            nutricion,
            topCursosExceso,
            conDerivacionPendiente,
        };
    }, [students, fichasClap]);

    const pctFicha = statsClap.total > 0 ? Math.round((statsClap.conFicha / statsClap.total) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Resumen Enfermería</h1>
                    <p className="text-sm text-slate-500">Estadísticas consolidadas · atenciones y salud escolar</p>
                </div>
            </div>

            {/* Selector de período */}
            <div className="flex gap-1.5 flex-wrap">
                {PERIODS.map(p => (
                    <button
                        key={p.key}
                        onClick={() => setPeriod(p.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            period === p.key
                                ? 'bg-teal-600 text-white shadow-sm shadow-teal-200'
                                : 'bg-white border border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-600'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* ── ATENCIONES DIARIAS ── */}
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">Atenciones Diarias</p>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <StatCard icon={AlertTriangle} label="Atenciones" value={statsAtenciones.total} color="teal" />
                    <StatCard icon={Users}         label="A casa"     value={statsAtenciones.aCasa} color="rose"
                        sub={statsAtenciones.total > 0 ? `${Math.round((statsAtenciones.aCasa / statsAtenciones.total) * 100)}%` : '–'} />
                    <StatCard icon={HeartPulse}    label="Apoderados notif." value={statsAtenciones.notificados} color="amber" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cursos con más atenciones */}
                    <Section title="Cursos con más atenciones" icon={Award} iconColor="text-teal-600" iconBg="bg-teal-100">
                        <BarList items={statsAtenciones.cursos} color="teal" emptyMsg="Sin atenciones en este período" />
                    </Section>

                    {/* Motivos más frecuentes */}
                    <Section title="Motivos más frecuentes" icon={AlertTriangle} iconColor="text-rose-600" iconBg="bg-rose-100">
                        <BarList items={statsAtenciones.motivos} color="rose" emptyMsg="Sin datos" />
                    </Section>

                    {/* Horarios con más incidentes */}
                    <Section title="Horarios con más incidentes" icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-100">
                        {/* Recreo vs Clases */}
                        {(statsAtenciones.porUbicacion.recreo > 0 || statsAtenciones.porUbicacion.clases > 0) && (
                            <div className="flex gap-2 mb-3">
                                {[
                                    { tipo: 'recreo',   label: '🏃 Recreo',  color: 'bg-amber-100 text-amber-700', val: statsAtenciones.porUbicacion.recreo },
                                    { tipo: 'clases',   label: '📚 Clases',  color: 'bg-indigo-100 text-indigo-700', val: statsAtenciones.porUbicacion.clases },
                                    { tipo: 'fuera',    label: '⏰ Fuera',   color: 'bg-slate-100 text-slate-500', val: statsAtenciones.porUbicacion.fuera_horario },
                                ].map(({ label, color, val }) => (
                                    <div key={label} className={`flex-1 text-center py-2 px-1 rounded-xl ${color}`}>
                                        <p className="text-lg font-black">{val}</p>
                                        <p className="text-[11px] font-semibold">{label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <BarList items={statsAtenciones.topBloques} color="amber" emptyMsg="Sin datos de horario (ingresa hora del incidente)" />
                    </Section>

                    {/* Alumnos con más visitas */}
                    <Section title="Alumnos con más visitas" icon={TrendingUp} iconColor="text-indigo-600" iconBg="bg-indigo-100">
                        {statsAtenciones.topAlumnos.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">Sin datos</p>
                        ) : (
                            <div className="space-y-2">
                                {statsAtenciones.topAlumnos.map((a, i) => (
                                    <div key={a.nombre + i} className="flex items-center gap-3">
                                        <span className={`text-[11px] font-bold w-4 text-center shrink-0 ${i === 0 ? 'text-amber-500' : 'text-slate-400'}`}>{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-700 truncate">{a.nombre}</p>
                                            {a.curso && <p className="text-[11px] text-slate-400">{a.curso}</p>}
                                        </div>
                                        <span className="text-sm font-black text-indigo-700 shrink-0">
                                            {a.count} {a.count === 1 ? 'vez' : 'veces'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                </div>
            </div>

            {/* ── FICHA CLAP ── */}
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">Ficha CLAP · 4° a 8° Básico</p>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <StatCard icon={Users}      label="Registrados"   value={`${statsClap.conFicha}/${statsClap.total}`} color="teal"
                        sub={`${pctFicha}% cobertura`} />
                    <StatCard icon={ClipboardX} label="Sin control"   value={statsClap.sinFicha} color="slate" />
                    <StatCard icon={HeartPulse} label="Sobrepeso / Obesidad"
                        value={statsClap.nutricion['SOBREPESO'] + statsClap.nutricion['OBESIDAD'] + statsClap.nutricion['EXCESO DE PESO']}
                        color="orange" />
                    <StatCard icon={Calendar}   label="Derivaciones pendientes" value={statsClap.conDerivacionPendiente.length} color="rose" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Estado nutricional */}
                    <Section title="Estado nutricional (último control)" icon={HeartPulse} iconColor="text-orange-600" iconBg="bg-orange-100">
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'NORMOPESO',      color: 'bg-green-100 text-green-700 border-green-200'  },
                                { key: 'SOBREPESO',      color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                                { key: 'OBESIDAD',       color: 'bg-orange-100 text-orange-700 border-orange-200' },
                                { key: 'EXCESO DE PESO', color: 'bg-red-100 text-red-700 border-red-200'       },
                                { key: 'BAJO PESO',      color: 'bg-blue-100 text-blue-700 border-blue-200'    },
                            ].map(({ key, color }) => (
                                <div key={key} className={`rounded-xl px-3 py-2.5 border text-center ${color}`}>
                                    <p className="text-2xl font-black">{statsClap.nutricion[key]}</p>
                                    <p className="text-[11px] font-semibold leading-tight mt-0.5">{key}</p>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Cursos con más exceso de peso */}
                    <Section title="Sobrepeso / Obesidad por curso" icon={Award} iconColor="text-orange-600" iconBg="bg-orange-100">
                        <BarList items={statsClap.topCursosExceso} color="orange" emptyMsg="Sin datos de nutrición registrados" />
                    </Section>

                    {/* Alumnos sin control */}
                    <Section title="Alumnos sin Ficha CLAP" icon={ClipboardX} iconColor="text-slate-500" iconBg="bg-slate-100">
                        {statsClap.sinControl.length === 0 ? (
                            <p className="text-sm text-green-600 font-semibold py-2 text-center">✓ Todos los alumnos tienen ficha registrada</p>
                        ) : (
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                {statsClap.sinControl.map(s => (
                                    <div key={s.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl">
                                        <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-bold text-slate-500">{s.fullName.charAt(0)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">{s.fullName}</p>
                                        </div>
                                        <span className="text-xs text-slate-400 shrink-0">{s.curso}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Derivaciones pendientes */}
                    <Section title="Derivaciones pendientes de asistencia" icon={AlertTriangle} iconColor="text-rose-600" iconBg="bg-rose-100">
                        {statsClap.conDerivacionPendiente.length === 0 ? (
                            <p className="text-sm text-green-600 font-semibold py-2 text-center">✓ Sin derivaciones pendientes</p>
                        ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {statsClap.conDerivacionPendiente.map((item, i) => (
                                    <div key={i} className="px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{item.nombre}</p>
                                            <span className="text-xs text-slate-400 shrink-0 ml-2">{item.curso}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {item.pendientes.map((h, j) => (
                                                <span key={j} className="text-[11px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg font-medium">
                                                    {h.tipo} {h.asistio === 'PENDIENTE' ? '· Pendiente' : '· Sin confirmar'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                </div>
            </div>
        </div>
    );
}
