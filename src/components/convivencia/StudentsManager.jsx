import React, { useState, useMemo, useRef } from 'react';
import { useStudents } from '../../context/StudentsContext';
import { Upload, Plus, Search, X, Edit3, Trash2, Check, AlertTriangle, FileText, Users, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { formatRut } from '../../lib/csvParser';
import { parseCSV } from '../../lib/csvParser';

// ── Curso options ──
const CURSOS = [
    'Pre-Kinder', 'Kinder',
    '1° Basico', '2° Basico', '3° Basico', '4° Basico',
    '5° Basico', '6° Basico', '7° Basico', '8° Basico',
    'I Medio', 'II Medio', 'III Medio', 'IV Medio',
];

const emptyForm = {
    rut: '', firstName: '', paternalLastName: '', maternalLastName: '',
    curso: '', birthDate: '', guardianName: '', guardianPhone: '', guardianEmail: '',
};

export default function StudentsManager({ onClose }) {
    const { students, addStudent, updateStudent, deleteStudent, importStudentsFromCSV } = useStudents();

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col"
            >
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <Users className="w-5 h-5 text-amber-500" />
                            Gestion de Alumnos
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">{students.length} alumnos registrados</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab bar */}
                <div className="flex border-b border-slate-100 bg-white shrink-0">
                    {[
                        { key: 'list', label: 'Lista', icon: Users },
                        { key: 'import', label: 'Importar CSV', icon: Upload },
                        { key: 'add', label: editingId ? 'Editar' : 'Agregar', icon: Plus },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => { setTab(t.key); if (t.key !== 'add') { setEditingId(null); setForm(emptyForm); } }}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px",
                                tab === t.key
                                    ? "border-amber-500 text-amber-700"
                                    : "border-transparent text-slate-500 hover:text-slate-700"
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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por nombre, RUT o curso..."
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
                                />
                            </div>

                            {filtered.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-medium">No hay alumnos{search ? ' que coincidan' : ' registrados'}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filtered.map(s => (
                                        <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group">
                                            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
                                                {(s.fullName || '?').charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800 truncate">{s.fullName}</span>
                                                    {s.curso && (
                                                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">{s.curso}</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-slate-400 font-mono">{s.rut}</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(s)}
                                                    className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-amber-600 transition-colors"
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
                                                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setDeleteConfirm(s.id)}
                                                        className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ IMPORT TAB ═══ */}
                    {tab === 'import' && (
                        <div className="space-y-4">
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-sm text-amber-800">
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
                                    className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-200 file:text-sm file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-50 file:cursor-pointer file:transition-colors"
                                />
                                {(csvPreview || importResult) && (
                                    <button onClick={resetImport} className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap">
                                        Limpiar
                                    </button>
                                )}
                            </div>

                            {/* Preview */}
                            {csvPreview && !importResult && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-700">
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
                                        <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-sm text-red-700 space-y-1">
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

                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                    <th className="text-left py-2 px-3 font-bold text-slate-600">RUT</th>
                                                    <th className="text-left py-2 px-3 font-bold text-slate-600">Nombre</th>
                                                    <th className="text-left py-2 px-3 font-bold text-slate-600">Curso</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvPreview.students.slice(0, 10).map((s, i) => (
                                                    <tr key={i} className="border-b border-slate-100">
                                                        <td className="py-2 px-3 font-mono text-slate-600">{s.rut}</td>
                                                        <td className="py-2 px-3 text-slate-800 font-medium">{s.fullName || `${s.firstName} ${s.paternalLastName}`}</td>
                                                        <td className="py-2 px-3 text-slate-500">{s.curso || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {csvPreview.students.length > 10 && (
                                            <div className="text-center py-2 text-xs text-slate-400 bg-slate-50">
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
                                        "rounded-xl p-4 border text-sm",
                                        importResult.imported > 0
                                            ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                                            : "bg-slate-50 border-slate-200 text-slate-700"
                                    )}>
                                        <p className="font-bold text-base">{importResult.imported} alumnos importados</p>
                                        {importResult.skipped > 0 && (
                                            <p className="mt-1">{importResult.skipped} duplicados omitidos (mismo RUT)</p>
                                        )}
                                    </div>
                                    {importResult.errors.length > 0 && (
                                        <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-sm text-red-700 space-y-1">
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
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">RUT *</label>
                                    <input
                                        type="text"
                                        value={form.rut}
                                        onChange={(e) => handleField('rut', e.target.value)}
                                        placeholder="12.345.678-9"
                                        disabled={!!editingId}
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700 disabled:opacity-50 font-mono"
                                    />
                                </div>

                                {/* Curso */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Curso</label>
                                    <select
                                        value={form.curso}
                                        onChange={(e) => handleField('curso', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                {/* First name */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombres *</label>
                                    <input
                                        type="text"
                                        value={form.firstName}
                                        onChange={(e) => handleField('firstName', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                                    />
                                </div>

                                {/* Paternal last name */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Apellido Paterno *</label>
                                    <input
                                        type="text"
                                        value={form.paternalLastName}
                                        onChange={(e) => handleField('paternalLastName', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                                    />
                                </div>

                                {/* Maternal last name */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Apellido Materno</label>
                                    <input
                                        type="text"
                                        value={form.maternalLastName}
                                        onChange={(e) => handleField('maternalLastName', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                                    />
                                </div>

                                {/* Birth date */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha Nacimiento</label>
                                    <input
                                        type="date"
                                        value={form.birthDate}
                                        onChange={(e) => handleField('birthDate', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* Guardian section */}
                            <div className="pt-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Datos Apoderado</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre</label>
                                        <input
                                            type="text"
                                            value={form.guardianName}
                                            onChange={(e) => handleField('guardianName', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Telefono</label>
                                        <input
                                            type="tel"
                                            value={form.guardianPhone}
                                            onChange={(e) => handleField('guardianPhone', e.target.value)}
                                            placeholder="+56 9 ..."
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            value={form.guardianEmail}
                                            onChange={(e) => handleField('guardianEmail', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !form.rut || !form.firstName || !form.paternalLastName}
                                    className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Agregar Alumno'}
                                </button>
                                {editingId && (
                                    <button
                                        onClick={() => { setEditingId(null); setForm(emptyForm); setTab('list'); }}
                                        className="px-4 py-3 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
