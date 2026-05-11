import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Plus, Pin, X,
    Clock, BookOpen, User, Pencil, Trash2, CheckCircle, XCircle, AlertCircle,
    FileDown, Loader2, NotebookPen, Users, Layers, Flag, BanIcon, Table2, Megaphone, GraduationCap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, canEdit, isAdmin, isManagement } from '../context/AuthContext';
import { useEvaluaciones } from '../context/EvaluacionesContext';
import CrearEvaluacionModal from './CrearEvaluacionModal';
import { AgendaSemanalModal } from './AgendaSemanal';
import { CURSOS } from '../data/objetivosAprendizaje';
import { exportCalendarioPDF, exportAgendaMensualCardPDF, exportAgendaTabularPDF, AVISOS_DEFAULT } from '../lib/pdfExport';
import { useHolidays } from '../context/HolidaysContext';
import { toast } from 'sonner';
import { useSchedule } from '../context/ScheduleContext';
import { useCourseSchedule } from '../context/CourseScheduleContext';

const DIA_TO_OFFSET = { lunes: 0, martes: 1, miercoles: 2, jueves: 3, viernes: 4 };

// "Juan Carlos García López" → "J. García"
function shortName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const initial = parts[0][0].toUpperCase() + '.';
    const surname = parts.length >= 4 ? parts[2] : parts[1];
    return `Prof. ${initial} ${surname}`;
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Legacy Tailwind classes — used only in EvalDetailModal & EditarFechasModal
const ASIG_COLORS = {
    MA: 'bg-blue-600 text-white',
    LE: 'bg-violet-600 text-white',
    CN: 'bg-emerald-600 text-white',
    HI: 'bg-amber-500 text-white',
    IN: 'bg-sky-500 text-white',
    EF: 'bg-orange-500 text-white',
    AV: 'bg-fuchsia-600 text-white',
    MU: 'bg-rose-600 text-white',
    TE: 'bg-slate-600 text-white',
    OR: 'bg-teal-600 text-white',
};

const ASIG_FULL = {
    MA: 'Matemática', LE: 'Lenguaje', CN: 'Ciencias Naturales', HI: 'Historia',
    IN: 'Inglés', EF: 'Ed. Física', AV: 'Artes Visuales', MU: 'Música',
    TE: 'Tecnología', OR: 'Orientación',
};

// New design color palette — mature educational colors
const SUB_COLORS = {
    MA: { color: '#2F6FE0', soft: '#E0EAFB' },
    LE: { color: '#C84B5A', soft: '#F8DEE2' },
    CN: { color: '#2E8B57', soft: '#DEEEE3' },
    HI: { color: '#B66A2C', soft: '#F4E0CC' },
    IN: { color: '#6B4FB8', soft: '#E5DEF4' },
    EF: { color: '#D9762B', soft: '#F8E1CC' },
    AV: { color: '#B83E8E', soft: '#F4D7E7' },
    MU: { color: '#7E3FAA', soft: '#EBDDF3' },
    TE: { color: '#1F8A95', soft: '#D4ECEF' },
    OR: { color: '#4D8C42', soft: '#DEEBD9' },
};

const SUBJECTS_LIST = Object.entries(ASIG_FULL).map(([key, name]) => ({ key, name }));

// Design tokens
const PRIMARY   = '#1F6F6B';
const PRIMARY_2 = '#2A8C87';
const PRIMARY_SOFT = '#DCEDEB';
const ACCENT    = '#E96C4F';
const HONEY     = '#F0B341';
const INK       = '#1F2A2E';
const INK_2     = '#4A5560';
const INK_3     = '#8A95A0';
const LINE      = '#ECE3D2';

// ─── Build Mon-Fri grid for a given year+month ────────────────────────────────
function buildMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);

    const start = new Date(firstDay);
    const startDow = start.getDay();
    start.setDate(start.getDate() - (startDow === 0 ? 6 : startDow - 1));

    const end = new Date(lastDay);
    const endDow = end.getDay();
    if (endDow === 0)      end.setDate(end.getDate() - 2);
    else if (endDow === 6) end.setDate(end.getDate() - 1);
    else if (endDow < 5)   end.setDate(end.getDate() + (5 - endDow));

    const weeks  = [];
    const cursor = new Date(start);
    while (cursor <= end) {
        const week = [];
        for (let d = 0; d < 5; d++) {
            const day = new Date(cursor);
            day.setDate(cursor.getDate() + d);
            week.push({
                dateStr: day.toISOString().slice(0, 10),
                inMonth: day.getMonth() === month && day.getFullYear() === year,
            });
        }
        weeks.push(week);
        cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
}

// ─── Animated background ──────────────────────────────────────────────────────
function AnimatedBg() {
    return (
        <div
            aria-hidden
            style={{
                position: 'fixed', inset: 0, zIndex: 0,
                pointerEvents: 'none', overflow: 'hidden',
                background: [
                    'radial-gradient(ellipse 80% 60% at 80% 0%, #DCEDEB 0%, transparent 55%)',
                    'radial-gradient(ellipse 70% 50% at 0% 100%, #FBEDC9 0%, transparent 55%)',
                    '#FBF7F1',
                ].join(', '),
            }}
        >
            {/* Dot pattern — slow drift */}
            <div style={{
                position: 'absolute', inset: '-20%', backgroundRepeat: 'repeat', opacity: 0.55,
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g fill='none' stroke='%231F6F6B' stroke-opacity='0.08' stroke-width='1'><circle cx='60' cy='60' r='3'/><circle cx='0' cy='0' r='2'/><circle cx='120' cy='0' r='2'/><circle cx='0' cy='120' r='2'/><circle cx='120' cy='120' r='2'/></g></svg>")`,
                animation: 'calDriftA 60s linear infinite',
            }} />
            {/* Wave pattern — slower drift */}
            <div style={{
                position: 'absolute', inset: '-20%', backgroundRepeat: 'repeat', opacity: 0.55,
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><g fill='none' stroke='%23E96C4F' stroke-opacity='0.07' stroke-width='1.2'><path d='M0,100 Q50,60 100,100 T200,100'/><path d='M0,150 Q50,110 100,150 T200,150'/><path d='M0,50 Q50,10 100,50 T200,50'/></g></svg>")`,
                animation: 'calDriftB 90s linear infinite',
            }} />
            {/* Blob 1 — teal, top-right */}
            <div style={{
                position: 'absolute', borderRadius: '50%', filter: 'blur(60px)',
                width: 480, height: 480, background: '#1F6F6B',
                top: -120, right: -120, opacity: 0.12,
                animation: 'calFloatA 18s ease-in-out infinite',
            }} />
            {/* Blob 2 — coral, bottom-center */}
            <div style={{
                position: 'absolute', borderRadius: '50%', filter: 'blur(60px)',
                width: 380, height: 380, background: '#E96C4F',
                bottom: -120, left: '20%', opacity: 0.10,
                animation: 'calFloatB 22s ease-in-out infinite',
            }} />
            {/* Blob 3 — honey, left-mid */}
            <div style={{
                position: 'absolute', borderRadius: '50%', filter: 'blur(60px)',
                width: 300, height: 300, background: '#F0B341',
                top: '40%', left: -100, opacity: 0.12,
                animation: 'calFloatC 26s ease-in-out infinite',
            }} />
        </div>
    );
}

// ─── CalModal — modal chrome del nuevo diseño ─────────────────────────────────
function CalModal({ onClose, width = 580, children }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            className="cal-modal-overlay"
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(31,42,46,.32)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                animation: 'calFadeIn .2s ease-out',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="cal-modal-inner"
                style={{
                    width, maxWidth: '100%',
                    background: '#fff',
                    borderRadius: 22,
                    border: `1px solid ${LINE}`,
                    boxShadow: '0 24px 60px -20px rgba(31,42,46,.22), 0 8px 18px -10px rgba(31,42,46,.10)',
                    display: 'flex', flexDirection: 'column',
                    maxHeight: 'calc(100vh - 48px)',
                    overflow: 'hidden',
                    animation: 'calPopIn .25s cubic-bezier(.4,0,.2,1)',
                }}
            >
                {/* Pull indicator — visible only on mobile */}
                <div className="cal-modal-pull" aria-hidden />
                {/* Gradient stripe */}
                <div style={{
                    height: 6, flexShrink: 0,
                    background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT}, ${HONEY})`,
                }} />
                {children}
            </div>
        </div>
    );
}

// ─── EvalDetailModal ──────────────────────────────────────────────────────────
function EvalDetailModal({ eval: ev, onClose, onEdit, onDelete, canCRUD, canEditEval, onApprove, onReject }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const pending  = ev.pendingChanges;
    const sc       = SUB_COLORS[ev.asignatura];
    const dateLabel = ev.date
        ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

    return (
        <CalModal onClose={onClose} width={520}>
            {/* Head */}
            <div className="cal-modal-head" style={{ padding: '22px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: sc?.soft || PRIMARY_SOFT, color: sc?.color || PRIMARY,
                    display: 'grid', placeItems: 'center',
                }}>
                    <CalendarDays className="w-5 h-5" />
                </div>
                <div style={{ flex: 1 }}>
                    <h2 className="font-headline" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', margin: 0, color: INK }}>{ev.name}</h2>
                    <p style={{ fontSize: 13, color: INK_2, marginTop: 3, textTransform: 'capitalize' }}>{dateLabel}</p>
                </div>
                <button onClick={onClose} className="transition-colors hover:bg-slate-100 rounded-lg"
                    style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', color: INK_2, flexShrink: 0 }}>
                    <X size={18} />
                </button>
            </div>

            {/* Body */}
            <div className="cal-modal-body" style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Asignatura + Curso */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: sc?.soft || PRIMARY_SOFT, borderRadius: 12, border: `1px solid ${LINE}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: sc?.color || PRIMARY, color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: sc?.color || PRIMARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {ASIG_FULL[ev.asignatura] || ev.asignatura}
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: INK, marginTop: 1 }}>{ev.curso}</p>
                    </div>
                </div>

                {/* Horario */}
                {ev.slots && ev.slots.length > 0 && (
                    <div style={{ padding: '14px 16px', background: '#FBF7F1', borderRadius: 12, border: `1px solid ${LINE}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                            <Clock className="w-4 h-4" style={{ color: INK_3 }} />
                            <p style={{ fontSize: 11, fontWeight: 700, color: INK_2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Horario</p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {ev.slots.map((s, i) => (
                                <div key={i} style={{ padding: '8px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${LINE}`, display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: PRIMARY }}>{s.day}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{s.label}</span>
                                    {s.startTime && <span style={{ fontSize: 11, color: INK_3 }}>{s.startTime}{s.endTime ? `–${s.endTime}` : ''}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* OAs */}
                {ev.oaCodes && ev.oaCodes.length > 0 && (
                    <div style={{ padding: '14px 16px', background: '#FBF7F1', borderRadius: 12, border: `1px solid ${LINE}` }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: INK_2, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>OA a evaluar</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {ev.oaCodes.map(code => (
                                <span key={code} style={{ padding: '4px 10px', borderRadius: 6, background: '#FBEDC9', color: '#6b4a06', fontSize: 11, fontWeight: 700 }}>
                                    {code.split('-').pop()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Creado por */}
                {ev.createdBy?.name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#FBF7F1', borderRadius: 12, border: `1px solid ${LINE}` }}>
                        <User className="w-4 h-4" style={{ color: INK_3, flexShrink: 0 }} />
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: INK_3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Creado por</p>
                            <p style={{ fontSize: 13, fontWeight: 600, color: INK }}>{ev.createdBy.name}</p>
                        </div>
                    </div>
                )}

                {/* Cambios pendientes */}
                {pending && (
                    <div style={{ padding: '14px 16px', borderRadius: 12, border: '2px solid #fcd34d', background: '#fffbeb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <AlertCircle className="w-4 h-4" style={{ color: '#d97706', flexShrink: 0 }} />
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Cambios pendientes de aprobación</p>
                        </div>
                        {pending.name && pending.name !== ev.name && (
                            <div style={{ marginBottom: 8 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#d97706', marginBottom: 2 }}>Nuevo título</p>
                                <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>{pending.name}</p>
                            </div>
                        )}
                        {pending.oaCodes?.length > 0 && (
                            <div style={{ marginBottom: 8 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#d97706', marginBottom: 6 }}>Nuevos OA</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {pending.oaCodes.map(code => (
                                        <span key={code} style={{ padding: '4px 10px', borderRadius: 6, background: '#fde68a', color: '#92400e', fontSize: 11, fontWeight: 700 }}>{code.split('-').pop()}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {pending.submittedBy?.name && (
                            <p style={{ fontSize: 12, color: '#d97706' }}>Propuesto por <strong>{pending.submittedBy.name}</strong></p>
                        )}
                        {canCRUD && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <button onClick={onApprove} className="flex items-center gap-1.5 transition-colors hover:brightness-95"
                                    style={{ padding: '8px 16px', borderRadius: 10, background: '#10b981', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                                    <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                                </button>
                                <button onClick={onReject} className="flex items-center gap-1.5 transition-colors hover:bg-red-200"
                                    style={{ padding: '8px 16px', borderRadius: 10, background: '#fee2e2', color: '#dc2626', fontSize: 12, fontWeight: 700 }}>
                                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                                </button>
                            </div>
                        )}
                        {!canCRUD && <p style={{ fontSize: 12, color: '#d97706', fontStyle: 'italic', marginTop: 8 }}>En revisión por la jefa UTP.</p>}
                    </div>
                )}
            </div>

            {/* Foot */}
            <div className="cal-modal-foot" style={{ padding: '14px 24px', borderTop: `1px solid ${LINE}`, background: '#FAF6EE', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {(canCRUD || canEditEval) && !confirmDelete && (
                    <>
                        <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 transition-colors hover:bg-red-50 rounded-xl"
                            style={{ padding: '8px 14px', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                            <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                        <button onClick={onEdit} className="flex items-center gap-1.5 transition-colors hover:bg-slate-100 rounded-xl"
                            style={{ padding: '8px 14px', color: PRIMARY, fontSize: 13, fontWeight: 600 }}>
                            <Pencil className="w-4 h-4" /> Editar
                        </button>
                    </>
                )}
                {confirmDelete && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', flex: 1 }}>¿Eliminar esta evaluación?</span>
                        <button onClick={() => setConfirmDelete(false)} className="transition-colors hover:bg-slate-100 rounded-xl"
                            style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: INK_2 }}>Cancelar</button>
                        <button onClick={onDelete} className="transition-colors hover:brightness-95 rounded-xl"
                            style={{ padding: '8px 14px', fontSize: 13, fontWeight: 700, background: '#dc2626', color: '#fff' }}>Sí, eliminar</button>
                    </div>
                )}
                {!confirmDelete && (
                    <button onClick={onClose} className="ml-auto transition-colors hover:bg-slate-100 rounded-xl"
                        style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, color: INK_2 }}>Cerrar</button>
                )}
            </div>
        </CalModal>
    );
}

// ─── EditarFechasModal ────────────────────────────────────────────────────────
function EditarFechasModal({ evaluaciones, user, canCRUD, onEdit, onClose }) {
    const myEvals = canCRUD
        ? [...evaluaciones].sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        : evaluaciones.filter(e => e.createdBy?.id === user.uid).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return (
        <CalModal onClose={onClose} width={560}>
            {/* Head */}
            <div className="cal-modal-head" style={{ padding: '22px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: PRIMARY_SOFT, color: PRIMARY, display: 'grid', placeItems: 'center' }}>
                    <Pencil className="w-5 h-5" />
                </div>
                <div style={{ flex: 1 }}>
                    <h2 className="font-headline" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', margin: 0, color: INK }}>Editar fechas</h2>
                    <p style={{ fontSize: 13, color: INK_2, marginTop: 3 }}>
                        {canCRUD ? 'Todas las evaluaciones programadas' : 'Tus evaluaciones programadas'}
                    </p>
                </div>
                <button onClick={onClose} className="transition-colors hover:bg-slate-100 rounded-lg"
                    style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', color: INK_2, flexShrink: 0 }}>
                    <X size={18} />
                </button>
            </div>

            {/* Body */}
            <div className="cal-modal-body" style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myEvals.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: PRIMARY_SOFT, color: PRIMARY, display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        <p style={{ fontSize: 14, color: INK_2, fontWeight: 500 }}>No hay evaluaciones programadas.</p>
                    </div>
                )}
                {myEvals.map(ev => {
                    const sc = SUB_COLORS[ev.asignatura];
                    const dateLabel = ev.date
                        ? new Date(ev.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
                        : '—';
                    return (
                        <div key={ev.id} className="flex items-center gap-3 transition-colors hover:bg-slate-50 rounded-2xl"
                            style={{ padding: '10px 12px', border: `1px solid ${LINE}`, borderRadius: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc?.color || INK_3, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</p>
                                <p style={{ fontSize: 11, color: INK_3, textTransform: 'capitalize', marginTop: 2 }}>
                                    {dateLabel} · {ASIG_FULL[ev.asignatura] || ev.asignatura} · {ev.curso}
                                </p>
                            </div>
                            {ev.pendingChanges && <AlertCircle size={15} style={{ color: '#d97706', flexShrink: 0 }} title="Cambios pendientes" />}
                            <button onClick={() => onEdit(ev)} className="flex items-center gap-1.5 transition-colors hover:bg-slate-100 rounded-lg"
                                style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: PRIMARY, flexShrink: 0 }}>
                                <Pencil className="w-3.5 h-3.5" /> Editar
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Foot */}
            <div className="cal-modal-foot" style={{ padding: '14px 24px', borderTop: `1px solid ${LINE}`, background: '#FAF6EE', flexShrink: 0 }}>
                <button onClick={onClose} className="w-full transition-colors hover:bg-slate-100 rounded-xl"
                    style={{ padding: '10px', fontSize: 13, fontWeight: 600, color: INK_2 }}>Cerrar</button>
            </div>
        </CalModal>
    );
}

// ─── DayModal — clic en una celda del calendario ──────────────────────────────
function DayModal({ dateStr, events, agendaItems = [], onClose, onNew, onDetail, canCreate, onDeleteAgendaEntry, currentUserId, canCRUD }) {
    const date      = new Date(dateStr + 'T12:00:00');
    const dayNum    = date.getDate();
    const monthName = MESES[date.getMonth()];
    const weekDay   = date.toLocaleDateString('es-CL', { weekday: 'long' });
    const hasContent = events.length > 0 || agendaItems.length > 0;

    // Group agenda items by subject for cleaner display
    const agendaByAsig = useMemo(() => {
        const map = {};
        agendaItems.forEach(item => {
            const key = `${item.curso}__${item.asignatura}`;
            if (!map[key]) map[key] = { curso: item.curso, asignatura: item.asignatura, docenteName: item.docenteName, items: [] };
            map[key].items.push(item);
        });
        return Object.values(map);
    }, [agendaItems]);

    return (
        <CalModal onClose={onClose} width={460}>
            {/* Head */}
            <div className="cal-modal-head" style={{ padding: '22px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: '#FBEDC9', color: HONEY, display: 'grid', placeItems: 'center' }}>
                    <CalendarDays className="w-5 h-5" />
                </div>
                <div style={{ flex: 1 }}>
                    <h2 className="font-headline" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', margin: 0, color: INK }}>
                        {dayNum} de {monthName}
                    </h2>
                    <p style={{ fontSize: 13, color: INK_2, marginTop: 3, textTransform: 'capitalize' }}>
                        {!hasContent
                            ? `${weekDay} — sin actividad`
                            : weekDay}
                    </p>
                </div>
                <button onClick={onClose} className="transition-colors hover:bg-slate-100 rounded-lg"
                    style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', color: INK_2, flexShrink: 0 }}>
                    <X size={18} />
                </button>
            </div>

            {/* Body */}
            <div className="cal-modal-body" style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!hasContent ? (
                    /* Empty state */
                    <div style={{ textAlign: 'center', padding: '12px 0 24px' }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 18, margin: '0 auto 14px',
                            background: `linear-gradient(135deg, ${PRIMARY_SOFT}, #FBEDC9)`,
                            display: 'grid', placeItems: 'center', color: PRIMARY,
                        }}>
                            <CalendarDays className="w-7 h-7" />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 6 }}>Día libre</p>
                        <p style={{ fontSize: 13, color: INK_2, marginBottom: 20 }}>No hay evaluaciones para este día. ¿Quieres programar una?</p>
                        {canCreate && (
                            <button onClick={onNew} className="inline-flex items-center gap-2 transition-all hover:-translate-y-px hover:brightness-95"
                                style={{ padding: '10px 20px', borderRadius: 10, background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: `0 6px 14px -6px ${PRIMARY}` }}>
                                <Plus className="w-4 h-4" /> Fijar una prueba
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Evaluaciones */}
                        {events.length > 0 && (
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: INK_3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                    Evaluaciones · {events.length}
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {events.map(ev => {
                                        const sc = SUB_COLORS[ev.asignatura];
                                        return (
                                            <button
                                                key={ev.id}
                                                onClick={() => onDetail(ev)}
                                                className="w-full text-left transition-colors hover:brightness-95"
                                                style={{
                                                    padding: '12px 14px', borderRadius: 10,
                                                    background: '#FAF6EE', border: `1px solid ${LINE}`,
                                                    borderLeft: `4px solid ${sc?.color || INK_3}`,
                                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: 14, fontWeight: 700, color: INK }}>{ev.name}</p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
                                                        <span style={{ padding: '2px 8px', borderRadius: 4, background: sc?.soft || '#f1f5f9', color: sc?.color || INK_3, fontSize: 11, fontWeight: 700 }}>
                                                            {ASIG_FULL[ev.asignatura] || ev.asignatura}
                                                        </span>
                                                        <span style={{ fontSize: 12, color: INK_2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <Users className="w-3 h-3" /> {ev.curso}
                                                        </span>
                                                    </div>
                                                </div>
                                                {ev.pendingChanges && (
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: HONEY, border: '2px solid #fff', flexShrink: 0, marginTop: 4 }} title="Cambios pendientes" />
                                                )}
                                            </button>
                                        );
                                    })}
                                    {canCreate && (
                                        <button onClick={onNew} className="w-full flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                                            style={{ padding: '10px', borderRadius: 10, background: PRIMARY_SOFT, color: PRIMARY, fontSize: 13, fontWeight: 600, border: `1px dashed ${PRIMARY}`, marginTop: 4 }}>
                                            <Plus className="w-4 h-4" /> Agregar evaluación
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Agenda semanal */}
                        {agendaByAsig.length > 0 && (
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: INK_3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <NotebookPen style={{ width: 11, height: 11 }} /> Agenda semanal
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {agendaByAsig.map((group, gi) => (
                                        <div key={gi} style={{
                                            padding: '10px 14px', borderRadius: 10,
                                            background: '#EEF2FF',
                                            border: '1px solid #C7D2FE',
                                            borderLeft: '4px solid #818CF8',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <span style={{ fontSize: 11, fontWeight: 700, color: '#4338CA', background: '#C7D2FE', padding: '2px 8px', borderRadius: 4 }}>
                                                    {group.asignatura}
                                                </span>
                                                <span style={{ fontSize: 12, color: '#6366F1', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Users style={{ width: 11, height: 11 }} /> {group.curso}
                                                </span>
                                                {group.docenteName && (
                                                    <span style={{ fontSize: 11, color: '#818CF8', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <User style={{ width: 10, height: 10 }} /> {group.docenteName.split(' ')[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <ul style={{ margin: 0, padding: '0 0 0 14px', listStyle: 'disc' }}>
                                                {group.items.map(item => {
                                                    const canDel = onDeleteAgendaEntry && (canCRUD || item.docenteId === currentUserId);
                                                    return (
                                                        <li key={item.id} style={{ fontSize: 13, color: '#312E81', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ flex: 1 }}>{item.texto}</span>
                                                            {canDel && (
                                                                <button
                                                                    onClick={() => onDeleteAgendaEntry(item.agendaDocId, item.id, item.agendaEntries)}
                                                                    style={{
                                                                        flexShrink: 0, width: 18, height: 18,
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        borderRadius: 4, border: 'none',
                                                                        background: '#FEE2E2', color: '#DC2626',
                                                                        cursor: 'pointer', padding: 0,
                                                                    }}
                                                                    title="Eliminar entrada"
                                                                >
                                                                    <Trash2 style={{ width: 10, height: 10 }} />
                                                                </button>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add eval button (when only agenda items, no evals) */}
                        {events.length === 0 && canCreate && (
                            <button onClick={onNew} className="w-full flex items-center justify-center gap-2 transition-all hover:-translate-y-px"
                                style={{ padding: '10px', borderRadius: 10, background: PRIMARY_SOFT, color: PRIMARY, fontSize: 13, fontWeight: 600, border: `1px dashed ${PRIMARY}` }}>
                                <Plus className="w-4 h-4" /> Agregar evaluación
                            </button>
                        )}
                    </>
                )}
            </div>
        </CalModal>
    );
}

// ─── Pill selector (curso / mes) ──────────────────────────────────────────────
function PillSelector({ value, label, onPrev, onNext, canPrev, canNext, onOpen, isOpen, dropdownRef, bg, children }) {
    return (
        <div
            className="flex items-center gap-1 p-1 rounded-full"
            style={{ background: bg, boxShadow: `0 4px 12px -6px ${bg}` }}
        >
            <button
                onClick={onPrev}
                disabled={!canPrev}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'rgba(255,255,255,0.8)' }}
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={onOpen}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-white/15 transition-colors"
                    style={{ color: '#fff', fontWeight: 600, fontSize: 13, minWidth: label === 'mes' ? 130 : 110 }}
                >
                    <span className="flex-1 text-center">{value}</span>
                    <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-xl border overflow-hidden z-50"
                            style={{ borderColor: LINE }}
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <button
                onClick={onNext}
                disabled={!canNext}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: 'rgba(255,255,255,0.8)' }}
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CalendarioEvaluaciones() {
    const { user, getAllUsers } = useAuth();
    const { evaluaciones, deleteEvaluacion, approvePendingChanges, rejectPendingChanges } = useEvaluaciones();
    const { getSchedule, getAllSchedules } = useSchedule();
    const { courseAssistants, getCourseSchedule, getCourseAssistant } = useCourseSchedule();
    const { allHolidays, customHolidays, addHoliday, deleteHoliday } = useHolidays();
    const canCreateEval = canEdit(user) || user?.role === 'teacher' || user?.role === 'utp_head';
    const canCRUD = isAdmin(user) || user?.role === 'utp_head';
    const isTeacher = user?.role === 'teacher';
    const canManageHolidays = user?.role === 'utp_head';
    const isAsistenteAula = user?.role === 'asistente_aula';

    const asistenteAulaCurso = useMemo(() => {
        if (!isAsistenteAula || !user?.uid) return null;
        return Object.keys(courseAssistants).find(
            course => courseAssistants[course]?.id === user.uid
        ) || null;
    }, [isAsistenteAula, courseAssistants, user?.uid]);

    const [selectedDate, setSelectedDate]         = useState(null);
    const [dayModal, setDayModal]                 = useState(null);
    const [showFijar, setShowFijar]               = useState(false);
    const [showAgenda, setShowAgenda]             = useState(false);
    const [evalModal, setEvalModal]               = useState(null);
    const [selectedAsignatura, setSelectedAsignatura] = useState(null);
    const [showInterferiado, setShowInterferiado] = useState(false);
    const [interferiado, setInterferiado]         = useState({ date: '', name: '' });
    const [savingInterferiado, setSavingInterferiado] = useState(false);

    const today        = useMemo(() => new Date(), []);
    const todayStr     = useMemo(() => today.toISOString().slice(0, 10), [today]);
    const currentYear  = today.getFullYear();
    const currentMonth = today.getMonth();

    const availableMonths = useMemo(() => {
        const months = [];
        for (let m = currentMonth; m <= 11; m++) {
            months.push({ value: m, label: `${MESES[m]} ${currentYear}` });
        }
        return months;
    }, [currentMonth, currentYear]);

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedCurso, setSelectedCurso] = useState(null);
    const [exportingPdf, setExportingPdf]         = useState(false);
    const [exportingAgenda, setExportingAgenda]   = useState(false);
    const [showAgendaExportModal, setShowAgendaExportModal] = useState(false);
    const [agendaExportWeek, setAgendaExportWeek] = useState(() => {
        const d = new Date();
        const day = d.getDay();
        d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
        d.setHours(0, 0, 0, 0);
        return d.toISOString().slice(0, 10);
    });
    const [agendaExportCurso, setAgendaExportCurso] = useState(null);

    // ── Estado modal exportación tabular (oficio horizontal) ──────────────────
    const [showTabularExportModal, setShowTabularExportModal] = useState(false);
    const [exportingTabular, setExportingTabular] = useState(false);

    // ── Modal de avisos importantes ────────────────────────────────────────────
    const [showAvisoModal, setShowAvisoModal] = useState(false);

    // ── Avisos importantes del Profesor Jefe ──────────────────────────────────
    const [avisosJefe, setAvisosJefe]       = useState([]);
    const [nuevoAviso, setNuevoAviso]       = useState('');
    const [savingAviso, setSavingAviso]     = useState(false);
    const [editingAvisoId, setEditingAvisoId] = useState(null);
    const [editingAvisoText, setEditingAvisoText] = useState('');
    const nuevoAvisoRef                     = useRef(null);
    // Profesor jefe ve su propio curso; UTP/admin ven el curso seleccionado en el filtro
    const cursoJefe = user?.isHeadTeacher
        ? user.headTeacherOf
        : (isManagement(user) && selectedCurso ? selectedCurso : null);

    useEffect(() => {
        if (!cursoJefe) return;
        const ref = doc(db, 'avisos_profesor_jefe', cursoJefe);
        return onSnapshot(ref, snap => {
            setAvisosJefe(snap.exists() ? (snap.data().avisos || []) : []);
        });
    }, [cursoJefe]);

    const guardarAvisos = async (lista) => {
        setSavingAviso(true);
        try {
            await setDoc(doc(db, 'avisos_profesor_jefe', cursoJefe), {
                curso: cursoJefe,
                avisos: lista,
                updatedAt: new Date().toISOString(),
            });
        } catch {
            toast.error('No se pudo guardar el aviso');
        } finally {
            setSavingAviso(false);
        }
    };

    const agregarAviso = async () => {
        const texto = nuevoAviso.trim();
        if (!texto) return;
        await guardarAvisos([...avisosJefe, { id: crypto.randomUUID(), texto }]);
        setNuevoAviso('');
        nuevoAvisoRef.current?.focus();
    };

    const eliminarAviso = (id) => guardarAvisos(avisosJefe.filter(a => a.id !== id));

    const iniciarEdicionAviso = (a) => { setEditingAvisoId(a.id); setEditingAvisoText(a.texto); };
    const cancelarEdicionAviso = () => { setEditingAvisoId(null); setEditingAvisoText(''); };
    const guardarEdicionAviso = async (id) => {
        const texto = editingAvisoText.trim();
        if (!texto) return;
        await guardarAvisos(avisosJefe.map(a => a.id === id ? { ...a, texto } : a));
        cancelarEdicionAviso();
    };
    // Convierte los avisos por defecto en personalizados y pone el índice indicado en modo edición
    const adoptarYEditarDefault = async (idx) => {
        const nuevos = AVISOS_DEFAULT.map(texto => ({ id: crypto.randomUUID(), texto }));
        setEditingAvisoId(nuevos[idx].id);
        setEditingAvisoText(nuevos[idx].texto);
        await guardarAvisos(nuevos);
    };

    const agendaExportWeekLabel = useMemo(() => {
        const mon = new Date(agendaExportWeek + 'T12:00:00');
        const fri = new Date(mon);
        fri.setDate(fri.getDate() + 4);
        const fmt = d => d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
        return `${fmt(mon)} – ${fmt(fri)}`;
    }, [agendaExportWeek]);

    const agendaExportWeekDays = useMemo(() => {
        const mon = new Date(agendaExportWeek + 'T12:00:00');
        return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((label, i) => {
            const d = new Date(mon);
            d.setDate(d.getDate() + i);
            const iso = d.toISOString().slice(0, 10);
            return { label, date: d.getDate(), iso, isToday: iso === todayStr };
        });
    }, [agendaExportWeek, todayStr]);

    const agendaExportWeekOfMonth = useMemo(() => {
        const mon = new Date(agendaExportWeek + 'T12:00:00');
        const monthName = mon.toLocaleDateString('es-CL', { month: 'long' });
        const firstDow = new Date(mon.getFullYear(), mon.getMonth(), 1).getDay();
        const firstMonday = firstDow === 0 ? 2 : firstDow === 1 ? 1 : 9 - firstDow;
        const weekNum = Math.floor((mon.getDate() - firstMonday) / 7) + 1;
        const ordinals = ['Primera', 'Segunda', 'Tercera', 'Cuarta', 'Quinta'];
        const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
        return `${ordinals[Math.min(weekNum - 1, 4)]} semana de ${cap(monthName)}`;
    }, [agendaExportWeek]);

    const agendaExportProfesorJefe = useMemo(() => {
        if (!agendaExportCurso) return null;
        return getAllUsers().find(u => u.isHeadTeacher && u.headTeacherOf === agendaExportCurso) ?? null;
    }, [getAllUsers, agendaExportCurso]);

    const weeks = useMemo(() => buildMonthGrid(currentYear, selectedMonth), [currentYear, selectedMonth]);

    // Auto-seleccionar el curso de la asistente de aula
    useEffect(() => {
        if (isAsistenteAula && asistenteAulaCurso) {
            setSelectedCurso(asistenteAulaCurso);
        }
    }, [isAsistenteAula, asistenteAulaCurso]);

    const relevantEvals = useMemo(() => {
        if (isAsistenteAula && asistenteAulaCurso) {
            return evaluaciones.filter(e => e.curso === asistenteAulaCurso);
        }
        return evaluaciones;
    }, [evaluaciones, isAsistenteAula, asistenteAulaCurso]);

    const filteredEvals = useMemo(() => {
        let evs = selectedCurso ? relevantEvals.filter(e => e.curso === selectedCurso) : relevantEvals;
        if (selectedAsignatura) evs = evs.filter(e => e.asignatura === selectedAsignatura);
        return evs;
    }, [relevantEvals, selectedCurso, selectedAsignatura]);

    const evalsByDate = useMemo(() => {
        const map = {};
        filteredEvals.forEach(e => {
            if (!e.date) return;
            if (!map[e.date]) map[e.date] = [];
            map[e.date].push(e);
        });
        return map;
    }, [filteredEvals]);

    // ── Agenda semanal items ──────────────────────────────────────────────────
    const weekStarts = useMemo(() =>
        [...new Set(weeks.map(w => w[0].dateStr))]
    , [weeks]);

    const [agendaDocs, setAgendaDocs] = useState([]);
    useEffect(() => {
        if (weekStarts.length === 0) { setAgendaDocs([]); return; }
        const q = query(
            collection(db, 'agenda_contenido'),
            where('weekStart', 'in', weekStarts)
        );
        return onSnapshot(q,
            snap => setAgendaDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            err  => console.error('agenda_contenido calendar:', err)
        );
    }, [weekStarts.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

    const agendaItemsByDate = useMemo(() => {
        const map = {};
        agendaDocs.forEach(docData => {
            if (selectedCurso && docData.curso !== selectedCurso) return;
            (docData.entries ?? []).forEach(entry => {
                const offset = DIA_TO_OFFSET[entry.dia];
                if (offset === undefined) return;
                const monday = new Date(docData.weekStart + 'T12:00:00');
                monday.setDate(monday.getDate() + offset);
                const dateStr = monday.toISOString().slice(0, 10);
                if (!map[dateStr]) map[dateStr] = [];
                map[dateStr].push({
                    ...entry,
                    curso:        docData.curso,
                    docenteId:    docData.docenteId,
                    docenteName:  docData.docenteName,
                    agendaDocId:  docData.id,
                    agendaEntries: docData.entries ?? [],
                    dateStr,
                });
            });
        });
        return map;
    }, [agendaDocs, selectedCurso]);

    // Próximo feriado
    const nextHoliday = useMemo(() => {
        const sorted = Object.entries(allHolidays)
            .filter(([date]) => date > todayStr)
            .sort(([a], [b]) => a.localeCompare(b));
        if (sorted.length === 0) return null;
        const [date, name] = sorted[0];
        const d      = new Date(date + 'T12:00:00');
        const t      = new Date(todayStr + 'T12:00:00');
        const diffDays = Math.round((d - t) / 86400000);
        const dateLabel = d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
        const countLabel = diffDays === 1 ? 'Mañana' : `En ${diffDays} días`;
        return { date, name, diffDays, dateLabel, countLabel };
    }, [allHolidays, todayStr]);

    // Stats for the selected month
    const stats = useMemo(() => {
        const pfx = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        const monthEvs = relevantEvals.filter(e => e.date?.startsWith(pfx));

        const mon = new Date(today);
        const dow = mon.getDay();
        mon.setDate(mon.getDate() - (dow === 0 ? 6 : dow - 1));
        const weekStart = mon.toISOString().slice(0, 10);
        const fri = new Date(mon);
        fri.setDate(fri.getDate() + 4);
        const weekEnd = fri.toISOString().slice(0, 10);

        return {
            total:       monthEvs.length,
            semana:      monthEvs.filter(e => e.date >= weekStart && e.date <= weekEnd).length,
            cursos:      new Set(monthEvs.map(e => e.curso)).size,
            asignaturas: new Set(monthEvs.map(e => e.asignatura)).size,
        };
    }, [relevantEvals, selectedMonth, currentYear, today]);

    const canGoPrev = selectedMonth > currentMonth;
    const canGoNext = selectedMonth < 11;

    // Días de la semana en que el docente tiene clases para el curso filtrado
    const teacherDaysForCurso = useMemo(() => {
        if (!isTeacher || !selectedCurso) return null;
        // El profesor jefe puede ver el calendario completo de su curso sin restricción de días
        if (user?.isHeadTeacher && user?.headTeacherOf === selectedCurso) return null;
        const blocks = getSchedule(user?.uid);
        const days = new Set(blocks.filter(b => b.course === selectedCurso).map(b => b.day));
        return days.size > 0 ? days : null;
    }, [isTeacher, selectedCurso, getSchedule, user?.uid, user?.isHeadTeacher, user?.headTeacherOf]);

    const [hoveredAgendaId, setHoveredAgendaId] = useState(null);

    const handleDeleteAgendaEntry = async (agendaDocId, entryId, allEntries) => {
        const newEntries = allEntries.filter(e => e.id !== entryId);
        try {
            await updateDoc(doc(db, 'agenda_contenido', agendaDocId), { entries: newEntries });
            toast.success('Entrada eliminada');
        } catch {
            toast.error('Error al eliminar');
        }
    };

    const goAgendaExportWeek = (delta) => {
        const d = new Date(agendaExportWeek + 'T12:00:00');
        d.setDate(d.getDate() + delta * 7);
        setAgendaExportWeek(d.toISOString().slice(0, 10));
    };

    const handleAgendaExportPDF = async () => {
        setExportingAgenda(true);
        try {
            const constraints = [where('weekStart', '==', agendaExportWeek)];
            if (agendaExportCurso) constraints.push(where('curso', '==', agendaExportCurso));
            const snap = await getDocs(query(collection(db, 'agenda_contenido'), ...constraints));
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

            // Calcular las 5 fechas de la semana para filtrar evaluaciones
            const monDate = new Date(agendaExportWeek + 'T12:00:00');
            const weekDates = Array.from({ length: 5 }, (_, i) => {
                const d = new Date(monDate); d.setDate(monDate.getDate() + i);
                return d.toISOString().slice(0, 10);
            });
            const weekEvals = relevantEvals.filter(ev =>
                ev.date && weekDates.includes(ev.date) &&
                (!agendaExportCurso || ev.curso === agendaExportCurso)
            );

            // Próxima semana — evaluaciones y contenido agendado
            const nextWeekDates = weekDates.map(iso => {
                const d = new Date(iso + 'T12:00:00');
                d.setDate(d.getDate() + 7);
                return d.toISOString().slice(0, 10);
            });
            const nextWeekStart = nextWeekDates[0];
            const nextWeekEvals = relevantEvals.filter(ev =>
                ev.date && nextWeekDates.includes(ev.date) &&
                (!agendaExportCurso || ev.curso === agendaExportCurso)
            );
            const nextConstraints = [where('weekStart', '==', nextWeekStart)];
            if (agendaExportCurso) nextConstraints.push(where('curso', '==', agendaExportCurso));
            const nextSnap = await getDocs(query(collection(db, 'agenda_contenido'), ...nextConstraints));
            const nextWeekEntries = nextSnap.docs.flatMap(d => d.data().entries || []);

            // Construir horario por día para el curso seleccionado.
            // Prioridad: horario oficial del curso (course_schedules) → fallback docentes.
            const normalizeDay = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const officialBlocks = agendaExportCurso ? getCourseSchedule(agendaExportCurso) : null;
            const scheduleByDay = {};

            if (officialBlocks && officialBlocks.length > 0) {
                officialBlocks.forEach(block => {
                    const key = normalizeDay(block.day);
                    if (!scheduleByDay[key]) scheduleByDay[key] = [];
                    if (!scheduleByDay[key].some(b => b.startTime === block.startTime)) {
                        scheduleByDay[key].push({ subject: block.subject, startTime: block.startTime });
                    }
                });
            } else {
                const allSchedules = getAllSchedules();
                Object.values(allSchedules).forEach(blocks => {
                    (blocks || []).forEach(block => {
                        if (!agendaExportCurso || block.course === agendaExportCurso) {
                            const key = normalizeDay(block.day);
                            if (!scheduleByDay[key]) scheduleByDay[key] = [];
                            const dup = scheduleByDay[key].some(
                                b => b.subject === block.subject && b.startTime === block.startTime
                            );
                            if (!dup) scheduleByDay[key].push({ subject: block.subject, startTime: block.startTime });
                        }
                    });
                });
            }
            Object.keys(scheduleByDay).forEach(key => {
                scheduleByDay[key].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
            });

            const ok = await exportAgendaMensualCardPDF({
                agendaDocs: docs,
                selectedCurso: agendaExportCurso,
                mesLabel: agendaExportWeekLabel,
                holidays: allHolidays,
                evaluaciones: weekEvals,
                weekStart: agendaExportWeek,
                profesorJefeName: agendaExportProfesorJefe?.name || '',
                scheduleByDay,
                nextWeekEvaluaciones: nextWeekEvals,
                nextWeekEntries,
            });
            if (!ok) toast.error('No hay nada agendado para esa semana');
            else setShowAgendaExportModal(false);
        } catch {
            toast.error('Error al exportar');
        } finally {
            setExportingAgenda(false);
        }
    };

    const handleTabularExportPDF = async () => {
        setExportingTabular(true);
        try {
            const normalizeDay = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            // 1. Entradas de agenda_contenido de la semana seleccionada
            const constraints = [where('weekStart', '==', agendaExportWeek)];
            if (agendaExportCurso) constraints.push(where('curso', '==', agendaExportCurso));
            const snap = await getDocs(query(collection(db, 'agenda_contenido'), ...constraints));
            const agendaEntries = snap.docs.flatMap(d => d.data().entries || []);

            // 2. Evaluaciones de la semana para el curso
            const monDate = new Date(agendaExportWeek + 'T12:00:00');
            const weekDates = Array.from({ length: 5 }, (_, i) => {
                const d = new Date(monDate); d.setDate(monDate.getDate() + i);
                return d.toISOString().slice(0, 10);
            });
            const weekEvals = relevantEvals.filter(ev =>
                ev.date && weekDates.includes(ev.date) &&
                (!agendaExportCurso || ev.curso === agendaExportCurso)
            );

            // 3. Materiales desde agenda_noticias tipo='materiales'
            const noticiaConstraints = [where('weekStart', '==', agendaExportWeek)];
            if (agendaExportCurso) noticiaConstraints.push(where('curso', '==', agendaExportCurso));
            const noticiaSnap = await getDocs(query(collection(db, 'agenda_noticias'), ...noticiaConstraints));
            const materialesTexto = noticiaSnap.docs
                .map(d => d.data())
                .filter(d => d.tipo === 'materiales' && d.texto)
                .map(d => d.texto)
                .join('\n');
            const materialesByDay = materialesTexto
                ? { lunes: materialesTexto, martes: materialesTexto, miercoles: materialesTexto, jueves: materialesTexto, viernes: materialesTexto }
                : {};

            // 4. Horario oficial por día
            const officialBlocks = agendaExportCurso ? getCourseSchedule(agendaExportCurso) : null;
            const schedByDay = {};
            if (officialBlocks && officialBlocks.length > 0) {
                officialBlocks.forEach(block => {
                    const key = normalizeDay(block.day);
                    if (!schedByDay[key]) schedByDay[key] = [];
                    if (!schedByDay[key].some(b => b.startTime === block.startTime)) {
                        schedByDay[key].push({ subject: block.subject, startTime: block.startTime });
                    }
                });
            } else {
                const allSchedules = getAllSchedules();
                Object.values(allSchedules).forEach(blocks => {
                    (blocks || []).forEach(block => {
                        if (!agendaExportCurso || block.course === agendaExportCurso) {
                            const key = normalizeDay(block.day);
                            if (!schedByDay[key]) schedByDay[key] = [];
                            const dup = schedByDay[key].some(
                                b => b.subject === block.subject && b.startTime === block.startTime
                            );
                            if (!dup) schedByDay[key].push({ subject: block.subject, startTime: block.startTime });
                        }
                    });
                });
            }
            Object.keys(schedByDay).forEach(key => {
                schedByDay[key].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
            });

            // 5. Profesores: profesor jefe + docentes con bloques en este curso
            const allUsersData = getAllUsers();
            const profJefe = allUsersData.find(u => u.isHeadTeacher && u.headTeacherOf === agendaExportCurso);
            const allSchedules = getAllSchedules();
            const docenteUids = new Set();
            Object.entries(allSchedules).forEach(([uid, blocks]) => {
                if ((blocks || []).some(b => b.course === agendaExportCurso)) docenteUids.add(uid);
            });
            const otrosDocentes = [...docenteUids]
                .map(uid => allUsersData.find(u => u.id === uid)?.name)
                .filter(n => n && n !== profJefe?.name);
            const profesores = profJefe
                ? [profJefe.name, ...otrosDocentes].slice(0, 2)
                : otrosDocentes.slice(0, 2);

            // 6. Asistente de aula asignada al curso (desde horario oficial del curso)
            const asistente = getCourseAssistant(agendaExportCurso)?.name || '';

            // 7. Avisos del profesor jefe para este curso
            let avisosExtra = [];
            if (agendaExportCurso) {
                const avisosSnap = await getDoc(doc(db, 'avisos_profesor_jefe', agendaExportCurso));
                if (avisosSnap.exists()) {
                    avisosExtra = (avisosSnap.data().avisos || []).map(a => a.texto).filter(Boolean);
                }
            }

            await exportAgendaTabularPDF({
                weekStart:       agendaExportWeek,
                selectedCurso:   agendaExportCurso,
                profesores,
                asistente,
                scheduleByDay:   schedByDay,
                entries:         agendaEntries,
                evaluaciones:    weekEvals,
                materialesByDay,
                salidaByDay:     {}, // auto-calculado en pdfExport desde el horario
                holidays:        allHolidays,
                avisosExtra,
            });
            setShowTabularExportModal(false);
        } catch {
            toast.error('Error al exportar');
        } finally {
            setExportingTabular(false);
        }
    };

    const [dropdownOpen, setDropdownOpen]                         = useState(false);
    const [cursoDropdownOpen, setCursoDropdownOpen]               = useState(false);
    const [exportDropdownOpen, setExportDropdownOpen]             = useState(false);
    const [agendaCursoDropdownOpen, setAgendaCursoDropdownOpen]   = useState(false);
    const dropdownRef           = useRef(null);
    const cursoDropdownRef      = useRef(null);
    const exportDropdownRef     = useRef(null);
    const agendaCursoDropdownRef = useRef(null);

    const cursoOptions = useMemo(() => {
        if (isTeacher) {
            const blocks = getSchedule(user?.uid);
            const teacherCursos = new Set(blocks.map(b => b.course).filter(c => CURSOS.includes(c)));
            // El profesor jefe siempre puede ver su curso aunque no tenga bloques de horario
            if (user?.isHeadTeacher && user?.headTeacherOf && CURSOS.includes(user.headTeacherOf)) {
                teacherCursos.add(user.headTeacherOf);
            }
            const ordered = CURSOS.filter(c => teacherCursos.has(c));
            return [null, ...ordered];
        }
        return [null, ...CURSOS];
    }, [isTeacher, getSchedule, user?.uid, user?.isHeadTeacher, user?.headTeacherOf]);
    const cursoIdx     = cursoOptions.indexOf(selectedCurso);
    const canPrevCurso = cursoIdx > 0;
    const canNextCurso = cursoIdx < cursoOptions.length - 1;

    const realCursos          = cursoOptions.filter(c => c !== null);
    const agendaCursoIdx      = realCursos.indexOf(agendaExportCurso);
    const canPrevAgendaCurso  = agendaCursoIdx > 0;
    const canNextAgendaCurso  = agendaCursoIdx < realCursos.length - 1;

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
            if (cursoDropdownRef.current && !cursoDropdownRef.current.contains(e.target)) setCursoDropdownOpen(false);
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) setExportDropdownOpen(false);
            if (agendaCursoDropdownRef.current && !agendaCursoDropdownRef.current.contains(e.target)) setAgendaCursoDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative flex-1 min-h-0 overflow-y-auto">
            <AnimatedBg />

            <div className="relative z-10 p-6 md:p-10 pb-16 max-w-7xl mx-auto space-y-5">

                {/* ── Page header ────────────────────────────────────────── */}
                <div className="flex items-start gap-4 flex-wrap gap-y-3">
                    <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_2})`,
                        boxShadow: `0 8px 20px -8px ${PRIMARY}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                    }}>
                        <CalendarDays className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-headline text-xl sm:text-[28px] leading-tight font-bold" style={{ color: INK, letterSpacing: '-0.5px' }}>
                            Calendario de Evaluaciones
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: INK_2 }}>
                            {canCreateEval ? 'Haz clic en un día para programar una evaluación' : 'Vista general de evaluaciones programadas'}
                        </p>
                    </div>
                    <div className="flex items-start gap-2 flex-wrap justify-start sm:justify-end w-full sm:w-auto">
                        {/* Export dropdown */}
                        <div className="relative" ref={exportDropdownRef}>
                            <button
                                onClick={() => setExportDropdownOpen(o => !o)}
                                disabled={exportingPdf || exportingAgenda}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px disabled:opacity-60"
                                style={{ background: '#fff', border: `1px solid ${LINE}`, color: INK_2, boxShadow: '0 1px 2px rgba(31,42,46,.04)' }}
                            >
                                {(exportingPdf || exportingAgenda) ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                                Exportar
                                <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${exportDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {exportDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border overflow-hidden z-50"
                                        style={{ borderColor: LINE, minWidth: 220 }}
                                    >
                                        <button
                                            onClick={() => {
                                                setExportDropdownOpen(false);
                                                const d = new Date();
                                                const day = d.getDay();
                                                d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
                                                d.setHours(0, 0, 0, 0);
                                                setAgendaExportWeek(d.toISOString().slice(0, 10));
                                                setAgendaExportCurso(selectedCurso ?? cursoOptions.find(c => c !== null) ?? null);
                                                setShowAgendaExportModal(true);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 text-left"
                                            style={{ color: INK }}
                                        >
                                            <NotebookPen className="w-4 h-4 shrink-0" style={{ color: INK_3 }} />
                                            Agenda semanal
                                        </button>
                                        <div style={{ height: 1, background: LINE, margin: '0 12px' }} />
                                        <button
                                            onClick={async () => {
                                                setExportDropdownOpen(false);
                                                setExportingPdf(true);
                                                try {
                                                    await exportCalendarioPDF({
                                                        evaluaciones: filteredEvals,
                                                        selectedCurso,
                                                        mesLabel: `${MESES[selectedMonth]} ${currentYear}`,
                                                        year: currentYear,
                                                        month: selectedMonth,
                                                        holidays: allHolidays,
                                                    });
                                                } finally {
                                                    setExportingPdf(false);
                                                }
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 text-left"
                                            style={{ color: INK }}
                                        >
                                            <CalendarDays className="w-4 h-4 shrink-0" style={{ color: INK_3 }} />
                                            Calendario mensual
                                        </button>
                                        <div style={{ height: 1, background: LINE, margin: '0 12px' }} />
                                        <button
                                            onClick={() => {
                                                setExportDropdownOpen(false);
                                                const d = new Date();
                                                const day = d.getDay();
                                                d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
                                                d.setHours(0, 0, 0, 0);
                                                setAgendaExportWeek(d.toISOString().slice(0, 10));
                                                setAgendaExportCurso(selectedCurso ?? cursoOptions.find(c => c !== null) ?? null);
                                                setShowTabularExportModal(true);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors hover:bg-slate-50 text-left"
                                            style={{ color: INK }}
                                        >
                                            <Table2 className="w-4 h-4 shrink-0" style={{ color: INK_3 }} />
                                            Tabla de agenda (oficio horizontal)
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {canManageHolidays && (
                            <button
                                onClick={() => { setInterferiado({ date: '', name: '' }); setShowInterferiado(true); }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
                                style={{ background: '#fff', border: '1px solid #FCA5A5', color: '#DC2626', boxShadow: '0 1px 2px rgba(31,42,46,.04)' }}
                            >
                                <BanIcon className="w-4 h-4" /> Interferiado
                            </button>
                        )}
                        {canCreateEval && (
                            <button
                                onClick={() => setEvalModal({ type: 'list' })}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
                                style={{ background: '#fff', border: `1.5px solid ${PRIMARY}`, color: PRIMARY, boxShadow: '0 1px 2px rgba(31,42,46,.04)' }}
                            >
                                <Pencil className="w-4 h-4" /> Editar fechas
                            </button>
                        )}
                        {/* Bloque apilado: aviso arriba, fijar+agenda abajo */}
                        {(cursoJefe || canCreateEval) && (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: (canCreateEval && isTeacher) ? '1fr 1fr' : '1fr',
                                    gap: 8,
                                }}
                            >
                                {cursoJefe && (
                                    <button
                                        onClick={() => setShowAvisoModal(true)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
                                        style={{ gridColumn: '1 / -1', background: '#FFFBF2', border: '1px solid #F3E7C3', color: '#D97706', boxShadow: '0 1px 2px rgba(31,42,46,.04)' }}
                                    >
                                        <Megaphone className="w-4 h-4" /> Agregar aviso importante
                                    </button>
                                )}
                                {canCreateEval && (
                                    <button
                                        onClick={() => setShowFijar(true)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-px active:translate-y-0"
                                        style={{ background: HONEY, color: '#2a1f04', boxShadow: `0 6px 14px -6px ${HONEY}` }}
                                    >
                                        <Pin className="w-4 h-4" /> Fijar una prueba
                                    </button>
                                )}
                                {canCreateEval && isTeacher && (
                                    <button
                                        onClick={() => setShowAgenda(true)}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px active:translate-y-0"
                                        style={{ background: '#fff', border: `1px solid ${LINE}`, color: INK_2, boxShadow: '0 1px 2px rgba(31,42,46,.04)' }}
                                    >
                                        <NotebookPen className="w-4 h-4" />
                                        Agenda Semanal
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Filter row ─────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3">
                    {isAsistenteAula && asistenteAulaCurso && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white" style={{ background: PRIMARY }}>
                            <GraduationCap className="w-3.5 h-3.5" />
                            {asistenteAulaCurso}
                        </div>
                    )}
                    {canCreateEval && (
                        <PillSelector
                            label="curso"
                            value={selectedCurso ?? 'Todos los cursos'}
                            bg={PRIMARY}
                            canPrev={canPrevCurso}
                            canNext={canNextCurso}
                            onPrev={() => canPrevCurso && setSelectedCurso(cursoOptions[cursoIdx - 1])}
                            onNext={() => canNextCurso && setSelectedCurso(cursoOptions[cursoIdx + 1])}
                            isOpen={cursoDropdownOpen}
                            onOpen={() => setCursoDropdownOpen(o => !o)}
                            dropdownRef={cursoDropdownRef}
                        >
                            {cursoOptions.map((c) => (
                                <button
                                    key={c ?? '__todos__'}
                                    onClick={() => { setSelectedCurso(c); setCursoDropdownOpen(false); }}
                                    className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                                    style={c === selectedCurso ? { background: PRIMARY, color: '#fff' } : { color: INK }}
                                >
                                    {c ?? 'Todos los cursos'}
                                </button>
                            ))}
                        </PillSelector>
                    )}

                    <PillSelector
                        label="mes"
                        value={`${MESES[selectedMonth]} ${currentYear}`}
                        bg={ACCENT}
                        canPrev={canGoPrev}
                        canNext={canGoNext}
                        onPrev={() => canGoPrev && setSelectedMonth(m => m - 1)}
                        onNext={() => canGoNext && setSelectedMonth(m => m + 1)}
                        isOpen={dropdownOpen}
                        onOpen={() => setDropdownOpen(o => !o)}
                        dropdownRef={dropdownRef}
                    >
                        {availableMonths.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => { setSelectedMonth(value); setDropdownOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                                style={value === selectedMonth ? { background: ACCENT, color: '#fff' } : { color: INK }}
                            >
                                {label}
                            </button>
                        ))}
                    </PillSelector>
                </div>

                {/* ── Calendar grid ──────────────────────────────────────── */}
                <div className="overflow-x-auto -mx-6 md:-mx-10 px-6 md:px-10">
                <div
                    className="rounded-3xl overflow-hidden sm:min-w-[500px]"
                    style={{
                        background: 'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        border: `1px solid ${LINE}`,
                        boxShadow: '0 6px 18px -6px rgba(31,42,46,.10), 0 2px 6px rgba(31,42,46,.04)',
                    }}
                >
                    {/* Day headers */}
                    <div
                        className="grid grid-cols-5"
                        style={{ background: 'rgba(251,247,241,0.9)', borderBottom: `1px solid ${LINE}` }}
                    >
                        {DIAS.map((d, i) => (
                            <div
                                key={d}
                                className="px-2 sm:px-4 py-2 sm:py-3 text-left"
                                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_2 }}
                            >
                                <span className="hidden sm:inline">{d}</span>
                                <span className="sm:hidden">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie'][i]}</span>
                            </div>
                        ))}
                    </div>

                    {/* Empty state */}
                    {selectedCurso && filteredEvals.length === 0 && (
                        <div className="py-16 flex flex-col items-center justify-center gap-3">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: PRIMARY_SOFT, color: PRIMARY }}>
                                <CalendarDays className="w-7 h-7" />
                            </div>
                            <p className="text-base font-bold" style={{ color: PRIMARY }}>Sin evaluaciones en {selectedCurso}</p>
                            <p className="text-sm" style={{ color: INK_3 }}>No hay evaluaciones agendadas para este mes</p>
                        </div>
                    )}

                    {/* Weeks */}
                    {weeks.map((week, wi) => (
                        <div
                            key={wi}
                            className="grid grid-cols-5"
                            style={wi < weeks.length - 1 ? { borderBottom: `1px solid ${LINE}` } : {}}
                        >
                            {week.map(({ dateStr, inMonth }, di) => {
                                const isPast     = dateStr < todayStr;
                                const isToday    = dateStr === todayStr;
                                const evals      = evalsByDate[dateStr] || [];
                                const agendaItems = agendaItemsByDate[dateStr] || [];
                                const dayNum     = parseInt(dateStr.split('-')[2]);
                                const clickable  = inMonth;
                                const canAdd     = inMonth && !isPast && canCreateEval;
                                const dimmed     = !inMonth;
                                const holiday    = inMonth ? allHolidays[dateStr] : null;
                                const isCustomHoliday = inMonth && !!customHolidays[dateStr];
                                const noClass    = inMonth && teacherDaysForCurso != null && !teacherDaysForCurso.has(DIAS[di]);

                                return (
                                    <div
                                        key={dateStr}
                                        onClick={() => {
                                            if (!inMonth) return;
                                            const evs    = evalsByDate[dateStr] || [];
                                            const agenda = agendaItemsByDate[dateStr] || [];
                                            if (canAdd && evs.length === 0 && agenda.length === 0) {
                                                setSelectedDate(dateStr);
                                            } else {
                                                setDayModal({ dateStr, events: evs, agendaItems: agenda });
                                            }
                                        }}
                                        className="group transition-colors flex flex-col min-h-[80px] sm:min-h-[118px] p-1.5 sm:p-3"
                                        style={{
                                            borderRight: di < 4 ? `1px solid ${LINE}` : 'none',
                                            cursor: clickable ? 'pointer' : 'default',
                                            background: dimmed
                                                ? 'rgba(244,236,223,0.7)'
                                                : noClass
                                                    ? 'rgba(230,230,230,0.55)'
                                                    : holiday
                                                        ? 'rgba(254,226,226,0.45)'
                                                        : isPast
                                                            ? 'rgba(251,247,241,0.5)'
                                                            : isToday
                                                                ? 'rgba(220,237,235,0.55)'
                                                                : 'rgba(255,255,255,0.35)',
                                        }}
                                    >
                                        {/* Day number */}
                                        <div
                                            className="mb-1 shrink-0 flex items-center gap-1.5"
                                        >
                                        <span style={
                                                isToday
                                                    ? {
                                                        width: 26, height: 26, borderRadius: '50%',
                                                        background: PRIMARY, color: '#fff',
                                                        display: 'grid', placeItems: 'center',
                                                        fontSize: 13, fontWeight: 700,
                                                        flexShrink: 0,
                                                    }
                                                    : {
                                                        fontSize: 13,
                                                        fontWeight: dimmed || noClass ? 400 : 600,
                                                        color: holiday ? '#DC2626' : dimmed || isPast || noClass ? INK_3 : INK_2,
                                                    }
                                            }
                                        >
                                            {dayNum}
                                        </span>
                                        </div>
                                        {holiday && (
                                            <div style={{
                                                fontSize: 10, fontWeight: 700, color: '#DC2626',
                                                marginBottom: 6, lineHeight: 1.2,
                                                display: 'flex', alignItems: 'flex-start', gap: 2,
                                            }}>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                    {holiday}
                                                </span>
                                                {isCustomHoliday && canManageHolidays && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteHoliday(dateStr).then(() => toast.success('Interferiado eliminado')).catch(() => toast.error('Error al eliminar')); }}
                                                        title="Eliminar interferiado"
                                                        style={{ flexShrink: 0, color: '#DC2626', opacity: 0.7, lineHeight: 1 }}
                                                        className="hover:opacity-100 transition-opacity"
                                                    >
                                                        <X style={{ width: 10, height: 10 }} />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Sin clases — mensaje explicativo */}
                                        {noClass && (
                                            <div className="hidden sm:flex" style={{
                                                flex: 1,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                padding: '4px 6px',
                                            }}>
                                                <span style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: INK_2,
                                                    lineHeight: 1.4,
                                                }}>
                                                    {selectedAsignatura
                                                        ? `Sin clases de ${ASIG_FULL[selectedAsignatura] || selectedAsignatura} en ${selectedCurso}`
                                                        : `Sin clases de ${selectedCurso}`
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {/* Event chips */}
                                        <div className="flex flex-col gap-1 flex-1">
                                            {evals.slice(0, 3).map(e => {
                                                const sc = SUB_COLORS[e.asignatura];
                                                return (
                                                    <button
                                                        key={e.id}
                                                        type="button"
                                                        onClick={(ev) => { ev.stopPropagation(); setEvalModal({ type: 'detail', data: e }); }}
                                                        className="w-full text-left transition-transform hover:translate-x-0.5 active:scale-95"
                                                        title={`${e.curso} · ${e.name}`}
                                                        style={{
                                                            flex: 1,
                                                            padding: '5px 8px',
                                                            borderRadius: 7,
                                                            background: sc?.soft || '#f1f5f9',
                                                            color: sc?.color || '#475569',
                                                            borderLeft: `3px solid ${sc?.color || '#94a3b8'}`,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: 2,
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        {/* Mobile: solo sigla + punto pendiente */}
                                                        <span className="sm:hidden" style={{ fontSize: 9, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            {e.asignatura}
                                                            {e.pendingChanges && <span style={{ width: 5, height: 5, borderRadius: '50%', background: HONEY, flexShrink: 0 }} />}
                                                        </span>
                                                        {/* Desktop: chip completo */}
                                                        <div className="hidden sm:flex flex-col" style={{ gap: 2 }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                                                                <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {e.curso} · {e.asignatura}
                                                                </span>
                                                                {e.pendingChanges && (
                                                                    <span
                                                                        title="Cambios pendientes"
                                                                        style={{ width: 6, height: 6, borderRadius: '50%', background: HONEY, border: '1.5px solid rgba(255,255,255,0.8)', flexShrink: 0 }}
                                                                    />
                                                                )}
                                                            </span>
                                                            <span style={{ fontSize: 11.5, fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                                {e.name}
                                                            </span>
                                                            {e.createdBy?.name && (
                                                                <span style={{ fontSize: 10, opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {shortName(e.createdBy.name)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                            {evals.length > 3 && (
                                                <span style={{ fontSize: 11, color: INK_3, fontWeight: 600, padding: '2px 4px' }}>
                                                    +{evals.length - 3} más
                                                </span>
                                            )}
                                            {/* Agenda items */}
                                            {agendaItems.slice(0, 2).map(item => {
                                                const canDeleteEntry = canCRUD || item.docenteId === user?.uid;
                                                const isHovered = hoveredAgendaId === item.id;
                                                return (
                                                <div
                                                    key={item.id}
                                                    title={`${item.curso} · ${item.asignatura}: ${item.texto}`}
                                                    onMouseEnter={() => canDeleteEntry && setHoveredAgendaId(item.id)}
                                                    onMouseLeave={() => setHoveredAgendaId(null)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '5px 7px',
                                                        borderRadius: 7,
                                                        background: '#EEF2FF',
                                                        color: '#4338CA',
                                                        borderLeft: '3px solid #818CF8',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 2,
                                                        overflow: 'hidden',
                                                        position: 'relative',
                                                    }}
                                                >
                                                    {/* Mobile: solo ícono */}
                                                    <span className="sm:hidden" style={{ fontSize: 9, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <NotebookPen style={{ width: 8, height: 8, flexShrink: 0 }} />
                                                        {item.asignatura}
                                                    </span>
                                                    {/* Desktop: chip completo */}
                                                    <div className="hidden sm:flex flex-col" style={{ gap: 2 }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            <NotebookPen style={{ width: 9, height: 9, flexShrink: 0 }} />
                                                            {item.asignatura} · {item.curso}
                                                            {canDeleteEntry && isHovered && (
                                                                <button
                                                                    type="button"
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        handleDeleteAgendaEntry(item.agendaDocId, item.id, item.agendaEntries);
                                                                    }}
                                                                    style={{
                                                                        marginLeft: 'auto',
                                                                        flexShrink: 0,
                                                                        width: 14, height: 14,
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        borderRadius: 3, border: 'none',
                                                                        background: '#FEE2E2', color: '#DC2626',
                                                                        cursor: 'pointer', padding: 0,
                                                                    }}
                                                                >
                                                                    <Trash2 style={{ width: 9, height: 9 }} />
                                                                </button>
                                                            )}
                                                        </span>
                                                        <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                            {item.texto}
                                                        </span>
                                                        {item.docenteName && (
                                                            <span style={{ fontSize: 10, opacity: 0.65, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {shortName(item.docenteName)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                );
                                            })}
                                            {agendaItems.length > 2 && (
                                                <span style={{ fontSize: 11, color: '#818CF8', fontWeight: 600, padding: '2px 4px' }}>
                                                    +{agendaItems.length - 2} agenda
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                </div>{/* end scroll wrapper */}

                {/* ── Subject legend — filter chips ──────────────────────── */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedAsignatura(null)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:-translate-y-px"
                        style={!selectedAsignatura
                            ? { background: INK, color: '#fff', border: '1px solid transparent', boxShadow: '0 2px 8px -2px rgba(31,42,46,.35)' }
                            : { background: 'rgba(255,255,255,0.8)', color: INK_2, border: `1px solid ${LINE}` }
                        }
                    >
                        <span className="w-2 h-2 rounded-full" style={{ background: !selectedAsignatura ? '#fff' : INK_3 }} />
                        Todas
                    </button>
                    {SUBJECTS_LIST.map(s => {
                        const sc     = SUB_COLORS[s.key];
                        const active = selectedAsignatura === s.key;
                        return (
                            <button
                                key={s.key}
                                onClick={() => setSelectedAsignatura(active ? null : s.key)}
                                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:-translate-y-px"
                                style={active
                                    ? { background: sc?.color, color: '#fff', border: '1px solid transparent', boxShadow: `0 2px 8px -2px ${sc?.color}` }
                                    : { background: 'rgba(255,255,255,0.8)', color: INK_2, border: `1px solid ${LINE}` }
                                }
                            >
                                <span className="w-2 h-2 rounded-full" style={{ background: active ? '#fff' : sc?.color }} />
                                {s.name}
                            </button>
                        );
                    })}
                </div>

                {/* ── Stats strip ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                        { num: stats.total,       label: 'Evaluaciones este mes', bg: PRIMARY_SOFT,  color: PRIMARY,    icon: <CalendarDays className="w-5 h-5" /> },
                        { num: stats.semana,      label: 'Esta semana',           bg: '#FBE4DB',     color: ACCENT,     icon: <Clock className="w-5 h-5" /> },
                        { num: stats.cursos,      label: 'Cursos activos',        bg: '#FBEDC9',     color: '#B86A00',  icon: <Users className="w-5 h-5" /> },
                        { num: stats.asignaturas, label: 'Asignaturas',           bg: '#DEEEE3',     color: '#2E8B57',  icon: <Layers className="w-5 h-5" /> },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 rounded-2xl p-4"
                            style={{
                                background: 'rgba(255,255,255,0.72)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: `1px solid ${LINE}`,
                                boxShadow: '0 1px 2px rgba(31,42,46,.04)',
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: item.bg, color: item.color }}
                            >
                                {item.icon}
                            </div>
                            <div>
                                <div className="font-headline text-2xl leading-none font-bold" style={{ color: INK }}>{item.num}</div>
                                <div className="text-xs mt-1" style={{ color: INK_2 }}>{item.label}</div>
                            </div>
                        </div>
                    ))}

                    {/* Próximo feriado */}
                    {nextHoliday && (
                        <div
                            className="flex items-center gap-3 rounded-2xl p-4"
                            style={{
                                background: nextHoliday.diffDays <= 7
                                    ? 'rgba(254,226,226,0.85)'
                                    : 'rgba(255,255,255,0.72)',
                                backdropFilter: 'blur(8px)',
                                WebkitBackdropFilter: 'blur(8px)',
                                border: nextHoliday.diffDays <= 7
                                    ? '1px solid #FECACA'
                                    : `1px solid ${LINE}`,
                                boxShadow: '0 1px 2px rgba(31,42,46,.04)',
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                    background: nextHoliday.diffDays <= 7 ? '#FEE2E2' : '#FEF3C7',
                                    color:      nextHoliday.diffDays <= 7 ? '#DC2626' : '#B45309',
                                }}
                            >
                                <Flag className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-sm leading-tight truncate" style={{ color: INK }}>
                                    {nextHoliday.name}
                                </div>
                                <div className="text-xs mt-0.5" style={{ color: nextHoliday.diffDays <= 7 ? '#DC2626' : INK_2 }}>
                                    {nextHoliday.countLabel} · {nextHoliday.dateLabel}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* ── Modal: Avisos importantes ───────────────────────────────── */}
            {showAvisoModal && cursoJefe && (
                <CalModal onClose={() => setShowAvisoModal(false)} width={480}>
                    <div className="cal-modal-head" style={{ padding: '22px 24px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: '#FEF3C7', color: '#D97706', display: 'grid', placeItems: 'center' }}>
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 className="font-headline" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', margin: 0, color: INK }}>Avisos importantes</h2>
                            <p style={{ fontSize: 12, color: INK_3, marginTop: 2 }}>Curso {cursoJefe} · Aparecen en el pie del PDF de agenda</p>
                        </div>
                        <button onClick={() => setShowAvisoModal(false)} className="transition-colors hover:bg-slate-100 rounded-lg" style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', color: INK_2, flexShrink: 0 }}>
                            <X size={18} />
                        </button>
                    </div>
                    <div className="cal-modal-body" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Vista previa — solo se muestra cuando NO hay personalizados */}
                        {avisosJefe.length === 0 && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: INK_3 }}>
                                    Avisos por defecto del establecimiento
                                </p>
                                <div className="space-y-1.5">
                                    {AVISOS_DEFAULT.map((texto, i) => (
                                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl group" style={{ background: '#FEF9EC', border: '1px solid #F3E7C3' }}>
                                            <span className="text-xs font-bold mt-0.5 flex-shrink-0" style={{ color: '#D97706' }}>•</span>
                                            <span className="flex-1 text-sm" style={{ color: INK }}>{texto}</span>
                                            <button
                                                onClick={() => adoptarYEditarDefault(i)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5 hover:text-amber-600 transition-colors"
                                                style={{ color: INK_3 }}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs mt-2" style={{ color: INK_3 }}>
                                    Edita cualquier aviso para personalizarlos. Los demás por defecto también se adoptarán.
                                </p>
                            </div>
                        )}

                        {/* Gestión de avisos personalizados */}
                        <div style={{ borderTop: avisosJefe.length === 0 ? `1px solid ${LINE}` : 'none', paddingTop: avisosJefe.length === 0 ? 16 : 0 }}>
                            {avisosJefe.length === 0 && (
                                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: INK_3 }}>
                                    Agregar aviso personalizado
                                </p>
                            )}
                            {avisosJefe.length > 0 && (
                                <div className="space-y-1.5 mb-3">
                                    {avisosJefe.map(a => (
                                        <div key={a.id} className="rounded-xl group" style={{ border: `1px solid ${editingAvisoId === a.id ? '#F3E7C3' : LINE}`, background: editingAvisoId === a.id ? '#FFFBF2' : '#fff' }}>
                                            {editingAvisoId === a.id ? (
                                                <div className="flex flex-col gap-2 p-2">
                                                    <textarea
                                                        autoFocus
                                                        rows={2}
                                                        value={editingAvisoText}
                                                        onChange={e => setEditingAvisoText(e.target.value)}
                                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guardarEdicionAviso(a.id); } if (e.key === 'Escape') cancelarEdicionAviso(); }}
                                                        className="w-full text-sm px-2 py-1.5 rounded-lg resize-none focus:outline-none focus:ring-2"
                                                        style={{ border: `1px solid #F3E7C3`, color: INK, '--tw-ring-color': '#F3E7C3' }}
                                                    />
                                                    <div className="flex gap-1.5 justify-end">
                                                        <button onClick={cancelarEdicionAviso} className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors hover:bg-slate-100" style={{ color: INK_2 }}>Cancelar</button>
                                                        <button onClick={() => guardarEdicionAviso(a.id)} disabled={savingAviso || !editingAvisoText.trim()} className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:brightness-95 disabled:opacity-50" style={{ background: '#D97706', color: '#fff' }}>Guardar</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-2 px-3 py-2.5">
                                                    <span className="flex-1 text-sm" style={{ color: INK }}>{a.texto}</span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                                                        <button onClick={() => iniciarEdicionAviso(a)} style={{ color: INK_3 }} className="hover:text-amber-600 transition-colors">
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button onClick={() => eliminarAviso(a.id)} style={{ color: INK_3 }} className="hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input
                                    ref={nuevoAvisoRef}
                                    value={nuevoAviso}
                                    onChange={e => setNuevoAviso(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && agregarAviso()}
                                    placeholder="Escribe un aviso y presiona Enter…"
                                    className="flex-1 text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2"
                                    style={{ border: `1px solid ${LINE}`, background: '#fff', color: INK, '--tw-ring-color': '#F3E7C3' }}
                                />
                                <button
                                    onClick={agregarAviso}
                                    disabled={savingAviso || !nuevoAviso.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-95 disabled:opacity-50"
                                    style={{ background: '#D97706', color: '#fff' }}
                                >
                                    <Plus className="w-4 h-4" /> Agregar
                                </button>
                            </div>
                            {avisosJefe.length === 0 && (
                                <p className="text-xs mt-2" style={{ color: INK_3 }}>
                                    Al agregar un aviso propio, los por defecto dejan de aparecer en el PDF.
                                </p>
                            )}
                        </div>
                    </div>
                </CalModal>
            )}

            {/* ── Modals ─────────────────────────────────────────────────── */}
            {dayModal && (
                <DayModal
                    dateStr={dayModal.dateStr}
                    events={dayModal.events}
                    agendaItems={dayModal.agendaItems}
                    onClose={() => setDayModal(null)}
                    canCreate={dayModal.dateStr >= todayStr && canCreateEval}
                    onNew={() => { setSelectedDate(dayModal.dateStr); setDayModal(null); }}
                    onDetail={(ev) => { setEvalModal({ type: 'detail', data: ev }); setDayModal(null); }}
                    onDeleteAgendaEntry={handleDeleteAgendaEntry}
                    currentUserId={user?.uid}
                    canCRUD={canCRUD}
                />
            )}

            <AnimatePresence>
                {showAgenda && (
                    <AgendaSemanalModal user={user} onClose={() => setShowAgenda(false)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedDate && (
                    <CrearEvaluacionModal
                        onClose={() => setSelectedDate(null)}
                        onCreated={() => setSelectedDate(null)}
                        user={user}
                        defaultDate={selectedDate}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showFijar && (
                    <CrearEvaluacionModal
                        onClose={() => setShowFijar(false)}
                        onCreated={() => setShowFijar(false)}
                        user={user}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {evalModal?.type === 'detail' ? (
                    <EvalDetailModal
                        key="detail"
                        eval={evalModal.data}
                        onClose={() => setEvalModal(null)}
                        canCRUD={canCRUD}
                        canEditEval={canCRUD || (canCreateEval && evalModal.data?.createdBy?.id === user?.uid)}
                        onEdit={() => setEvalModal({ type: 'edit', data: evalModal.data })}
                        onDelete={() => { setEvalModal(null); deleteEvaluacion(evalModal.data.id); }}
                        onApprove={async () => { await approvePendingChanges(evalModal.data.id, evalModal.data.pendingChanges); setEvalModal(null); }}
                        onReject={async () => { await rejectPendingChanges(evalModal.data.id); setEvalModal(null); }}
                    />
                ) : evalModal?.type === 'list' ? (
                    <EditarFechasModal
                        key="list"
                        evaluaciones={evaluaciones}
                        user={user}
                        canCRUD={canCRUD}
                        onEdit={(ev) => setEvalModal({ type: 'edit', data: ev })}
                        onClose={() => setEvalModal(null)}
                    />
                ) : evalModal?.type === 'edit' ? (
                    <CrearEvaluacionModal
                        key={`edit-${evalModal.data.id}`}
                        onClose={() => setEvalModal(null)}
                        onCreated={() => setEvalModal(null)}
                        user={user}
                        evalId={evalModal.data.id}
                        initialData={evalModal.data}
                    />
                ) : null}
            </AnimatePresence>

            {/* ── Modal selector de semana — exportar agenda ── */}
            {showAgendaExportModal && (
                <CalModal onClose={() => setShowAgendaExportModal(false)} width={460}>
                    {/* Head */}
                    <div className="cal-modal-head" style={{ padding: '22px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: PRIMARY_SOFT, color: PRIMARY, display: 'grid', placeItems: 'center' }}>
                            <NotebookPen className="w-5 h-5" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 className="font-headline" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', margin: 0, color: INK }}>Exportar agenda semanal</h2>
                            <p style={{ fontSize: 13, color: INK_2, marginTop: 3 }}>{agendaExportWeekOfMonth}</p>
                        </div>
                        <button onClick={() => setShowAgendaExportModal(false)} className="transition-colors hover:bg-slate-100 rounded-lg"
                            style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', color: INK_2, flexShrink: 0 }}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="cal-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Curso dropdown */}
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: INK_3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Curso</p>
                            <div style={{ display: 'inline-flex' }}>
                            <PillSelector
                                label="curso"
                                value={agendaExportCurso ?? ''}
                                bg={PRIMARY}
                                canPrev={canPrevAgendaCurso}
                                canNext={canNextAgendaCurso}
                                onPrev={() => canPrevAgendaCurso && setAgendaExportCurso(realCursos[agendaCursoIdx - 1])}
                                onNext={() => canNextAgendaCurso && setAgendaExportCurso(realCursos[agendaCursoIdx + 1])}
                                isOpen={agendaCursoDropdownOpen}
                                onOpen={() => setAgendaCursoDropdownOpen(o => !o)}
                                dropdownRef={agendaCursoDropdownRef}
                            >
                                {realCursos.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setAgendaExportCurso(c); setAgendaCursoDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                                        style={c === agendaExportCurso ? { background: PRIMARY, color: '#fff' } : { color: INK }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </PillSelector>
                            </div>
                        </div>

                        {/* Semana */}
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: INK_3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Semana</p>

                            {/* Navegador */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <button onClick={() => goAgendaExportWeek(-1)} className="transition-colors hover:bg-slate-100 rounded-lg"
                                    style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: PRIMARY, flexShrink: 0, border: `1px solid ${LINE}`, background: '#fff' }}>
                                    <ChevronLeft size={15} />
                                </button>
                                <div style={{ flex: 1, textAlign: 'center', padding: '6px 0' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{agendaExportWeekLabel}</div>
                                    <div style={{ fontSize: 11, color: INK_3, marginTop: 2 }}>{agendaExportWeekOfMonth}</div>
                                </div>
                                <button onClick={() => goAgendaExportWeek(1)} className="transition-colors hover:bg-slate-100 rounded-lg"
                                    style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: PRIMARY, flexShrink: 0, border: `1px solid ${LINE}`, background: '#fff' }}>
                                    <ChevronRight size={15} />
                                </button>
                            </div>

                            {/* Mini grilla de días */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                                {agendaExportWeekDays.map(day => (
                                    <div key={day.iso} style={{
                                        textAlign: 'center', padding: '8px 4px', borderRadius: 10,
                                        background: day.isToday ? PRIMARY_SOFT : '#FAF6EE',
                                        border: day.isToday ? `1.5px solid ${PRIMARY}` : `1px solid ${LINE}`,
                                    }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: day.isToday ? PRIMARY : INK_3 }}>
                                            {day.label}
                                        </div>
                                        <div style={{ fontSize: 16, fontWeight: day.isToday ? 800 : 600, color: day.isToday ? PRIMARY : INK, marginTop: 2, lineHeight: 1 }}>
                                            {day.date}
                                        </div>
                                        {day.isToday && (
                                            <div style={{ fontSize: 9, fontWeight: 800, color: PRIMARY, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Hoy
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Foot */}
                    <div className="cal-modal-foot" style={{ padding: '14px 24px', borderTop: `1px solid ${LINE}`, background: '#FAF6EE', display: 'flex', gap: 10, flexShrink: 0 }}>
                        <button onClick={() => setShowAgendaExportModal(false)} className="transition-colors hover:bg-slate-100 rounded-xl"
                            style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, color: INK_2 }}>
                            Cancelar
                        </button>
                        <button onClick={handleAgendaExportPDF} disabled={exportingAgenda}
                            className="flex items-center justify-center gap-2 transition-all hover:brightness-95 rounded-xl"
                            style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, background: PRIMARY, color: '#fff', opacity: exportingAgenda ? 0.7 : 1 }}>
                            {exportingAgenda ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                            {exportingAgenda ? 'Exportando…' : 'Exportar PDF'}
                        </button>
                    </div>
                </CalModal>
            )}

            {/* ── Modal: Exportar tabla de agenda (oficio horizontal) ── */}
            {showTabularExportModal && (
                <CalModal onClose={() => setShowTabularExportModal(false)} width={460}>
                    {/* Head */}
                    <div className="cal-modal-head" style={{ padding: '22px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: '#EEF0FF', color: '#3730A3', display: 'grid', placeItems: 'center' }}>
                            <Table2 className="w-5 h-5" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 className="font-headline" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', margin: 0, color: INK }}>Exportar tabla de agenda</h2>
                            <p style={{ fontSize: 13, color: INK_2, marginTop: 3 }}>Hoja oficio horizontal — datos auto-completados</p>
                        </div>
                        <button onClick={() => setShowTabularExportModal(false)} className="transition-colors hover:bg-slate-100 rounded-lg"
                            style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', color: INK_2, flexShrink: 0 }}>
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="cal-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                        {/* Curso */}
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: INK_3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Curso</p>
                            <div style={{ display: 'inline-flex' }}>
                                <PillSelector
                                    label="curso"
                                    value={agendaExportCurso ?? ''}
                                    bg={PRIMARY}
                                    canPrev={canPrevAgendaCurso}
                                    canNext={canNextAgendaCurso}
                                    onPrev={() => canPrevAgendaCurso && setAgendaExportCurso(realCursos[agendaCursoIdx - 1])}
                                    onNext={() => canNextAgendaCurso && setAgendaExportCurso(realCursos[agendaCursoIdx + 1])}
                                    isOpen={agendaCursoDropdownOpen}
                                    onOpen={() => setAgendaCursoDropdownOpen(o => !o)}
                                    dropdownRef={agendaCursoDropdownRef}
                                >
                                    {realCursos.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => { setAgendaExportCurso(c); setAgendaCursoDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                                            style={c === agendaExportCurso ? { background: PRIMARY, color: '#fff' } : { color: INK }}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </PillSelector>
                            </div>
                        </div>

                        {/* Semana */}
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: INK_3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Semana</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button onClick={() => goAgendaExportWeek(-1)} className="transition-colors hover:bg-slate-100 rounded-lg"
                                    style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: PRIMARY, flexShrink: 0, border: `1px solid ${LINE}`, background: '#fff' }}>
                                    <ChevronLeft size={15} />
                                </button>
                                <div style={{ flex: 1, textAlign: 'center', padding: '6px 0' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{agendaExportWeekLabel}</div>
                                    <div style={{ fontSize: 11, color: INK_3, marginTop: 2 }}>{agendaExportWeekOfMonth}</div>
                                </div>
                                <button onClick={() => goAgendaExportWeek(1)} className="transition-colors hover:bg-slate-100 rounded-lg"
                                    style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: PRIMARY, flexShrink: 0, border: `1px solid ${LINE}`, background: '#fff' }}>
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>

                        {/* Nota informativa */}
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#EEF0FF', border: '1px solid rgba(55,48,163,0.15)' }}>
                            <p style={{ fontSize: 12, color: '#3730A3', margin: 0, lineHeight: 1.5 }}>
                                El PDF se genera automáticamente con el horario oficial, los profesores del curso, las evaluaciones de la semana y los materiales registrados en agenda.
                            </p>
                        </div>
                    </div>

                    {/* Foot */}
                    <div className="cal-modal-foot" style={{ padding: '14px 24px', borderTop: `1px solid ${LINE}`, background: '#FAF6EE', display: 'flex', gap: 10, flexShrink: 0 }}>
                        <button onClick={() => setShowTabularExportModal(false)} className="transition-colors hover:bg-slate-100 rounded-xl"
                            style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, color: INK_2 }}>
                            Cancelar
                        </button>
                        <button onClick={handleTabularExportPDF} disabled={exportingTabular}
                            className="flex items-center justify-center gap-2 transition-all hover:brightness-95 rounded-xl"
                            style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, background: '#3730A3', color: '#fff', opacity: exportingTabular ? 0.7 : 1 }}>
                            {exportingTabular ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table2 className="w-4 h-4" />}
                            {exportingTabular ? 'Generando…' : 'Exportar PDF oficio'}
                        </button>
                    </div>
                </CalModal>
            )}

            {/* ── Modal: Agregar interferiado (solo utp_head) ── */}
            {showInterferiado && (
                <CalModal onClose={() => setShowInterferiado(false)} width={400}>
                    <div className="cal-modal-head" style={{ padding: '22px 24px 16px', display: 'flex', alignItems: 'flex-start', gap: 14, borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: '#FEE2E2', color: '#DC2626', display: 'grid', placeItems: 'center' }}>
                            <BanIcon className="w-5 h-5" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 className="font-headline" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', margin: 0, color: INK }}>Agregar interferiado</h2>
                            <p style={{ fontSize: 13, color: INK_2, marginTop: 3 }}>Día sin clases que afecta todos los calendarios</p>
                        </div>
                        <button onClick={() => setShowInterferiado(false)} className="transition-colors hover:bg-slate-100 rounded-lg"
                            style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', color: INK_2, flexShrink: 0 }}>
                            <X size={18} />
                        </button>
                    </div>

                    <div className="cal-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: INK_3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Fecha</p>
                            <input
                                type="date"
                                value={interferiado.date}
                                onChange={e => setInterferiado(v => ({ ...v, date: e.target.value }))}
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${LINE}`, borderRadius: 10, fontSize: 14, color: INK, background: '#fff', outline: 'none' }}
                            />
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: INK_3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Nombre</p>
                            <input
                                type="text"
                                placeholder="Ej: Aniversario del colegio"
                                value={interferiado.name}
                                onChange={e => setInterferiado(v => ({ ...v, name: e.target.value }))}
                                style={{ width: '100%', padding: '10px 14px', border: `1px solid ${LINE}`, borderRadius: 10, fontSize: 14, color: INK, background: '#fff', outline: 'none' }}
                            />
                        </div>

                        {/* Interferiados existentes */}
                        {Object.keys(customHolidays).length > 0 && (
                            <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: INK_3, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>Interferiados activos</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {Object.entries(customHolidays).sort(([a],[b]) => a.localeCompare(b)).map(([date, name]) => (
                                        <div key={date} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                                            <Flag style={{ width: 14, height: 14, color: '#DC2626', flexShrink: 0 }} />
                                            <span style={{ flex: 1, fontSize: 13, color: INK, fontWeight: 600 }}>{name}</span>
                                            <span style={{ fontSize: 12, color: INK_3 }}>{new Date(date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
                                            <button
                                                onClick={() => deleteHoliday(date).then(() => toast.success('Eliminado')).catch(() => toast.error('Error al eliminar'))}
                                                style={{ color: '#DC2626', opacity: 0.7, flexShrink: 0 }}
                                                className="hover:opacity-100 transition-opacity"
                                                title="Eliminar"
                                            >
                                                <Trash2 style={{ width: 14, height: 14 }} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="cal-modal-foot" style={{ padding: '14px 24px', borderTop: `1px solid ${LINE}`, background: '#FAF6EE', display: 'flex', gap: 10, flexShrink: 0 }}>
                        <button onClick={() => setShowInterferiado(false)} className="transition-colors hover:bg-slate-100 rounded-xl"
                            style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, color: INK_2 }}>
                            Cerrar
                        </button>
                        <button
                            disabled={!interferiado.date || !interferiado.name.trim() || savingInterferiado}
                            onClick={async () => {
                                setSavingInterferiado(true);
                                try {
                                    await addHoliday(interferiado.date, interferiado.name.trim());
                                    toast.success('Interferiado agregado');
                                    setInterferiado({ date: '', name: '' });
                                } catch {
                                    toast.error('Error al guardar');
                                } finally {
                                    setSavingInterferiado(false);
                                }
                            }}
                            className="flex items-center justify-center gap-2 transition-all hover:brightness-95 rounded-xl"
                            style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, background: '#DC2626', color: '#fff', opacity: (!interferiado.date || !interferiado.name.trim() || savingInterferiado) ? 0.5 : 1 }}>
                            {savingInterferiado ? <Loader2 className="w-4 h-4 animate-spin" /> : <BanIcon className="w-4 h-4" />}
                            Agregar
                        </button>
                    </div>
                </CalModal>
            )}
        </div>
    );
}
