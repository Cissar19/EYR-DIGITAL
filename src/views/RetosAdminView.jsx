import React, { useState } from 'react';
import { BookCheck, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Clock, Send } from 'lucide-react';
import { useRetos } from '../context/RetosContext';
import { toast } from 'sonner';
import ModalContainer from '../components/ModalContainer';

const ASIGNATURAS = ['Lenguaje', 'Matemáticas', 'Historia', 'Ciencias', 'Inglés', 'Educación Física', 'Artes', 'Tecnología', 'Otra'];
const CURSOS = ['', 'Pre-Kinder', 'Kinder', '1° Básico', '2° Básico', '3° Básico', '4° Básico', '5° Básico', '6° Básico', '7° Básico', '8° Básico', 'I Medio', 'II Medio', 'III Medio', 'IV Medio'];

const emptyForm = {
    titulo: '', instrucciones: '', asignatura: 'Lenguaje',
    cursoObjetivo: '', duracionMin: 45, habilitarEnvioMin: 20,
};

const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-200';

export default function RetosAdminView() {
    const { retos, loading, createReto, updateReto, deleteReto } = useRetos();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
    const openEdit = (r) => {
        setForm({ titulo: r.titulo, instrucciones: r.instrucciones, asignatura: r.asignatura,
            cursoObjetivo: r.cursoObjetivo || '', duracionMin: r.duracionMin, habilitarEnvioMin: r.habilitarEnvioMin });
        setEditingId(r.id);
        setShowModal(true);
    };

    const handleField = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSave = async () => {
        if (!form.titulo.trim() || !form.instrucciones.trim()) {
            toast.error('Título e instrucciones son obligatorios');
            return;
        }
        if (Number(form.habilitarEnvioMin) >= Number(form.duracionMin)) {
            toast.error('El tiempo de habilitación debe ser menor que la duración');
            return;
        }
        setSaving(true);
        try {
            if (editingId) await updateReto(editingId, form);
            else await createReto(form);
            setShowModal(false);
        } catch {
            toast.error('Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (r) => {
        await updateReto(r.id, { activo: !r.activo });
    };

    const handleDelete = async (id) => {
        try { await deleteReto(id); } catch { toast.error('Error al eliminar'); }
        setConfirmDelete(null);
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                        <BookCheck className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Banco de Retos</h1>
                        <p className="text-slate-500 text-sm">Ejercicios para sesiones de emergencia.</p>
                    </div>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-200">
                    <Plus className="w-4 h-4" /> Nuevo Reto
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Cargando…</div>
            ) : retos.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <BookCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay retos creados todavía.</p>
                    <button onClick={openCreate} className="mt-4 text-violet-600 font-bold text-sm hover:underline">
                        Crear el primero →
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {retos.map(r => (
                        <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {r.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{r.asignatura}</span>
                                    {r.cursoObjetivo && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{r.cursoObjetivo}</span>}
                                </div>
                                <h3 className="font-bold text-slate-800 truncate">{r.titulo}</h3>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.instrucciones}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {r.duracionMin} min</span>
                                    <span className="flex items-center gap-1"><Send className="w-3 h-3" /> Envío desde min {r.habilitarEnvioMin}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => handleToggle(r)} title={r.activo ? 'Desactivar' : 'Activar'}
                                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                                    {r.activo ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                                </button>
                                <button onClick={() => openEdit(r)}
                                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => setConfirmDelete(r.id)}
                                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modal crear/editar ── */}
            {showModal && (
                <ModalContainer onClose={() => setShowModal(false)} maxWidth="max-w-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                        <h2 className="font-extrabold text-slate-800">{editingId ? 'Editar Reto' : 'Nuevo Reto'}</h2>
                        <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Scrollable body */}
                    <div className="overflow-y-auto flex-1 p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Título del reto *</label>
                            <input type="text" value={form.titulo} onChange={e => handleField('titulo', e.target.value)}
                                placeholder="Ej: Redacción libre — Día del Medio Ambiente"
                                className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Instrucciones del reto *</label>
                            <textarea rows={8} value={form.instrucciones} onChange={e => handleField('instrucciones', e.target.value)}
                                placeholder="Escribe el enunciado completo que verán los alumnos durante el reto…"
                                className={`${inputCls} resize-none`} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Asignatura</label>
                                <select value={form.asignatura} onChange={e => handleField('asignatura', e.target.value)} className={inputCls}>
                                    {ASIGNATURAS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                    Curso objetivo <span className="text-slate-400 font-normal">(opcional)</span>
                                </label>
                                <select value={form.cursoObjetivo} onChange={e => handleField('cursoObjetivo', e.target.value)} className={inputCls}>
                                    <option value="">Todos los cursos</option>
                                    {CURSOS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Duración (minutos)</label>
                                <input type="number" min={10} max={120} value={form.duracionMin}
                                    onChange={e => handleField('duracionMin', e.target.value)}
                                    className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Habilitar envío desde min</label>
                                <input type="number" min={5} max={60} value={form.habilitarEnvioMin}
                                    onChange={e => handleField('habilitarEnvioMin', e.target.value)}
                                    className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0">
                        <button onClick={() => setShowModal(false)}
                            className="text-slate-500 hover:bg-slate-100 rounded-2xl px-6 py-3 font-bold transition-all text-sm">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-8 py-3 rounded-2xl shadow-lg shadow-violet-200 transition-all text-sm disabled:opacity-50">
                            {saving ? 'Guardando…' : (editingId ? 'Guardar cambios' : 'Crear reto')}
                        </button>
                    </div>
                </ModalContainer>
            )}

            {/* ── Confirmar eliminación ── */}
            {confirmDelete && (
                <ModalContainer onClose={() => setConfirmDelete(null)} maxWidth="max-w-sm" noGradient>
                    <div className="p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="font-extrabold text-slate-800 mb-2">¿Eliminar este reto?</h3>
                        <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
                    </div>
                    <div className="bg-eyr-surface-mid flex items-center justify-between p-6 shrink-0">
                        <button onClick={() => setConfirmDelete(null)}
                            className="text-slate-500 hover:bg-slate-100 rounded-2xl px-6 py-3 font-bold transition-all text-sm">
                            Cancelar
                        </button>
                        <button onClick={() => handleDelete(confirmDelete)}
                            className="bg-red-600 hover:bg-red-700 text-white font-extrabold px-8 py-3 rounded-2xl shadow-lg transition-all text-sm">
                            Eliminar
                        </button>
                    </div>
                </ModalContainer>
            )}
        </div>
    );
}
