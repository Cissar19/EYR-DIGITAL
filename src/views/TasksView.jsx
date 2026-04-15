import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, Plus, Search, X, Check, Clock, AlertCircle,
    ChevronDown, Trash2, User, Calendar, Flag, MessageSquare,
    Circle, CheckCircle2, Ban, Send, Pencil, UserPlus, Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTasks } from '../context/TasksContext';
import { useAuth, getRoleLabel, ROLES } from '../context/AuthContext';

const STATUSES = [
    { key: 'all',        label: 'Todas' },
    { key: 'pending',    label: 'Pendiente',   icon: Circle,       color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200' },
    { key: 'in_progress',label: 'En progreso', icon: Clock,        color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
    { key: 'done',       label: 'Completada',  icon: CheckCircle2, color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200' },
    { key: 'cancelled',  label: 'Cancelada',   icon: Ban,          color: 'text-slate-500',  bg: 'bg-slate-50',  border: 'border-slate-200' },
];

const PRIORITIES = [
    { key: 'low',    label: 'Baja',     color: 'text-slate-500',  bg: 'bg-slate-100' },
    { key: 'normal', label: 'Normal',   color: 'text-blue-600',   bg: 'bg-blue-50' },
    { key: 'high',   label: 'Alta',     color: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'urgent', label: 'Urgente',  color: 'text-red-600',    bg: 'bg-red-50' },
];

const getStatusConfig = (key) => STATUSES.find(s => s.key === key) || STATUSES[1];
const getPriorityConfig = (key) => PRIORITIES.find(p => p.key === key) || PRIORITIES[1];

const normalizeText = (t) => t?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

const formatDate = (d) => {
    if (!d) return null;
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
};

const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'done' || status === 'cancelled') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate + 'T00:00:00') < today;
};

function getInitials(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onClick }) {
    const statusConfig = getStatusConfig(task.status);
    const priorityConfig = getPriorityConfig(task.priority);
    const StatusIcon = statusConfig.icon || Circle;
    const overdue = isOverdue(task.dueDate, task.status);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClick}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
        >
            {/* Top row */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={cn(
                    "text-sm font-semibold text-slate-800 leading-snug flex-1 group-hover:text-indigo-700 transition-colors",
                    task.status === 'done' && "line-through text-slate-400"
                )}>
                    {task.title}
                </h3>
                <span className={cn(
                    "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                    priorityConfig.bg, priorityConfig.color
                )}>
                    <Flag className="w-2.5 h-2.5" />
                    {priorityConfig.label}
                </span>
            </div>

            {/* Description preview */}
            {task.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
            )}

            {/* Bottom row */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Status */}
                <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                    statusConfig.bg, statusConfig.color, statusConfig.border
                )}>
                    <StatusIcon className="w-2.5 h-2.5" />
                    {statusConfig.label}
                </span>

                {/* Assignee */}
                {task.assignedToName && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        <User className="w-2.5 h-2.5" />
                        {task.assignedToName.split(' ')[0]}
                    </span>
                )}

                {/* Due date */}
                {task.dueDate && (
                    <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full",
                        overdue
                            ? "text-red-600 bg-red-50 border border-red-200 font-semibold"
                            : "text-slate-500 bg-slate-50 border border-slate-100"
                    )}>
                        <Calendar className="w-2.5 h-2.5" />
                        {overdue ? 'Vencida ' : ''}{formatDate(task.dueDate)}
                    </span>
                )}

                {/* Notes count */}
                {(task.notes?.length > 0) && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 ml-auto">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {task.notes.length}
                    </span>
                )}
            </div>
        </motion.div>
    );
}

// ── Task Detail Panel ─────────────────────────────────────────────────────────
function TaskDetailPanel({ task, onClose, canEdit }) {
    const { updateTaskStatus, updateTask, deleteTask, addNote, deleteNote, addCollaborator, removeCollaborator } = useTasks();
    const { user, users } = useAuth();
    const [noteText, setNoteText] = useState('');
    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [showCollabPicker, setShowCollabPicker] = useState(false);
    const [collabSearch, setCollabSearch] = useState('');

    const statusConfig = getStatusConfig(task.status);
    const priorityConfig = getPriorityConfig(task.priority);
    const overdue = isOverdue(task.dueDate, task.status);

    const handleStatusChange = (newStatus) => updateTaskStatus(task.id, newStatus);

    const handleSendNote = async () => {
        if (!noteText.trim()) return;
        await addNote(task.id, noteText.trim());
        setNoteText('');
    };

    const handleEditSave = async (field) => {
        if (!editValue.trim() && field !== 'dueDate') return;
        await updateTask(task.id, { [field]: editValue || null });
        setEditingField(null);
    };

    const startEdit = (field, current) => {
        setEditingField(field);
        setEditValue(current || '');
    };

    const isOwner = task.createdBy === user?.uid;
    const isAssignee = task.assignedTo === user?.uid;
    const isCollaborator = (task.collaborators || []).some(c => c.id === user?.uid);
    const canModify = canEdit || isOwner || isAssignee || isCollaborator;

    const collaboratorIds = new Set([
        task.assignedTo,
        task.createdBy,
        ...(task.collaborators || []).map(c => c.id),
    ].filter(Boolean));

    const availableToAdd = users.filter(u =>
        !collaboratorIds.has(u.id) &&
        u.role !== ROLES.SUPER_ADMIN &&
        u.role !== ROLES.PRINTER &&
        normalizeText(u.name).includes(normalizeText(collabSearch))
    );

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            {editingField === 'title' ? (
                                <div className="flex gap-2">
                                    <input
                                        autoFocus
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleEditSave('title'); if (e.key === 'Escape') setEditingField(null); }}
                                        className="flex-1 text-lg font-bold border-b-2 border-indigo-400 outline-none bg-transparent"
                                    />
                                    <button onClick={() => handleEditSave('title')} className="text-indigo-600"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingField(null)} className="text-slate-400"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group/title">
                                    <h2 className={cn("text-lg font-bold text-slate-800", task.status === 'done' && "line-through text-slate-400")}>
                                        {task.title}
                                    </h2>
                                    {canModify && (
                                        <button onClick={() => startEdit('title', task.title)} className="opacity-0 group-hover/title:opacity-100 transition-opacity">
                                            <Pencil className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                                Creada por <span className="font-medium text-slate-600">{task.createdByName}</span>
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    {/* Status + Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Estado</label>
                            {canModify ? (
                                <select
                                    value={task.status}
                                    onChange={e => handleStatusChange(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-400 bg-white"
                                >
                                    {STATUSES.filter(s => s.key !== 'all').map(s => (
                                        <option key={s.key} value={s.key}>{s.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border",
                                    statusConfig.bg, statusConfig.color, statusConfig.border
                                )}>
                                    {statusConfig.label}
                                </span>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Prioridad</label>
                            {canModify ? (
                                <select
                                    value={task.priority}
                                    onChange={e => updateTask(task.id, { priority: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-400 bg-white"
                                >
                                    {PRIORITIES.map(p => (
                                        <option key={p.key} value={p.key}>{p.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className={cn("inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold", priorityConfig.bg, priorityConfig.color)}>
                                    <Flag className="w-3.5 h-3.5" />{priorityConfig.label}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Assignee */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Asignada a</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                {task.assignedToName ? getInitials(task.assignedToName) : '?'}
                            </div>
                            <span className="text-sm font-medium text-slate-700">{task.assignedToName || 'Sin asignar'}</span>
                        </div>
                    </div>

                    {/* Collaborators */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            Colaboradores
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {(task.collaborators || []).map(c => (
                                <div key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-medium text-indigo-700">
                                    <span className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-[9px] font-bold">{getInitials(c.name)}</span>
                                    {c.name.split(' ')[0]}
                                    {canEdit && (
                                        <button onClick={() => removeCollaborator(task.id, c.id)} className="text-indigo-400 hover:text-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {(task.collaborators || []).length === 0 && (
                                <span className="text-xs text-slate-400 italic">Sin colaboradores</span>
                            )}
                        </div>
                        {canEdit && (
                            <div className="relative">
                                <button
                                    onClick={() => { setShowCollabPicker(v => !v); setCollabSearch(''); }}
                                    className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    Agregar colaborador
                                </button>
                                {showCollabPicker && (
                                    <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                                        <div className="p-2 border-b border-slate-100">
                                            <input
                                                autoFocus
                                                value={collabSearch}
                                                onChange={e => setCollabSearch(e.target.value)}
                                                placeholder="Buscar…"
                                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400"
                                            />
                                        </div>
                                        <div className="max-h-40 overflow-y-auto">
                                            {availableToAdd.length > 0 ? availableToAdd.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => { addCollaborator(task.id, u); setShowCollabPicker(false); setCollabSearch(''); }}
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 transition-colors flex items-center gap-2"
                                                >
                                                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600">{getInitials(u.name)}</span>
                                                    {u.name}
                                                </button>
                                            )) : (
                                                <p className="px-3 py-2 text-xs text-slate-400">No hay más usuarios</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Due date */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Fecha límite</label>
                        {canModify ? (
                            <input
                                type="date"
                                value={task.dueDate || ''}
                                onChange={e => updateTask(task.id, { dueDate: e.target.value || null })}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                            />
                        ) : (
                            <span className={cn(
                                "text-sm font-medium",
                                overdue ? "text-red-600" : "text-slate-700"
                            )}>
                                {task.dueDate ? formatDate(task.dueDate) : 'Sin fecha'}
                                {overdue && ' (Vencida)'}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Descripción</label>
                        {editingField === 'description' ? (
                            <div className="space-y-2">
                                <textarea
                                    autoFocus
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-sm focus:outline-none bg-white resize-none"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditSave('description')} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
                                        <Check className="w-3 h-3" /> Guardar
                                    </button>
                                    <button onClick={() => setEditingField(null)} className="px-3 py-1.5 text-slate-500 text-xs">Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={cn("group/desc min-h-[40px] text-sm rounded-xl px-3 py-2 bg-slate-50 border border-slate-100", canModify && "cursor-pointer hover:border-indigo-200")}
                                onClick={() => canModify && startEdit('description', task.description)}
                            >
                                {task.description
                                    ? <p className="text-slate-700 whitespace-pre-wrap">{task.description}</p>
                                    : <p className="text-slate-400 italic">{canModify ? 'Clic para agregar descripción…' : 'Sin descripción'}</p>
                                }
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 mb-2 block flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Notas {task.notes?.length > 0 && `(${task.notes.length})`}
                        </label>

                        {/* Existing notes */}
                        <div className="space-y-2 mb-3">
                            {(task.notes || []).map(note => (
                                <div key={note.id} className="group/note bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-semibold text-indigo-600">{note.authorName}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(note.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {(note.authorId === user?.uid || canEdit) && (
                                                <button
                                                    onClick={() => deleteNote(task.id, note.id)}
                                                    className="opacity-0 group-hover/note:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{note.text}</p>
                                </div>
                            ))}
                        </div>

                        {/* Add note */}
                        <div className="flex gap-2">
                            <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendNote(); } }}
                                placeholder="Agregar nota… (Enter para enviar)"
                                rows={2}
                                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 resize-none bg-white"
                            />
                            <button
                                onClick={handleSendNote}
                                disabled={!noteText.trim()}
                                className="self-end p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer actions */}
                {(canEdit || isOwner) && (
                    <div className="px-6 py-4 border-t border-slate-100">
                        <button
                            onClick={() => { if (confirm('¿Eliminar esta tarea?')) { deleteTask(task.id); onClose(); } }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 border border-red-100 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Eliminar tarea
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// ── Create Task Modal ─────────────────────────────────────────────────────────
function CreateTaskModal({ onClose, users }) {
    const { addTask } = useTasks();
    const { user: currentUser } = useAuth();
    const [form, setForm] = useState({
        title: '',
        description: '',
        assignedTo: '',
        priority: 'normal',
        dueDate: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!form.title.trim()) return;
        setSubmitting(true);
        const assignee = users.find(u => u.id === form.assignedTo);
        const ok = await addTask({
            title: form.title,
            description: form.description,
            assignedTo: assignee?.id || null,
            assignedToName: assignee?.name || null,
            priority: form.priority,
            dueDate: form.dueDate || null,
        });
        setSubmitting(false);
        if (ok) onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Plus className="w-5 h-5 text-indigo-700" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Nueva Tarea</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Título *</label>
                        <input
                            autoFocus
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="¿Qué hay que hacer?"
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none text-sm"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Detalles adicionales…"
                            rows={3}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none text-sm resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Asignar a</label>
                            <select
                                value={form.assignedTo}
                                onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm bg-white"
                            >
                                <option value="">Sin asignar</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Prioridad</label>
                            <select
                                value={form.priority}
                                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm bg-white"
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p.key} value={p.key}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Fecha límite</label>
                        <input
                            type="date"
                            value={form.dueDate}
                            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-400 focus:outline-none text-sm bg-white"
                        />
                    </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!form.title.trim() || submitting}
                        className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Crear Tarea
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ── Main View ─────────────────────────────────────────────────────────────────
export default function TasksView() {
    const { tasks } = useTasks();
    const { user, users, canEdit } = useAuth();
    const userCanEdit = canEdit();

    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [mineOnly, setMineOnly] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    const relevantUsers = users.filter(u => u.role !== ROLES.SUPER_ADMIN && u.role !== ROLES.PRINTER);

    const filtered = tasks.filter(t => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (mineOnly && t.assignedTo !== user?.uid && t.createdBy !== user?.uid) return false;
        if (search && !normalizeText(t.title).includes(normalizeText(search)) &&
            !normalizeText(t.assignedToName || '').includes(normalizeText(search))) return false;
        return true;
    });

    // Counts per status
    const counts = tasks.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
    }, {});

    // Keep selected task in sync
    const liveSelectedTask = selectedTask ? tasks.find(t => t.id === selectedTask.id) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-300/50">
                            <ClipboardList className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-light text-slate-900 tracking-tight">Tareas</h1>
                            <p className="text-slate-500 text-sm mt-0.5">Gestión de trabajo del equipo</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-300/40 hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Tarea
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar tarea o persona…"
                            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 focus:outline-none text-sm"
                        />
                    </div>
                    {/* Mine toggle */}
                    <button
                        onClick={() => setMineOnly(v => !v)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                            mineOnly
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        <User className="w-4 h-4" />
                        Mis tareas
                    </button>
                </div>

                {/* Status tabs */}
                <div className="flex gap-1 mb-6 bg-slate-100/80 p-1 rounded-2xl w-fit flex-wrap">
                    {STATUSES.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setStatusFilter(s.key)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                                statusFilter === s.key
                                    ? "bg-white text-indigo-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {s.label}
                            {s.key !== 'all' && counts[s.key] > 0 && (
                                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                                    {counts[s.key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tasks grid */}
                {filtered.length > 0 ? (
                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filtered.map(task => (
                                <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium">No hay tareas{statusFilter !== 'all' ? ' con este estado' : ''}</p>
                        <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-indigo-600 hover:underline">
                            Crear la primera tarea
                        </button>
                    </div>
                )}
            </div>

            {/* Detail Panel */}
            <AnimatePresence>
                {liveSelectedTask && (
                    <TaskDetailPanel
                        task={liveSelectedTask}
                        onClose={() => setSelectedTask(null)}
                        canEdit={userCanEdit}
                    />
                )}
            </AnimatePresence>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <CreateTaskModal onClose={() => setShowCreate(false)} users={relevantUsers} />
                )}
            </AnimatePresence>
        </div>
    );
}
