import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { validateRequiredString, validateUserId, sanitizeText, sanitizeName } from '../lib/validation';
import { useAuth } from './AuthContext';

const TasksContext = createContext();
export const useTasks = () => useContext(TasksContext);

export const TasksProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        const unsubscribe = subscribeToCollection('tasks', (docs) => {
            const sorted = docs.sort((a, b) => {
                // Priority order: urgent > high > normal > low
                const pOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
                const pDiff = (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
                if (pDiff !== 0) return pDiff;
                return new Date(b.createdAt?.toDate?.() || 0) - new Date(a.createdAt?.toDate?.() || 0);
            });
            setTasks(sorted);
        });
        return () => unsubscribe();
    }, []);

    const addTask = React.useCallback(async ({ title, description, assignedTo, assignedToName, priority, dueDate }) => {
        validateRequiredString(title, 'título', 200);
        if (assignedTo) validateUserId(assignedTo);

        const newTask = {
            title: sanitizeText(title),
            description: description ? sanitizeText(description) : '',
            assignedTo: assignedTo || null,
            assignedToName: assignedToName ? sanitizeName(assignedToName) : null,
            createdBy: user.uid,
            createdByName: sanitizeName(user.displayName || user.email),
            status: 'pending',
            priority: priority || 'normal',
            dueDate: dueDate || null,
            notes: [],
        };

        try {
            await createDocument('tasks', newTask);
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
            await updateDocument('tasks', taskId, { status });
        } catch (error) {
            console.error('Error actualizando estado:', error);
            toast.error('Error al actualizar estado');
        }
    }, []);

    const updateTask = React.useCallback(async (taskId, updates) => {
        try {
            await updateDocument('tasks', taskId, updates);
            toast.success('Tarea actualizada');
        } catch (error) {
            console.error('Error actualizando tarea:', error);
            toast.error('Error al actualizar');
        }
    }, []);

    const deleteTask = React.useCallback(async (taskId) => {
        try {
            await removeDocument('tasks', taskId);
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
            authorName: sanitizeName(user.displayName || user.email),
            createdAt: new Date().toISOString(),
        };

        const updatedNotes = [...(task.notes || []), note];
        try {
            await updateDocument('tasks', taskId, { notes: updatedNotes });
        } catch (error) {
            console.error('Error agregando nota:', error);
            toast.error('Error al agregar nota');
        }
    }, [tasks, user]);

    const deleteNote = React.useCallback(async (taskId, noteId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const updatedNotes = (task.notes || []).filter(n => n.id !== noteId);
        try {
            await updateDocument('tasks', taskId, { notes: updatedNotes });
        } catch (error) {
            console.error('Error eliminando nota:', error);
            toast.error('Error al eliminar nota');
        }
    }, [tasks]);

    const addCollaborator = React.useCallback(async (taskId, collabUser) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const already = (task.collaborators || []).some(c => c.id === collabUser.id);
        if (already) return;
        const updated = [...(task.collaborators || []), { id: collabUser.id, name: collabUser.name }];
        try {
            await updateDocument('tasks', taskId, { collaborators: updated });
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
            await updateDocument('tasks', taskId, { collaborators: updated });
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
        addCollaborator,
        removeCollaborator,
    }), [tasks, addTask, updateTaskStatus, updateTask, deleteTask, addNote, deleteNote, addCollaborator, removeCollaborator]);

    return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};
