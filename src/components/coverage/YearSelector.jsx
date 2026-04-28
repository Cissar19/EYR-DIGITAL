import React, { useState } from 'react';
import { Plus, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useAuth } from '../../context/AuthContext';

export default function YearSelector({ className }) {
  const { year, setYear, availableYears, loading, addYear, deleteYear } = useAcademicYear();
  const { isUtpHead, isAdmin } = useAuth();
  const canManage = isUtpHead() || isAdmin();

  const [confirmingAdd, setConfirmingAdd]       = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(null); // year number | null
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className={cn('flex gap-2', className)}>
        {[1, 2].map(i => (
          <div key={i} className="h-8 w-14 rounded-full bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  const years    = availableYears.length > 0 ? availableYears : [year];
  const nextYear = Math.max(...years) + 1;

  const handleAdd = async () => {
    setBusy(true);
    try {
      await addYear(nextYear);
      toast.success(`Año ${nextYear} creado`);
      setConfirmingAdd(false);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo crear el año');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (y) => {
    setBusy(true);
    try {
      await deleteYear(y);
      toast.success(`Año ${y} eliminado`);
      setConfirmingDelete(null);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo eliminar el año');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      <span className="text-xs text-slate-500 mr-1">Año:</span>

      {years.map(y => (
        <div key={y} className="relative group flex items-center">
          {confirmingDelete === y ? (
            <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-full px-2 py-1">
              <span className="text-xs text-rose-700 font-medium">¿Borrar {y}?</span>
              <button
                onClick={() => handleDelete(y)}
                disabled={busy}
                className="w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white transition-colors disabled:opacity-50"
              >
                <Check size={11} />
              </button>
              <button
                onClick={() => setConfirmingDelete(null)}
                disabled={busy}
                className="w-5 h-5 rounded-full bg-slate-300 hover:bg-slate-400 flex items-center justify-center text-white transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setYear(y)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  y === year
                    ? 'bg-eyr-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {y}
              </button>
              {canManage && (
                <button
                  onClick={() => setConfirmingDelete(y)}
                  className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                  title={`Eliminar año ${y}`}
                >
                  <Trash2 size={10} />
                </button>
              )}
            </>
          )}
        </div>
      ))}

      {canManage && (
        confirmingAdd ? (
          <div className="flex items-center gap-1 bg-slate-100 rounded-full px-2 py-1">
            <span className="text-xs text-slate-600 font-medium">{nextYear}</span>
            <button
              onClick={handleAdd}
              disabled={busy}
              className="w-5 h-5 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white transition-colors disabled:opacity-50"
            >
              <Check size={11} />
            </button>
            <button
              onClick={() => setConfirmingAdd(false)}
              disabled={busy}
              className="w-5 h-5 rounded-full bg-slate-300 hover:bg-slate-400 flex items-center justify-center text-white transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingAdd(true)}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            title={`Crear año ${nextYear}`}
          >
            <Plus size={14} />
          </button>
        )
      )}
    </div>
  );
}
