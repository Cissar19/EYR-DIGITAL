import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

const TodoContext = createContext();
export const useTodos = () => useContext(TodoContext);

export const TodoProvider = ({ children }) => {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.uid) return;
        const q = query(collection(db, 'todos'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
            });
            setTodos(docs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    const addTodo = React.useCallback(async ({ text, color, priority, dueDate }) => {
        if (!text?.trim()) return;
        try {
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
            toast.success('Tarea creada');
        } catch (e) {
            console.error(e);
            toast.error('Error al crear tarea');
        }
    }, [user]);

    const updateTodo = React.useCallback(async (id, data, successMsg) => {
        try {
            await updateDoc(doc(db, 'todos', id), data);
            if (successMsg) toast.success(successMsg);
        } catch (e) {
            toast.error('Error al actualizar');
        }
    }, []);

    const deleteTodo = React.useCallback(async (id) => {
        try {
            await deleteDoc(doc(db, 'todos', id));
            toast.success('Tarea eliminada');
        } catch (e) {
            toast.error('Error al eliminar');
        }
    }, []);

    const addTodoNote = React.useCallback(async (todoId, text) => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo || !text?.trim()) return;
        const note = { id: crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString() };
        try {
            await updateDoc(doc(db, 'todos', todoId), { notes: [...(todo.notes || []), note] });
            toast.success('Nota agregada');
        } catch (e) {
            toast.error('Error al agregar nota');
        }
    }, [todos]);

    const deleteTodoNote = React.useCallback(async (todoId, noteId) => {
        const todo = todos.find(t => t.id === todoId);
        if (!todo) return;
        try {
            await updateDoc(doc(db, 'todos', todoId), { notes: (todo.notes || []).filter(n => n.id !== noteId) });
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
