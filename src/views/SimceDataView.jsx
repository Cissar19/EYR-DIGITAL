import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Pencil, Trash2, X, Check, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSimce } from '../context/SimceContext';
import { toast } from 'sonner';

const GRADES = ['4° Básico', '6° Básico', '8° Básico', '2° Medio', 'Promedio'];
const SUBJECTS = ['Lenguaje', 'Matemáticas', 'Ciencias', 'Historia'];

const emptyForm = { year: new Date().getFullYear(), grade: GRADES[0], subject: SUBJECTS[0], score: '', nationalAvg: '' };

export default function SimceDataView() {
  const { results, addResult, updateResult, deleteResult } = useSimce();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const years = useMemo(() => {
    const yrs = [...new Set(results.map(r => r.year))].sort((a, b) => b - a);
    return yrs.length > 0 ? yrs : [new Date().getFullYear()];
  }, [results]);

  const [selectedYear, setSelectedYear] = useState(years[0]);

  const filtered = useMemo(() =>
    results.filter(r => r.year === selectedYear).sort((a, b) => {
      const gi = GRADES.indexOf(a.grade) - GRADES.indexOf(b.grade);
      if (gi !== 0) return gi;
      return SUBJECTS.indexOf(a.subject) - SUBJECTS.indexOf(b.subject);
    }),
    [results, selectedYear]
  );

  const openAdd = () => {
    setEditingId(null);
    setFormData({ ...emptyForm, year: selectedYear });
    setIsModalOpen(true);
  };

  const openEdit = (r) => {
    setEditingId(r.id);
    setFormData({ year: r.year, grade: r.grade, subject: r.subject, score: r.score, nationalAvg: r.nationalAvg });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, score: Number(formData.score), nationalAvg: Number(formData.nationalAvg), year: Number(formData.year) };
    if (editingId) {
      updateResult(editingId, data);
      toast.success('Resultado SIMCE actualizado');
    } else {
      addResult(data);
      toast.success('Resultado SIMCE agregado');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    deleteResult(id);
    setDeleteConfirmId(null);
    toast.success('Resultado eliminado');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-300/40">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Resultados SIMCE</h1>
            <p className="text-slate-500 text-sm">Ingreso y gestión de resultados SIMCE por año</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
          <Plus className="w-4 h-4" /> Agregar Resultado
        </button>
      </motion.div>

      {/* Year tabs */}
      <div className="flex gap-2 flex-wrap">
        {years.map(y => (
          <button key={y} onClick={() => setSelectedYear(y)} className={cn(
            'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
            selectedYear === y ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
          )}>{y}</button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Grado</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Asignatura</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">Puntaje Escuela</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">Promedio Nacional</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">Diferencia</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const diff = r.score - r.nationalAvg;
                return (
                  <tr key={r.id} className={cn('border-b border-slate-100 hover:bg-slate-50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                    <td className="py-3 px-4 font-medium text-slate-900">{r.grade}</td>
                    <td className="py-3 px-4 text-slate-700">{r.subject}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">{r.score}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{r.nationalAvg}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold',
                        diff > 0 ? 'bg-green-50 text-green-700' : diff < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'
                      )}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteConfirmId === r.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteConfirmId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Award className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No hay resultados para {selectedYear}</p>
                    <p className="text-xs mt-1">Haz clic en "Agregar Resultado" para comenzar</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Editar Resultado' : 'Agregar Resultado SIMCE'}</h2>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Año</label>
                    <input type="number" required value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Grado</label>
                    <select required value={formData.grade} onChange={e => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm">
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Asignatura</label>
                  <select required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Puntaje Escuela</label>
                    <input type="number" required min={0} max={500} value={formData.score} onChange={e => setFormData({ ...formData, score: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Promedio Nacional</label>
                    <input type="number" required min={0} max={500} value={formData.nationalAvg} onChange={e => setFormData({ ...formData, nationalAvg: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                    {editingId ? 'Guardar Cambios' : 'Agregar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
