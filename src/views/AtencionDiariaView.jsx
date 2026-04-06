import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Stethoscope, Plus, X, Pencil, Trash2, Search, ChevronLeft, ChevronRight, User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ModalContainer from '../components/ModalContainer';
import { useAuth } from '../context/AuthContext';
import { useStudents } from '../context/StudentsContext';
import { useSchedule, SCHEDULE_BLOCKS } from '../context/ScheduleContext';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { orderBy } from 'firebase/firestore';
import { toast } from 'sonner';

// ── Opciones ──
const OPCIONES_MOTIVO = [
    'Dolor de cabeza',
    'Dolor abdominal',
    'Fiebre',
    'Herida / golpe',
    'Crisis emocional',
    'Vómitos',
    'Mareos / lipotimia',
    'Dolor de garganta',
    'Dolor de muela',
    'Alergia',
    'Crisis asmática',
    'Accidente en recreo',
    'Sangrado nasal',
    'Malestar general',
    'Control de medicamento',
    'Otro',
];

const OPCIONES_TRATAMIENTO = [
    'Reposo',
    'Analgésico (paracetamol)',
    'Ibuprofeno',
    'Antiespasmódico',
    'Curación',
    'Compresas / hielo',
    'Control de temperatura',
    'Nebulización',
    'Antihistamínico',
    'Derivación a urgencias',
    'Solo evaluación',
    'Otro',
];

const CURSOS_TODOS = [
    'Pre-Kinder', 'Kinder',
    '1° Básico', '2° Básico', '3° Básico', '4° Básico',
    '5° Básico', '6° Básico', '7° Básico', '8° Básico',
];

// ── ComboInput con portal ──
function ComboInput({ value, onChange, options, placeholder, inputClassName }) {
    const [open, setOpen] = useState(false);
    const inputRef = React.useRef(null);
    const dropdownRef = React.useRef(null);

    const filtered = useMemo(() => {
        const norm = value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!norm) return options;
        return options.filter(o =>
            o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(norm)
        );
    }, [value, options]);

    useEffect(() => {
        const close = (e) => {
            if (!inputRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const getStyle = () => {
        if (!inputRef.current) return {};
        const r = inputRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom;
        const spaceAbove = r.top;
        const upward = spaceBelow < 220 && spaceAbove > spaceBelow;
        return {
            position: 'fixed',
            left: r.left,
            width: r.width,
            zIndex: 9999,
            ...(upward
                ? { bottom: window.innerHeight - r.top + 4, maxHeight: Math.min(spaceAbove - 8, 280) }
                : { top: r.bottom + 4,                      maxHeight: Math.min(spaceBelow - 8, 280) }),
        };
    };

    return (
        <>
            <input
                ref={inputRef}
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={e => { onChange(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                className={inputClassName}
                autoComplete="off"
            />
            {open && filtered.length > 0 && createPortal(
                <div
                    ref={dropdownRef}
                    style={getStyle()}
                    className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-y-auto"
                >
                    {filtered.map(opt => (
                        <button
                            key={opt}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors border-b border-slate-50 last:border-0"
                        >
                            {opt}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}

// ── Buscador de estudiantes con autocompletado (portal) ──
function StudentSearchInput({ value, onSelect, onClear, students, inputClassName }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState(value || '');
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Sync query cuando se edita externamente (ej. al limpiar)
    useEffect(() => { setQuery(value || ''); }, [value]);

    const normalizeSearch = (t) =>
        t?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

    const filtered = useMemo(() => {
        const norm = normalizeSearch(query);
        if (!norm || norm.length < 2) return [];
        return students
            .filter(s =>
                normalizeSearch(s.fullName).includes(norm) ||
                normalizeSearch(s.rut).includes(norm)
            )
            .slice(0, 8);
    }, [query, students]);

    useEffect(() => {
        const close = (e) => {
            if (!inputRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const getStyle = () => {
        if (!inputRef.current) return {};
        const r = inputRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom;
        const spaceAbove = r.top;
        const upward = spaceBelow < 260 && spaceAbove > spaceBelow;
        return {
            position: 'fixed',
            left: r.left,
            width: r.width,
            zIndex: 9999,
            ...(upward
                ? { bottom: window.innerHeight - r.top + 4, maxHeight: Math.min(spaceAbove - 8, 320) }
                : { top: r.bottom + 4,                      maxHeight: Math.min(spaceBelow - 8, 320) }),
        };
    };

    const handleSelect = (student) => {
        setQuery(student.fullName);
        setOpen(false);
        onSelect(student);
    };

    const handleChange = (e) => {
        setQuery(e.target.value);
        setOpen(true);
        // Si borra texto, limpia la selección
        if (!e.target.value.trim()) onClear();
    };

    return (
        <>
            <input
                ref={inputRef}
                type="text"
                value={query}
                placeholder="Buscar por nombre o RUT..."
                onChange={handleChange}
                onFocus={() => query.length >= 2 && setOpen(true)}
                className={inputClassName}
                autoComplete="off"
            />
            {open && filtered.length > 0 && createPortal(
                <div
                    ref={dropdownRef}
                    style={getStyle()}
                    className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-y-auto"
                >
                    {filtered.map(s => (
                        <button
                            key={s.id}
                            type="button"
                            onMouseDown={e => { e.preventDefault(); handleSelect(s); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 transition-colors border-b border-slate-50 last:border-0"
                        >
                            <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-teal-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-slate-800">{s.fullName}</p>
                                <p className="text-xs text-slate-400">{s.curso} · {s.rut}</p>
                            </div>
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}

// ── Helpers ──
const todayStr = () => new Date().toISOString().split('T')[0];

function formatDate(d) {
    if (!d) return '';
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
}

function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
}

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', ''];

/**
 * Determina dónde estaba el estudiante según la hora y el día.
 * @returns {{ tipo, label, subject?, teacher? } | null}
 */
function resolverUbicacion(horaStr, dateStr, curso, schedules, users) {
    if (!horaStr || !dateStr || !curso) return null;

    const date = new Date(dateStr + 'T12:00:00');
    const dayIndex = date.getDay(); // 0=Dom, 6=Sáb
    if (dayIndex === 0 || dayIndex === 6) return { tipo: 'sin_clases', label: 'Fin de semana' };
    const dayName = DAY_NAMES[dayIndex];

    const [h, m] = horaStr.split(':').map(Number);
    const mins = h * 60 + m;

    const block = SCHEDULE_BLOCKS.find(b => {
        const [bh, bm] = b.start.split(':').map(Number);
        const [eh, em] = b.end.split(':').map(Number);
        return mins >= bh * 60 + bm && mins < eh * 60 + em;
    });

    if (!block) return { tipo: 'fuera_horario', label: 'Fuera del horario escolar' };

    if (block.type === 'break') {
        const esAlmuerzo = block.id === 'almuerzo';
        return {
            tipo: 'recreo',
            label: esAlmuerzo ? `Almuerzo (${block.start}–${block.end})` : `Recreo (${block.start}–${block.end})`,
        };
    }

    // Buscar docente que tiene ese curso a esa hora ese día
    for (const [userId, blocks] of Object.entries(schedules)) {
        const match = blocks.find(b => b.day === dayName && b.startTime === block.start && b.course === curso);
        if (match) {
            const teacher = users.find(u => u.id === userId);
            return {
                tipo: 'clases',
                label: `${match.subject}`,
                subject: match.subject,
                teacher: teacher?.name || 'Docente',
            };
        }
    }

    // Hora de clase pero sin asignación
    return {
        tipo: 'clases',
        label: block.label,
        subject: null,
        teacher: null,
    };
}

const EMPTY_FORM = {
    studentId: '',
    nombreEstudiante: '',
    rut: '',
    curso: '',
    horaIncidente: '',
    motivo: '',
    evaluacion: '',
    tratamiento: '',
    notificoApoderado: '',
    enviadoCasa: '',
    observaciones: '',
};

const NOTIF_OPTS = [
    { val: 'SI',              idle: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100', sel: 'bg-green-500 text-white border-green-500' },
    { val: 'NO',              idle: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',         sel: 'bg-red-500 text-white border-red-500' },
    { val: 'No fue necesario',idle: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200', sel: 'bg-slate-600 text-white border-slate-600' },
];

const SINONOPT = [
    { val: 'SI', idle: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100', sel: 'bg-green-500 text-white border-green-500' },
    { val: 'NO', idle: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',         sel: 'bg-red-500 text-white border-red-500' },
];

export default function AtencionDiariaView() {
    const { user, users } = useAuth();
    const { students } = useStudents();
    const { schedules } = useSchedule();

    const [atenciones, setAtenciones] = useState([]);
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [search, setSearch] = useState('');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    // Confirmar eliminación
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Ubicación automática según hora del incidente
    const ubicacion = useMemo(
        () => resolverUbicacion(form.horaIncidente, selectedDate, form.curso, schedules, users),
        [form.horaIncidente, selectedDate, form.curso, schedules, users]
    );

    // Suscripción Firestore
    useEffect(() => {
        const unsub = subscribeToCollection('atenciones_diarias', setAtenciones, orderBy('createdAt', 'desc'));
        return unsub;
    }, []);

    // Filtrar por fecha seleccionada + búsqueda
    const atencionesDelDia = useMemo(() => {
        let list = atenciones.filter(a => a.fecha === selectedDate);
        if (search.trim()) {
            const norm = search.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            list = list.filter(a =>
                (a.nombreEstudiante || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(norm) ||
                (a.motivo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(norm)
            );
        }
        return list;
    }, [atenciones, selectedDate, search]);

    // Stats del día
    const stats = useMemo(() => {
        const delDia = atenciones.filter(a => a.fecha === selectedDate);
        return {
            total: delDia.length,
            enviadosCasa: delDia.filter(a => a.enviadoCasa === 'SI').length,
            notificados: delDia.filter(a => a.notificoApoderado === 'SI').length,
        };
    }, [atenciones, selectedDate]);

    // ── Modales ──
    const openNew = () => {
        setEditing(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEdit = (a) => {
        setEditing(a);
        setForm({
            studentId: a.studentId || '',
            nombreEstudiante: a.nombreEstudiante || '',
            rut: a.rut || '',
            curso: a.curso || '',
            horaIncidente: a.horaIncidente || '',
            motivo: a.motivo || '',
            evaluacion: a.evaluacion || '',
            tratamiento: a.tratamiento || '',
            notificoApoderado: a.notificoApoderado || '',
            enviadoCasa: a.enviadoCasa || '',
            observaciones: a.observaciones || '',
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setForm(EMPTY_FORM);
    };

    const handleSave = async () => {
        if (!form.nombreEstudiante.trim()) { toast.error('Ingresa el nombre del estudiante'); return; }
        if (!form.motivo.trim()) { toast.error('Indica el motivo de la atención'); return; }
        setSaving(true);
        const payload = {
            fecha: selectedDate,
            hora: editing?.hora || new Date().toTimeString().slice(0, 5),
            studentId: form.studentId,
            nombreEstudiante: form.nombreEstudiante.trim(),
            rut: form.rut,
            curso: form.curso,
            horaIncidente: form.horaIncidente,
            ubicacion: ubicacion ? { tipo: ubicacion.tipo, label: ubicacion.label, subject: ubicacion.subject || null, teacher: ubicacion.teacher || null } : null,
            motivo: form.motivo.trim(),
            evaluacion: form.evaluacion.trim(),
            tratamiento: form.tratamiento.trim(),
            notificoApoderado: form.notificoApoderado,
            enviadoCasa: form.enviadoCasa,
            observaciones: form.observaciones.trim(),
            registradoPor: user?.name || '',
        };
        try {
            if (editing) {
                await updateDocument('atenciones_diarias', editing.id, payload);
                toast.success('Atención actualizada');
            } else {
                await createDocument('atenciones_diarias', payload);
                toast.success('Atención registrada');
            }
            closeModal();
        } catch (err) {
            console.error('Error atenciones_diarias:', err);
            toast.error(err?.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await removeDocument('atenciones_diarias', deleteConfirm.id);
            toast.success('Atención eliminada');
        } catch (err) {
            toast.error(err?.message || 'Error al eliminar');
        } finally {
            setDeleteConfirm(null);
        }
    };

    const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                    <Stethoscope className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Atenciones Diarias</h1>
                    <p className="text-sm text-slate-500">Registro de consultas en enfermería</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-200 transition-all hover:-translate-y-0.5 shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Nueva Atención</span>
                </button>
            </div>

            {/* Selector de fecha — card grande */}
            {(() => {
                const d = new Date(selectedDate + 'T12:00:00');
                const dayNames  = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
                const isToday = selectedDate === todayStr();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                    <div className={`relative rounded-3xl overflow-hidden shadow-sm border ${isWeekend ? 'border-slate-200' : 'border-teal-100'}`}>
                        {/* Fondo degradado */}
                        <div className={`absolute inset-0 ${isWeekend ? 'bg-slate-100' : 'bg-gradient-to-br from-teal-500 to-emerald-600'}`} />

                        <div className="relative flex items-center px-4 py-5 gap-4">
                            {/* Flecha izquierda */}
                            <button
                                onClick={() => setSelectedDate(d => addDays(d, -1))}
                                className={`p-2.5 rounded-2xl transition-colors shrink-0 ${isWeekend ? 'bg-white/60 hover:bg-white text-slate-500' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            {/* Centro: día grande */}
                            <div className="flex-1 text-center">
                                <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-1 ${isWeekend ? 'text-slate-400' : 'text-teal-100'}`}>
                                    {dayNames[d.getDay()]}
                                </p>
                                <p className={`text-6xl font-black leading-none tabular-nums ${isWeekend ? 'text-slate-400' : 'text-white'}`}>
                                    {d.getDate()}
                                </p>
                                <p className={`text-sm font-semibold mt-1.5 uppercase tracking-wider ${isWeekend ? 'text-slate-400' : 'text-teal-100'}`}>
                                    {monthNames[d.getMonth()]} {d.getFullYear()}
                                </p>
                            </div>

                            {/* Flecha derecha + Hoy */}
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <button
                                    onClick={() => setSelectedDate(d => addDays(d, 1))}
                                    className={`p-2.5 rounded-2xl transition-colors ${isWeekend ? 'bg-white/60 hover:bg-white text-slate-500' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                                {!isToday && (
                                    <button
                                        onClick={() => setSelectedDate(todayStr())}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${isWeekend ? 'bg-white text-slate-600 hover:bg-slate-50' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                                    >
                                        Hoy
                                    </button>
                                )}
                                {isToday && (
                                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-xl ${isWeekend ? 'bg-slate-200 text-slate-500' : 'bg-white/25 text-white'}`}>
                                        HOY
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Input date oculto para soporte nativo en mobile */}
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="sr-only"
                            tabIndex={-1}
                            aria-hidden
                        />
                    </div>
                );
            })()}

            {/* Stats del día */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-teal-700">{stats.total}</p>
                    <p className="text-xs text-teal-500 font-medium mt-0.5">Atenciones</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats.notificados}</p>
                    <p className="text-xs text-amber-500 font-medium mt-0.5">Apoderado notif.</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-rose-600">{stats.enviadosCasa}</p>
                    <p className="text-xs text-rose-500 font-medium mt-0.5">Enviados a casa</p>
                </div>
            </div>

            {/* Búsqueda */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o motivo..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none shadow-sm"
                />
            </div>

            {/* Lista */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {atencionesDelDia.length === 0 ? (
                    <div className="py-14 text-center text-slate-400">
                        <Stethoscope className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">
                            {search.trim() ? 'Sin resultados para esa búsqueda' : `Sin atenciones registradas el ${formatDate(selectedDate)}`}
                        </p>
                        <button
                            onClick={openNew}
                            className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            Registrar primera atención
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {atencionesDelDia.map(a => (
                            <div key={a.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                                {/* Hora */}
                                <div className="shrink-0 text-center w-12 pt-0.5">
                                    <p className="text-sm font-bold text-teal-700">{a.hora || '--:--'}</p>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-slate-800">{a.nombreEstudiante}</p>
                                        {a.curso && (
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{a.curso}</span>
                                        )}
                                        {a.enviadoCasa === 'SI' && (
                                            <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">Enviado a casa</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        <span className="font-medium">Motivo:</span> {a.motivo}
                                    </p>
                                    {a.tratamiento && (
                                        <p className="text-xs text-slate-500">
                                            <span className="font-medium">Tratamiento:</span> {a.tratamiento}
                                        </p>
                                    )}
                                    {a.ubicacion && (
                                        <p className={`text-xs font-medium ${
                                            a.ubicacion.tipo === 'clases' ? 'text-indigo-600'
                                            : a.ubicacion.tipo === 'recreo' ? 'text-amber-600'
                                            : 'text-slate-400'
                                        }`}>
                                            {a.ubicacion.tipo === 'clases' ? '📚' : a.ubicacion.tipo === 'recreo' ? '🏃' : '⏰'}{' '}
                                            {a.ubicacion.tipo === 'clases' ? 'Clases:' : a.ubicacion.tipo === 'recreo' ? 'Recreo:' : ''}{' '}
                                            {a.ubicacion.label}
                                            {a.ubicacion.teacher ? ` · ${a.ubicacion.teacher}` : ''}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {a.notificoApoderado && a.notificoApoderado !== 'No fue necesario' && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${a.notificoApoderado === 'SI' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                Apoderado: {a.notificoApoderado}
                                            </span>
                                        )}
                                        {a.observaciones && (
                                            <span className="text-[10px] text-slate-400 italic truncate max-w-xs">{a.observaciones}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => openEdit(a)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(a)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── MODAL: Nueva / Editar Atención ── */}
            <AnimatePresence>
                {modalOpen && (
                    <ModalContainer onClose={closeModal} maxWidth="max-w-lg">
                        <div className="overflow-y-auto p-6 space-y-4">
                            {/* Cabecera */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Stethoscope className="w-4 h-4 text-teal-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
                                        {editing ? 'Editar' : 'Nueva'} Atención · {formatDate(selectedDate)}
                                    </p>
                                </div>
                                <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>

                            {/* Estudiante */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Estudiante *</label>
                                <StudentSearchInput
                                    value={form.nombreEstudiante}
                                    students={students}
                                    onSelect={s => setForm(f => ({
                                        ...f,
                                        studentId: s.id,
                                        nombreEstudiante: s.fullName,
                                        rut: s.rut || '',
                                        curso: s.curso || '',
                                    }))}
                                    onClear={() => setForm(f => ({
                                        ...f,
                                        studentId: '',
                                        rut: '',
                                        curso: '',
                                    }))}
                                    inputClassName={inputCls}
                                />
                                {/* Tarjeta de info automática */}
                                {form.studentId && (
                                    <div className="mt-2 flex items-center gap-3 px-3 py-2 bg-teal-50 border border-teal-100 rounded-xl">
                                        <div className="w-7 h-7 bg-teal-200 rounded-lg flex items-center justify-center shrink-0">
                                            <User className="w-3.5 h-3.5 text-teal-700" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-teal-800 truncate">{form.nombreEstudiante}</p>
                                            <p className="text-xs text-teal-600">{form.curso}{form.rut ? ` · ${form.rut}` : ''}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, studentId: '', nombreEstudiante: '', rut: '', curso: '' }))}
                                            className="p-1 text-teal-400 hover:text-teal-700 hover:bg-teal-100 rounded-lg transition-colors shrink-0"
                                            title="Limpiar selección"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                                {/* Si no hay studentId pero sí nombre escrito, permite ingreso libre */}
                                {!form.studentId && form.nombreEstudiante && (
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">Curso (manual)</label>
                                            <select
                                                value={form.curso}
                                                onChange={e => setForm(f => ({ ...f, curso: e.target.value }))}
                                                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none bg-white text-slate-700"
                                            >
                                                <option value="">Seleccionar...</option>
                                                {CURSOS_TODOS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">RUT (manual)</label>
                                            <input
                                                type="text"
                                                placeholder="12345678-9"
                                                value={form.rut}
                                                onChange={e => setForm(f => ({ ...f, rut: e.target.value }))}
                                                className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Hora del incidente + ubicación automática */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Hora del incidente</label>
                                <input
                                    type="time"
                                    value={form.horaIncidente}
                                    onChange={e => setForm(f => ({ ...f, horaIncidente: e.target.value }))}
                                    className={inputCls}
                                />
                                {/* Tarjeta de ubicación */}
                                {ubicacion && (
                                    <div className={`mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                                        ubicacion.tipo === 'clases'
                                            ? 'bg-indigo-50 border-indigo-100'
                                            : ubicacion.tipo === 'recreo'
                                                ? 'bg-amber-50 border-amber-100'
                                                : 'bg-slate-50 border-slate-200'
                                    }`}>
                                        <span className="text-xl shrink-0">
                                            {ubicacion.tipo === 'clases' ? '📚' : ubicacion.tipo === 'recreo' ? '🏃' : '⏰'}
                                        </span>
                                        <div>
                                            <p className={`text-xs font-bold uppercase tracking-wide ${
                                                ubicacion.tipo === 'clases' ? 'text-indigo-700'
                                                : ubicacion.tipo === 'recreo' ? 'text-amber-700'
                                                : 'text-slate-500'
                                            }`}>
                                                {ubicacion.tipo === 'clases' ? 'En clases' : ubicacion.tipo === 'recreo' ? 'En recreo' : 'Sin horario'}
                                            </p>
                                            <p className={`text-sm font-semibold ${
                                                ubicacion.tipo === 'clases' ? 'text-indigo-800'
                                                : ubicacion.tipo === 'recreo' ? 'text-amber-800'
                                                : 'text-slate-600'
                                            }`}>
                                                {ubicacion.label}
                                                {ubicacion.teacher && (
                                                    <span className="font-normal text-xs ml-1 opacity-70">· {ubicacion.teacher}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Motivo */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Motivo de consulta *</label>
                                <ComboInput
                                    value={form.motivo}
                                    onChange={v => setForm(f => ({ ...f, motivo: v }))}
                                    options={OPCIONES_MOTIVO}
                                    placeholder="Ej: Dolor de cabeza, Fiebre..."
                                    inputClassName={inputCls}
                                />
                            </div>

                            {/* Evaluación */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Evaluación / Diagnóstico</label>
                                <textarea
                                    placeholder="Descripción de la evaluación clínica..."
                                    value={form.evaluacion}
                                    onChange={e => setForm(f => ({ ...f, evaluacion: e.target.value }))}
                                    rows={2}
                                    className={inputCls + ' resize-none'}
                                />
                            </div>

                            {/* Tratamiento */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Tratamiento aplicado</label>
                                <ComboInput
                                    value={form.tratamiento}
                                    onChange={v => setForm(f => ({ ...f, tratamiento: v }))}
                                    options={OPCIONES_TRATAMIENTO}
                                    placeholder="Ej: Reposo, Analgésico..."
                                    inputClassName={inputCls}
                                />
                            </div>

                            {/* Notificó apoderado */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">¿Se notificó al apoderado?</label>
                                <div className="flex gap-2 flex-wrap">
                                    {NOTIF_OPTS.map(({ val, idle, sel }) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, notificoApoderado: f.notificoApoderado === val ? '' : val }))}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${form.notificoApoderado === val ? sel : idle}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Enviado a casa */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">¿Se envió a casa?</label>
                                <div className="flex gap-2">
                                    {SINONOPT.map(({ val, idle, sel }) => (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, enviadoCasa: f.enviadoCasa === val ? '' : val }))}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${form.enviadoCasa === val ? sel : idle}`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Observaciones</label>
                                <textarea
                                    placeholder="Notas adicionales..."
                                    value={form.observaciones}
                                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                    rows={2}
                                    className={inputCls + ' resize-none'}
                                />
                            </div>

                            {/* Acciones */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Registrar'}
                                </button>
                            </div>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>

            {/* ── MODAL: Confirmar eliminación ── */}
            <AnimatePresence>
                {deleteConfirm && (
                    <ModalContainer onClose={() => setDeleteConfirm(null)} noGradient>
                        <div className="p-6 space-y-4">
                            <h3 className="text-lg font-bold text-slate-800">¿Eliminar atención?</h3>
                            <p className="text-sm text-slate-500">
                                Se eliminará la atención de <strong>{deleteConfirm.nombreEstudiante}</strong> del{' '}
                                {formatDate(deleteConfirm.fecha)}.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>
        </div>
    );
}
