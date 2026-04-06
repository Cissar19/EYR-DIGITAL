import React, { useState, useMemo } from 'react';
import { X, Search, Archive, CheckSquare, AlignLeft, ToggleLeft, Link2, Type, Plus, Trash2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuestionBank } from '../context/QuestionBankContext';
import { useAuth } from '../context/AuthContext';
import { ASIGNATURAS } from '../data/objetivosAprendizaje';

const TIPO_CONFIG = {
    seleccion_multiple: { label: 'S.M.',      Icon: CheckSquare, cls: 'bg-indigo-100 text-indigo-700' },
    desarrollo:         { label: 'Desarrollo', Icon: AlignLeft,   cls: 'bg-amber-100 text-amber-700'  },
    verdadero_falso:    { label: 'V/F',        Icon: ToggleLeft,  cls: 'bg-violet-100 text-violet-700'},
    unir:               { label: 'Unir',       Icon: Link2,       cls: 'bg-sky-100 text-sky-700'      },
    completar:          { label: 'Completar',  Icon: Type,        cls: 'bg-rose-100 text-rose-700'    },
};

function normalizar(t) {
    return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Modal para buscar y seleccionar preguntas del banco.
 * @param {function} onClose
 * @param {function} onSelect - callback({ pregunta }) → se puede llamar varias veces
 * @param {string} asignatura - filtro inicial por asignatura (código)
 */
export default function BancoPreguntasModal({ onClose, onSelect, asignatura: asignaturaInicial }) {
    const { questions, loading, deleteQuestion } = useQuestionBank();
    const { user } = useAuth();

    const [search,          setSearch]          = useState('');
    const [filterAsig,      setFilterAsig]      = useState(asignaturaInicial || '');
    const [filterTipo,      setFilterTipo]      = useState('');
    const [addedIds,        setAddedIds]        = useState(new Set());
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const filtered = useMemo(() => {
        const q = normalizar(search);
        return questions.filter(p => {
            if (filterAsig && p.asignatura !== filterAsig) return false;
            if (filterTipo && p.tipo !== filterTipo) return false;
            if (q && !normalizar(p.enunciado).includes(q)) return false;
            return true;
        });
    }, [questions, search, filterAsig, filterTipo]);

    const handleAdd = (pregunta) => {
        // Copia limpia de la pregunta (sin id, sin metadata del banco)
        const { id: _id, createdBy: _cb, createdAt: _ca, usedCount: _uc, asignatura: _a, curso: _c, ...copia } = pregunta;
        onSelect(copia);
        setAddedIds(prev => new Set([...prev, pregunta.id]));
    };

    const handleDelete = async (id) => {
        await deleteQuestion(id);
        setConfirmDeleteId(null);
    };

    const SELECT_CLS = 'py-2 pl-3 pr-8 rounded-xl border border-slate-200 text-sm font-medium outline-none bg-white appearance-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl">
                            <Archive className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Banco de Preguntas</h2>
                            <p className="text-xs text-slate-500">{questions.length} pregunta{questions.length !== 1 ? 's' : ''} guardadas</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filtros */}
                <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-2 shrink-0">
                    <div className="relative flex-1 min-w-44">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar en enunciado..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                        />
                    </div>
                    <select value={filterAsig} onChange={e => setFilterAsig(e.target.value)} className={SELECT_CLS}>
                        <option value="">Todas las asignaturas</option>
                        {ASIGNATURAS.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                    </select>
                    <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className={SELECT_CLS}>
                        <option value="">Todos los tipos</option>
                        {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                    {(search || filterAsig || filterTipo) && (
                        <button
                            onClick={() => { setSearch(''); setFilterAsig(''); setFilterTipo(''); }}
                            className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                    {loading ? (
                        <p className="text-center text-sm text-slate-400 py-8">Cargando banco...</p>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
                            <BookOpen className="w-10 h-10" />
                            <p className="text-sm font-medium">
                                {questions.length === 0
                                    ? 'El banco está vacío. Guarda preguntas desde las evaluaciones.'
                                    : 'Sin resultados para los filtros aplicados'}
                            </p>
                        </div>
                    ) : (
                        filtered.map(p => {
                            const conf    = TIPO_CONFIG[p.tipo] || TIPO_CONFIG.desarrollo;
                            const oaShort = p.oaCode
                                ? (p.oaCode.includes('-') ? p.oaCode.split('-').slice(1).join('-') : p.oaCode)
                                : null;
                            const yaAgregada = addedIds.has(p.id);
                            const esPropia   = p.createdBy?.id === user?.uid;
                            const isAdmin    = user?.role === 'admin' || user?.role === 'super_admin';

                            return (
                                <div
                                    key={p.id}
                                    className={`border rounded-xl p-3.5 transition-all ${
                                        yaAgregada ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Tipo badge */}
                                        <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold mt-0.5 ${conf.cls}`}>
                                            <conf.Icon className="w-3 h-3" />
                                            {conf.label}
                                        </span>

                                        {/* Contenido */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2">
                                                {p.enunciado || <span className="italic text-slate-400">(sin enunciado)</span>}
                                            </p>
                                            {/* Alternativas SM (preview) */}
                                            {p.tipo === 'seleccion_multiple' && p.alternativas && (
                                                <div className="mt-1 space-y-0.5">
                                                    {['a','b','c','d'].filter(l => p.alternativas[l]).map(l => (
                                                        <p key={l} className={`text-[11px] ${p.respuestaCorrecta === l ? 'font-semibold text-emerald-700' : 'text-slate-500'}`}>
                                                            {p.respuestaCorrecta === l ? '✓ ' : ''}{l}) {p.alternativas[l]}
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                            {/* Ítems V/F preview */}
                                            {p.tipo === 'verdadero_falso' && (p.items || []).length > 0 && (
                                                <p className="text-[11px] text-slate-400 mt-1">{p.items.length} ítem{p.items.length !== 1 ? 's' : ''}</p>
                                            )}
                                            {/* Metadata */}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {oaShort && (
                                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{oaShort}</span>
                                                )}
                                                {p.asignatura && (
                                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                        {ASIGNATURAS.find(a => a.code === p.asignatura)?.name || p.asignatura}
                                                    </span>
                                                )}
                                                {p.curso && (
                                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{p.curso}</span>
                                                )}
                                                <span className="text-[10px] text-slate-400">{p.puntaje ?? 1} pt · {p.createdBy?.name}</span>
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            {(esPropia || isAdmin) && (
                                                confirmDeleteId === p.id ? (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleDelete(p.id)}
                                                            className="px-2 py-1 text-[11px] font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                                        >
                                                            Eliminar
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDeleteId(null)}
                                                            className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmDeleteId(p.id)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar del banco"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )
                                            )}
                                            <button
                                                onClick={() => !yaAgregada && handleAdd(p)}
                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                                    yaAgregada
                                                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                            >
                                                {yaAgregada ? '✓ Agregada' : <><Plus className="w-3 h-3" /> Agregar</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <p className="text-xs text-slate-500">
                        {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                        {addedIds.size > 0 && ` · ${addedIds.size} agregada${addedIds.size !== 1 ? 's' : ''}`}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
