import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { orderBy, serverTimestamp } from 'firebase/firestore';
import { FLAGS } from '../lib/featureFlags';
import { apiClient } from '../lib/apiClient';
import { getSocket } from '../lib/socket';

const RetosContext = createContext();

const normalizeReto = (r) => ({
    ...r,
    cursoObjetivo: r.curso_objetivo ?? r.cursoObjetivo ?? '',
    duracionMin: r.duracion_min ?? r.duracionMin ?? 45,
    habilitarEnvioMin: r.habilitar_envio_min ?? r.habilitarEnvioMin ?? 20,
    creadoPor: r.creado_por ?? r.creadoPor,
    createdAt: r.created_at ?? r.createdAt,
});

const normalizeSesion = (s) => ({
    ...s,
    retoId: s.reto_id ?? s.retoId,
    retoTitulo: s.reto_titulo ?? s.retoTitulo ?? '',
    closedAt: s.closed_at ?? s.closedAt,
    createdAt: s.created_at ?? s.createdAt,
});

export function RetosProvider({ children }) {
    const { user } = useAuth();
    const [retos, setRetos] = useState([]);
    const [sesiones, setSesiones] = useState([]);
    const [loading, setLoading] = useState(true);

    // Todos los retos (catálogo)
    useEffect(() => {
        if (FLAGS.USE_NEW_API_RETOS) {
            let cancelled = false;
            apiClient.get('/retos').then(data => {
                if (!cancelled) {
                    setRetos(data.map(normalizeReto));
                    setLoading(false);
                }
            }).catch(err => {
                console.error('Error cargando retos:', err);
                if (!cancelled) setLoading(false);
            });

            const socket = getSocket();
            const onCreated = (r) => setRetos(prev => [normalizeReto(r), ...prev]);
            const onUpdated = (r) => setRetos(prev => prev.map(x => x.id === r.id ? normalizeReto(r) : x));
            const onDeleted = ({ id }) => setRetos(prev => prev.filter(x => x.id !== id));

            socket?.on('retos:created', onCreated);
            socket?.on('retos:updated', onUpdated);
            socket?.on('retos:deleted', onDeleted);

            return () => {
                cancelled = true;
                socket?.off('retos:created', onCreated);
                socket?.off('retos:updated', onUpdated);
                socket?.off('retos:deleted', onDeleted);
            };
        }

        // Firebase original
        const unsub = subscribeToCollection('retos', (docs) => {
            setRetos(docs);
            setLoading(false);
        }, orderBy('createdAt', 'desc'));
        return () => unsub();
    }, []);

    // Sesiones activas (todas, filtradas cliente-side)
    useEffect(() => {
        if (FLAGS.USE_NEW_API_RETOS) {
            let cancelled = false;
            apiClient.get('/sesiones-reto').then(data => {
                if (!cancelled) {
                    setSesiones(data.map(normalizeSesion).filter(s => s.estado === 'activa'));
                }
            }).catch(err => {
                console.error('Error cargando sesiones:', err);
            });

            const socket = getSocket();
            const onSesionCreated = (s) => {
                const norm = normalizeSesion(s);
                if (norm.estado === 'activa') setSesiones(prev => [norm, ...prev]);
            };
            const onSesionUpdated = (s) => {
                const norm = normalizeSesion(s);
                if (norm.estado === 'activa') {
                    setSesiones(prev => {
                        const exists = prev.some(x => x.id === norm.id);
                        return exists ? prev.map(x => x.id === norm.id ? norm : x) : [norm, ...prev];
                    });
                } else {
                    setSesiones(prev => prev.filter(x => x.id !== norm.id));
                }
            };
            const onSesionDeleted = ({ id }) => setSesiones(prev => prev.filter(x => x.id !== id));

            socket?.on('sesiones-reto:created', onSesionCreated);
            socket?.on('sesiones-reto:updated', onSesionUpdated);
            socket?.on('sesiones-reto:deleted', onSesionDeleted);

            return () => {
                cancelled = true;
                socket?.off('sesiones-reto:created', onSesionCreated);
                socket?.off('sesiones-reto:updated', onSesionUpdated);
                socket?.off('sesiones-reto:deleted', onSesionDeleted);
            };
        }

        // Firebase original
        const unsub = subscribeToCollection('sesiones_reto', (docs) => {
            setSesiones(docs.filter(s => s.estado === 'activa'));
        }, orderBy('createdAt', 'desc'));
        return () => unsub();
    }, []);

    const createReto = useCallback(async (data) => {
        if (FLAGS.USE_NEW_API_RETOS) {
            await apiClient.post('/retos', {
                titulo: data.titulo.trim(),
                instrucciones: data.instrucciones.trim(),
                asignatura: data.asignatura.trim(),
                curso_objetivo: data.cursoObjetivo || '',
                duracion_min: Number(data.duracionMin) || 45,
                habilitar_envio_min: Number(data.habilitarEnvioMin) || 20,
                activo: true,
                creado_por: { uid: user.uid, name: user.name },
            });
        } else {
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
        }
        toast.success('Reto creado');
    }, [user]);

    const updateReto = useCallback(async (id, data) => {
        if (FLAGS.USE_NEW_API_RETOS) {
            await apiClient.patch(`/retos/${id}`, data);
        } else {
            await updateDocument('retos', id, data);
        }
        toast.success('Reto actualizado');
    }, []);

    const deleteReto = useCallback(async (id) => {
        if (FLAGS.USE_NEW_API_RETOS) {
            await apiClient.delete(`/retos/${id}`);
        } else {
            await removeDocument('retos', id);
        }
        toast.success('Reto eliminado');
    }, []);

    const createSesion = useCallback(async (retoId, curso) => {
        const reto = retos.find(r => r.id === retoId);
        if (!reto) throw new Error('Reto no encontrado');

        if (FLAGS.USE_NEW_API_RETOS) {
            const result = await apiClient.post('/sesiones-reto', {
                reto_id: retoId,
                reto_titulo: reto.titulo,
                curso,
                asistente: { uid: user.uid, name: user.name },
                estado: 'activa',
            });
            toast.success(`Sesión iniciada para ${curso}`);
            return result;
        }

        // Firebase original
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
        if (FLAGS.USE_NEW_API_RETOS) {
            await apiClient.patch(`/sesiones-reto/${sesionId}`, {
                estado: 'cerrada',
                closed_at: new Date().toISOString(),
            });
        } else {
            await updateDocument('sesiones_reto', sesionId, {
                estado: 'cerrada',
                closedAt: serverTimestamp(),
            });
        }
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
