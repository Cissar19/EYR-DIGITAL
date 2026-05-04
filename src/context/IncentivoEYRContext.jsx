import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import {
    collection, doc, onSnapshot, writeBatch, serverTimestamp, query, orderBy
} from 'firebase/firestore';

const IncentivoEYRContext = createContext();

const COL_ESTRELLAS = 'incentivo_estrellas';
const COL_TRANSACCIONES = 'incentivo_transacciones';

export function IncentivoEYRProvider({ children }) {
    const { user } = useAuth();
    const [estrellas, setEstrellas] = useState({});   // { [studentId]: number }
    const [transacciones, setTransacciones] = useState([]);
    const [loading, setLoading] = useState(true);

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

        const q = query(collection(db, COL_TRANSACCIONES), orderBy('fecha', 'desc'));
        const unsubT = onSnapshot(q, snap => {
            setTransacciones(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, () => {});

        return () => { unsubE(); unsubT(); };
    }, []);

    const registrarMovimiento = useCallback(async ({ studentId, monto, tipo, nota = '' }) => {
        if (!user) return;
        const n = parseInt(monto);
        if (!n || n <= 0) { toast.error('Ingresa una cantidad válida'); return; }

        const batch = writeBatch(db);
        const current = estrellas[studentId] ?? 0;
        const delta = tipo === 'ingreso' ? n : -n;
        const newBalance = Math.max(0, current + delta);

        batch.set(
            doc(db, COL_ESTRELLAS, studentId),
            { studentId, estrellas: newBalance },
            { merge: true }
        );
        batch.set(doc(collection(db, COL_TRANSACCIONES)), {
            studentId,
            monto: n,
            tipo,
            nota: nota.trim(),
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

    const getBalance = useCallback((studentId) => estrellas[studentId] ?? 0, [estrellas]);

    const getTransaccionesAlumno = useCallback(
        (studentId) => transacciones.filter(t => t.studentId === studentId),
        [transacciones]
    );

    const value = React.useMemo(() => ({
        estrellas,
        transacciones,
        loading,
        registrarMovimiento,
        getBalance,
        getTransaccionesAlumno,
    }), [estrellas, transacciones, loading, registrarMovimiento, getBalance, getTransaccionesAlumno]);

    return (
        <IncentivoEYRContext.Provider value={value}>
            {children}
        </IncentivoEYRContext.Provider>
    );
}

export function useIncentivoEYR() {
    return useContext(IncentivoEYRContext);
}
