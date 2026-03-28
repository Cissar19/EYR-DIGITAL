import React, { useState, useMemo, useRef } from 'react';
import { useStudents } from '../../context/StudentsContext';
import { Upload, Plus, Search, X, Edit3, Trash2, Check, AlertTriangle, FileText, Users, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, canEdit as canEditHelper } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { formatRut } from '../../lib/csvParser';
import { parseCSV } from '../../lib/csvParser';
import ModalContainer from '../ModalContainer';

// ── Curso options ──
const CURSOS = [
    'Pre-Kinder', 'Kinder',
    '1° Básico', '2° Básico', '3° Básico', '4° Básico',
    '5° Básico', '6° Básico', '7° Básico', '8° Básico',
    'I Medio', 'II Medio', 'III Medio', 'IV Medio',
];

const emptyForm = {
    rut: '', firstName: '', paternalLastName: '', maternalLastName: '',
    curso: '', birthDate: '', guardianName: '', guardianPhone: '', guardianEmail: '',
};

export default function StudentsManager({ onClose }) {
    const { students, addStudent, updateStudent, deleteStudent, importStudentsFromCSV } = useStudents();
    const { user } = useAuth();
    const userCanEdit = canEditHelper(user);

    // ── Tabs: list / import / add ──
    const [tab, setTab] = useState('list');
    const [search, setSearch] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // ── CSV Import state ──
    const [csvPreview, setCsvPreview] = useState(null); // { students, errors }
    const [importResult, setImportResult] = useState(null);
    const [importing, setImporting] = useState(false);
    const [csvText, setCsvText] = useState('');
    const fileRef = useRef(null);

    // ── Search/filter ──
    const normalizeSearch = (text) =>
        text?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

    const filtered = useMemo(() => {
        if (!search.trim()) return students;
        const norm = normalizeSearch(search);
        return students.filter(s =>
            normalizeSearch(s.fullName).includes(norm) ||
            normalizeSearch(s.rut).includes(norm) ||
            normalizeSearch(s.curso).includes(norm)
        );
    }, [students, search]);

    // ── Form handlers ──
    const handleField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingId) {
                await updateStudent(editingId, form);
                setEditingId(null);
            } else {
                await addStudent(form);
            }
            setForm(emptyForm);
            setTab('list');
        } catch (err) {
            // toast is handled in context
        }
        setSaving(false);
    };

    const handleEdit = (student) => {
        setForm({
            rut: student.rut || '',
            firstName: student.firstName || '',
            paternalLastName: student.paternalLastName || '',
            maternalLastName: student.maternalLastName || '',
            curso: student.curso || '',
            birthDate: student.birthDate || '',
            guardianName: student.guardianName || '',
            guardianPhone: student.guardianPhone || '',
            guardianEmail: student.guardianEmail || '',
        });
        setEditingId(student.id);
        setTab('add');
    };

    const handleDelete = async (id) => {
        await deleteStudent(id);
        setDeleteConfirm(null);
    };

    // ── CSV handlers ──
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            setCsvText(text);
            const result = parseCSV(text);
            setCsvPreview(result);
            setImportResult(null);
        };
        reader.readAsText(file, 'UTF-8');
    };

    const handleConfirmImport = async () => {
        setImporting(true);
        try {
            const result = await importStudentsFromCSV(csvText);
            setImportResult(result);
            setCsvPreview(null);
        } catch (err) {
            // handled
        }
        setImporting(false);
    };

    const resetImport = () => {
        setCsvPreview(null);
        setImportResult(null);
        setCsvText('');
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <ModalContainer onClose={onClose} maxWidth="max-w-4xl">
            {/* Header */}
            <div className="px-6 py-5 border-b border-eyr-outline-variant/30 flex justify-between items-center shrink-0">
                <div>
                    <h3 className="font-headline font-extrabold text-eyr-on-surface text-xl tracking-tight flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-500" />
                        Gestion de Alumnos
                    </h3>
                    <p className="text-sm text-eyr-on-variant mt-0.5">{students.length} alumnos registrados</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-red-50 hover:text-red-500 text-eyr-on-variant transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-eyr-outline-variant/30 bg-white shrink-0">
                {[
                    { key: 'list', label: 'Lista', icon: Users },
                    { key: 'import', label: 'Importar CSV', icon: Upload },
                    { key: 'add', label: editingId ? 'Editar' : 'Agregar', icon: Plus },
                ].filter(t => t.key === 'list' || userCanEdit).map(t => (
                    <button
                        key={t.key}
                        onClick={() => { setTab(t.key); if (t.key !== 'add') { setEditingId(null); setForm(emptyForm); } }}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px",
                            tab === t.key
                                ? "border-amber-500 text-amber-700"
                                : "border-transparent text-eyr-on-variant hover:text-eyr-on-surface"
                        )}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* ═══ LIST TAB ═══ */}
                {tab === 'list' && (
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-eyr-on-variant" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nombre, RUT o curso..."
                                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-eyr-surface-low border border-eyr-outline-variant/30 text-sm font-medium text-eyr-on-surface placeholder-eyr-on-variant focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all"
                            />
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-12 text-eyr-on-variant">
                                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-medium">No hay alumnos{search ? ' que coincidan' : ' registrados'}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filtered.map(s => (
                                    <div key={s.id} className="flex items-center gap-3 p-3 bg-eyr-surface-low rounded-2xl border border-eyr-outline-variant/30 hover:bg-eyr-surface-mid transition-colors group">
                                        <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
                                            {(s.fullName || '?').charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-eyr-on-surface truncate">{s.fullName}</span>
                                                {s.curso && (
                                                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">{s.curso}</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-eyr-on-variant font-mono">{s.rut}</span>
                                        </div>
                                        {userCanEdit && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(s)}
                                                className="p-1.5 rounded-lg hover:bg-white text-eyr-on-variant hover:text-amber-600 transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            {deleteConfirm === s.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDelete(s.id)}
                                                        className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="p-1.5 rounded-lg bg-eyr-surface-mid text-eyr-on-variant hover:bg-eyr-surface-low transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setDeleteConfirm(s.id)}
                                                    className="p-1.5 rounded-lg hover:bg-white text-eyr-on-variant hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ IMPORT TAB ═══ */}
                {tab === 'import' && (
                    <div className="space-y-4">
                        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 text-sm text-amber-800">
                            <div className="flex items-start gap-2">
                                <FileText className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">Importar desde SIGE</p>
                                    <p className="text-amber-700 mt-1">Exporta la lista de alumnos desde SIGE como CSV. El sistema detecta automaticamente las columnas y el separador.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleFileSelect}
                                className="block w-full text-sm text-eyr-on-variant file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-eyr-outline-variant/30 file:text-sm file:font-bold file:bg-white file:text-eyr-on-surface hover:file:bg-eyr-surface-low file:cursor-pointer file:transition-colors"
                            />
                            {(csvPreview || importResult) && (
                                <button onClick={resetImport} className="px-3 py-2 text-xs font-bold text-eyr-on-variant bg-eyr-surface-mid rounded-lg hover:bg-eyr-surface-low transition-colors whitespace-nowrap">
                                    Limpiar
                                </button>
                            )}
                        </div>

                        {/* Preview */}
                        {csvPreview && !importResult && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-eyr-on-surface">
                                        Vista previa: {csvPreview.students.length} alumnos encontrados
                                    </h4>
                                    <button
                                        onClick={handleConfirmImport}
                                        disabled={importing || csvPreview.students.length === 0}
                                        className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
                                    >
                                        {importing ? (
                                            <span className="animate-pulse">Importando...</span>
                                        ) : (
                                            <><Upload className="w-4 h-4" /> Confirmar Importacion</>
                                        )}
                                    </button>
                                </div>

                                {csvPreview.errors.length > 0 && (
                                    <div className="bg-red-50 rounded-2xl p-3 border border-red-100 text-sm text-red-700 space-y-1">
                                        <div className="flex items-center gap-1.5 font-bold text-red-800">
                                            <AlertTriangle className="w-4 h-4" />
                                            {csvPreview.errors.length} advertencias
                                        </div>
                                        {csvPreview.errors.slice(0, 5).map((e, i) => (
                                            <p key={i} className="text-xs">{e}</p>
                                        ))}
                                        {csvPreview.errors.length > 5 && (
                                            <p className="text-xs text-red-500">...y {csvPreview.errors.length - 5} mas</p>
                                        )}
                                    </div>
                                )}

                                <div className="overflow-x-auto rounded-2xl border border-eyr-outline-variant/30">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-eyr-surface-low border-b border-eyr-outline-variant/30">
                                                <th className="text-left py-2 px-3 font-bold text-eyr-on-variant">RUT</th>
                                                <th className="text-left py-2 px-3 font-bold text-eyr-on-variant">Nombre</th>
                                                <th className="text-left py-2 px-3 font-bold text-eyr-on-variant">Curso</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvPreview.students.slice(0, 10).map((s, i) => (
                                                <tr key={i} className="border-b border-eyr-outline-variant/30">
                                                    <td className="py-2 px-3 font-mono text-eyr-on-variant">{s.rut}</td>
                                                    <td className="py-2 px-3 text-eyr-on-surface font-medium">{s.fullName || `${s.firstName} ${s.paternalLastName}`}</td>
                                                    <td className="py-2 px-3 text-eyr-on-variant">{s.curso || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {csvPreview.students.length > 10 && (
                                        <div className="text-center py-2 text-xs text-eyr-on-variant bg-eyr-surface-low">
                                            ...y {csvPreview.students.length - 10} mas
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Import Result */}
                        {importResult && (
                            <div className="space-y-3">
                                <div className={cn(
                                    "rounded-2xl p-4 border text-sm",
                                    importResult.imported > 0
                                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                                        : "bg-eyr-surface-low border-eyr-outline-variant/30 text-eyr-on-surface"
                                )}>
                                    <p className="font-bold text-base">{importResult.imported} alumnos importados</p>
                                    {importResult.skipped > 0 && (
                                        <p className="mt-1">{importResult.skipped} duplicados omitidos (mismo RUT)</p>
                                    )}
                                </div>
                                {importResult.errors.length > 0 && (
                                    <div className="bg-red-50 rounded-2xl p-3 border border-red-100 text-sm text-red-700 space-y-1">
                                        {importResult.errors.map((e, i) => (
                                            <p key={i} className="text-xs">{e}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ ADD/EDIT TAB ═══ */}
                {tab === 'add' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* RUT */}
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1.5">RUT *</label>
                                <input
                                    type="text"
                                    value={form.rut}
                                    onChange={(e) => handleField('rut', e.target.value)}
                                    placeholder="12.345.678-9"
                                    disabled={!!editingId}
                                    className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface disabled:opacity-50 font-mono"
                                />
                            </div>

                            {/* Curso */}
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1.5">Curso</label>
                                <select
                                    value={form.curso}
                                    onChange={(e) => handleField('curso', e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                >
                                    <option value="">Seleccionar...</option>
                                    {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* First name */}
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1.5">Nombres *</label>
                                <input
                                    type="text"
                                    value={form.firstName}
                                    onChange={(e) => handleField('firstName', e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                />
                            </div>

                            {/* Paternal last name */}
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1.5">Apellido Paterno *</label>
                                <input
                                    type="text"
                                    value={form.paternalLastName}
                                    onChange={(e) => handleField('paternalLastName', e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                />
                            </div>

                            {/* Maternal last name */}
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1.5">Apellido Materno</label>
                                <input
                                    type="text"
                                    value={form.maternalLastName}
                                    onChange={(e) => handleField('maternalLastName', e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                />
                            </div>

                            {/* Birth date */}
                            <div>
                                <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1.5">Fecha Nacimiento</label>
                                <input
                                    type="date"
                                    value={form.birthDate}
                                    onChange={(e) => handleField('birthDate', e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                />
                            </div>
                        </div>

                        {/* Guardian section */}
                        <div className="pt-2">
                            <h4 className="text-xs font-bold text-eyr-on-variant uppercase tracking-wider mb-3">Datos Apoderado</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1.5">Nombre</label>
                                    <input
                                        type="text"
                                        value={form.guardianName}
                                        onChange={(e) => handleField('guardianName', e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1.5">Telefono</label>
                                    <input
                                        type="tel"
                                        value={form.guardianPhone}
                                        onChange={(e) => handleField('guardianPhone', e.target.value)}
                                        placeholder="+56 9 ..."
                                        className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-eyr-on-variant ml-1 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={form.guardianEmail}
                                        onChange={(e) => handleField('guardianEmail', e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl border border-eyr-outline-variant/30 bg-eyr-surface-low focus:outline-none focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 transition-all font-medium text-eyr-on-surface"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.rut || !form.firstName || !form.paternalLastName}
                                className="bg-gradient-to-r from-eyr-primary to-[#742fe5] text-white rounded-2xl font-extrabold px-8 py-3 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar Alumno'}
                            </button>
                            {editingId && (
                                <button
                                    onClick={() => { setEditingId(null); setForm(emptyForm); setTab('list'); }}
                                    className="text-eyr-on-variant hover:bg-red-50 hover:text-red-500 rounded-2xl px-6 py-3 font-bold transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ModalContainer>
    );
}
