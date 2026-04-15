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
            docs.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            setTodos(docs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    const addTodo = React.useCallback(async ({ text, color, priority }) => {
        if (!text?.trim()) return;
        try {
            await addDoc(collection(db, 'todos'), {
                userId: user.uid,
                text: text.trim(),
                color: color ?? 'indigo',
                priority: priority ?? 'media',
                status: 'pendiente',
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.error(e);
            toast.error('Error al crear tarea');
        }
    }, [user]);

    const updateTodo = React.useCallback(async (id, data) => {
        try {
            await updateDoc(doc(db, 'todos', id), data);
        } catch (e) {
            toast.error('Error al actualizar');
        }
    }, []);

    const deleteTodo = React.useCallback(async (id) => {
        try {
            await deleteDoc(doc(db, 'todos', id));
        } catch (e) {
            toast.error('Error al eliminar');
        }
    }, []);

    const value = React.useMemo(() => ({
        todos, loading, addTodo, updateTodo, deleteTodo,
    }), [todos, loading, addTodo, updateTodo, deleteTodo]);

    return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
};
