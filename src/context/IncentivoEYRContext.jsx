import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import {
    collection, doc, onSnapshot, writeBatch, serverTimestamp,
    query, orderBy, setDoc, updateDoc, deleteDoc, increment,
} from 'firebase/firestore';

const IncentivoEYRContext = createContext();

const COL_ESTRELLAS     = 'incentivo_estrellas';
const COL_TRANSACCIONES = 'incentivo_transacciones';
const COL_CONFIG        = 'incentivo_config';
const COL_PRODUCTOS     = 'incentivo_productos';

const DEFAULT_CONFIG = {
    tiers: [
        { id:3, label:'Excelencia', minCoins:80  },
        { id:2, label:'Destacado',  minCoins:30  },
        { id:1, label:'Regular',    minCoins:0   },
    ],
    bonusEvents: [
        { key:'BONUS_ASISTENCIA_PERFECTA',  label:'Asistencia perfecta semanal',   amount:10 },
        { key:'BONUS_PUNTUALIDAD_PERFECTA', label:'Puntualidad perfecta semanal',  amount:5  },
        { key:'BONUS_CONDUCTA_PERFECTA',    label:'Conducta perfecta semanal',     amount:5  },
        { key:'LOGRO_ANOTACION_POSITIVA',   label:'Anotación positiva',            amount:5  },
    ],
    penaltyEvents: [
        { key:'PENALTI_ATRASO',         label:'Atraso al llegar',            amount:3,  perUnit:true  },
        { key:'PENALTI_INASISTENCIA',   label:'Inasistencia injustificada',  amount:10, perUnit:true  },
        { key:'PENALTI_CONDUCTA_LEVE',  label:'Anotación negativa leve',     amount:15, perUnit:false },
        { key:'PENALTI_CONDUCTA_GRAVE', label:'Anotación negativa grave',    amount:30, perUnit:false },
    ],
};

export function IncentivoEYRProvider({ children }) {
    const { user } = useAuth();
    const [estrellas,        setEstrellas]        = useState({});
    const [transacciones,    setTransacciones]    = useState([]);
    const [config,           setConfig]           = useState(DEFAULT_CONFIG);
    const [productos,        setProductos]        = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(true);
    const [loading,          setLoading]          = useState(true);

    useEffect(() => {
        const unsubE = onSnapshot(
            collection(db, COL_ESTRELLAS),
            snap => {
                const map = {};
                snap.docs.forEach(d => { map[d.id] = d.data().estrellas ?? 0; });
                setEstrellas(map);
                setLoading(false);
            },
            () => setLoading(false)
        );

        const unsubT = onSnapshot(
            query(collection(db, COL_TRANSACCIONES), orderBy('fecha', 'desc')),
            snap => setTransacciones(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            () => {}
        );

        const unsubC = onSnapshot(doc(db, COL_CONFIG, 'reglas'), snap => {
            if (snap.exists()) {
                const data = snap.data();
                setConfig({
                    tiers:         data.tiers         ?? DEFAULT_CONFIG.tiers,
                    bonusEvents:   data.bonusEvents    ?? DEFAULT_CONFIG.bonusEvents,
                    penaltyEvents: data.penaltyEvents  ?? DEFAULT_CONFIG.penaltyEvents,
                });
            }
        }, () => {});

        const unsubP = onSnapshot(
            query(collection(db, COL_PRODUCTOS), orderBy('creadoEn', 'desc')),
            snap => {
                setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                setLoadingProductos(false);
            },
            () => setLoadingProductos(false)
        );

        return () => { unsubE(); unsubT(); unsubC(); unsubP(); };
    }, []);

    // ── Estrellas ───────────────────────────────────────────────────────────────
    const registrarMovimiento = useCallback(async ({ studentId, monto, tipo, nota = '' }) => {
        if (!user) return;
        const n = parseInt(monto);
        if (!n || n <= 0) { toast.error('Ingresa una cantidad válida'); return; }

        const batch = writeBatch(db);
        const current = estrellas[studentId] ?? 0;
        const delta = tipo === 'ingreso' ? n : -n;
        const newBalance = Math.max(0, current + delta);

        batch.set(doc(db, COL_ESTRELLAS, studentId), { studentId, estrellas: newBalance }, { merge: true });
        batch.set(doc(collection(db, COL_TRANSACCIONES)), {
            studentId, monto: n, tipo, nota: nota.trim(),
            fecha: serverTimestamp(),
            registradoPor: user.name || user.email,
            registradoPorId: user.uid,
        });
        await batch.commit();

        const label = tipo === 'ingreso'
            ? `+${n} estrella${n !== 1 ? 's' : ''} agregada${n !== 1 ? 's' : ''}`
            : `-${n} estrella${n !== 1 ? 's' : ''} retirada${n !== 1 ? 's' : ''}`;
        toast.success(label);
    }, [user, estrellas]);

    const getBalance            = useCallback((id) => estrellas[id] ?? 0, [estrellas]);
    const getTransaccionesAlumno = useCallback((id) => transacciones.filter(t => t.studentId === id), [transacciones]);

    // ── Config ──────────────────────────────────────────────────────────────────
    const saveConfig = useCallback(async (newConfig) => {
        try {
            await setDoc(doc(db, COL_CONFIG, 'reglas'), newConfig);
            toast.success('Configuración guardada');
        } catch {
            toast.error('Error al guardar la configuración');
        }
    }, []);

    // ── Productos (Kiosko) ──────────────────────────────────────────────────────
    const addProducto = useCallback(async (data) => {
        try {
            const ref = doc(collection(db, COL_PRODUCTOS));
            await setDoc(ref, { ...data, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp() });
            toast.success(`"${data.nombre}" agregado al kiosko`);
        } catch {
            toast.error('Error al agregar el producto');
        }
    }, []);

    const updateProducto = useCallback(async (id, changes) => {
        try {
            await updateDoc(doc(db, COL_PRODUCTOS, id), { ...changes, actualizadoEn: serverTimestamp() });
            toast.success('Producto actualizado');
        } catch {
            toast.error('Error al actualizar el producto');
        }
    }, []);

    const deleteProducto = useCallback(async (id, nombre) => {
        try {
            await deleteDoc(doc(db, COL_PRODUCTOS, id));
            toast.success(`"${nombre}" eliminado del kiosko`);
        } catch {
            toast.error('Error al eliminar el producto');
        }
    }, []);

    const adjustStock = useCallback(async (id, delta) => {
        try {
            await updateDoc(doc(db, COL_PRODUCTOS, id), {
                stock: increment(delta),
                actualizadoEn: serverTimestamp(),
            });
        } catch {
            toast.error('Error al actualizar el stock');
        }
    }, []);

    const value = React.useMemo(() => ({
        estrellas, transacciones, config, loading,
        productos, loadingProductos,
        registrarMovimiento, getBalance, getTransaccionesAlumno,
        saveConfig,
        addProducto, updateProducto, deleteProducto, adjustStock,
    }), [
        estrellas, transacciones, config, loading,
        productos, loadingProductos,
        registrarMovimiento, getBalance, getTransaccionesAlumno,
        saveConfig,
        addProducto, updateProducto, deleteProducto, adjustStock,
    ]);

    return (
        <IncentivoEYRContext.Provider value={value}>
            {children}
        </IncentivoEYRContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIncentivoEYR() {
    return useContext(IncentivoEYRContext);
}
