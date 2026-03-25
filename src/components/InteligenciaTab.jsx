import React, { useState } from 'react';
import {
    AlertTriangle, TrendingUp, Users, Calendar,
    Shield, CheckCircle, Brain, Clock, Info, ChevronDown
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, Area, AreaChart,
    BarChart, Bar, Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { KpiCard, ChartCard, InsightCard, CustomTooltip } from './StatsShared';

// ============================================
// COLLAPSIBLE EXPLAINER
// ============================================

const Explainer = ({ children }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="mb-4">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
            >
                <Info className="w-3.5 h-3.5" />
                {open ? 'Ocultar explicacion' : 'Como se calcula?'}
                <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
            </button>
            {open && (
                <div className="mt-2 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-slate-600 leading-relaxed space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
};

// ============================================
// CUSTOM TOOLTIPS
// ============================================

const ForecastTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const isForecast = !!d?.upper;
    return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200 text-xs">
            <p className="font-bold text-slate-700 mb-1">Sem. {label}</p>
            <p className="text-indigo-600 font-medium">{d?.total} clases perdidas</p>
            {isForecast && (
                <p className="text-slate-400">Rango: {d.lower} — {d.upper}</p>
            )}
            {isForecast && <p className="text-amber-500 text-[10px] mt-1">Proyeccion</p>}
        </div>
    );
};

const RiskTooltip = ({ active, payload, label }) => {
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
// SECTION 1: FORECAST
// ============================================

const ForecastSection = ({ forecastData }) => {
    const { historical, forecast, nextWeekEstimate } = forecastData;

    if (historical.length === 0) {
        return (
            <ChartCard title="Pronostico de Ausencias Semanales" description="Se necesitan datos historicos para generar proyecciones.">
                <p className="text-sm text-slate-400 text-center py-10">Sin datos suficientes</p>
            </ChartCard>
        );
    }

    const chartData = [
        ...historical.map(h => ({ ...h, type: 'real' })),
        { ...historical[historical.length - 1], upper: historical[historical.length - 1].total, lower: historical[historical.length - 1].total, type: 'bridge' },
        ...forecast.map(f => ({ ...f, type: 'forecast' })),
    ];

    return (
        <div className="space-y-4">
            <Explainer>
                <p><strong>Que muestra:</strong> Cuantas clases se perdieron cada semana (linea solida) y cuantas se esperan perder en las proximas 4 semanas (linea punteada con banda sombreada).</p>
                <p><strong>Como se calcula:</strong> Se toman las ultimas 6 semanas de clases perdidas (dias administrativos + licencias medicas + atrasos) y se calcula un promedio ponderado, donde <strong>las semanas mas recientes pesan mas</strong>. Si la ultima semana fue mala, la proyeccion sube; si fue tranquila, baja.</p>
                <p><strong>La banda sombreada</strong> muestra el rango probable. Si las semanas anteriores fueron muy disparejas, la banda sera ancha (mas incertidumbre). Si fueron estables, la banda sera angosta (proyeccion mas confiable).</p>
                <p><strong>La tarjeta KPI</strong> muestra la mejor estimacion de clases perdidas para la proxima semana.</p>
            </Explainer>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <KpiCard
                    icon={TrendingUp}
                    label="Proyeccion Prox. Semana"
                    value={`~${nextWeekEstimate}`}
                    sublabel="clases perdidas"
                    color="indigo"
                />
                <KpiCard
                    icon={Calendar}
                    label="Semanas Proyectadas"
                    value={forecast.length}
                    sublabel="hacia adelante"
                    color="blue"
                />
            </div>

            <ChartCard title="Tendencia + Proyeccion" description="Linea solida = datos reales. Linea punteada = proyeccion con banda de confianza.">
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="weekLabel" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip content={<ForecastTooltip />} />
                        <Area
                            dataKey="upper"
                            stroke="none"
                            fill="#6366f1"
                            fillOpacity={0.08}
                            connectNulls={false}
                        />
                        <Area
                            dataKey="lower"
                            stroke="none"
                            fill="#ffffff"
                            fillOpacity={1}
                            connectNulls={false}
                        />
                        <Line
                            dataKey="total"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={(props) => {
                                const { cx, cy, payload } = props;
                                if (payload.type === 'bridge') return null;
                                return (
                                    <circle
                                        cx={cx} cy={cy} r={3}
                                        fill={payload.type === 'forecast' ? '#fff' : '#6366f1'}
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                    />
                                );
                            }}
                            strokeDasharray={(entry) => entry?.type === 'forecast' ? '6 3' : '0'}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
};

// ============================================
// SECTION 2: BALANCE DEPLETION
// ============================================

const RISK_COLORS = { red: 'bg-red-100 text-red-700', yellow: 'bg-amber-100 text-amber-700', green: 'bg-emerald-100 text-emerald-700' };
const RISK_LABELS = { red: 'Critico', yellow: 'Precaucion', green: 'OK' };

const DepletionSection = ({ depletionData }) => {
    const atRisk = depletionData.filter(d => d.riskLevel !== 'green').length;

    if (depletionData.length === 0) {
        return (
            <ChartCard title="Agotamiento de Dias Administrativos" description="Sin datos de uso para proyectar agotamiento.">
                <p className="text-sm text-slate-400 text-center py-10">Ningun docente ha usado dias administrativos aun</p>
            </ChartCard>
        );
    }

    return (
        <div className="space-y-4">
            <Explainer>
                <p><strong>Que muestra:</strong> Una tabla con los docentes que van camino a quedarse sin dias administrativos, ordenados por urgencia.</p>
                <p><strong>Como se calcula:</strong> Para cada docente se mira cuantos dias ha usado por mes en promedio. Se divide su saldo actual por esa tasa para estimar en cuantos meses se le acaban.</p>
                <p><strong>Ejemplo:</strong> Si un docente tiene saldo 3 y usa en promedio 1.5 dias/mes, se proyecta que en 2 meses se quedara sin dias.</p>
                <p><strong>Columnas de la tabla:</strong></p>
                <ul className="list-disc pl-4 space-y-0.5">
                    <li><strong>Saldo:</strong> Dias que le quedan hoy</li>
                    <li><strong>Uso/Mes:</strong> Promedio de dias que usa por mes</li>
                    <li><strong>Meses Rest.:</strong> En cuantos meses se le acaban al ritmo actual</li>
                    <li><strong>Fecha Est.:</strong> Fecha aproximada en que llegara a 0</li>
                    <li><strong>Estado:</strong> Rojo = critico (menos de 1 mes o agotado), Amarillo = precaucion (1-3 meses), Verde = OK (mas de 3 meses)</li>
                </ul>
                <p>Solo aparecen docentes que ya han usado al menos un dia. Si alguien no ha usado ninguno, no hay patron que proyectar.</p>
            </Explainer>

            <KpiCard
                icon={AlertTriangle}
                label="Docentes en Riesgo"
                value={atRisk}
                sublabel="agotaran dias antes de fin de ano"
                color={atRisk > 0 ? 'red' : 'emerald'}
            />

            <ChartCard title="Proyeccion de Agotamiento" description="Fecha estimada en que cada docente agotara su saldo, basada en su tasa de uso mensual.">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left py-2 px-3 text-xs font-bold text-slate-400 uppercase">Docente</th>
                                <th className="text-center py-2 px-3 text-xs font-bold text-slate-400 uppercase">Saldo</th>
                                <th className="text-center py-2 px-3 text-xs font-bold text-slate-400 uppercase">Uso/Mes</th>
                                <th className="text-center py-2 px-3 text-xs font-bold text-slate-400 uppercase">Meses Rest.</th>
                                <th className="text-center py-2 px-3 text-xs font-bold text-slate-400 uppercase">Fecha Est.</th>
                                <th className="text-center py-2 px-3 text-xs font-bold text-slate-400 uppercase">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {depletionData.map(row => (
                                <tr key={row.userId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="py-2.5 px-3 font-semibold text-slate-700">{row.userName}</td>
                                    <td className="py-2.5 px-3 text-center">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                                            row.balance <= 0 ? 'bg-red-50 text-red-700' :
                                                row.balance <= 2 ? 'bg-amber-50 text-amber-700' :
                                                    'bg-emerald-50 text-emerald-700'
                                        )}>
                                            {row.balance}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-slate-600">{row.monthlyRate}</td>
                                    <td className="py-2.5 px-3 text-center text-slate-600">
                                        {row.monthsRemaining !== null ? row.monthsRemaining : '—'}
                                    </td>
                                    <td className="py-2.5 px-3 text-center text-slate-500 text-xs">
                                        {row.depletionDate || '—'}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", RISK_COLORS[row.riskLevel])}>
                                            {RISK_LABELS[row.riskLevel]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </ChartCard>
        </div>
    );
};

// ============================================
// SECTION 3: STUDENT RISK
// ============================================

const FACTOR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#06b6d4', '#ef4444'];
const FACTOR_LABELS = ['Justificativos', 'Medicos', 'Incidencias', 'Entrevistas', 'No resueltas'];
const RISK_LEVEL_STYLES = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};
const RISK_LEVEL_LABELS = { high: 'Alto', medium: 'Medio', low: 'Bajo' };

const StudentRiskSection = ({ riskData }) => {
    const highRisk = riskData.filter(s => s.riskLevel === 'high').length;

    if (riskData.length === 0) {
        return (
            <ChartCard title="Alumnos en Riesgo" description="Sin datos suficientes para calcular riesgo.">
                <p className="text-sm text-slate-400 text-center py-10">No hay alumnos con indicadores de riesgo</p>
            </ChartCard>
        );
    }

    const chartData = riskData.map(s => {
        const entry = { name: s.studentName.split(' ').slice(0, 2).join(' ') };
        s.factors.forEach((f, i) => {
            entry[f.name] = Math.round(f.normalized * f.weight * 100);
        });
        return entry;
    });

    return (
        <div className="space-y-4">
            <Explainer>
                <p><strong>Que muestra:</strong> Los 10 alumnos con mas senales de alerta, evaluados con un puntaje de 0 a 100.</p>
                <p><strong>Se evaluan 5 factores:</strong></p>
                <ul className="list-disc pl-4 space-y-0.5">
                    <li><span className="font-bold" style={{ color: FACTOR_COLORS[0] }}>Justificativos (25%)</span> — Cuantos justificativos tiene en los ultimos 90 dias</li>
                    <li><span className="font-bold" style={{ color: FACTOR_COLORS[1] }}>Medicos reiterados (15%)</span> — Cuantos de esos justificativos son medicos</li>
                    <li><span className="font-bold" style={{ color: FACTOR_COLORS[2] }}>Incidencias (30%)</span> — Cantidad y gravedad de incidencias (leve=1 pto, grave=3, muy grave=5). Las recientes cuentan doble</li>
                    <li><span className="font-bold" style={{ color: FACTOR_COLORS[3] }}>Entrevistas (20%)</span> — Cuantas entrevistas (alumno o apoderado) en los ultimos 90 dias</li>
                    <li><span className="font-bold" style={{ color: FACTOR_COLORS[4] }}>No resueltas (10%)</span> — Incidencias que siguen abiertas o en seguimiento</li>
                </ul>
                <p><strong>Como se calcula:</strong> Cada factor se compara contra el alumno con el valor mas alto del colegio. Si el maximo de justificativos es 8 y un alumno tiene 4, obtiene 50% en ese factor. Luego se aplican los pesos y se suman.</p>
                <p><strong>En el grafico:</strong> Cada color apilado muestra cuanto aporta cada factor al puntaje total. Si la barra es mayormente violeta, el problema principal son incidencias; si es rosa, son ausencias reiteradas.</p>
                <p><strong>Las 5 barritas</strong> debajo de cada nombre muestran lo mismo en miniatura: barra llena = valor maximo del colegio, barra vacia = sin eventos.</p>
                <p><strong>Niveles:</strong> Alto (60-100) = intervencion prioritaria · Medio (30-59) = seguimiento cercano · Bajo (1-29) = monitorear</p>
            </Explainer>

            <KpiCard
                icon={Shield}
                label="Atencion Prioritaria"
                value={highRisk}
                sublabel="alumnos en riesgo alto"
                color={highRisk > 0 ? 'red' : 'emerald'}
            />

            <ChartCard title="Top 10 Alumnos en Riesgo" description="Score multifactor: justificativos (25%), medicos (15%), incidencias (30%), entrevistas (20%), no resueltas (10%).">
                {/* Factor legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    {riskData[0]?.factors.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: FACTOR_COLORS[i] }} />
                            {f.name}
                        </div>
                    ))}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="vertical" barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                        <Tooltip content={<RiskTooltip />} />
                        {riskData[0]?.factors.map((f, i) => (
                            <Bar key={f.name} dataKey={f.name} stackId="risk" fill={FACTOR_COLORS[i]} radius={i === riskData[0].factors.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* Detail cards */}
            <div className="space-y-2">
                {riskData.map((s, i) => (
                    <div
                        key={s.studentId}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/60 hover:shadow-sm transition-shadow"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                            s.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                                s.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-100 text-slate-600'
                        )}>
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-700 truncate">{s.studentName}</span>
                                {s.studentCurso && <span className="text-[10px] text-slate-400 shrink-0">{s.studentCurso}</span>}
                            </div>
                            {/* Factor mini bars with labels on hover */}
                            <div className="flex gap-1 mt-1.5">
                                {s.factors.map((f, fi) => (
                                    <div key={fi} className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" title={`${f.name}: ${f.value}`}>
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${Math.round(f.normalized * 100)}%`,
                                                backgroundColor: FACTOR_COLORS[fi],
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", RISK_LEVEL_STYLES[s.riskLevel])}>
                                {RISK_LEVEL_LABELS[s.riskLevel]}
                            </span>
                            <span className="text-lg font-black text-slate-700">{s.score}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// SECTION 4: ANOMALY DETECTION
// ============================================

const AnomalySection = ({ anomalies }) => {
    if (anomalies.length === 0) {
        return (
            <div className="space-y-3">
                <Explainer>
                    <p><strong>Que hace:</strong> Compara lo que paso esta semana con lo que pasa normalmente en 4 metricas: clases perdidas, justificativos nuevos, incidencias nuevas y tickets abiertos.</p>
                    <p><strong>Como decide:</strong> Si el valor de esta semana se aleja mucho del promedio historico (mas de 1.5 veces la variacion tipica), aparece una alerta naranja. Si se aleja demasiado (mas de 2.5 veces), aparece alerta roja.</p>
                    <p><strong>Ejemplo:</strong> Si normalmente se pierden ~10 clases/semana con variaciones de ±2, y esta semana se perdieron 18, eso esta muy fuera de lo normal y genera alerta roja.</p>
                    <p>Se necesitan al menos 3 semanas de historial para detectar anomalias.</p>
                </Explainer>
                <div className="flex items-start gap-3 p-5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-emerald-700">Sin Anomalias Esta Semana</p>
                        <p className="text-xs text-emerald-600 mt-0.5">Todas las metricas estan dentro de los rangos normales.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Explainer>
                <p><strong>Que hace:</strong> Compara lo que paso esta semana con lo que pasa normalmente en 4 metricas: clases perdidas, justificativos nuevos, incidencias nuevas y tickets abiertos.</p>
                <p><strong>Como decide:</strong> Si el valor de esta semana se aleja mucho del promedio historico (mas de 1.5 veces la variacion tipica), aparece una alerta naranja. Si se aleja demasiado (mas de 2.5 veces), aparece alerta roja.</p>
                <p><strong>Que significan los numeros:</strong></p>
                <ul className="list-disc pl-4 space-y-0.5">
                    <li><strong>Promedio:</strong> Lo que pasa normalmente cada semana</li>
                    <li><strong>Desv. estandar:</strong> Cuanto varian las semanas entre si (la "variacion tipica")</li>
                    <li><strong>Z-score:</strong> Cuantas veces la variacion tipica se alejo esta semana del promedio. Mas de 1.5 = inusual, mas de 2.5 = muy inusual</li>
                </ul>
                <p>Si hay multiples alertas a la vez, probablemente hay una causa comun que vale la pena investigar.</p>
            </Explainer>
            {anomalies.map((a, i) => (
                <div
                    key={i}
                    className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border",
                        a.severity === 'red' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                    )}
                >
                    <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        a.severity === 'red' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    )}>
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "text-sm font-bold",
                            a.severity === 'red' ? 'text-red-700' : 'text-amber-700'
                        )}>
                            {a.metric}: {a.currentValue} esta semana
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Promedio semanal: {a.mean} · Variacion tipica: ±{a.stdDev} · Desviacion: {a.zScore}x
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// ============================================
// MAIN TAB COMPONENT
// ============================================

export default function InteligenciaTab({ forecastData, depletionData, riskData, anomalies }) {
    return (
        <div className="space-y-8">
            {/* Intro */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-indigo-800">Analisis Predictivo</p>
                        <p className="text-xs text-indigo-600/80 mt-0.5 leading-relaxed">
                            Este modulo analiza automaticamente los datos del colegio para anticipar problemas antes de que escalen.
                            Usa promedios ponderados, proyecciones de tendencia y deteccion de patrones inusuales.
                            Presiona <strong>"Como se calcula?"</strong> en cada seccion para entender el detalle.
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 1: Forecast */}
            <div>
                <h3 className="text-base font-extrabold text-slate-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    Pronostico de Ausencias
                </h3>
                <ForecastSection forecastData={forecastData} />
            </div>

            {/* Section 2: Balance Depletion */}
            <div className="pt-4 border-t border-slate-200">
                <h3 className="text-base font-extrabold text-slate-700 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    Agotamiento de Dias Administrativos
                </h3>
                <DepletionSection depletionData={depletionData} />
            </div>

            {/* Section 3: Student Risk */}
            <div className="pt-4 border-t border-slate-200">
                <h3 className="text-base font-extrabold text-slate-700 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500" />
                    Alumnos en Riesgo
                </h3>
                <StudentRiskSection riskData={riskData} />
            </div>

            {/* Section 4: Anomaly Detection */}
            <div className="pt-4 border-t border-slate-200">
                <h3 className="text-base font-extrabold text-slate-700 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Deteccion de Anomalias
                </h3>
                <AnomalySection anomalies={anomalies} />
            </div>
        </div>
    );
}
