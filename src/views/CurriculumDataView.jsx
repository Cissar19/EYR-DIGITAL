import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Plus, Pencil, Trash2, X, Check, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES } from '../context/AuthContext';
import { useCurriculum } from '../context/CurriculumContext';
import { SUBJECTS } from '../data/mockAnalyticsData';
import { toast } from 'sonner';

export default function CurriculumDataView() {
  const { users: allUsers } = useAuth();
  const { records, addRecord, updateRecord, deleteRecord, initWithUsers } = useCurriculum();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newRecord, setNewRecord] = useState({ userId: '', subjectId: '', coverage: '' });

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yrs = [...new Set(records.map(r => r.year))].sort((a, b) => b - a);
    return yrs.length > 0 ? yrs : [currentYear];
  }, [records, currentYear]);
  const [selectedYear, setSelectedYear] = useState(years[0]);

  // Init seed
  useEffect(() => {
    if (allUsers.length > 0) initWithUsers(allUsers);
  }, [allUsers, initWithUsers]);

  const teachers = useMemo(() => allUsers.filter(u => u.role === ROLES.TEACHER), [allUsers]);

  // Group records by teacher
  const grouped = useMemo(() => {
    const yearRecords = records.filter(r => r.year === selectedYear);
    const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const filteredRecords = q
      ? yearRecords.filter(r => r.userName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q))
      : yearRecords;

    const map = {};
    filteredRecords.forEach(r => {
      if (!map[r.userId]) map[r.userId] = { userId: r.userId, userName: r.userName, subjects: [] };
      map[r.userId].subjects.push(r);
    });
    return Object.values(map).sort((a, b) => a.userName.localeCompare(b.userName));
  }, [records, selectedYear, searchQuery]);

  const handleAdd = (e) => {
    e.preventDefault();
    const user = teachers.find(u => u.id === newRecord.userId);
    const subj = SUBJECTS.find(s => s.id === newRecord.subjectId);
    if (!user || !subj) { toast.error('Seleccione docente y asignatura'); return; }
    const val = parseFloat(newRecord.coverage);
    if (isNaN(val) || val < 0 || val > 100) { toast.error('Porcentaje inválido (0-100)'); return; }
    // Check duplicate
    const exists = records.find(r => r.userId === user.id && r.subjectId === subj.id && r.year === selectedYear);
    if (exists) { toast.error('Ya existe un registro para este docente y asignatura'); return; }
    addRecord({
      userId: user.id, userName: user.name,
      subjectId: subj.id, subjectName: subj.name,
      coverage: Math.round(val * 10) / 10, year: selectedYear,
    });
    setNewRecord({ userId: '', subjectId: '', coverage: '' });
    setShowAddForm(false);
    toast.success('Registro de cobertura agregado');
  };

  const handleInlineEdit = (id) => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0 || val > 100) { toast.error('Porcentaje inválido'); return; }
    updateRecord(id, { coverage: Math.round(val * 10) / 10 });
    setEditingId(null);
    toast.success('Cobertura actualizada');
  };

  const handleDelete = (id) => {
    deleteRecord(id);
    setDeleteConfirmId(null);
    toast.success('Registro eliminado');
  };

  const getCovColor = (cov) => {
    if (cov >= 90) return 'text-green-700 bg-green-50';
    if (cov >= 80) return 'text-blue-700 bg-blue-50';
    if (cov >= 65) return 'text-amber-700 bg-amber-50';
    return 'text-red-700 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-300/40">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Cobertura Curricular</h1>
            <p className="text-slate-500 text-sm">Porcentaje de cobertura por docente y asignatura</p>
          </div>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
          <Plus className="w-4 h-4" /> Agregar Registro
        </button>
      </motion.div>

      {/* Year tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {years.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)} className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              selectedYear === y ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
            )}>{y}</button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar docente..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm" />
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleAdd}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Docente</label>
            <select required value={newRecord.userId} onChange={e => setNewRecord({ ...newRecord, userId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm">
              <option value="">Seleccionar...</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Asignatura</label>
            <select required value={newRecord.subjectId} onChange={e => setNewRecord({ ...newRecord, subjectId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm">
              <option value="">Seleccionar...</option>
              {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cobertura %</label>
            <input type="number" required min={0} max={100} step={0.1} value={newRecord.coverage} onChange={e => setNewRecord({ ...newRecord, coverage: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">Agregar</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Cancelar</button>
          </div>
        </motion.form>
      )}

      {/* Grouped cards */}
      <div className="space-y-4">
        {grouped.map(teacher => (
          <div key={teacher.userId} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  {teacher.userName.charAt(0)}
                </div>
                <span className="font-bold text-slate-900 text-sm">{teacher.userName}</span>
              </div>
              <span className="text-xs text-slate-400">{teacher.subjects.length} asignatura{teacher.subjects.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {teacher.subjects.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SUBJECTS.find(s => s.id === r.subjectId)?.color || '#6366f1' }} />
                    <span className="text-sm font-medium text-slate-700">{r.subjectName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {editingId === r.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} max={100} step={0.1} value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="w-20 text-center px-2 py-1 rounded-lg border border-indigo-400 bg-indigo-50 text-sm font-bold text-indigo-700"
                          autoFocus onKeyDown={e => { if (e.key === 'Enter') handleInlineEdit(r.id); if (e.key === 'Escape') setEditingId(null); }} />
                        <button onClick={() => handleInlineEdit(r.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <span className={cn('inline-flex px-2.5 py-1 rounded-lg text-xs font-bold', getCovColor(r.coverage))}>
                          {r.coverage}%
                        </span>
                        <button onClick={() => { setEditingId(r.id); setEditValue(String(r.coverage)); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
                </div>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 py-12 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium text-slate-400">No hay registros de cobertura</p>
            <p className="text-xs text-slate-400 mt-1">Haz clic en "Agregar Registro" para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}
