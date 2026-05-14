import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { validateRequiredString, validateUserId, sanitizeText, sanitizeName } from '../lib/validation';
import { useAuth } from './AuthContext';
import { FLAGS } from '../lib/featureFlags';
import { apiClient } from '../lib/apiClient';
import { getSocket } from '../lib/socket';

const TasksContext = createContext();
export const useTasks = () => useContext(TasksContext);

const normalizeTask = (t) => ({
    ...t,
    title: t.title ?? t.name ?? '',
    status: t.status ?? 'pending',
    createdBy: t.created_by ?? t.createdBy,
    createdByName: t.created_by_name ?? t.createdByName,
    createdAt: t.created_at ?? t.createdAt,
    dueDate: t.due_date ?? t.dueDate,
});

export const TasksProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const { user } = useAuth();

    const sortTasks = (list) => list.sort((a, b) => {
        const pOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        const pDiff = (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
        if (pDiff !== 0) return pDiff;
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime;
    });

    useEffect(() => {
        if (FLAGS.USE_NEW_API_TASKS) {
            let cancelled = false;
            apiClient.get('/tasks').then(data => {
                if (!cancelled) {
                    const normalized = data.map(normalizeTask);
                    console.log('Tasks normalizadas:', normalized);
                    setTasks(sortTasks(normalized));
                }
            }).catch(err => {
                console.error('Error cargando tasks:', err);
            });

            const socket = getSocket();
            const onCreated = (task) => setTasks(prev => sortTasks([...prev, normalizeTask(task)]));
            const onUpdated = (task) => setTasks(prev => sortTasks(prev.map(t => t.id === task.id ? normalizeTask(task) : t)));
            const onDeleted = ({ id }) => setTasks(prev => prev.filter(t => t.id !== id));

            socket?.on('tasks:created', onCreated);
            socket?.on('tasks:updated', onUpdated);
            socket?.on('tasks:deleted', onDeleted);

            return () => {
                cancelled = true;
                socket?.off('tasks:created', onCreated);
                socket?.off('tasks:updated', onUpdated);
                socket?.off('tasks:deleted', onDeleted);
            };
        }

        // Firebase original
        const unsubscribe = subscribeToCollection('tasks', (docs) => {
            setTasks(sortTasks(docs));
        });
        return () => unsubscribe();
    }, []);

    const addTask = React.useCallback(async ({ title, description, assignees, priority, dueDate }) => {
        validateRequiredString(title, 'título', 200);
        const safeAssignees = (assignees || []).map(a => {
            validateUserId(a.id);
            return { id: a.id, name: sanitizeName(a.name) };
        });

        try {
            if (FLAGS.USE_NEW_API_TASKS) {
                await apiClient.post('/tasks', {
                    title: sanitizeText(title),
                    description: description ? sanitizeText(description) : '',
                    assignees: safeAssignees,
                    priority: priority || 'normal',
                    due_date: dueDate || null,
                });
                const data = await apiClient.get('/tasks');
                setTasks(sortTasks(data.map(normalizeTask)));
            } else {
                const newTask = {
                    title: sanitizeText(title),
                    description: description ? sanitizeText(description) : '',
                    assignees: safeAssignees,
                    createdBy: user.uid,
                    createdByName: sanitizeName(user.displayName || user.email),
                    status: 'pending',
                    priority: priority || 'normal',
                    dueDate: dueDate || null,
                    notes: [],
                };
                await createDocument('tasks', newTask);
            }
            toast.success('Tarea creada');
            return true;
        } catch (error) {
            console.error('Error creando tarea:', error);
            toast.error('Error al crear tarea');
            return false;
        }
    }, [user]);

    const updateTaskStatus = React.useCallback(async (taskId, status) => {
        try {
            if (FLAGS.USE_NEW_API_TASKS) {
                await apiClient.patch(`/tasks/${taskId}`, { status });
            } else {
                await updateDocument('tasks', taskId, { status });
            }
        } catch (error) {
            console.error('Error actualizando estado:', error);
            toast.error('Error al actualizar estado');
        }
    }, []);

    const updateTask = React.useCallback(async (taskId, updates) => {
        try {
            if (FLAGS.USE_NEW_API_TASKS) {
                await apiClient.patch(`/tasks/${taskId}`, updates);
            } else {
                await updateDocument('tasks', taskId, updates);
            }
            toast.success('Tarea actualizada');
        } catch (error) {
            console.error('Error actualizando tarea:', error);
            toast.error('Error al actualizar');
        }
    }, []);

    const deleteTask = React.useCallback(async (taskId) => {
        try {
            if (FLAGS.USE_NEW_API_TASKS) {
                await apiClient.delete(`/tasks/${taskId}`);
            } else {
                await removeDocument('tasks', taskId);
            }
            toast.success('Tarea eliminada');
        } catch (error) {
            console.error('Error eliminando tarea:', error);
            toast.error('Error al eliminar');
        }
    }, []);

    const addNote = React.useCallback(async (taskId, text) => {
        validateRequiredString(text, 'nota', 1000);
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const note = {
            id: crypto.randomUUID(),
            text: sanitizeText(text),
            authorId: user.uid,
            authorName: sanitizeName(user.name || user.displayName || user.email),
            createdAt: new Date().toISOString(),
        };

        const updatedNotes = [...(task.notes || []), note];
        try {
            if (FLAGS.USE_NEW_API_TASKS) {
                await apiClient.patch(`/tasks/${taskId}`, { notes: updatedNotes });
            } else {
                await updateDocument('tasks', taskId, { notes: updatedNotes });
            }
        } catch (error) {
            console.error('Error agregando nota:', error);
            toast.error('Error al agregar nota');
        }
    }, [tasks, user]);

    const deleteNote = React.useCallback(async (taskId, noteId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const updatedNotes = (task.notes || []).map(n =>
            n.id !== noteId ? n : {
                ...n,
                deleted: true,
                deletedById: user.uid,
                deletedByName: sanitizeName(user.name || user.displayName || user.email),
                deletedAt: new Date().toISOString(),
            }
        );
        try {
            if (FLAGS.USE_NEW_API_TASKS) {
                await apiClient.patch(`/tasks/${taskId}`, { notes: updatedNotes });
            } else {
                await updateDocument('tasks', taskId, { notes: updatedNotes });
            }
        } catch (error) {
            console.error('Error eliminando nota:', error);
            toast.error('Error al eliminar nota');
        }
    }, [tasks, user]);

    const editNote = React.useCallback(async (taskId, noteId, newText) => {
        validateRequiredString(newText, 'nota', 1000);
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const note = (task.notes || []).find(n => n.id === noteId);
        if (!note || note.deleted) return;
        const ageMs = Date.now() - new Date(note.createdAt).getTime();
        if (ageMs > 5 * 60 * 1000) { toast.error('Solo puedes editar dentro de los primeros 5 minutos'); return; }
        const updatedNotes = (task.notes || []).map(n =>
            n.id !== noteId ? n : { ...n, text: sanitizeText(newText), editedAt: new Date().toISOString() }
        );
        try {
            if (FLAGS.USE_NEW_API_TASKS) {
                await apiClient.patch(`/tasks/${taskId}`, { notes: updatedNotes });
            } else {
                await updateDocument('tasks', taskId, { notes: updatedNotes });
            }
        } catch (error) {
            console.error('Error editando nota:', error);
            toast.error('Error al editar nota');
        }
    }, [tasks]);

    const addCollaborator = React.useCallback(async (taskId, collabUser) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const already = (task.collaborators || []).some(c => c.id === collabUser.id);
        if (already) return;
        const updated = [...(task.collaborators || []), { id: collabUser.id, name: collabUser.name }];
        try {
            if (FLAGS.USE_NEW_API_TASKS) {
                await apiClient.patch(`/tasks/${taskId}`, { collaborators: updated });
            } else {
                await updateDocument('tasks', taskId, { collaborators: updated });
            }
        } catch (error) {
            console.error('Error agregando colaborador:', error);
            toast.error('Error al agregar colaborador');
        }
    }, [tasks]);

    const removeCollaborator = React.useCallback(async (taskId, collabId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const updated = (task.collaborators || []).filter(c => c.id !== collabId);
        try {
            if (FLAGS.USE_NEW_API_TASKS) {
                await apiClient.patch(`/tasks/${taskId}`, { collaborators: updated });
            } else {
                await updateDocument('tasks', taskId, { collaborators: updated });
            }
        } catch (error) {
            console.error('Error eliminando colaborador:', error);
            toast.error('Error al eliminar colaborador');
        }
    }, [tasks]);

    const value = React.useMemo(() => ({
        tasks,
        addTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
        addNote,
        deleteNote,
        editNote,
        addCollaborator,
        removeCollaborator,
    }), [tasks, addTask, updateTaskStatus, updateTask, deleteTask, addNote, deleteNote, editNote, addCollaborator, removeCollaborator]);

    return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};
