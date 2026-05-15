import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { orderBy, serverTimestamp } from 'firebase/firestore';

const RetosContext = createContext();

export function RetosProvider({ children }) {
    const { user } = useAuth();
    const [retos, setRetos] = useState([]);
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);

    // Todos los retos (catálogo)
    useEffect(() => {
        const unsub = subscribeToCollection('retos', (docs) => {
            setRetos(docs);
            setLoading(false);
        }, orderBy('createdAt', 'desc'));
        return () => unsub();
    }, []);

    // Sesiones activas (todas, filtradas cliente-side)
    useEffect(() => {
        const unsub = subscribeToCollection('sesiones_reto', (docs) => {
            setSesiones(docs.filter(s => s.estado === 'activa'));
        }, orderBy('createdAt', 'desc'));
        return () => unsub();
    }, []);

    const createReto = useCallback(async (data) => {
        await createDocument('retos', {
            titulo: data.titulo.trim(),
            instrucciones: data.instrucciones.trim(),
            asignatura: data.asignatura.trim(),
            cursoObjetivo: data.cursoObjetivo || '',
            duracionMin: Number(data.duracionMin) || 45,
            habilitarEnvioMin: Number(data.habilitarEnvioMin) || 20,
            activo: true,
            creadoPor: { uid: user.uid, name: user.name },
        });
        toast.success('Reto creado');
    }, [user]);

    const updateReto = useCallback(async (id, data) => {
        await updateDocument('retos', id, data);
        toast.success('Reto actualizado');
    }, []);

    const deleteReto = useCallback(async (id) => {
        await removeDocument('retos', id);
        toast.success('Reto eliminado');
    }, []);

    const createSesion = useCallback(async (retoId, curso) => {
        const reto = retos.find(r => r.id === retoId);
        if (!reto) throw new Error('Reto no encontrado');
        const result = await createDocument('sesiones_reto', {
            retoId,
            retoTitulo: reto.titulo,
            curso,
            asistente: { uid: user.uid, name: user.name },
            estado: 'activa',
        });
        toast.success(`Sesión iniciada para ${curso}`);
        return result;
    }, [retos, user]);

    const closeSesion = useCallback(async (sesionId) => {
        await updateDocument('sesiones_reto', sesionId, {
            estado: 'cerrada',
            closedAt: serverTimestamp(),
        });
        toast.success('Sesión cerrada');
    }, []);

    const value = React.useMemo(() => ({
        retos, sesiones, loading,
        createReto, updateReto, deleteReto,
        createSesion, closeSesion,
    }), [retos, sesiones, loading, createReto, updateReto, deleteReto, createSesion, closeSesion]);

    return <RetosContext.Provider value={value}>{children}</RetosContext.Provider>;
}

export function useRetos() {
    return useContext(RetosContext);
}
