import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Search, Save, Plus, Trash2, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth, ROLES } from '../context/AuthContext';
import { useAttendance } from '../context/AttendanceContext';
import { toast } from 'sonner';

export default function AttendanceDataView() {
  const { users: allUsers } = useAuth();
  const { records, addRecord, updateRecord, deleteRecord, initWithUsers } = useAttendance();
  const [searchQuery, setSearchQuery] = useState('');
  const [editedValues, setEditedValues] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({ userId: '', attendance: '' });

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const yrs = [...new Set(records.map(r => r.year))].sort((a, b) => b - a);
    return yrs.length > 0 ? yrs : [currentYear];
  }, [records, currentYear]);
  const [selectedYear, setSelectedYear] = useState(years[0]);

  // Init seed data
  useEffect(() => {
    if (allUsers.length > 0) initWithUsers(allUsers);
  }, [allUsers, initWithUsers]);

  const teachers = useMemo(() =>
    allUsers.filter(u => u.role === ROLES.TEACHER || u.role === ROLES.ADMIN || u.role === ROLES.STAFF || u.role === 'director'),
    [allUsers]
  );

  const filtered = useMemo(() => {
    const yearRecords = records.filter(r => r.year === selectedYear);
    if (!searchQuery) return yearRecords.sort((a, b) => a.userName.localeCompare(b.userName));
    const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return yearRecords
      .filter(r => r.userName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q))
      .sort((a, b) => a.userName.localeCompare(b.userName));
  }, [records, selectedYear, searchQuery]);

  const handleChange = (id, value) => {
    setEditedValues(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = (id) => {
    const val = parseFloat(editedValues[id]);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error('Ingrese un porcentaje válido (0-100)');
      return;
    }
    updateRecord(id, { attendance: Math.round(val * 10) / 10 });
    setEditedValues(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    toast.success('Asistencia actualizada');
  };

  const handleSaveAll = () => {
    let count = 0;
    Object.entries(editedValues).forEach(([id, value]) => {
      const val = parseFloat(value);
      if (!isNaN(val) && val >= 0 && val <= 100) {
        updateRecord(id, { attendance: Math.round(val * 10) / 10 });
        count++;
      }
    });
    setEditedValues({});
    if (count > 0) toast.success(`${count} registro${count > 1 ? 's' : ''} actualizado${count > 1 ? 's' : ''}`);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const user = teachers.find(u => u.id === newRecord.userId);
    if (!user) { toast.error('Seleccione un docente'); return; }
    const val = parseFloat(newRecord.attendance);
    if (isNaN(val) || val < 0 || val > 100) { toast.error('Porcentaje inválido'); return; }
    // Check if already exists
    const exists = records.find(r => r.userId === user.id && r.year === selectedYear);
    if (exists) { toast.error('Ya existe un registro para este docente en este año'); return; }
    addRecord({ userId: user.id, userName: user.name, year: selectedYear, attendance: Math.round(val * 10) / 10 });
    setNewRecord({ userId: '', attendance: '' });
    setShowAddForm(false);
    toast.success('Registro de asistencia agregado');
  };

  const handleDelete = (id) => {
    deleteRecord(id);
    setDeleteConfirmId(null);
    toast.success('Registro eliminado');
  };

  const getAttColor = (att) => {
    if (att >= 95) return 'text-green-700 bg-green-50';
    if (att >= 90) return 'text-blue-700 bg-blue-50';
    if (att >= 85) return 'text-amber-700 bg-amber-50';
    return 'text-red-700 bg-red-50';
  };

  const hasEdits = Object.keys(editedValues).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-300/40">
            <UserCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Asistencia Docente</h1>
            <p className="text-slate-500 text-sm">Porcentaje de asistencia acumulado anual por docente</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasEdits && (
            <button onClick={handleSaveAll} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors shadow-md shadow-green-200">
              <Save className="w-4 h-4" /> Guardar Todo ({Object.keys(editedValues).length})
            </button>
          )}
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>
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
          <div className="w-32">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Asistencia %</label>
            <input type="number" required min={0} max={100} step={0.1} value={newRecord.attendance} onChange={e => setNewRecord({ ...newRecord, attendance: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-none text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">Agregar</button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">Cancelar</button>
          </div>
        </motion.form>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 font-semibold text-slate-600">Docente</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">Asistencia %</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">Estado</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const currentVal = editedValues[r.id] !== undefined ? editedValues[r.id] : r.attendance;
                const isEdited = editedValues[r.id] !== undefined;
                return (
                  <tr key={r.id} className={cn('border-b border-slate-100 hover:bg-slate-50 transition-colors', i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}>
                    <td className="py-3 px-4 font-medium text-slate-900">{r.userName}</td>
                    <td className="py-3 px-4 text-center">
                      <input type="number" min={0} max={100} step={0.1} value={currentVal}
                        onChange={e => handleChange(r.id, e.target.value)}
                        className={cn(
                          'w-20 text-center px-2 py-1 rounded-lg border text-sm font-bold transition-colors',
                          isEdited ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-700'
                        )} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn('inline-flex px-2.5 py-1 rounded-lg text-xs font-bold', getAttColor(r.attendance))}>
                        {r.attendance >= 95 ? 'Excelente' : r.attendance >= 90 ? 'Bueno' : r.attendance >= 85 ? 'Aceptable' : 'Crítico'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEdited && (
                          <button onClick={() => handleSave(r.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Guardar">
                            <Check className="w-4 h-4" />
                          </button>
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
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">No hay registros de asistencia</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
