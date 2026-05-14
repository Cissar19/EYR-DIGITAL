import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { FLAGS } from '../lib/featureFlags';
import { apiClient } from '../lib/apiClient';
import { getSocket } from '../lib/socket';

const TodoContext = createContext();
export const useTodos = () => useContext(TodoContext);

export const TodoProvider = ({ children }) => {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const normalizeTodo = (t) => ({
        ...t,
        text: t.text ?? t.title ?? '',
        createdAt: t.created_at ?? t.createdAt,
        dueDate: t.due_date ?? t.dueDate,
        userId: t.user_id ?? t.userId,
    });

    const sortTodos = (list) => list.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const aTime = a.createdAt?.toMillis?.() || new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.toMillis?.() || new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
    });

    useEffect(() => {
        if (!user?.uid) return;

        if (FLAGS.USE_NEW_API_TODOS) {
            let cancelled = false;
            apiClient.get(`/todos?userId=${user.uid}`).then(data => {
                if (!cancelled) {
                    setTodos(sortTodos(data.map(normalizeTodo)));
                    setLoading(false);
                }
            }).catch(err => {
                console.error('Error cargando todos:', err);
                if (!cancelled) setLoading(false);
            });

            const socket = getSocket();
            const onCreated = (todo) => {
                const n = normalizeTodo(todo);
                if (n.userId === user.uid) setTodos(prev => sortTodos([...prev, n]));
            };
            const onUpdated = (todo) => {
                const n = normalizeTodo(todo);
                if (n.userId === user.uid) setTodos(prev => sortTodos(prev.map(t => t.id === n.id ? n : t)));
            };
            const onDeleted = ({ id }) => {
                setTodos(prev => prev.filter(t => t.id !== id));
            };

            socket?.on('todos:created', onCreated);
            socket?.on('todos:updated', onUpdated);
            socket?.on('todos:deleted', onDeleted);

            return () => {
                cancelled = true;
                socket?.off('todos:created', onCreated);
                socket?.off('todos:updated', onUpdated);
                socket?.off('todos:deleted', onDeleted);
            };
        }

        // Firebase original
        const q = query(collection(db, 'todos'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            sortTodos(docs);
            setTodos(docs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    const addTodo = React.useCallback(async ({ text, color, priority, dueDate }) => {
        if (!text?.trim()) return;
        try {
            if (FLAGS.USE_NEW_API_TODOS) {
                const title = text.trim();
                console.log('Enviando todo:', { title });
                await apiClient.post('/todos', { title });
                const data = await apiClient.get('/todos');
                setTodos(sortTodos(data.map(normalizeTodo)));
            } else {
                await addDoc(collection(db, 'todos'), {
                    userId:   user.uid,
                    text:     text.trim(),
                    color:    color    ?? 'indigo',
                    priority: priority ?? 'media',
                    status:   'pendiente',
                    dueDate:  dueDate  || null,
                    notes:    [],
                    pinned:   false,
                    createdAt: serverTimestamp(),
                });
            }
            toast.success('Tarea creada');
        } catch (e) {
            console.error(e);
            toast.error('Error al crear tarea');
        }
    }, [user]);

    const updateTodo = React.useCallback(async (id, data, successMsg) => {
        try {
            if (FLAGS.USE_NEW_API_TODOS) {
                await apiClient.patch(`/todos/${id}`, data);
            } else {
                await updateDoc(doc(db, 'todos', id), data);
            }
            if (successMsg) toast.success(successMsg);
        } catch (e) {
            toast.error('Error al actualizar');
        }
    }, []);

    const deleteTodo = React.useCallback(async (id) => {
        try {
            if (FLAGS.USE_NEW_API_TODOS) {
                await apiClient.delete(`/todos/${id}`);
            } else {
                await deleteDoc(doc(db, 'todos', id));
            }
            toast.success('Tarea eliminada');
        } catch (e) {
            toast.error('Error al eliminar');
        }
    }, []);

    const addTodoNote = React.useCallback(async (todoId, text) => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo || !text?.trim()) return;
        const note = { id: crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString() };
        const updatedNotes = [...(todo.notes || []), note];
        try {
            if (FLAGS.USE_NEW_API_TODOS) {
                await apiClient.patch(`/todos/${todoId}`, { notes: updatedNotes });
            } else {
                await updateDoc(doc(db, 'todos', todoId), { notes: updatedNotes });
            }
            toast.success('Nota agregada');
        } catch (e) {
            toast.error('Error al agregar nota');
        }
    }, [todos]);

    const deleteTodoNote = React.useCallback(async (todoId, noteId) => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo) return;
        const updatedNotes = (todo.notes || []).filter(n => n.id !== noteId);
        try {
            if (FLAGS.USE_NEW_API_TODOS) {
                await apiClient.patch(`/todos/${todoId}`, { notes: updatedNotes });
            } else {
                await updateDoc(doc(db, 'todos', todoId), { notes: updatedNotes });
            }
            toast.success('Nota eliminada');
        } catch (e) {
            toast.error('Error al eliminar nota');
        }
    }, [todos]);

    const value = React.useMemo(() => ({
        todos, loading, addTodo, updateTodo, deleteTodo, addTodoNote, deleteTodoNote,
    }), [todos, loading, addTodo, updateTodo, deleteTodo, addTodoNote, deleteTodoNote]);

    return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
};
