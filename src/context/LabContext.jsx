import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const LabContext = createContext();

export const TIME_BLOCKS = [
    { id: 'recepcion', start: '08:00', end: '08:10', type: 'class', label: 'Recepción' },
    { id: 'b1', start: '08:10', end: '08:55', type: 'class', label: 'Bloque 1' },
    { id: 'b2', start: '08:55', end: '09:40', type: 'class', label: 'Bloque 2' },
    { id: 'break1', start: '09:40', end: '09:55', type: 'break', label: 'RECREO' },
    { id: 'b3', start: '09:55', end: '10:40', type: 'class', label: 'Bloque 3' },
    { id: 'b4', start: '10:40', end: '11:25', type: 'class', label: 'Bloque 4' },
    { id: 'break2', start: '11:25', end: '11:40', type: 'break', label: 'RECREO' },
    { id: 'b5', start: '11:40', end: '12:25', type: 'class', label: 'Bloque 5' },
    { id: 'b6', start: '12:25', end: '13:10', type: 'class', label: 'Bloque 6' },
    { id: 'lunch', start: '13:10', end: '13:55', type: 'break', label: 'ALMUERZO' },
    { id: 'b7', start: '13:55', end: '14:40', type: 'class', label: 'Bloque 7' },
    { id: 'b8', start: '14:40', end: '15:25', type: 'class', label: 'Bloque 8' },
];

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export function LabProvider({ children }) {
    const { user } = useAuth();

    // 1. Carga Inicial
    const [reservations, setReservations] = useState(() => {
        try {
            const saved = localStorage.getItem('lab_reservations');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error("Error reading lab_reservations:", error);
            return [];
        }
    });

    // 2. Sincronización Automática (El Truco)
    useEffect(() => {
        const handleStorageChange = (event) => {
            // Si el evento es específicamente sobre nuestra key, o si es null (clear)
            if (event.key === 'lab_reservations' || event.key === null) {
                const freshData = JSON.parse(localStorage.getItem('lab_reservations')) || [];
                setReservations(freshData);
            }
        };

        const handleFocus = () => {
            // Refresco proactivo al volver a la pestaña
            const freshData = JSON.parse(localStorage.getItem('lab_reservations')) || [];
            // Solo actualizamos si hay cambios reales para evitar re-renders innecesarios (opcional, pero buena práctica)
            // Aquí lo haremos directo para asegurar consistencia
            setReservations(freshData);
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Persistir cambios locales (Redundante con addReservation pero útil para otros cambios de estado si los hubiera)
    useEffect(() => {
        // Nota: El storage event no se dispara en la misma ventana que hace el cambio, solo en otras.
        // Por eso necesitamos actulizar el estado React localmente tambien.
    }, [reservations]);


    // 3. Función addReservation con Validación de Seguridad
    const addReservation = (blockId, date, subject, userNameOverride = null) => {
        if (!user) {
            toast.error("Debes iniciar sesión para reservar.");
            return false;
        }

        const userName = userNameOverride || user.name;

        try {
            // A. Leer la versión más reciente LITERALLY RIGHT NOW
            const currentData = JSON.parse(localStorage.getItem('lab_reservations')) || [];

            // B. Verificar si está ocupado (Race condition check)
            // Asumimos que 'blockId' es único por bloque y día combinados como en el ejemplo del usuario: "Lunes-Bloque1"?
            // O si vienen separados. El usuario dijo: `blockId: "Lunes-Bloque1"`.
            // Si el input 'date' es la fecha (ej: 2026-02-09), entonces la unicidad es date + blockId.
            // Voy a asumir que 'blockId' es el ID del bloque (ej: 'b1') y 'date' es la fecha específica o día de la semana.
            // El prompt dice: "date: '2026-02-09' // Semana o fecha especifica".
            // Y el objeto ejemplo tiene: "blockId": "Lunes-Bloque1".
            // Voy a construir el identificador único para chequear colisiones.

            // Si el usuario pasa 'blockId' como "Lunes-Bloque1" directo, perfecto.
            // Si pasa 'b1' y la fecha, habría que ver como lo maneja la UI.
            // Basado en el ejemplo JSON:
            // { ... blockId: "Lunes-Bloque1", date: "2026-02-09" ... }
            // La colisión real es: mismo `date` y mismo `blockId`.

            const isOccupied = currentData.some(r => r.date === date && r.blockId === blockId);

            if (isOccupied) {
                // Alguien ganó el click por milisegundos
                setReservations(currentData); // Actualizamos nuestra vista de paso
                toast.error("¡Bloque ya reservado por otro usuario!");
                return false;
            }

            // C. Si está libre, agregamos
            const newReservation = {
                id: Date.now(),
                blockId, // Ej: "Lunes-Bloque1"
                teacher: userName,
                subject,
                date, // Ej: "2026-02-09"
                timestamp: Date.now(),
                userId: user.id // Guardamos userId para permisos de borrado
            };

            const updatedData = [...currentData, newReservation];

            // D. Guardar en localStorage INMEDIATAMENTE
            localStorage.setItem('lab_reservations', JSON.stringify(updatedData));

            // E. Actualizar estado local
            setReservations(updatedData);
            toast.success("Reserva confirmada.");
            return true;

        } catch (error) {
            console.error("Error en addReservation:", error);
            toast.error("Error al procesar la reserva.");
            return false;
        }
    };

    // 4. Función removeReservation con Permisos
    const removeReservation = (reservationId) => {
        if (!user) return;

        try {
            const currentData = JSON.parse(localStorage.getItem('lab_reservations')) || [];
            const reservation = currentData.find(r => r.id === reservationId);

            if (!reservation) {
                toast.error("La reserva no existe.");
                // Sincronizar por si acaso
                setReservations(currentData);
                return;
            }

            // Validar permisos
            const isOwner = reservation.userId === user.id;
            const isAdmin = user.role === 'director' || user.role === 'admin';

            if (!isOwner && !isAdmin) {
                toast.error("Solo el dueño o un admin pueden borrar esta reserva.");
                return;
            }

            // Borrar
            const updatedData = currentData.filter(r => r.id !== reservationId);
            localStorage.setItem('lab_reservations', JSON.stringify(updatedData));
            setReservations(updatedData);
            toast.success("Reserva eliminada.");

        } catch (error) {
            console.error("Error removing reservation:", error);
        }
    };

    // Helper para obtener reserva de un bloque específico
    const getReservation = (date, blockId) => {
        return reservations.find(r => r.date === date && r.blockId === blockId);
    };

    const value = React.useMemo(() => ({
        reservations,
        addReservation,
        removeReservation,
        getReservation
    }), [reservations, user]);

    return (
        <LabContext.Provider value={value}>
            {children}
        </LabContext.Provider>
    );
}

export function useLab() {
    return useContext(LabContext);
}
