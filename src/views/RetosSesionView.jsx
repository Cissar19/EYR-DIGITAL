import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Play, X, Copy, Check, Users, AlertTriangle, Unlock, Clock, Send, WifiOff } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useRetos } from '../context/RetosContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const CURSOS = ['Pre-Kinder', 'Kinder', '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico', 'I Medio', 'II Medio', 'III Medio', 'IV Medio'];

function EstadoBadge({ estado, cambios }) {
    if (estado === 'bloqueada') return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse"><WifiOff className="w-3 h-3" /> Bloqueada</span>;
    if (estado === 'enviada') return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"><Check className="w-3 h-3" /> Enviada</span>;
    if (cambios >= 2) return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700"><AlertTriangle className="w-3 h-3" /> {cambios} alertas</span>;
    if (cambios === 1) return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><AlertTriangle className="w-3 h-3" /> 1 alerta</span>;
    return <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"><Clock className="w-3 h-3" /> En progreso</span>;
}

function formatTimer(seconds) {
    if (!seconds || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function AlumnoCard({ resp, onUnlock }) {
    const { studentName, studentRut, estado, cambiosPestana = 0, texto = '', startedAt } = resp;
    const elapsed = startedAt?.toDate ? Math.floor((Date.now() - startedAt.toDate().getTime()) / 1000) : 0;
    const chars = texto.length;
    const blocked = estado === 'bloqueada';

    return (
        <div className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${blocked ? 'border-red-300 bg-red-50' : cambiosPestana > 0 ? 'border-amber-200' : 'border-slate-100'}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{studentName}</p>
                    <p className="text-xs text-slate-400">{studentRut}</p>
                </div>
                <EstadoBadge estado={estado} cambios={cambiosPestana} />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                <span>{chars} caracteres</span>
                {elapsed > 0 && <span>{formatTimer(elapsed)} en sesión</span>}
                {cambiosPestana > 0 && <span className="text-amber-600 font-semibold">{cambiosPestana} cambio{cambiosPestana > 1 ? 's' : ''} pestaña</span>}
            </div>
            {blocked && (
                <button onClick={() => onUnlock(resp.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors">
                    <Unlock className="w-3.5 h-3.5" /> Desbloquear
                </button>
            )}
        </div>
    );
}

export default function RetosSesionView() {
    const { user } = useAuth();
    const { retos, sesiones, createSesion, closeSesion } = useRetos();
    const [selectedRetoId, setSelectedRetoId] = useState('');
    const [selectedCurso, setSelectedCurso] = useState('');
    const [starting, setStarting] = useState(false);
    const [sesionActiva, setSesionActiva] = useState(null);
    const [respuestas, setRespuestas] = useState([]);
    const [copied, setCopied] = useState(false);

    // Detectar sesión activa del asistente actual
    useEffect(() => {
        const miSesion = sesiones.find(s => s.asistente?.uid === user?.uid);
        setSesionActiva(miSesion || null);
    }, [sesiones, user]);

    // Suscripción en tiempo real a respuestas de la sesión activa
    useEffect(() => {
        if (!sesionActiva?.id) { setRespuestas([]); return; }
        const q = query(collection(db, 'respuestas_reto'), where('sesionId', '==', sesionActiva.id));
        const unsub = onSnapshot(q, snap => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || '', 'es'));
            setRespuestas(docs);
        });
        return () => unsub();
    }, [sesionActiva?.id]);

    const handleStart = async () => {
        if (!selectedRetoId || !selectedCurso) { toast.error('Selecciona un reto y un curso'); return; }
        setStarting(true);
        try { await createSesion(selectedRetoId, selectedCurso); }
        catch { toast.error('Error al iniciar sesión'); }
        finally { setStarting(false); }
    };

    const handleClose = async () => {
        if (!sesionActiva) return;
        if (!window.confirm('¿Cerrar la sesión? Los alumnos ya no podrán enviar.')) return;
        await closeSesion(sesionActiva.id);
    };

    const handleUnlock = useCallback(async (respId) => {
        try {
            await updateDoc(doc(db, 'respuestas_reto', respId), {
                estado: 'en_progreso',
                cambiosPestana: 0,
                desbloqueadoPor: { uid: user.uid, name: user.name },
                updatedAt: serverTimestamp(),
            });
            toast.success('Alumno desbloqueado');
        } catch { toast.error('Error al desbloquear'); }
    }, [user]);

    const copyUrl = () => {
        if (!sesionActiva) return;
        const url = `${window.location.origin}/reto/${sesionActiva.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('URL copiada');
    };

    const retosActivos = retos.filter(r => r.activo);
    const sesionUrl = sesionActiva ? `${window.location.origin}/reto/${sesionActiva.id}` : '';

    // Stats
    const enProgreso = respuestas.filter(r => r.estado === 'en_progreso').length;
    const enviadas   = respuestas.filter(r => r.estado === 'enviada').length;
    const bloqueadas = respuestas.filter(r => r.estado === 'bloqueada').length;
    const alertas    = respuestas.filter(r => (r.cambiosPestana || 0) > 0 && r.estado !== 'bloqueada').length;

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">No Pierde Clases</h1>
                    <p className="text-slate-500 text-sm">Inicia y monitorea sesiones de reto en sala.</p>
                </div>
            </div>

            {!sesionActiva ? (
                /* ── Iniciar sesión ── */
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 max-w-lg">
                    <h2 className="font-bold text-slate-700 mb-5">Iniciar nueva sesión</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Selecciona un reto</label>
                            {retosActivos.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">No hay retos activos. Pídele a UTP que cree uno.</p>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                    {retosActivos.map(r => (
                                        <button key={r.id} type="button" onClick={() => setSelectedRetoId(r.id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${selectedRetoId === r.id ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                            <p className="font-bold text-slate-800">{r.titulo}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{r.asignatura} · {r.duracionMin} min · Envío desde min {r.habilitarEnvioMin}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Curso</label>
                            <select value={selectedCurso} onChange={e => setSelectedCurso(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200">
                                <option value="">Seleccionar curso…</option>
                                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <button onClick={handleStart} disabled={starting || !selectedRetoId || !selectedCurso}
                            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-amber-200">
                            <Play className="w-4 h-4" /> {starting ? 'Iniciando…' : 'Iniciar sesión'}
                        </button>
                    </div>
                </div>
            ) : (
                /* ── Dashboard sesión activa ── */
                <div className="space-y-5">
                    {/* Info bar */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse">● EN VIVO</span>
                                <span className="text-xs text-slate-400">{sesionActiva.curso}</span>
                            </div>
                            <p className="font-bold text-slate-800 truncate">{sesionActiva.retoTitulo}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={copyUrl}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${copied ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copiada' : 'Copiar URL'}
                            </button>
                            <button onClick={handleClose}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors">
                                <X className="w-3.5 h-3.5" /> Cerrar sesión
                            </button>
                        </div>
                    </div>

                    {/* URL para proyectar */}
                    <div className="bg-slate-800 rounded-2xl p-4 flex items-center gap-3">
                        <p className="text-xs text-slate-400 shrink-0">URL para alumnos:</p>
                        <p className="font-mono text-sm text-amber-400 truncate flex-1">{sesionUrl}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'En progreso', val: enProgreso, color: 'blue' },
                            { label: 'Enviadas', val: enviadas, color: 'emerald' },
                            { label: 'Alertas', val: alertas, color: 'amber' },
                            { label: 'Bloqueadas', val: bloqueadas, color: 'red' },
                        ].map(({ label, val, color }) => (
                            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                                <p className={`text-2xl font-extrabold text-${color}-600`}>{val}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Grid de alumnos */}
                    {respuestas.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
                            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">Esperando que los alumnos ingresen a la URL…</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {respuestas.map(r => (
                                <AlumnoCard key={r.id} resp={r} onUnlock={handleUnlock} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
