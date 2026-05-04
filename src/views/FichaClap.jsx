import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Heart, Search, X, ChevronDown, ChevronUp, History,
    UserPlus, Trash2, Pencil, MoreVertical, Plus, ClipboardList
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ModalContainer from '../components/ModalContainer';
import { useAuth } from '../context/AuthContext';
import { useStudents } from '../context/StudentsContext';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { orderBy } from 'firebase/firestore';
import { toast } from 'sonner';

const CURSOS_CLAP = ['4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico'];

const OPCIONES_DERIVACION = [
    'NO',
    'Nutricionista',
    'Salud Mental',
    'Dental',
    'Oftalmología',
    'Nutricionista / Salud Mental',
    'Nutricionista / Dental',
    'Dental / Salud Mental',
    'Nutricionista / Dental / Salud Mental',
    'Nutricionista / Dental / Programa Vida Sana',
    'Pediatra',
    'Kinesiología',
];

const OPCIONES_CESFAM = [
    'Los Libertadores',
    'Víctor Castro',
    'El Barrero',
    'No inscrito en CESFAM',
    'No inscrito en CESFAM o CECOSF',
    'ISAPRE',
    'Médico particular',
];

const OPCIONES_RIESGO = [
    'NO',
    '1° consulta salud mental',
    'En control con psicóloga',
    'En control con psicólogo',
    'En control centro adolescente',
    'En control con psicólogo particular',
    'Derivado a psiquiatría',
];

// ── Combobox con autocompletado (portal para escapar overflow del modal) ──
function ComboInput({ value, onChange, options, placeholder, inputClassName }) {
    const [open, setOpen] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    const filtered = useMemo(() => {
        const norm = value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!norm) return options;
        return options.filter(o =>
            o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(norm)
        );
    }, [value, options]);

    // Cierra solo si el click no es ni en el input ni en el dropdown
    useEffect(() => {
        const close = (e) => {
            const inInput    = inputRef.current?.contains(e.target);
            const inDropdown = dropdownRef.current?.contains(e.target);
            if (!inInput && !inDropdown) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    // Calcula posición en el momento del render (no en estado → sin race)
    const getStyle = () => {
        if (!inputRef.current) return {};
        const r = inputRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - r.bottom;
        const spaceAbove = r.top;
        const upward = spaceBelow < 220 && spaceAbove > spaceBelow;
        return {
            position: 'fixed',
            left:  r.left,
            width: r.width,
            zIndex: 9999,
            ...(upward
                ? { bottom: window.innerHeight - r.top + 4, maxHeight: Math.min(spaceAbove - 8, 280) }
                : { top:    r.bottom + 4,                   maxHeight: Math.min(spaceBelow - 8, 280) }),
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
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors border-b border-slate-50 last:border-0"
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

const ESTADO_NUTRICIONAL_OPTS = ['NORMOPESO', 'SOBREPESO', 'OBESIDAD', 'EXCESO DE PESO'];

// ── Tablas WHO 2007 IMC para edad (valores de -2DS, +1DS, +2DS) ──
// Fuente: WHO Growth Reference 5-19 years / Norma MINSAL Chile
// Clasificación: <-2DS=Bajo peso | -2DS~+1DS=Normopeso | +1DS~+2DS=Sobrepeso | >+2DS=Obesidad
const WHO_IMC = {
    M: {
        // edad_media: [-2DS, +1DS, +2DS]
        9.5:  [13.7, 17.9, 19.8],
        10.5: [13.8, 18.6, 20.8],
        11.5: [14.0, 19.4, 21.9],
        12.5: [14.2, 20.3, 23.1],
        13.5: [14.5, 21.2, 24.3],
        14.5: [14.9, 22.1, 25.5],
    },
    F: {
        9.5:  [13.6, 18.4, 20.9],
        10.5: [13.8, 19.2, 21.9],
        11.5: [14.0, 20.0, 23.0],
        12.5: [14.3, 20.9, 24.0],
        13.5: [14.7, 21.7, 25.0],
        14.5: [15.2, 22.5, 26.0],
    },
};

const OPCIONES_TIPO_HORA = [
    'Dental', 'Nutricionista', 'Salud Mental', 'Oftalmología',
    'Pediatra', 'Kinesiología', 'Psiquiatría', 'Otro',
];

const CURSO_EDAD = {
    '4° Básico': 9.5,
    '5° Básico': 10.5,
    '6° Básico': 11.5,
    '7° Básico': 12.5,
    '8° Básico': 13.5,
};

function calcularIMC(peso, talla) {
    const p = parseFloat(peso);
    const t = parseFloat(talla);
    if (!p || !t || t < 50) return null;
    return p / Math.pow(t / 100, 2);
}

function clasificarEstado(imc, curso, sexo) {
    if (!imc || !sexo || !CURSO_EDAD[curso]) return null;
    const tabla = WHO_IMC[sexo][CURSO_EDAD[curso]];
    if (!tabla) return null;
    const [neg2, pos1, pos2] = tabla;
    if (imc < neg2)  return 'BAJO PESO';
    if (imc <= pos1) return 'NORMOPESO';
    if (imc <= pos2) return 'SOBREPESO';
    return 'OBESIDAD';
}

// Color cuando está SELECCIONADO
const ESTADO_COLOR_SEL = {
    'NORMOPESO':      'bg-green-500  text-white border-green-500  shadow-lg shadow-green-100',
    'SOBREPESO':      'bg-yellow-400 text-white border-yellow-400 shadow-lg shadow-yellow-100',
    'OBESIDAD':       'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-100',
    'EXCESO DE PESO': 'bg-red-500    text-white border-red-500    shadow-lg shadow-red-100',
};
// Color cuando NO está seleccionado (siempre coloreado, más suave)
const ESTADO_COLOR_IDLE = {
    'NORMOPESO':      'bg-green-50  text-green-600  border-green-200  hover:bg-green-100',
    'SOBREPESO':      'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100',
    'OBESIDAD':       'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',
    'EXCESO DE PESO': 'bg-red-50    text-red-600    border-red-200    hover:bg-red-100',
};
// Badges del historial (sin cambios)
const ESTADO_COLOR = {
    'NORMOPESO':      'bg-green-100 text-green-700 border-green-200',
    'SOBREPESO':      'bg-yellow-100 text-yellow-700 border-yellow-200',
    'OBESIDAD':       'bg-orange-100 text-orange-700 border-orange-200',
    'EXCESO DE PESO': 'bg-red-100 text-red-700 border-red-200',
};

const ESTADO_BADGE_COLOR = {
    'NORMOPESO':      'bg-green-50 text-green-700',
    'SOBREPESO':      'bg-yellow-50 text-yellow-700',
    'OBESIDAD':       'bg-orange-50 text-orange-700',
    'EXCESO DE PESO': 'bg-red-50 text-red-700',
};

const todayStr = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
    fecha: todayStr(),
    hora: '',
    sexo: '',
    peso: '',
    talla: '',
    cAbdominal: '',
    estadoNutricional: '',
    riesgoPsicosocial: '',
    derivacion: '',
    horasAgendadas: [{ tipo: '', fecha: '', hora: '', asistio: '', entregadaDerivacion: '' }],
    cesfam: '',
    observaciones: '',
};

const normalizeSearch = (text) =>
    text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function registroToForm(r) {
    return {
        fecha: r.fecha || todayStr(),
        hora: r.hora || '',
        sexo: r.sexo || '',
        peso: r.peso != null ? String(r.peso) : '',
        talla: r.talla != null ? String(r.talla) : '',
        cAbdominal: r.cAbdominal != null ? String(r.cAbdominal) : '',
        estadoNutricional: r.estadoNutricional || '',
        riesgoPsicosocial: r.riesgoPsicosocial || '',
        derivacion: r.derivacion || '',
        horasAgendadas: (() => {
            if (Array.isArray(r.horasAgendadas) && r.horasAgendadas.length) {
                // Migrate old { tipo, detalle } entries to new shape
                return r.horasAgendadas.map(h => ({
                    tipo: h.tipo || '',
                    fecha: h.fecha || '',
                    hora: h.hora || '',
                    asistio: h.asistio || '',
                    entregadaDerivacion: h.entregadaDerivacion || '',
                }));
            }
            return [{ tipo: '', fecha: '', hora: '', asistio: '', entregadaDerivacion: '' }];
        })(),
        cesfam: r.cesfam || '',
        observaciones: r.observaciones || '',
    };
}

const EMPTY_STUDENT = {
    primerNombre: '', segundoNombre: '',
    primerApellido: '', segundoApellido: '',
    rut: '', curso: '',
};

export default function FichaClap() {
    const { user } = useAuth();
    const { students, addStudent } = useStudents();

    const [registros, setRegistros] = useState([]);
    const [search, setSearch] = useState('');
    const [filterCurso, setFilterCurso] = useState('');
    const [expandedStudent, setExpandedStudent] = useState(null);

    // Modal ficha
    const [modalStudent, setModalStudent] = useState(null);
    const [editingRegistro, setEditingRegistro] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(0);
    const TOTAL_STEPS = 5;

    // Modal agregar estudiante
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [studentForm, setStudentForm] = useState(EMPTY_STUDENT);
    const [savingStudent, setSavingStudent] = useState(false);

    // Confirmar eliminación
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Dropdown acciones por estudiante
    const [openDropdown, setOpenDropdown] = useState(null);
    const dropdownRef = useRef(null);

    const closeDropdown = useCallback(() => setOpenDropdown(null), []);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                closeDropdown();
            }
        };
        if (openDropdown) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [openDropdown, closeDropdown]);

    useEffect(() => {
        const unsub = subscribeToCollection('ficha_clap', setRegistros, orderBy('createdAt', 'desc'));
        return unsub;
    }, []);

    const estudiantesBase = useMemo(
        () => students.filter(s => CURSOS_CLAP.includes(s.curso)),
        [students]
    );

    // Último registro por estudiante (para badge)
    const ultimaFichaPorEstudiante = useMemo(() => {
        const map = {};
        registros.forEach(r => {
            if (!map[r.studentId] || r.fecha > map[r.studentId].fecha) {
                map[r.studentId] = r;
            }
        });
        return map;
    }, [registros]);

    // Todos los registros por estudiante ordenados
    const fichasPorEstudiante = useMemo(() => {
        const map = {};
        registros.forEach(r => {
            if (!map[r.studentId]) map[r.studentId] = [];
            map[r.studentId].push(r);
        });
        Object.values(map).forEach(list => list.sort((a, b) => (b.fecha > a.fecha ? 1 : -1)));
        return map;
    }, [registros]);

    const filteredStudents = useMemo(() => {
        let list = estudiantesBase;
        if (search.trim()) {
            const norm = normalizeSearch(search);
            list = list.filter(s =>
                normalizeSearch(s.fullName).includes(norm) ||
                normalizeSearch(s.rut).includes(norm)
            );
        }
        if (filterCurso) list = list.filter(s => s.curso === filterCurso);
        return list;
    }, [estudiantesBase, search, filterCurso]);

    const stats = useMemo(() => {
        const conFicha = estudiantesBase.filter(s => ultimaFichaPorEstudiante[s.id]).length;
        const porEstado = { NORMOPESO: 0, SOBREPESO: 0, OBESIDAD: 0, 'EXCESO DE PESO': 0 };
        let conDerivacion = 0;

        Object.values(ultimaFichaPorEstudiante).forEach(r => {
            if (r.estadoNutricional && porEstado[r.estadoNutricional] !== undefined) {
                porEstado[r.estadoNutricional]++;
            }
            if (r.derivacion?.trim() && r.derivacion.toUpperCase() !== 'NO') {
                conDerivacion++;
            }
        });

        return { total: estudiantesBase.length, conFicha, porEstado, conDerivacion };
    }, [estudiantesBase, ultimaFichaPorEstudiante]);

    // ── Modales ──
    const openNewModal = (student) => {
        setModalStudent(student);
        setEditingRegistro(null);
        setForm({ ...EMPTY_FORM, fecha: todayStr() });
        setStep(0);
    };

    const openEditModal = (student, registro) => {
        setModalStudent(student);
        setEditingRegistro(registro);
        setForm(registroToForm(registro));
        setStep(0);
    };

    const closeModal = () => {
        setModalStudent(null);
        setEditingRegistro(null);
        setForm(EMPTY_FORM);
        setStep(0);
    };

    const handleSave = async () => {
        if (!form.peso && !form.talla) {
            toast.error('Ingresa al menos peso o talla');
            return;
        }
        setSaving(true);
        const payload = {
            fecha: form.fecha,
            hora: form.hora.trim(),
            sexo: form.sexo,
            peso: form.peso ? parseFloat(form.peso) : null,
            talla: form.talla ? parseFloat(form.talla) : null,
            cAbdominal: form.cAbdominal ? parseFloat(form.cAbdominal) : null,
            estadoNutricional: form.estadoNutricional,
            riesgoPsicosocial: form.riesgoPsicosocial.trim(),
            derivacion: form.derivacion.trim(),
            horasAgendadas: form.horasAgendadas.filter(h => h.tipo || h.fecha || h.hora),
            cesfam: form.cesfam.trim(),
            observaciones: form.observaciones.trim(),
            registradoPor: user?.name || '',
        };
        try {
            if (editingRegistro) {
                await updateDocument('ficha_clap', editingRegistro.id, payload);
                toast.success('Ficha CLAP actualizada');
            } else {
                await createDocument('ficha_clap', {
                    ...payload,
                    studentId: modalStudent.id,
                    studentName: modalStudent.fullName,
                    studentRut: modalStudent.rut,
                    studentCurso: modalStudent.curso,
                });
                toast.success(`Ficha CLAP registrada para ${modalStudent.fullName}`);
            }
            closeModal();
        } catch (err) {
            console.error('Error ficha_clap:', err);
            toast.error(err?.message || 'Error al guardar la ficha');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!deleteConfirm) return;
        const id = deleteConfirm.id;
        setDeleteConfirm(null);
        removeDocument('ficha_clap', id)
            .then(() => toast.success('Ficha eliminada'))
            .catch(err => toast.error(err?.message || 'Error al eliminar'));
    };

    const handleAddStudent = async () => {
        if (!studentForm.primerNombre.trim()) { toast.error('Ingresa el primer nombre'); return; }
        if (!studentForm.primerApellido.trim()) { toast.error('Ingresa el apellido paterno'); return; }
        if (!studentForm.rut.trim()) { toast.error('Ingresa el RUT'); return; }
        if (!studentForm.curso) { toast.error('Selecciona el curso'); return; }
        setSavingStudent(true);
        try {
            const firstName = [studentForm.primerNombre.trim(), studentForm.segundoNombre.trim()].filter(Boolean).join(' ');
            await addStudent({
                firstName,
                paternalLastName: studentForm.primerApellido.trim(),
                maternalLastName: studentForm.segundoApellido.trim(),
                rut: studentForm.rut.trim(),
                curso: studentForm.curso,
            });
            setShowAddStudent(false);
            setStudentForm(EMPTY_STUDENT);
        } catch (err) {
            toast.error(err?.message || 'Error al agregar estudiante');
        } finally {
            setSavingStudent(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6 text-rose-600" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Ficha CLAP</h1>
                    <p className="text-sm text-slate-500">
                        4° a 8° Básico · {stats.conFicha}/{stats.total} con ficha registrada
                    </p>
                </div>
                <button
                    onClick={() => { setStudentForm(EMPTY_STUDENT); setShowAddStudent(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-rose-200 transition-all hover:-translate-y-0.5 shrink-0"
                >
                    <UserPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">Agregar Estudiante</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-rose-700">{stats.conFicha}</p>
                    <p className="text-xs text-rose-500 font-medium mt-0.5">Con Ficha</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-slate-400">{stats.total - stats.conFicha}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Sin Ficha</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-green-700">{stats.porEstado['NORMOPESO']}</p>
                    <p className="text-xs text-green-500 font-medium mt-0.5">Normopeso</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.porEstado['SOBREPESO']}</p>
                    <p className="text-xs text-yellow-500 font-medium mt-0.5">Sobrepeso</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-orange-600">
                        {stats.porEstado['OBESIDAD'] + stats.porEstado['EXCESO DE PESO']}
                    </p>
                    <p className="text-xs text-orange-500 font-medium mt-0.5">Obesidad/Exceso</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats.conDerivacion}</p>
                    <p className="text-xs text-amber-500 font-medium mt-0.5">Con Derivación</p>
                </div>
            </div>

            {/* Búsqueda + filtros */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar alumno por nombre o RUT..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    <button
                        onClick={() => setFilterCurso('')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!filterCurso ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        Todos
                    </button>
                    {CURSOS_CLAP.map(c => (
                        <button
                            key={c}
                            onClick={() => setFilterCurso(filterCurso === c ? '' : c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCurso === c ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de estudiantes */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {filteredStudents.length === 0 ? (
                    <div className="py-14 text-center text-slate-400">
                        <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No se encontraron estudiantes</p>
                        {search.trim() && (
                            <p className="text-sm mt-1">
                                Puedes agregar a &quot;{search}&quot; con el botón de arriba
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredStudents.map(student => {
                            const ultima = ultimaFichaPorEstudiante[student.id];
                            const fichas = fichasPorEstudiante[student.id] || [];
                            const isExpanded = expandedStudent === student.id;

                            return (
                                <div key={student.id}>
                                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                                        {/* Expand toggle */}
                                        <button
                                            onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                fichas.length > 0
                                                    ? 'bg-rose-50 hover:bg-rose-100 cursor-pointer'
                                                    : 'bg-rose-50 cursor-default'
                                            }`}
                                        >
                                            {fichas.length > 0 ? (
                                                isExpanded
                                                    ? <ChevronUp className="w-4 h-4 text-rose-600" />
                                                    : <ChevronDown className="w-4 h-4 text-rose-600" />
                                            ) : (
                                                <span className="text-rose-700 font-bold text-sm">
                                                    {student.fullName.charAt(0)}
                                                </span>
                                            )}
                                        </button>

                                        {/* Nombre + RUT */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{student.fullName}</p>
                                            <p className="text-xs text-slate-500">{student.rut} · {student.curso}</p>
                                        </div>

                                        {/* Última ficha */}
                                        <div className="hidden sm:flex flex-col items-end gap-1 mr-3">
                                            {ultima ? (
                                                <>
                                                    <span className="text-xs text-rose-700 font-medium bg-rose-50 px-2.5 py-0.5 rounded-full">
                                                        {formatDate(ultima.fecha)}
                                                    </span>
                                                    {ultima.estadoNutricional && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ESTADO_BADGE_COLOR[ultima.estadoNutricional] || 'bg-slate-100 text-slate-600'}`}>
                                                            {ultima.estadoNutricional}
                                                        </span>
                                                    )}
                                                    {ultima.derivacion && ultima.derivacion.toUpperCase() !== 'NO' && (
                                                        <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium max-w-[140px] truncate">
                                                            {ultima.derivacion}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                                    Sin ficha
                                                </span>
                                            )}
                                        </div>

                                        {/* Dropdown acciones */}
                                        <div className="relative shrink-0" ref={openDropdown === student.id ? dropdownRef : null}>
                                            <button
                                                onClick={() => setOpenDropdown(openDropdown === student.id ? null : student.id)}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl transition-colors"
                                            >
                                                <span className="hidden sm:inline">Acciones</span>
                                                <ChevronDown className="w-4 h-4" />
                                            </button>

                                            <AnimatePresence>
                                                {openDropdown === student.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                        transition={{ duration: 0.12 }}
                                                        className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={() => { closeDropdown(); openNewModal(student); }}
                                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4 text-rose-500" />
                                                            Nueva Ficha CLAP
                                                        </button>
                                                        {fichas.length > 0 && (
                                                            <>
                                                                <div className="h-px bg-slate-100 mx-3" />
                                                                <button
                                                                    onClick={() => { closeDropdown(); openEditModal(student, ultima); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                                                >
                                                                    <Pencil className="w-4 h-4 text-indigo-400" />
                                                                    Editar última ficha
                                                                </button>
                                                                <button
                                                                    onClick={() => { closeDropdown(); setExpandedStudent(isExpanded ? null : student.id); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                                                >
                                                                    <ClipboardList className="w-4 h-4 text-slate-400" />
                                                                    {isExpanded ? 'Ocultar historial' : `Ver historial (${fichas.length})`}
                                                                </button>
                                                                <div className="h-px bg-slate-100 mx-3" />
                                                                <button
                                                                    onClick={() => { closeDropdown(); setDeleteConfirm({ id: ultima.id, studentName: student.fullName, fecha: ultima.fecha }); }}
                                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Eliminar última ficha
                                                                </button>
                                                            </>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Historial */}
                                    <AnimatePresence>
                                        {isExpanded && fichas.length > 0 && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 space-y-2">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <History className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                                            Historial · {fichas.length} ficha{fichas.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    {fichas.map(r => (
                                                        <div key={r.id} className="flex items-start gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100">
                                                            <div className="shrink-0 text-center min-w-[52px]">
                                                                <p className="text-sm font-bold text-rose-700">{formatDate(r.fecha)}</p>
                                                                {r.hora && <p className="text-[10px] text-slate-400">{r.hora}</p>}
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                                                    {r.peso != null && (
                                                                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg">
                                                                            Peso: <strong>{r.peso} kg</strong>
                                                                        </span>
                                                                    )}
                                                                    {r.talla != null && (
                                                                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg">
                                                                            Talla: <strong>{r.talla} cm</strong>
                                                                        </span>
                                                                    )}
                                                                    {r.cAbdominal != null && (
                                                                        <span className="bg-slate-100 px-2 py-0.5 rounded-lg">
                                                                            C.Abd.: <strong>{r.cAbdominal} cm</strong>
                                                                        </span>
                                                                    )}
                                                                    {r.estadoNutricional && (
                                                                        <span className={`px-2 py-0.5 rounded-lg font-medium ${ESTADO_BADGE_COLOR[r.estadoNutricional] || 'bg-slate-100 text-slate-600'}`}>
                                                                            {r.estadoNutricional}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {r.riesgoPsicosocial && r.riesgoPsicosocial.toUpperCase() !== 'NO' && (
                                                                    <p className="text-xs text-slate-500">Riesgo psicosocial: {r.riesgoPsicosocial}</p>
                                                                )}
                                                                {r.derivacion && r.derivacion.toUpperCase() !== 'NO' && (
                                                                    <p className="text-xs text-amber-700 font-medium">Derivación: {r.derivacion}</p>
                                                                )}
                                                                {r.cesfam && (
                                                                    <p className="text-xs text-slate-400">CESFAM: {r.cesfam}</p>
                                                                )}
                                                                {Array.isArray(r.horasAgendadas) && r.horasAgendadas.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        {r.horasAgendadas.filter(h => h.tipo || h.fecha || h.hora).map((h, i) => (
                                                                            <div key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
                                                                                {h.tipo && (
                                                                                    <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-lg font-semibold">{h.tipo}</span>
                                                                                )}
                                                                                {h.fecha && (
                                                                                    <span className="text-slate-500">{formatDate(h.fecha)}</span>
                                                                                )}
                                                                                {h.hora && (
                                                                                    <span className="text-slate-500">{h.hora}</span>
                                                                                )}
                                                                                {h.asistio && (
                                                                                    <span className={`px-1.5 py-0.5 rounded font-semibold ${h.asistio === 'SI' ? 'bg-green-50 text-green-700' : h.asistio === 'NO' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                                                                                        {h.asistio}
                                                                                    </span>
                                                                                )}
                                                                                {h.entregadaDerivacion && (
                                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${h.entregadaDerivacion === 'SI' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                                                                        Der. apoderado: {h.entregadaDerivacion}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                {r.observaciones && (
                                                                    <p className="text-xs text-slate-400 truncate">{r.observaciones}</p>
                                                                )}
                                                            </div>
                                                            <button
                                                                onClick={() => openEditModal(student, r)}
                                                                title="Editar ficha"
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirm({ id: r.id, studentName: student.fullName, fecha: r.fecha })}
                                                                title="Eliminar ficha"
                                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── MODAL: Wizard Ficha CLAP ── */}
            <AnimatePresence>
                {modalStudent && (
                    <ModalContainer onClose={closeModal} maxWidth="max-w-xl">
                        <div className="p-6 flex flex-col gap-5">

                            {/* Cabecera fija */}
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Heart className="w-4 h-4 text-rose-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">
                                        {editingRegistro ? 'Editar' : 'Nueva'} Ficha CLAP
                                    </p>
                                    <p className="text-sm font-bold text-slate-800 truncate">{modalStudent.fullName}</p>
                                </div>
                                <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>

                            {/* Indicador de pasos */}
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setStep(i)}
                                        className={`h-1.5 rounded-full transition-all ${
                                            i === step
                                                ? 'bg-rose-500 flex-[3]'
                                                : i < step
                                                    ? 'bg-rose-300 flex-1'
                                                    : 'bg-slate-200 flex-1'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Contenido del paso actual */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.15 }}
                                    className="space-y-4"
                                >
                                    {/* ── Paso 1: Fecha, hora y sexo ── */}
                                    {step === 0 && (
                                        <>
                                            <div>
                                                <p className="text-base font-bold text-slate-800 mb-0.5">Datos de la atención</p>
                                                <p className="text-xs text-slate-400">Fecha, hora y sexo del estudiante</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Fecha</label>
                                                    <input
                                                        type="date"
                                                        value={form.fecha}
                                                        onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Hora</label>
                                                    <input
                                                        type="time"
                                                        value={form.hora}
                                                        onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Sexo</label>
                                                <div className="flex gap-3">
                                                    {[
                                                        { val: 'M', label: 'Masculino', idle: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100', sel: 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-100' },
                                                        { val: 'F', label: 'Femenino',  idle: 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100', sel: 'bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-100' },
                                                    ].map(({ val, label, idle, sel }) => (
                                                        <button
                                                            key={val}
                                                            onClick={() => setForm(f => ({ ...f, sexo: f.sexo === val ? '' : val }))}
                                                            className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${form.sexo === val ? sel + ' scale-[1.03]' : idle}`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* ── Paso 2: Mediciones ── */}
                                    {step === 1 && (() => {
                                        const imc = calcularIMC(form.peso, form.talla);
                                        const sugerido = clasificarEstado(imc, modalStudent.curso, form.sexo);
                                        const imcColor = sugerido === 'NORMOPESO' ? 'text-green-600 bg-green-50 border-green-200'
                                            : sugerido === 'SOBREPESO'  ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
                                            : sugerido === 'OBESIDAD'   ? 'text-orange-600 bg-orange-50 border-orange-200'
                                            : sugerido === 'BAJO PESO'  ? 'text-blue-600 bg-blue-50 border-blue-200'
                                            : 'text-slate-500 bg-slate-50 border-slate-200';
                                        return (
                                            <>
                                                <div>
                                                    <p className="text-base font-bold text-slate-800 mb-0.5">Mediciones</p>
                                                    <p className="text-xs text-slate-400">Peso, talla y circunferencia abdominal</p>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Peso (kg)</label>
                                                        <input
                                                            autoFocus
                                                            type="number" step="0.1" placeholder="55.2"
                                                            value={form.peso}
                                                            onChange={e => setForm(f => ({ ...f, peso: e.target.value }))}
                                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Talla (cm)</label>
                                                        <input
                                                            type="number" step="0.1" placeholder="165.0"
                                                            value={form.talla}
                                                            onChange={e => setForm(f => ({ ...f, talla: e.target.value }))}
                                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">C. Abd. (cm)</label>
                                                        <input
                                                            type="number" step="0.1" placeholder="70.0"
                                                            value={form.cAbdominal}
                                                            onChange={e => setForm(f => ({ ...f, cAbdominal: e.target.value }))}
                                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                {/* IMC en vivo */}
                                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                                    Clasificación según la{' '}
                                                    <span className="font-semibold text-slate-600">Norma Técnica MINSAL</span>{' '}
                                                    para evaluación nutricional de escolares de 5 a 19 años, basada en las tablas de referencia{' '}
                                                    <span className="font-medium text-slate-500">OMS/WHO 2007</span> por edad y sexo:{' '}
                                                    <span className="text-green-600 font-medium">Normopeso</span>,{' '}
                                                    <span className="text-yellow-600 font-medium">Sobrepeso</span>,{' '}
                                                    <span className="text-orange-600 font-medium">Obesidad</span>.
                                                </p>
                                                {imc ? (
                                                    <div className={`flex items-center justify-between px-4 py-3 rounded-2xl border ${imcColor}`}>
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-wide opacity-70">IMC calculado</p>
                                                            <p className="text-2xl font-extrabold">{imc.toFixed(1)}</p>
                                                        </div>
                                                        {sugerido && (
                                                            <div className="text-right">
                                                                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Clasificación WHO 2007</p>
                                                                <p className="text-base font-bold">{sugerido}</p>
                                                                <button
                                                                    onClick={() => {
                                                                        if (ESTADO_NUTRICIONAL_OPTS.includes(sugerido)) {
                                                                            setForm(f => ({ ...f, estadoNutricional: sugerido }));
                                                                        }
                                                                        setStep(2);
                                                                    }}
                                                                    className="mt-1 text-xs underline underline-offset-2 font-semibold opacity-80 hover:opacity-100"
                                                                >
                                                                    Aplicar →
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-center text-slate-400">
                                                        {form.sexo ? 'Ingresa peso y talla para calcular el IMC automáticamente' : 'Vuelve al paso anterior e indica el sexo para el cálculo'}
                                                    </p>
                                                )}
                                            </>
                                        );
                                    })()}

                                    {/* ── Paso 3: Estado Nutricional ── */}
                                    {step === 2 && (
                                        <>
                                            <div>
                                                <p className="text-base font-bold text-slate-800 mb-0.5">Estado Nutricional</p>
                                                <p className="text-xs text-slate-400">Selecciona el diagnóstico nutricional</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {ESTADO_NUTRICIONAL_OPTS.map(opt => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setForm(f => ({
                                                            ...f,
                                                            estadoNutricional: f.estadoNutricional === opt ? '' : opt,
                                                        }))}
                                                        className={`py-5 rounded-2xl text-sm font-bold border-2 transition-all ${
                                                            form.estadoNutricional === opt
                                                                ? ESTADO_COLOR_SEL[opt] + ' scale-[1.04]'
                                                                : ESTADO_COLOR_IDLE[opt]
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* ── Paso 4: Riesgo + Derivación ── */}
                                    {step === 3 && (
                                        <>
                                            <div>
                                                <p className="text-base font-bold text-slate-800 mb-0.5">Evaluación clínica</p>
                                                <p className="text-xs text-slate-400">Riesgo psicosocial y derivación a especialista</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Riesgo Psicosocial</label>
                                                <ComboInput
                                                    value={form.riesgoPsicosocial}
                                                    onChange={v => setForm(f => ({ ...f, riesgoPsicosocial: v }))}
                                                    options={OPCIONES_RIESGO}
                                                    placeholder="Ej: NO, 1° consulta salud mental..."
                                                    inputClassName="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Derivación a Especialista</label>
                                                <ComboInput
                                                    value={form.derivacion}
                                                    onChange={v => setForm(f => ({ ...f, derivacion: v }))}
                                                    options={OPCIONES_DERIVACION}
                                                    placeholder="Ej: Nutricionista, Dental, NO..."
                                                    inputClassName="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* ── Paso 5: CESFAM + Agenda + Seguimiento ── */}
                                    {step === 4 && (
                                        <>
                                            <div>
                                                <p className="text-base font-bold text-slate-800 mb-0.5">CESFAM y seguimiento</p>
                                                <p className="text-xs text-slate-400">Centro de salud, cita agendada y control posterior</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">CESFAM</label>
                                                <ComboInput
                                                    value={form.cesfam}
                                                    onChange={v => setForm(f => ({ ...f, cesfam: v }))}
                                                    options={OPCIONES_CESFAM}
                                                    placeholder="Ej: Los Libertadores, Víctor Castro..."
                                                    inputClassName="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Horas Agendadas</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm(f => ({ ...f, horasAgendadas: [...f.horasAgendadas, { tipo: '', fecha: '', hora: '', asistio: '', entregadaDerivacion: '' }] }))}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" /> Agregar
                                                    </button>
                                                </div>

                                                {/* Encabezado columnas */}
                                                <div className="grid grid-cols-[1fr_90px_72px_auto] gap-1.5 px-1 mb-1">
                                                    {['Especialidad', 'Fecha', 'Horario', ''].map((h, i) => (
                                                        <p key={i} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{h}</p>
                                                    ))}
                                                </div>

                                                <div className="space-y-2">
                                                    {form.horasAgendadas.map((h, i) => {
                                                        const updateH = (patch) => setForm(f => {
                                                            const arr = [...f.horasAgendadas];
                                                            arr[i] = { ...arr[i], ...patch };
                                                            return { ...f, horasAgendadas: arr };
                                                        });
                                                        return (
                                                            <div key={i} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-2">
                                                                {/* Fila 1: especialidad + fecha + hora + borrar */}
                                                                <div className="grid grid-cols-[1fr_90px_72px_auto] gap-1.5 items-center">
                                                                    <select
                                                                        value={h.tipo}
                                                                        onChange={e => updateH({ tipo: e.target.value })}
                                                                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none bg-white text-slate-700"
                                                                    >
                                                                        <option value="">Especialidad...</option>
                                                                        {OPCIONES_TIPO_HORA.map(o => <option key={o} value={o}>{o}</option>)}
                                                                    </select>
                                                                    <input
                                                                        type="date"
                                                                        value={h.fecha}
                                                                        onChange={e => updateH({ fecha: e.target.value })}
                                                                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none bg-white"
                                                                    />
                                                                    <input
                                                                        type="time"
                                                                        value={h.hora}
                                                                        onChange={e => updateH({ hora: e.target.value })}
                                                                        className="px-2 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none bg-white"
                                                                    />
                                                                    {form.horasAgendadas.length > 1 ? (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setForm(f => ({ ...f, horasAgendadas: f.horasAgendadas.filter((_, j) => j !== i) }))}
                                                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    ) : <span />}
                                                                </div>
                                                                {/* Fila 2: Asistió + Derivación a apoderado */}
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Asistió</p>
                                                                        <div className="flex gap-1">
                                                                            {[
                                                                                { val: 'SI',        idle: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100', sel: 'bg-green-500 text-white border-green-500' },
                                                                                { val: 'NO',        idle: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',         sel: 'bg-red-500 text-white border-red-500' },
                                                                                { val: 'PENDIENTE', idle: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100', sel: 'bg-amber-400 text-white border-amber-400' },
                                                                            ].map(({ val, idle, sel }) => (
                                                                                <button
                                                                                    key={val}
                                                                                    type="button"
                                                                                    onClick={() => updateH({ asistio: h.asistio === val ? '' : val })}
                                                                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${h.asistio === val ? sel : idle}`}
                                                                                >
                                                                                    {val}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Derivación a apoderado</p>
                                                                        <div className="flex gap-1">
                                                                            {[
                                                                                { val: 'SI', idle: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100', sel: 'bg-green-500 text-white border-green-500' },
                                                                                { val: 'NO', idle: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',         sel: 'bg-red-500 text-white border-red-500' },
                                                                            ].map(({ val, idle, sel }) => (
                                                                                <button
                                                                                    key={val}
                                                                                    type="button"
                                                                                    onClick={() => updateH({ entregadaDerivacion: h.entregadaDerivacion === val ? '' : val })}
                                                                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${h.entregadaDerivacion === val ? sel : idle}`}
                                                                                >
                                                                                    {val}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Observaciones</label>
                                                <textarea
                                                    placeholder="Notas adicionales..."
                                                    value={form.observaciones}
                                                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                                    rows={2}
                                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none resize-none"
                                                />
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Navegación */}
                            <div className="flex gap-2 pt-1">
                                {step > 0 ? (
                                    <button
                                        onClick={() => setStep(s => s - 1)}
                                        className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Anterior
                                    </button>
                                ) : (
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <span className="flex-1" />
                                <span className="self-center text-xs text-slate-400 font-medium">
                                    {step + 1} / {TOTAL_STEPS}
                                </span>
                                <span className="flex-1" />
                                {step < TOTAL_STEPS - 1 ? (
                                    <button
                                        onClick={() => setStep(s => s + 1)}
                                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors"
                                    >
                                        Siguiente
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                    >
                                        {saving ? 'Guardando...' : editingRegistro ? 'Actualizar' : 'Guardar'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>

            {/* ── MODAL: Agregar Estudiante ── */}
            <AnimatePresence>
                {showAddStudent && (
                    <ModalContainer onClose={() => setShowAddStudent(false)}>
                        <div className="overflow-y-auto p-6 space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                                    <UserPlus className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">Agregar Estudiante</h2>
                                    <p className="text-sm text-slate-500">Registrar nuevo alumno en el sistema</p>
                                </div>
                                <button onClick={() => setShowAddStudent(false)} className="ml-auto p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Primer Nombre *', key: 'primerNombre', placeholder: '' },
                                    { label: 'Segundo Nombre', key: 'segundoNombre', placeholder: '' },
                                    { label: 'Apellido Paterno *', key: 'primerApellido', placeholder: '' },
                                    { label: 'Apellido Materno', key: 'segundoApellido', placeholder: '' },
                                    { label: 'RUT *', key: 'rut', placeholder: '12345678-9' },
                                ].map(({ label, key, placeholder }) => (
                                    <div key={key}>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
                                        <input
                                            type="text"
                                            placeholder={placeholder}
                                            value={studentForm[key]}
                                            onChange={e => setStudentForm(f => ({ ...f, [key]: e.target.value }))}
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Curso *</label>
                                    <select
                                        value={studentForm.curso}
                                        onChange={e => setStudentForm(f => ({ ...f, curso: e.target.value }))}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none bg-white"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {CURSOS_CLAP.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowAddStudent(false)}
                                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddStudent}
                                    disabled={savingStudent}
                                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                                >
                                    {savingStudent ? 'Guardando...' : 'Agregar Estudiante'}
                                </button>
                            </div>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>

            {/* ── MODAL: Confirmar Eliminación ── */}
            <AnimatePresence>
                {deleteConfirm && (
                    <ModalContainer onClose={() => setDeleteConfirm(null)} noGradient>
                        <div className="p-6 space-y-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-lg font-bold text-slate-800">¿Eliminar ficha?</h2>
                                <p className="text-sm text-slate-500 mt-1">
                                    {deleteConfirm.studentName} · {formatDate(deleteConfirm.fecha)}
                                </p>
                            </div>
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
