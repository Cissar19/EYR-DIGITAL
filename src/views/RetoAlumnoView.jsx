import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import {
    doc, getDoc, collection, query, where, getDocs, addDoc,
    updateDoc, onSnapshot, serverTimestamp, increment,
} from 'firebase/firestore';
import { Zap, AlertTriangle, WifiOff, Check, Clock, Send, ShieldAlert } from 'lucide-react';

const AUTOSAVE_MS = 30_000;

function formatTimer(seconds) {
    if (!seconds || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ─── Static screens ─── */
function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Cargando reto…</p>
            </div>
        </div>
    );
}

function ErrorScreen({ message }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="text-center max-w-sm">
                <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h2 className="font-bold text-slate-700 mb-1">Sesión no disponible</h2>
                <p className="text-sm text-slate-400">{message || 'Este enlace no existe o ya expiró.'}</p>
            </div>
        </div>
    );
}

function YaEnviadaScreen({ studentName }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="text-center max-w-sm">
                <Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h2 className="font-bold text-slate-700 mb-1">Ya enviaste el reto</h2>
                {studentName && <p className="text-sm text-slate-500 mb-1">{studentName}</p>}
                <p className="text-sm text-slate-400">Tu respuesta ya fue registrada. Puedes cerrar esta ventana.</p>
            </div>
        </div>
    );
}

/* ─── Main view ─── */
export default function RetoAlumnoView() {
    const { sesionId } = useParams();

    const [stage, setStage] = useState('cargando');
    // cargando | identificacion | reto | error | cerrada

    const [sesion, setSesion] = useState(null);
    const [reto, setReto] = useState(null);

    // identificacion
    const [rut, setRut] = useState('');
    const [rutError, setRutError] = useState('');
    const [identifying, setIdentifying] = useState(false);

    // reto in-progress
    const [studentName, setStudentName] = useState('');
    const [respuestaId, setRespuestaId] = useState(null);
    const [texto, setTexto] = useState('');
    const [estado, setEstado] = useState('en_progreso'); // from Firestore snapshot
    const [cambiosPestana, setCambiosPestana] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [startedAt, setStartedAt] = useState(null);
    const [showWarning, setShowWarning] = useState(false);
    const [showCritical, setShowCritical] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [savedAt, setSavedAt] = useState(null);

    // Refs (stable values usable in async callbacks / event listeners)
    const anonUidRef = useRef(null);
    const respuestaIdRef = useRef(null);
    const textoRef = useRef('');
    const cambiosRef = useRef(0);

    /* ── 1. Init: anonymous auth + load sesion / reto ── */
    useEffect(() => {
        let cancelled = false;
        async function init() {
            try {
                const cred = await signInAnonymously(auth);
                if (cancelled) return;
                anonUidRef.current = cred.user.uid;

                const sesionSnap = await getDoc(doc(db, 'sesiones_reto', sesionId));
                if (!sesionSnap.exists()) { if (!cancelled) setStage('error'); return; }
                const sd = { id: sesionSnap.id, ...sesionSnap.data() };
                if (sd.estado !== 'activa') { if (!cancelled) setStage('cerrada'); return; }

                const retoSnap = await getDoc(doc(db, 'retos', sd.retoId));
                if (!retoSnap.exists()) { if (!cancelled) setStage('error'); return; }

                if (!cancelled) {
                    setSesion(sd);
                    setReto({ id: retoSnap.id, ...retoSnap.data() });
                    setStage('identificacion');
                }
            } catch { if (!cancelled) setStage('error'); }
        }
        init();
        return () => { cancelled = true; };
    }, [sesionId]);

    /* ── 2. Identify student ── */
    const handleIdentify = async () => {
        const rutClean = rut.trim().toUpperCase();
        if (!rutClean) { setRutError('Ingresa tu RUT'); return; }
        setIdentifying(true);
        setRutError('');
        try {
            // Check for existing response (handles page refresh)
            const existingSnap = await getDocs(
                query(collection(db, 'respuestas_reto'),
                    where('sesionId', '==', sesionId),
                    where('studentRut', '==', rutClean))
            );

            if (!existingSnap.empty) {
                const existingDoc = existingSnap.docs[0];
                const ed = existingDoc.data();

                if (ed.estado === 'enviada') {
                    setStudentName(ed.studentName);
                    setStage('ya_enviada');
                    return;
                }

                // Resume — update anonUid so writes still work
                await updateDoc(doc(db, 'respuestas_reto', existingDoc.id), {
                    anonUid: anonUidRef.current,
                    updatedAt: serverTimestamp(),
                });

                respuestaIdRef.current = existingDoc.id;
                setRespuestaId(existingDoc.id);
                setStudentName(ed.studentName);
                textoRef.current = ed.texto || '';
                setTexto(ed.texto || '');
                cambiosRef.current = ed.cambiosPestana || 0;
                setCambiosPestana(ed.cambiosPestana || 0);
                setStartedAt(ed.startedAt?.toDate?.() ?? new Date());
                setEstado(ed.estado || 'en_progreso');
                setStage('reto');
                return;
            }

            // New student — look up name from students collection
            const studentsSnap = await getDocs(
                query(collection(db, 'students'), where('rut', '==', rutClean))
            );

            let foundName = rutClean;
            if (!studentsSnap.empty) {
                const s = studentsSnap.docs[0].data();
                foundName = s.fullName || `${s.firstName || ''} ${s.paternalLastName || ''}`.trim() || rutClean;
            }

            const newRef = await addDoc(collection(db, 'respuestas_reto'), {
                sesionId,
                retoId: sesion.retoId,
                studentName: foundName,
                studentRut: rutClean,
                anonUid: anonUidRef.current,
                curso: sesion.curso,
                estado: 'en_progreso',
                texto: '',
                cambiosPestana: 0,
                startedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            respuestaIdRef.current = newRef.id;
            setRespuestaId(newRef.id);
            setStudentName(foundName);
            setStartedAt(new Date());
            setStage('reto');
        } catch {
            setRutError('No se pudo identificarte. Intenta nuevamente.');
        } finally {
            setIdentifying(false);
        }
    };

    /* ── 3. Real-time snapshot on own doc (detect unlock / estado changes) ── */
    useEffect(() => {
        if (!respuestaId) return;
        const unsub = onSnapshot(doc(db, 'respuestas_reto', respuestaId), (snap) => {
            if (!snap.exists()) return;
            const d = snap.data();
            setEstado(d.estado);
            const c = d.cambiosPestana || 0;
            setCambiosPestana(c);
            cambiosRef.current = c;
        });
        return () => unsub();
    }, [respuestaId]);

    /* ── 4. Warning banners driven by cambiosPestana ── */
    useEffect(() => {
        if (cambiosPestana === 1) { setShowWarning(true); setShowCritical(false); }
        else if (cambiosPestana === 2) { setShowWarning(false); setShowCritical(true); }
        else if (cambiosPestana >= 3) { setShowWarning(false); setShowCritical(false); }
    }, [cambiosPestana]);

    /* ── 5. Timer ── */
    useEffect(() => {
        if (!startedAt || stage !== 'reto') return;
        const t0 = startedAt instanceof Date ? startedAt.getTime() : startedAt;
        const iv = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
        return () => clearInterval(iv);
    }, [startedAt, stage]);

    /* ── 6. Tab-switch detection ── */
    useEffect(() => {
        if (stage !== 'reto') return;
        const handle = async () => {
            if (document.visibilityState !== 'hidden') return;
            if (!respuestaIdRef.current) return;
            const next = cambiosRef.current + 1;
            cambiosRef.current = next;
            const updates = { cambiosPestana: increment(1), updatedAt: serverTimestamp() };
            if (next >= 3) updates.estado = 'bloqueada';
            try { await updateDoc(doc(db, 'respuestas_reto', respuestaIdRef.current), updates); } catch {}
        };
        document.addEventListener('visibilitychange', handle);
        return () => document.removeEventListener('visibilitychange', handle);
    }, [stage]);

    /* ── 7. Autosave ── */
    const doSave = useCallback(async () => {
        if (!respuestaIdRef.current) return;
        try {
            await updateDoc(doc(db, 'respuestas_reto', respuestaIdRef.current), {
                texto: textoRef.current,
                updatedAt: serverTimestamp(),
            });
            setSavedAt(new Date());
        } catch {}
    }, []);

    useEffect(() => {
        if (stage !== 'reto') return;
        const iv = setInterval(doSave, AUTOSAVE_MS);
        return () => clearInterval(iv);
    }, [stage, doSave]);

    /* ── 8. Submit ── */
    const handleSubmit = async () => {
        if (!respuestaIdRef.current || submitting) return;
        setSubmitting(true);
        try {
            await updateDoc(doc(db, 'respuestas_reto', respuestaIdRef.current), {
                texto: textoRef.current,
                estado: 'enviada',
                enviadoAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            // estado will update via onSnapshot
        } catch { setSubmitting(false); }
    };

    /* ── Anti-paste ── */
    const block = (e) => { e.preventDefault(); e.stopPropagation(); };
    const blockKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'v') e.preventDefault(); };

    /* ── Render ── */
    if (stage === 'cargando') return <LoadingScreen />;
    if (stage === 'error') return <ErrorScreen />;
    if (stage === 'cerrada') return <ErrorScreen message="Esta sesión ya fue cerrada por el asistente." />;
    if (stage === 'ya_enviada') return <YaEnviadaScreen studentName={studentName} />;

    if (stage === 'identificacion') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Zap className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-extrabold text-slate-800 leading-tight">No Pierde Clases</p>
                            <p className="text-xs text-slate-400">{sesion?.curso} · {reto?.titulo}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
                        <h2 className="font-bold text-slate-700 mb-5">Identifícate</h2>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Tu RUT</label>
                        <input
                            type="text"
                            value={rut}
                            onChange={e => setRut(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleIdentify()}
                            placeholder="12.345.678-9"
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 mb-1"
                            autoFocus
                        />
                        {rutError && <p className="text-red-500 text-xs mb-3">{rutError}</p>}
                        <button
                            onClick={handleIdentify}
                            disabled={identifying || !rut.trim()}
                            className="w-full mt-4 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-sm transition-all shadow-lg shadow-amber-200"
                        >
                            {identifying ? 'Verificando…' : 'Entrar al reto →'}
                        </button>
                    </div>

                    <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
                        <p className="text-xs text-amber-700 font-bold mb-1">Reglas del reto</p>
                        <ul className="text-xs text-amber-600 space-y-0.5 list-disc list-inside">
                            <li>No puedes pegar texto desde el portapapeles.</li>
                            <li>Cambiar de pestaña genera alertas. Al tercer cambio quedarás bloqueado/a.</li>
                            <li>Podrás enviar a partir del minuto {reto?.habilitarEnvioMin}.</li>
                            <li>Tu respuesta se guarda automáticamente cada 30 segundos.</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // Stage: 'reto'
    const duracionSecs = (reto?.habilitarEnvioMin || 20) * 60;
    const canSubmit = elapsed >= duracionSecs;
    const timeLeft = Math.max(0, (reto?.duracionMin || 45) * 60 - elapsed);
    const isBlocked = estado === 'bloqueada';
    const isEnviada = estado === 'enviada';
    const timeLeftToSend = Math.max(0, duracionSecs - elapsed);

    return (
        <div className="min-h-screen bg-slate-50 pb-8">
            {/* ── Blocked overlay ── */}
            {isBlocked && (
                <div className="fixed inset-0 z-50 bg-red-900/90 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Acceso bloqueado</h2>
                        <p className="text-sm text-slate-500 mb-5">
                            Cambiaste de pestaña 3 veces. Tu asistente debe desbloquearte para continuar.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs animate-pulse">
                            <Clock className="w-3.5 h-3.5" /> Esperando desbloqueo…
                        </div>
                    </div>
                </div>
            )}

            {/* ── Submitted overlay ── */}
            {isEnviada && (
                <div className="fixed inset-0 z-50 bg-emerald-900/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                        <Check className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-xl font-extrabold text-slate-800 mb-2">¡Reto enviado!</h2>
                        <p className="text-sm text-slate-500">Tu respuesta fue recibida correctamente. Puedes cerrar esta ventana.</p>
                    </div>
                </div>
            )}

            <div className="max-w-2xl mx-auto px-4 pt-5">
                {/* ── Header bar ── */}
                <div className="flex items-center justify-between mb-4">
                    <div className="min-w-0">
                        <p className="text-xs text-slate-400 truncate">{sesion?.curso} · {reto?.titulo}</p>
                        <p className="font-bold text-slate-800 truncate">{studentName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {savedAt && (
                            <span className="hidden sm:block text-xs text-slate-400">
                                Guardado {savedAt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                            timeLeft < 120 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-700'
                        }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {formatTimer(timeLeft)}
                        </div>
                    </div>
                </div>

                {/* ── Warning banners ── */}
                {showWarning && (
                    <div className="mb-3 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-amber-800">Advertencia (1/3): cambio de pestaña detectado</p>
                            <p className="text-xs text-amber-600">Si cambias de pestaña dos veces más quedarás bloqueado/a.</p>
                        </div>
                        <button onClick={() => setShowWarning(false)} className="text-amber-400 hover:text-amber-600 shrink-0 text-sm leading-none">✕</button>
                    </div>
                )}
                {showCritical && (
                    <div className="mb-3 bg-orange-50 border border-orange-300 rounded-2xl p-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-orange-800">¡ÚLTIMO AVISO! (2/3): cambio de pestaña</p>
                            <p className="text-xs text-orange-600">El próximo cambio bloqueará tu acceso permanentemente hasta que el asistente te desbloquee.</p>
                        </div>
                        <button onClick={() => setShowCritical(false)} className="text-orange-400 hover:text-orange-600 shrink-0 text-sm leading-none">✕</button>
                    </div>
                )}

                {/* ── Instructions ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
                    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                        {reto?.titulo}
                    </h3>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{reto?.instrucciones}</p>
                </div>

                {/* ── Textarea ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tu respuesta</label>
                    <textarea
                        value={texto}
                        onChange={e => { setTexto(e.target.value); textoRef.current = e.target.value; }}
                        onPaste={block}
                        onDrop={block}
                        onContextMenu={block}
                        onKeyDown={blockKey}
                        rows={14}
                        disabled={isBlocked || isEnviada}
                        placeholder="Escribe aquí tu respuesta…"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1.5 text-right">{texto.length} caracteres</p>
                </div>

                {/* ── Submit bar ── */}
                <div className="flex items-center gap-3">
                    {!canSubmit ? (
                        <p className="text-xs text-slate-400 flex-1">
                            Envío disponible en {formatTimer(timeLeftToSend)} (min {reto?.habilitarEnvioMin})
                        </p>
                    ) : (
                        <p className="text-xs text-emerald-600 font-semibold flex-1">Puedes enviar tu respuesta</p>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting || isBlocked || isEnviada}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all shadow-lg shadow-amber-200"
                    >
                        <Send className="w-4 h-4" />
                        {submitting ? 'Enviando…' : 'Enviar reto'}
                    </button>
                </div>
            </div>
        </div>
    );
}
