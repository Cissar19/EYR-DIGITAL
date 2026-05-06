/**
 * HolidaysContext
 * ───────────────
 * Gestiona los feriados del año escolar. Fusiona los feriados legales de Chile
 * (estáticos) con los interferiados institutionales definidos por la jefa UTP
 * (persistidos en Firestore, colección `interferiados`).
 *
 * Provee: allHolidays, allHolidaysSet, customHolidays, addHoliday, deleteHoliday, loading
 * - allHolidays     : { [dateISO]: string } — mapa combinado (legales + custom)
 * - allHolidaysSet  : Set<string>           — fechas ISO para lookup rápido
 * - customHolidays  : { [dateISO]: string } — solo los interferiados custom
 * - addHoliday      : (dateStr, name) => Promise<void>
 * - deleteHoliday   : (dateStr) => Promise<void>
 * - loading         : true mientras carga la primera vez
 *
 * Solo la jefa UTP (y admins) debe exponer los controles de escritura en la UI.
 * Las reglas de Firestore también restringen la escritura a isUTP().
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CHILE_HOLIDAYS } from '../data/chileHolidays';

const HolidaysContext = createContext({
    allHolidays:    CHILE_HOLIDAYS,
    allHolidaysSet: new Set(Object.keys(CHILE_HOLIDAYS)),
    customHolidays: {},
    addHoliday:     async () => {},
    deleteHoliday:  async () => {},
    loading:        false,
});

export const HolidaysProvider = ({ children }) => {
    const [customHolidays, setCustomHolidays] = useState({});
    const [loading, setLoading]               = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(
            collection(db, 'interferiados'),
            (snap) => {
                const map = {};
                snap.docs.forEach(d => { map[d.id] = d.data().name; });
                setCustomHolidays(map);
                setLoading(false);
            },
            () => setLoading(false),
        );
        return unsub;
    }, []);

    const allHolidays    = { ...CHILE_HOLIDAYS, ...customHolidays };
    const allHolidaysSet = new Set(Object.keys(allHolidays));

    const addHoliday = (dateStr, name) =>
        setDoc(doc(db, 'interferiados', dateStr), {
            name,
            createdAt: new Date().toISOString(),
        });

    const deleteHoliday = (dateStr) =>
        deleteDoc(doc(db, 'interferiados', dateStr));

    return (
        <HolidaysContext.Provider value={{ allHolidays, allHolidaysSet, customHolidays, addHoliday, deleteHoliday, loading }}>
            {children}
        </HolidaysContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useHolidays = () => useContext(HolidaysContext);
