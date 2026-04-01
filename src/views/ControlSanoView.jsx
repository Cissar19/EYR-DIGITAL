import React, { useState, useMemo, useEffect } from 'react';
import {
    Stethoscope, Search, X, ClipboardCheck, CheckCircle2, Circle,
    FileDown, Pencil, ChevronDown, ChevronUp, History, UserPlus
} from 'lucide-react';
import { exportControlSanoPDF } from '../lib/pdfExport';
import { AnimatePresence, motion } from 'framer-motion';
import ModalContainer from '../components/ModalContainer';
import { useAuth } from '../context/AuthContext';
import { useStudents } from '../context/StudentsContext';
import { subscribeToCollection, createDocument, updateDocument } from '../lib/firestoreService';
import { orderBy } from 'firebase/firestore';
import { toast } from 'sonner';

const CURSOS_ENFERMERIA = ['Pre-Kinder', 'Kinder', '1° Básico', '2° Básico', '3° Básico', '4° Básico'];

const DERIVACIONES = [
    { key: 'dental',        label: 'Dental' },
    { key: 'nutricionista', label: 'Nutricionista' },
    { key: 'pediatra',      label: 'Pediatra' },
    { key: 'psicologia',    label: 'Psicología' },
    { key: 'saludMental',   label: 'Salud Mental' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
    fecha: todayStr(),
    peso: '',
    talla: '',
    circunferenciaAbdominal: '',
    diagnostico: '',
    derivaciones: { dental: false, nutricionista: false, pediatra: false, psicologia: false, saludMental: false },
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
        peso: r.peso != null ? String(r.peso) : '',
        talla: r.talla != null ? String(r.talla) : '',
        circunferenciaAbdominal: r.circunferenciaAbdominal != null ? String(r.circunferenciaAbdominal) : '',
        diagnostico: r.diagnostico || '',
        derivaciones: {
            dental: !!r.derivaciones?.dental,
            nutricionista: !!r.derivaciones?.nutricionista,
            pediatra: !!r.derivaciones?.pediatra,
            psicologia: !!r.derivaciones?.psicologia,
            saludMental: !!r.derivaciones?.saludMental,
        },
        observaciones: r.observaciones || '',
    };
}

export default function ControlSanoView() {
    const { user } = useAuth();
    const { students, addStudent } = useStudents();

    const [registros, setRegistros] = useState([]);
    const [search, setSearch] = useState('');
    const [filterCurso, setFilterCurso] = useState('');
    const [expandedStudent, setExpandedStudent] = useState(null);

    // Modal state — control sano
    const [modalStudent, setModalStudent] = useState(null);
    const [editingRegistro, setEditingRegistro] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    // Modal state — agregar estudiante
    const EMPTY_STUDENT = { primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '', rut: '', curso: '' };
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [studentForm, setStudentForm] = useState(EMPTY_STUDENT);
    const [savingStudent, setSavingStudent] = useState(false);

    useEffect(() => {
        const unsub = subscribeToCollection('control_sano', setRegistros, orderBy('createdAt', 'desc'));
        return unsub;
    }, []);

    // Only 4° – 8° Básico
    const estudiantesBase = useMemo(
        () => students.filter(s => CURSOS_ENFERMERIA.includes(s.curso)),
        [students]
    );

    // Latest control per student
    const registrosByStudent = useMemo(() => {
        const map = {};
        registros.forEach(r => {
            if (!map[r.studentId] || r.fecha > map[r.studentId].fecha) {
                map[r.studentId] = r;
            }
        });
        return map;
    }, [registros]);

    // All controls per student sorted desc
    const allRegistrosByStudent = useMemo(() => {
        const map = {};
        registros.forEach(r => {
            if (!map[r.studentId]) map[r.studentId] = [];
            map[r.studentId].push(r);
        });
        Object.values(map).forEach(list => list.sort((a, b) => b.fecha > a.fecha ? 1 : -1));
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
        const conControl = estudiantesBase.filter(s => registrosByStudent[s.id]).length;
        const derivCount = {};
        DERIVACIONES.forEach(d => { derivCount[d.key] = 0; });
        registros.forEach(r => {
            DERIVACIONES.forEach(d => {
                if (r.derivaciones?.[d.key]) derivCount[d.key]++;
            });
        });
        return { total: estudiantesBase.length, conControl, derivCount };
    }, [estudiantesBase, registros, registrosByStudent]);

    // ── Open modal for new registro ──
    const openNewModal = (student) => {
        setModalStudent(student);
        setEditingRegistro(null);
        setForm({ ...EMPTY_FORM, fecha: todayStr() });
    };

    // ── Open modal to edit existing registro ──
    const openEditModal = (student, registro) => {
        setModalStudent(student);
        setEditingRegistro(registro);
        setForm(registroToForm(registro));
    };

    const closeModal = () => {
        setModalStudent(null);
        setEditingRegistro(null);
        setForm(EMPTY_FORM);
    };

    const toggleDerivacion = (key) =>
        setForm(f => ({ ...f, derivaciones: { ...f.derivaciones, [key]: !f.derivaciones[key] } }));

    const handleSave = async () => {
        if (!form.peso && !form.talla && !form.circunferenciaAbdominal) {
            toast.error('Ingresa al menos una medición');
            return;
        }
        setSaving(true);
        const payload = {
            fecha: form.fecha,
            peso: form.peso ? parseFloat(form.peso) : null,
            talla: form.talla ? parseFloat(form.talla) : null,
            circunferenciaAbdominal: form.circunferenciaAbdominal ? parseFloat(form.circunferenciaAbdominal) : null,
            diagnostico: form.diagnostico.trim(),
            derivaciones: form.derivaciones,
            observaciones: form.observaciones.trim(),
            registradoPor: user?.name || '',
        };
        try {
            if (editingRegistro) {
                await updateDocument('control_sano', editingRegistro.id, payload);
                toast.success('Control actualizado');
            } else {
                await createDocument('control_sano', {
                    ...payload,
                    studentId: modalStudent.id,
                    studentName: modalStudent.fullName,
                    studentRut: modalStudent.rut,
                    studentCurso: modalStudent.curso,
                });
                toast.success(`Control registrado para ${modalStudent.fullName}`);
            }
            closeModal();
        } catch (err) {
            console.error('Error control_sano:', err);
            toast.error(err?.message || 'Error al guardar el control');
        } finally {
            setSaving(false);
        }
    };

    const isEditing = !!editingRegistro;

    const handleAddStudent = async () => {
        if (!studentForm.primerNombre.trim()) { toast.error('Ingresa el primer nombre'); return; }
        if (!studentForm.primerApellido.trim()) { toast.error('Ingresa el primer apellido'); return; }
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
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                    <Stethoscope className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Control Sano</h1>
                    <p className="text-sm text-slate-500">Pre-Kinder a 4° Básico · {stats.conControl}/{stats.total} con control registrado</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-teal-700">{stats.conControl}</p>
                    <p className="text-xs text-teal-500 font-medium mt-0.5">Con Control</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-bold text-slate-400">{stats.total - stats.conControl}</p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Sin Control</p>
                </div>
                {DERIVACIONES.map(d => (
                    <div key={d.key} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                        <p className="text-2xl font-bold text-amber-600">{stats.derivCount[d.key]}</p>
                        <p className="text-xs text-amber-500 font-medium mt-0.5">{d.label}</p>
                    </div>
                ))}
            </div>

            {/* Search + Curso filters */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar alumno por nombre o RUT..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-200 focus:border-teal-400 outline-none"
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    <button
                        onClick={() => setFilterCurso('')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!filterCurso ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        Todos
                    </button>
                    {CURSOS_ENFERMERIA.map(c => (
                        <button
                            key={c}
                            onClick={() => setFilterCurso(filterCurso === c ? '' : c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCurso === c ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Student list */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                {filteredStudents.length === 0 ? (
                    <div className="py-14 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <Stethoscope className="w-8 h-8 text-slate-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-600">No se encontraron estudiantes</p>
                            <p className="text-sm text-slate-400 mt-1">
                                {search.trim() ? `"${search}" no está en el registro` : 'No hay estudiantes en este curso'}
                            </p>
                        </div>
                        <button
                            onClick={() => { setStudentForm(EMPTY_STUDENT); setShowAddStudent(true); }}
                            className="flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-teal-200 transition-all hover:shadow-teal-300 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <UserPlus className="w-5 h-5" />
                            Agregar Estudiante
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredStudents.map(student => {
                            const last = registrosByStudent[student.id];
                            const allControls = allRegistrosByStudent[student.id] || [];
                            const activeDerivaciones = last
                                ? DERIVACIONES.filter(d => last.derivaciones?.[d.key])
                                : [];
                            const isExpanded = expandedStudent === student.id;

                            return (
                                <div key={student.id}>
                                    {/* Main row */}
                                    <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                                        {/* Expand toggle (only if has controls) */}
                                        <button
                                            onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                allControls.length > 0
                                                    ? 'bg-teal-50 hover:bg-teal-100 cursor-pointer'
                                                    : 'bg-teal-50 cursor-default'
                                            }`}
                                        >
                                            {allControls.length > 0 ? (
                                                isExpanded
                                                    ? <ChevronUp className="w-4 h-4 text-teal-600" />
                                                    : <ChevronDown className="w-4 h-4 text-teal-600" />
                                            ) : (
                                                <span className="text-teal-700 font-bold text-sm">{student.fullName.charAt(0)}</span>
                                            )}
                                        </button>

                                        {/* Name + info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{student.fullName}</p>
                                            <p className="text-xs text-slate-500">{student.rut} · {student.curso}</p>
                                        </div>

                                        {/* Last control badge */}
                                        <div className="hidden sm:flex flex-col items-end gap-1 mr-3">
                                            {last ? (
                                                <>
                                                    <span className="text-xs text-teal-700 font-medium bg-teal-50 px-2.5 py-0.5 rounded-full">
                                                        {formatDate(last.fecha)}
                                                    </span>
                                                    {activeDerivaciones.length > 0 && (
                                                        <div className="flex gap-1 flex-wrap justify-end">
                                                            {activeDerivaciones.map(d => (
                                                                <span key={d.key} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                                                                    {d.label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">Sin control</span>
                                            )}
                                        </div>

                                        {/* PDF */}
                                        {allControls.length > 0 && (
                                            <button
                                                onClick={() => exportControlSanoPDF({ student, registros: allControls }).catch(err => console.error('PDF error:', err))}
                                                title="Exportar PDF"
                                                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors shrink-0"
                                            >
                                                <FileDown className="w-4 h-4" />
                                            </button>
                                        )}

                                        {/* New control */}
                                        <button
                                            onClick={() => openNewModal(student)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
                                        >
                                            <ClipboardCheck className="w-4 h-4" />
                                            <span className="hidden sm:inline">Registrar Control Sano</span>
                                            <span className="sm:hidden">Registrar</span>
                                        </button>
                                    </div>

                                    {/* Expanded: history of controls */}
                                    <AnimatePresence>
                                        {isExpanded && allControls.length > 0 && (
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
                                                            Historial · {allControls.length} control{allControls.length !== 1 ? 'es' : ''}
                                                        </span>
                                                    </div>
                                                    {allControls.map(r => {
                                                        const deriv = DERIVACIONES.filter(d => r.derivaciones?.[d.key]);
                                                        return (
                                                            <div key={r.id} className="flex items-start gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-100">
                                                                {/* Date */}
                                                                <div className="shrink-0 text-center min-w-[52px]">
                                                                    <p className="text-sm font-bold text-teal-700">{formatDate(r.fecha)}</p>
                                                                </div>

                                                                {/* Measurements */}
                                                                <div className="flex-1 min-w-0 space-y-1">
                                                                    <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                                                                        {r.peso != null && <span className="bg-slate-100 px-2 py-0.5 rounded-lg">Peso: <strong>{r.peso} kg</strong></span>}
                                                                        {r.talla != null && <span className="bg-slate-100 px-2 py-0.5 rounded-lg">Talla: <strong>{r.talla} cm</strong></span>}
                                                                        {r.circunferenciaAbdominal != null && <span className="bg-slate-100 px-2 py-0.5 rounded-lg">C. Abd.: <strong>{r.circunferenciaAbdominal} cm</strong></span>}
                                                                    </div>
                                                                    {r.diagnostico && (
                                                                        <p className="text-xs text-slate-500 truncate">Dx: {r.diagnostico}</p>
                                                                    )}
                                                                    {deriv.length > 0 && (
                                                                        <div className="flex gap-1 flex-wrap">
                                                                            {deriv.map(d => (
                                                                                <span key={d.key} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                                                                                    {d.label}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {r.observaciones && (
                                                                        <p className="text-xs text-slate-400 truncate">{r.observaciones}</p>
                                                                    )}
                                                                </div>

                                                                {/* Edit button */}
                                                                <button
                                                                    onClick={() => openEditModal(student, r)}
                                                                    title="Editar control"
                                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors shrink-0"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
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

            {/* Modal (create / edit) */}
            <AnimatePresence>
                {modalStudent && (
                    <ModalContainer onClose={closeModal} maxWidth="max-w-lg">
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pt-7 pb-5">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    isEditing
                                        ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                                        : 'bg-gradient-to-br from-teal-500 to-emerald-600'
                                }`}>
                                    {isEditing
                                        ? <Pencil className="w-5 h-5 text-white" />
                                        : <Stethoscope className="w-5 h-5 text-white" />
                                    }
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-800">
                                        {isEditing ? 'Editar Control Sano' : 'Registrar Control Sano'}
                                    </h2>
                                    <p className="text-xs text-slate-500 truncate max-w-56">
                                        {modalStudent.fullName} · {modalStudent.curso}
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-8 pb-6 space-y-5 overflow-y-auto">
                            {/* Fecha */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Fecha</label>
                                <input
                                    type="date"
                                    value={form.fecha}
                                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all"
                                />
                            </div>

                            {/* Mediciones */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-3">Mediciones</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { field: 'peso', label: 'Peso (kg)', placeholder: 'ej. 45.5', max: 200 },
                                        { field: 'talla', label: 'Talla (cm)', placeholder: 'ej. 150', max: 250 },
                                        { field: 'circunferenciaAbdominal', label: 'Circ. Abd. (cm)', placeholder: 'ej. 70', max: 200 },
                                    ].map(({ field, label, placeholder, max }) => (
                                        <div key={field}>
                                            <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max={max}
                                                step="0.1"
                                                value={form[field]}
                                                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                                                placeholder={placeholder}
                                                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Diagnóstico */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Diagnóstico</label>
                                <textarea
                                    value={form.diagnostico}
                                    onChange={e => setForm(f => ({ ...f, diagnostico: e.target.value }))}
                                    placeholder="Diagnóstico del control sano..."
                                    rows={2}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-sm resize-none"
                                />
                            </div>

                            {/* Derivaciones */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-3">Derivaciones</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {DERIVACIONES.map(d => {
                                        const active = form.derivaciones[d.key];
                                        return (
                                            <button
                                                key={d.key}
                                                type="button"
                                                onClick={() => toggleDerivacion(d.key)}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                                                    active
                                                        ? 'border-amber-400 bg-amber-50 text-amber-800'
                                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                {active
                                                    ? <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                                                    : <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                                                }
                                                {d.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Observaciones */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Observaciones</label>
                                <textarea
                                    value={form.observaciones}
                                    onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                                    placeholder="Notas adicionales del control..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-sm resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-8 pb-7">
                            <button
                                onClick={closeModal}
                                className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`flex-1 px-6 py-3 text-white rounded-2xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 ${
                                    isEditing
                                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600'
                                        : 'bg-gradient-to-r from-teal-500 to-emerald-600'
                                }`}
                            >
                                {saving ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Guardar Control'}
                            </button>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>
            {/* Modal — Agregar Estudiante */}
            <AnimatePresence>
                {showAddStudent && (
                    <ModalContainer onClose={() => setShowAddStudent(false)} maxWidth="max-w-md">
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 pt-7 pb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                    <UserPlus className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-800">Agregar Estudiante</h2>
                                    <p className="text-xs text-slate-500">Pre-Kinder a 4° Básico</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAddStudent(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-8 pb-6 space-y-4 overflow-y-auto">
                            {/* Nombres */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Primer Nombre <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        value={studentForm.primerNombre}
                                        onChange={e => setStudentForm(f => ({ ...f, primerNombre: e.target.value }))}
                                        placeholder="ej. Juan"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Segundo Nombre</label>
                                    <input
                                        type="text"
                                        value={studentForm.segundoNombre}
                                        onChange={e => setStudentForm(f => ({ ...f, segundoNombre: e.target.value }))}
                                        placeholder="ej. Carlos"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* Apellidos */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Primer Apellido <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        value={studentForm.primerApellido}
                                        onChange={e => setStudentForm(f => ({ ...f, primerApellido: e.target.value }))}
                                        placeholder="ej. González"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">Segundo Apellido</label>
                                    <input
                                        type="text"
                                        value={studentForm.segundoApellido}
                                        onChange={e => setStudentForm(f => ({ ...f, segundoApellido: e.target.value }))}
                                        placeholder="ej. Pérez"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            {/* RUT */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">RUT <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={studentForm.rut}
                                    onChange={e => setStudentForm(f => ({ ...f, rut: e.target.value }))}
                                    placeholder="ej. 12.345.678-9"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all text-sm"
                                />
                            </div>

                            {/* Curso */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Curso <span className="text-red-400">*</span></label>
                                <div className="grid grid-cols-3 gap-2">
                                    {CURSOS_ENFERMERIA.map(c => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setStudentForm(f => ({ ...f, curso: c }))}
                                            className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                                                studentForm.curso === c
                                                    ? 'border-teal-500 bg-teal-50 text-teal-800'
                                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 px-8 pb-7">
                            <button
                                onClick={() => setShowAddStudent(false)}
                                className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-semibold hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddStudent}
                                disabled={savingStudent}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                            >
                                {savingStudent ? 'Guardando...' : 'Agregar Estudiante'}
                            </button>
                        </div>
                    </ModalContainer>
                )}
            </AnimatePresence>
        </div>
    );
}
