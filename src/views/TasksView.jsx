import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList, Plus, Search, X, Check, Clock, AlertCircle,
    ChevronDown, Trash2, User, Calendar, Flag, MessageSquare,
    Circle, CheckCircle2, Ban, Send, Pencil, UserPlus, Users,
    Workflow, LayoutGrid, Pencil as PencilIcon, ListChecks,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTasks } from '../context/TasksContext';
import { useWorkshops } from '../context/WorkshopsContext';
import { useAuth, getRoleLabel, ROLES } from '../context/AuthContext';
import WorkshopCanvas, { NODE_COLORS } from './WorkshopCanvas';

const STATUSES = [
    { key: 'all',         label: 'Todas' },
    { key: 'pending',     label: 'Pendiente',   icon: Circle,       color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-200' },
    { key: 'in_progress', label: 'En progreso', icon: Clock,        color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200' },
    { key: 'done',        label: 'Completada',  icon: CheckCircle2, color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { key: 'cancelled',   label: 'Cancelada',   icon: Ban,          color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-200' },
];

const PRIORITIES = [
    { key: 'low',    label: 'Baja',    color: 'text-slate-500',  bg: 'bg-slate-100' },
    { key: 'normal', label: 'Normal',  color: 'text-blue-600',   bg: 'bg-blue-50' },
    { key: 'high',   label: 'Alta',    color: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'urgent', label: 'Urgente', color: 'text-red-600',    bg: 'bg-red-50' },
];

const getStatusConfig   = (key) => STATUSES.find(s => s.key === key)   || STATUSES[1];
const getPriorityConfig = (key) => PRIORITIES.find(p => p.key === key) || PRIORITIES[1];

const normalizeText = (t) => t?.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';

const formatDate = (d) => {
    if (!d) return null;
    return new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
};

const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'done' || status === 'cancelled') return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(dueDate + 'T00:00:00') < today;
};

function getInitials(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onClick }) {
    const statusConfig  = getStatusConfig(task.status);
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
            className="bg-white rounded-3xl border border-eyr-outline-variant/20 p-5 shadow-sm hover:shadow-lg hover:border-eyr-primary/30 transition-all cursor-pointer group"
        >
            {/* Priority badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className={cn(
                    "text-sm font-bold text-eyr-on-surface leading-snug flex-1 group-hover:text-eyr-primary transition-colors",
                    task.status === 'done' && "line-through text-eyr-on-variant"
                )}>
                    {task.title}
                </h3>
                <span className={cn(
                    "shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                    priorityConfig.bg, priorityConfig.color
                )}>
                    <Flag className="w-2.5 h-2.5" />
                    {priorityConfig.label}
                </span>
            </div>

            {task.description && (
                <p className="text-xs text-eyr-on-variant mb-3 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                    statusConfig.bg, statusConfig.color, statusConfig.border
                )}>
                    <StatusIcon className="w-2.5 h-2.5" />
                    {statusConfig.label}
                </span>

                {task.assignedToName && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-eyr-on-variant bg-eyr-surface-low border border-eyr-outline-variant/20 px-2.5 py-0.5 rounded-full">
                        <User className="w-2.5 h-2.5" />
                        {task.assignedToName.split(' ')[0]}
                    </span>
                )}

                {task.dueDate && (
                    <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full",
                        overdue
                            ? "text-red-600 bg-red-50 border border-red-200 font-semibold"
                            : "text-eyr-on-variant bg-eyr-surface-low border border-eyr-outline-variant/20"
                    )}>
                        <Calendar className="w-2.5 h-2.5" />
                        {overdue ? 'Vencida ' : ''}{formatDate(task.dueDate)}
                    </span>
                )}

                {(task.notes?.length > 0) && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-eyr-on-variant ml-auto">
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

    const statusConfig   = getStatusConfig(task.status);
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

    const isOwner        = task.createdBy === user?.uid;
    const isAssignee     = task.assignedTo === user?.uid;
    const isCollaborator = (task.collaborators || []).some(c => c.id === user?.uid);
    const canModify      = canEdit || isOwner || isAssignee || isCollaborator;

    const collaboratorIds = new Set([
        task.assignedTo, task.createdBy,
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
                <div className="px-6 pt-6 pb-4 border-b border-eyr-outline-variant/20">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            {editingField === 'title' ? (
                                <div className="flex gap-2">
                                    <input
                                        autoFocus
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleEditSave('title'); if (e.key === 'Escape') setEditingField(null); }}
                                        className="flex-1 text-lg font-bold border-b-2 border-eyr-primary outline-none bg-transparent"
                                    />
                                    <button onClick={() => handleEditSave('title')} className="text-eyr-primary"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingField(null)} className="text-eyr-on-variant"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group/title">
                                    <h2 className={cn("text-lg font-bold text-eyr-on-surface", task.status === 'done' && "line-through text-eyr-on-variant")}>
                                        {task.title}
                                    </h2>
                                    {canModify && (
                                        <button onClick={() => startEdit('title', task.title)} className="opacity-0 group-hover/title:opacity-100 transition-opacity">
                                            <Pencil className="w-3.5 h-3.5 text-eyr-on-variant hover:text-eyr-primary" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-eyr-on-variant mt-1">
                                Creada por <span className="font-medium text-eyr-on-surface">{task.createdByName}</span>
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-eyr-surface-low transition-colors">
                            <X className="w-5 h-5 text-eyr-on-variant" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    {/* Status + Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 block">Estado</label>
                            {canModify ? (
                                <select
                                    value={task.status}
                                    onChange={e => handleStatusChange(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-eyr-outline-variant/30 text-sm font-medium focus:outline-none focus:border-eyr-primary bg-white"
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
                            <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 block">Prioridad</label>
                            {canModify ? (
                                <select
                                    value={task.priority}
                                    onChange={e => updateTask(task.id, { priority: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-eyr-outline-variant/30 text-sm font-medium focus:outline-none focus:border-eyr-primary bg-white"
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
                        <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 block">Asignada a</label>
                        <div className="flex items-center gap-2 px-3 py-2 bg-eyr-surface-low rounded-xl border border-eyr-outline-variant/20">
                            <div className="w-7 h-7 rounded-lg bg-eyr-primary-container/40 flex items-center justify-center text-xs font-bold text-eyr-primary">
                                {task.assignedToName ? getInitials(task.assignedToName) : '?'}
                            </div>
                            <span className="text-sm font-medium text-eyr-on-surface">{task.assignedToName || 'Sin asignar'}</span>
                        </div>
                    </div>

                    {/* Collaborators */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            Colaboradores
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {(task.collaborators || []).map(c => (
                                <div key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-eyr-primary-container/30 border border-eyr-primary/20 rounded-full text-xs font-medium text-eyr-primary">
                                    <span className="w-4 h-4 rounded-full bg-eyr-primary/20 flex items-center justify-center text-[9px] font-bold">{getInitials(c.name)}</span>
                                    {c.name.split(' ')[0]}
                                    {canEdit && (
                                        <button onClick={() => removeCollaborator(task.id, c.id)} className="text-eyr-primary/60 hover:text-red-500 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {(task.collaborators || []).length === 0 && (
                                <span className="text-xs text-eyr-on-variant italic">Sin colaboradores</span>
                            )}
                        </div>
                        {canEdit && (
                            <div className="relative">
                                <button
                                    onClick={() => { setShowCollabPicker(v => !v); setCollabSearch(''); }}
                                    className="flex items-center gap-1.5 text-xs text-eyr-primary hover:opacity-80 font-medium"
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    Agregar colaborador
                                </button>
                                {showCollabPicker && (
                                    <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-eyr-outline-variant/20 overflow-hidden">
                                        <div className="p-2 border-b border-eyr-outline-variant/10">
                                            <input
                                                autoFocus
                                                value={collabSearch}
                                                onChange={e => setCollabSearch(e.target.value)}
                                                placeholder="Buscar…"
                                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-eyr-outline-variant/30 focus:outline-none focus:border-eyr-primary"
                                            />
                                        </div>
                                        <div className="max-h-40 overflow-y-auto">
                                            {availableToAdd.length > 0 ? availableToAdd.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => { addCollaborator(task.id, u); setShowCollabPicker(false); setCollabSearch(''); }}
                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-eyr-surface-low transition-colors flex items-center gap-2"
                                                >
                                                    <span className="w-5 h-5 rounded-full bg-eyr-surface-high flex items-center justify-center text-[9px] font-bold text-eyr-on-variant">{getInitials(u.name)}</span>
                                                    {u.name}
                                                </button>
                                            )) : (
                                                <p className="px-3 py-2 text-xs text-eyr-on-variant">No hay más usuarios</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Due date */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 block">Fecha límite</label>
                        {canModify ? (
                            <input
                                type="date"
                                value={task.dueDate || ''}
                                onChange={e => updateTask(task.id, { dueDate: e.target.value || null })}
                                className="w-full px-3 py-2 rounded-xl border border-eyr-outline-variant/30 text-sm focus:outline-none focus:border-eyr-primary bg-white"
                            />
                        ) : (
                            <span className={cn("text-sm font-medium", overdue ? "text-red-600" : "text-eyr-on-surface")}>
                                {task.dueDate ? formatDate(task.dueDate) : 'Sin fecha'}
                                {overdue && ' (Vencida)'}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 block">Descripción</label>
                        {editingField === 'description' ? (
                            <div className="space-y-2">
                                <textarea
                                    autoFocus
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-xl border border-eyr-primary/30 text-sm focus:outline-none bg-white resize-none"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditSave('description')} className="flex items-center gap-1 px-3 py-1.5 bg-eyr-primary text-white rounded-lg text-xs font-semibold">
                                        <Check className="w-3 h-3" /> Guardar
                                    </button>
                                    <button onClick={() => setEditingField(null)} className="px-3 py-1.5 text-eyr-on-variant text-xs">Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={cn("group/desc min-h-[40px] text-sm rounded-xl px-3 py-2 bg-eyr-surface-low border border-eyr-outline-variant/10", canModify && "cursor-pointer hover:border-eyr-primary/30")}
                                onClick={() => canModify && startEdit('description', task.description)}
                            >
                                {task.description
                                    ? <p className="text-eyr-on-surface whitespace-pre-wrap">{task.description}</p>
                                    : <p className="text-eyr-on-variant italic">{canModify ? 'Clic para agregar descripción…' : 'Sin descripción'}</p>
                                }
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant mb-2 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Notas {task.notes?.length > 0 && `(${task.notes.length})`}
                        </label>
                        <div className="space-y-2 mb-3">
                            {(task.notes || []).map(note => (
                                <div key={note.id} className="group/note bg-eyr-surface-low rounded-xl px-3 py-2.5 border border-eyr-outline-variant/10">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-semibold text-eyr-primary">{note.authorName}</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-eyr-on-variant">
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
                                    <p className="text-xs text-eyr-on-surface whitespace-pre-wrap">{note.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendNote(); } }}
                                placeholder="Agregar nota… (Enter para enviar)"
                                rows={2}
                                className="flex-1 px-3 py-2 rounded-xl border border-eyr-outline-variant/30 text-sm focus:outline-none focus:border-eyr-primary resize-none bg-white"
                            />
                            <button
                                onClick={handleSendNote}
                                disabled={!noteText.trim()}
                                className="self-end p-2.5 rounded-xl bg-eyr-primary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                {(canEdit || isOwner) && (
                    <div className="px-6 py-4 border-t border-eyr-outline-variant/10">
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
        title: '', description: '', assignedTo: '', priority: 'normal', dueDate: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!form.title.trim()) return;
        setSubmitting(true);
        const assignee = users.find(u => u.id === form.assignedTo);
        const ok = await addTask({
            title:          form.title,
            description:    form.description,
            assignedTo:     assignee?.id     || null,
            assignedToName: assignee?.name   || null,
            priority:       form.priority,
            dueDate:        form.dueDate     || null,
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
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-eyr-outline-variant/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-eyr-primary-container/40 rounded-xl flex items-center justify-center">
                            <Plus className="w-5 h-5 text-eyr-primary" />
                        </div>
                        <h2 className="text-lg font-bold text-eyr-on-surface">Nueva Tarea</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-eyr-surface-low rounded-xl transition-colors">
                        <X className="w-5 h-5 text-eyr-on-variant" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 block">Título *</label>
                        <input
                            autoFocus
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="¿Qué hay que hacer?"
                            className="w-full px-4 py-3 rounded-2xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 block">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Detalles adicionales…"
                            rows={3}
                            className="w-full px-4 py-3 rounded-2xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none text-sm resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 block">Asignar a</label>
                            <select
                                value={form.assignedTo}
                                onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:outline-none text-sm bg-white"
                            >
                                <option value="">Sin asignar</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 block">Prioridad</label>
                            <select
                                value={form.priority}
                                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:outline-none text-sm bg-white"
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p.key} value={p.key}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-eyr-on-variant mb-1.5 block">Fecha límite</label>
                        <input
                            type="date"
                            value={form.dueDate}
                            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:outline-none text-sm bg-white"
                        />
                    </div>
                </div>

                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-eyr-outline-variant/30 text-sm font-semibold text-eyr-on-variant hover:bg-eyr-surface-low transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!form.title.trim() || submitting}
                        className="flex-1 py-3 rounded-2xl bg-eyr-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
    const { tasks }    = useTasks();
    const { workshops, createWorkshop, saveWorkshop, renameWorkshop, deleteWorkshop } = useWorkshops();
    const { user, users, canEdit } = useAuth();
    const userCanEdit = canEdit();

    const [mainTab,      setMainTab]      = useState('tareas'); // 'tareas' | 'workshop'
    const [statusFilter, setStatusFilter] = useState('all');
    const [search,       setSearch]       = useState('');
    const [mineOnly,     setMineOnly]     = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showCreate,   setShowCreate]   = useState(false);

    const [activeWorkshop,  setActiveWorkshop]  = useState(null);
    const [newDiagramTitle, setNewDiagramTitle] = useState('');
    const [showNewDiagram,  setShowNewDiagram]  = useState(false);
    const [renamingId,      setRenamingId]      = useState(null);
    const [renameValue,     setRenameValue]     = useState('');

    const relevantUsers = users.filter(u => u.role !== ROLES.SUPER_ADMIN && u.role !== ROLES.PRINTER);

    const filtered = tasks.filter(t => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (mineOnly && t.assignedTo !== user?.uid && t.createdBy !== user?.uid) return false;
        if (search && !normalizeText(t.title).includes(normalizeText(search)) &&
            !normalizeText(t.assignedToName || '').includes(normalizeText(search))) return false;
        return true;
    });

    const counts = tasks.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
    }, {});

    const totalOverdue = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;

    const liveSelectedTask = selectedTask ? tasks.find(t => t.id === selectedTask.id) : null;

    const handleCreateWorkshop = async () => {
        if (!newDiagramTitle.trim()) return;
        const created = await createWorkshop(newDiagramTitle.trim());
        if (created) { setActiveWorkshop(created); setShowNewDiagram(false); setNewDiagramTitle(''); }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-eyr-primary-container/40 rounded-xl">
                        <ListChecks className="w-6 h-6 text-eyr-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-eyr-on-surface font-headline">Tareas</h1>
                        <p className="text-sm text-eyr-on-variant">Gestión de trabajo del equipo</p>
                    </div>
                </div>
                {mainTab === 'tareas' && (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-eyr-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Nueva Tarea
                    </button>
                )}
                {mainTab === 'workshop' && !activeWorkshop && (
                    <button
                        onClick={() => setShowNewDiagram(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-eyr-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Diagrama
                    </button>
                )}
            </div>

            {/* ── Bento KPIs ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#e0e7ff] p-6 rounded-3xl flex flex-col justify-between h-36 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <ListChecks className="w-5 h-5 text-indigo-600" />
                        </div>
                        <span className="text-xs font-bold text-indigo-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Total</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-indigo-900">{tasks.length}</p>
                        <p className="text-indigo-700 font-semibold">Tareas</p>
                    </div>
                </div>
                <div className="bg-[#fef3c7] p-6 rounded-3xl flex flex-col justify-between h-36 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <Circle className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Pendiente</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-amber-900">{counts.pending || 0}</p>
                        <p className="text-amber-700 font-semibold">Sin iniciar</p>
                    </div>
                </div>
                <div className="bg-[#e0f2fe] p-6 rounded-3xl flex flex-col justify-between h-36 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <Clock className="w-5 h-5 text-sky-600" />
                        </div>
                        <span className="text-xs font-bold text-sky-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">En progreso</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-sky-900">{counts.in_progress || 0}</p>
                        <p className="text-sky-700 font-semibold">En curso</p>
                    </div>
                </div>
                <div className="bg-[#d1fae5] p-6 rounded-3xl flex flex-col justify-between h-36 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-white/60 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-white/60 px-2 py-1 rounded-full uppercase tracking-wider">Listo</span>
                    </div>
                    <div>
                        <p className="text-4xl font-extrabold text-emerald-900">{counts.done || 0}</p>
                        <p className="text-emerald-700 font-semibold">Completadas</p>
                    </div>
                </div>
            </div>

            {/* ── Main tabs ── */}
            <div className="bg-eyr-surface-high rounded-xl p-1 w-fit flex gap-0.5">
                <button
                    onClick={() => setMainTab('tareas')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                        mainTab === 'tareas' ? "bg-white text-eyr-on-surface shadow-sm" : "text-eyr-on-variant hover:text-eyr-on-surface"
                    )}
                >
                    <LayoutGrid className="w-4 h-4" />
                    Tareas
                    {tasks.length > 0 && (
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                            mainTab === 'tareas' ? "bg-eyr-surface-high text-eyr-on-variant" : "bg-eyr-surface-low text-eyr-on-variant"
                        )}>{tasks.length}</span>
                    )}
                </button>
                <button
                    onClick={() => setMainTab('workshop')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all",
                        mainTab === 'workshop' ? "bg-white text-eyr-on-surface shadow-sm" : "text-eyr-on-variant hover:text-eyr-on-surface"
                    )}
                >
                    <Workflow className="w-4 h-4" />
                    Workshop
                    {workshops.length > 0 && (
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                            mainTab === 'workshop' ? "bg-eyr-surface-high text-eyr-on-variant" : "bg-eyr-surface-low text-eyr-on-variant"
                        )}>{workshops.length}</span>
                    )}
                </button>
            </div>

            {/* ══ TAREAS TAB ══ */}
            {mainTab === 'tareas' && (
                <>
                    {/* Search + mine toggle */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-eyr-on-variant" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar tarea o persona…"
                                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-eyr-outline-variant/30 focus:border-eyr-primary focus:ring-4 focus:ring-eyr-primary/10 focus:outline-none text-sm"
                            />
                        </div>
                        <button
                            onClick={() => setMineOnly(v => !v)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
                                mineOnly
                                    ? "bg-eyr-primary-container/30 text-eyr-primary border-eyr-primary/30"
                                    : "bg-white text-eyr-on-variant border-eyr-outline-variant/30 hover:bg-eyr-surface-low"
                            )}
                        >
                            <User className="w-4 h-4" />
                            Mis tareas
                        </button>
                    </div>

                    {/* Status tabs */}
                    <div className="bg-eyr-surface-high rounded-xl p-1 w-fit flex flex-wrap gap-0.5">
                        {STATUSES.map(s => (
                            <button
                                key={s.key}
                                onClick={() => setStatusFilter(s.key)}
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                    statusFilter === s.key
                                        ? "bg-white text-eyr-on-surface shadow-sm"
                                        : "text-eyr-on-variant hover:text-eyr-on-surface"
                                )}
                            >
                                {s.label}
                                {s.key !== 'all' && counts[s.key] > 0 && (
                                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                        statusFilter === s.key ? "bg-eyr-surface-high text-eyr-on-variant" : "bg-eyr-surface-low text-eyr-on-variant"
                                    )}>{counts[s.key]}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    {filtered.length > 0 ? (
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filtered.map(task => (
                                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-eyr-on-variant">
                            <ClipboardList className="w-12 h-12 opacity-20" />
                            <p className="font-semibold">No hay tareas{statusFilter !== 'all' ? ' con este estado' : ''}</p>
                            <button onClick={() => setShowCreate(true)} className="text-sm text-eyr-primary hover:underline font-medium">
                                Crear la primera tarea
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ══ WORKSHOP TAB ══ */}
            {mainTab === 'workshop' && (
                activeWorkshop ? (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <button
                                onClick={() => setActiveWorkshop(null)}
                                className="text-xs text-eyr-primary hover:underline font-medium"
                            >
                                ← Diagramas
                            </button>
                            <span className="text-eyr-on-variant/40">·</span>
                            <span className="text-xs font-semibold text-eyr-on-surface">{activeWorkshop.title}</span>
                        </div>
                        <div
                            className="rounded-3xl overflow-hidden border border-eyr-outline-variant/20 shadow-sm"
                            style={{ height: 'calc(100vh - 240px)' }}
                        >
                            <WorkshopCanvas
                                workshop={activeWorkshop}
                                onSave={(nodes, edges) => saveWorkshop(activeWorkshop.id, nodes, edges)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {workshops.length === 0 && !showNewDiagram ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 text-eyr-on-variant">
                                <Workflow className="w-12 h-12 opacity-20" />
                                <p className="font-semibold">No hay diagramas todavía</p>
                                <button onClick={() => setShowNewDiagram(true)} className="text-sm text-eyr-primary hover:underline font-medium">
                                    Crear el primer diagrama
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {workshops.map(w => (
                                    <motion.div
                                        key={w.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-3xl border border-eyr-outline-variant/20 shadow-sm hover:shadow-lg hover:border-eyr-primary/30 transition-all group"
                                    >
                                        <button onClick={() => setActiveWorkshop(w)} className="w-full p-5 text-left">
                                            <div className="w-full h-28 bg-eyr-surface-low rounded-2xl border border-eyr-outline-variant/10 mb-3 flex items-center justify-center overflow-hidden">
                                                {w.nodes?.length > 0 ? (
                                                    <div className="relative w-full h-full">
                                                        {w.nodes.slice(0, 6).map((n, i) => {
                                                            const color = NODE_COLORS[n.data?.colorIdx ?? 0];
                                                            return (
                                                                <div
                                                                    key={n.id}
                                                                    className="absolute text-[8px] font-semibold px-2 py-1 rounded-lg border truncate max-w-[80px]"
                                                                    style={{
                                                                        left: `${(i % 3) * 33 + 5}%`,
                                                                        top:  `${Math.floor(i / 3) * 50 + 10}%`,
                                                                        background:   color.bg,
                                                                        borderColor:  color.border,
                                                                        color:        color.text,
                                                                    }}
                                                                >
                                                                    {n.data?.label}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <Workflow className="w-8 h-8 text-eyr-on-variant/20" />
                                                )}
                                            </div>
                                            <h3 className="text-sm font-bold text-eyr-on-surface group-hover:text-eyr-primary transition-colors truncate">
                                                {w.title}
                                            </h3>
                                            <p className="text-xs text-eyr-on-variant mt-0.5">
                                                {w.nodes?.length || 0} nodo{w.nodes?.length !== 1 ? 's' : ''} · {w.edges?.length || 0} conexión{w.edges?.length !== 1 ? 'es' : ''}
                                            </p>
                                        </button>
                                        {userCanEdit && (
                                            <div className="flex items-center gap-1 px-5 pb-4">
                                                {renamingId === w.id ? (
                                                    <div className="flex items-center gap-1 flex-1">
                                                        <input
                                                            autoFocus
                                                            value={renameValue}
                                                            onChange={e => setRenameValue(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') { renameWorkshop(w.id, renameValue); setRenamingId(null); }
                                                                if (e.key === 'Escape') setRenamingId(null);
                                                            }}
                                                            className="flex-1 text-xs px-2 py-1 rounded-lg border border-eyr-primary/30 focus:outline-none"
                                                        />
                                                        <button onClick={() => { renameWorkshop(w.id, renameValue); setRenamingId(null); }} className="text-eyr-primary"><Check className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => setRenamingId(null)} className="text-eyr-on-variant"><X className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => { setRenamingId(w.id); setRenameValue(w.title); }}
                                                            className="text-xs text-eyr-on-variant hover:text-eyr-primary flex items-center gap-1 transition-colors"
                                                        >
                                                            <PencilIcon className="w-3 h-3" /> Renombrar
                                                        </button>
                                                        <span className="text-eyr-on-variant/20 mx-1">·</span>
                                                        <button
                                                            onClick={() => { if (confirm('¿Eliminar diagrama?')) deleteWorkshop(w.id); }}
                                                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {showNewDiagram && (
                            <div className="bg-white rounded-3xl border border-eyr-primary/20 shadow-sm p-5 max-w-sm">
                                <p className="text-sm font-bold text-eyr-on-surface mb-3">Nombre del diagrama</p>
                                <input
                                    autoFocus
                                    value={newDiagramTitle}
                                    onChange={e => setNewDiagramTitle(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleCreateWorkshop(); if (e.key === 'Escape') setShowNewDiagram(false); }}
                                    placeholder="Ej: Flujo de aprobaciones…"
                                    className="w-full px-4 py-2.5 rounded-xl border border-eyr-outline-variant/30 text-sm focus:border-eyr-primary focus:outline-none mb-3"
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleCreateWorkshop} disabled={!newDiagramTitle.trim()} className="flex-1 py-2 bg-eyr-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all">
                                        Crear
                                    </button>
                                    <button onClick={() => setShowNewDiagram(false)} className="px-4 py-2 text-eyr-on-variant text-sm border border-eyr-outline-variant/30 rounded-xl hover:bg-eyr-surface-low transition-colors">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )
            )}

            {/* Overlays */}
            <AnimatePresence>
                {liveSelectedTask && (
                    <TaskDetailPanel
                        task={liveSelectedTask}
                        onClose={() => setSelectedTask(null)}
                        canEdit={userCanEdit}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showCreate && (
                    <CreateTaskModal onClose={() => setShowCreate(false)} users={relevantUsers} />
                )}
            </AnimatePresence>
        </div>
    );
}
