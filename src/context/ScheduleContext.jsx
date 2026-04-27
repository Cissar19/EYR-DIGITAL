import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DEFAULT_SCHEDULES } from '../data/defaultSchedules';
import { subscribeToCollection, setDocument, removeDocument } from '../lib/firestoreService';

// Mapeo nombre de asignatura → código. Sincronizado con CrearEvaluacionModal.
export const SUBJECT_TO_ASIG = {
    'Lenguaje': 'LE', 'Leng. y Lit.': 'LE', 'T. Lenguaje': 'LE', 'Taller Len': 'LE',
    'Matemática': 'MA', 'T. Matemática': 'MA',
    'Historia': 'HI', 'H. G. y Cs. S.': 'HI', 'For. Ciud.': 'HI',
    'Ciencias': 'CN', 'C. Nat': 'CN', 'T. Ciencias': 'CN',
    'Inglés': 'IN',
    'Artes': 'AV',
    'Música': 'MU', 'Música/Arte': 'MU',
    'Ed. Física': 'EF',
    'Tecnología': 'TE',
    'Orientación': 'OR', 'Religión': 'OR', 'Religión / FC': 'OR',
};

// Genera el array desnormalizado ["5° Básico|MA", ...] usado en las reglas de Firestore.
function computeCourseSubjectPairs(blocks) {
    return [...new Set(
        (blocks || [])
            .filter(b => SUBJECT_TO_ASIG[b.subject])
            .map(b => `${b.course}|${SUBJECT_TO_ASIG[b.subject]}`)
    )];
}

const ScheduleContext = createContext();

// ============================================
// SCHEDULE BLOCKS (Real Chilean School Structure)
// ============================================
export const SCHEDULE_BLOCKS = [
    { id: 'jefatura', start: '08:00', end: '08:10', label: 'Jefatura', type: 'special' },
    { id: 'hora1', start: '08:10', end: '08:55', label: '1° Hora', type: 'class' },
    { id: 'hora2', start: '08:55', end: '09:40', label: '2° Hora', type: 'class' },
    { id: 'recreo1', start: '09:40', end: '09:55', label: 'Recreo', type: 'break' },
    { id: 'hora3', start: '09:55', end: '10:40', label: '3° Hora', type: 'class' },
    { id: 'hora4', start: '10:40', end: '11:25', label: '4° Hora', type: 'class' },
    { id: 'recreo2', start: '11:25', end: '11:40', label: 'Recreo', type: 'break' },
    { id: 'hora5', start: '11:40', end: '12:25', label: '5° Hora', type: 'class' },
    { id: 'hora6', start: '12:25', end: '13:10', label: '6° Hora', type: 'class' },
    { id: 'almuerzo', start: '13:10', end: '13:55', label: 'Almuerzo', type: 'break' },
    { id: 'hora7', start: '13:55', end: '14:40', label: '7° Hora', type: 'class' },
    { id: 'hora8', start: '14:40', end: '15:25', label: '8° Hora', type: 'class' },
];

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// ============================================
// COURSES (Chilean Education Levels)
// ============================================
export const COURSES_LIST = [
    'Pre-Kinder',
    'Pre-Kinder A',
    'Pre-Kinder B',
    'Kinder',
    'Kinder A',
    'Kinder B',
    '1° Básico',
    '2° Básico',
    '3° Básico',
    '4° Básico',
    '5° Básico',
    '6° Básico',
    '7° Básico',
    '8° Básico'
];

// ============================================
// SUBJECTS (School Subjects)
// ============================================
export const SUBJECTS_LIST = [
    'Lenguaje',
    'Leng. y Lit.',
    'Matemática',
    'T. Matemática',
    'Historia',
    'H. G. y Cs. S.',
    'For. Ciud.',
    'Ciencias',
    'C. Nat',
    'Inglés',
    'Artes',
    'Música',
    'Música/Arte',
    'Ed. Física',
    'Tecnología',
    'Orientación',
    'Religión',
    'Religión / FC',
    'Jefatura',
    'T. Ciencias',
    'T. Lenguaje',
    'Taller Len',
    'PAE'
];

// ============================================
// SCHEDULE PROVIDER
// ============================================
export const ScheduleProvider = ({ children }) => {
    const [schedules, setSchedules] = useState({});

    // Load schedules from Firestore on mount
    useEffect(() => {
        const unsubscribe = subscribeToCollection('schedules', (docs) => {
            const newSchedules = {};
            docs.forEach(doc => {
                const uid = doc.userId || doc.id;
                newSchedules[uid] = doc.blocks || [];
            });
            setSchedules(newSchedules);
        });

        return () => unsubscribe();
    }, []);

    /**
     * Get schedule for a specific user
     * @param {string} userId - User ID
     * @returns {Array} - User's schedule blocks or empty array
     */
    const getSchedule = React.useCallback((userId) => {
        return schedules[userId] || [];
    }, [schedules]);

    /**
     * Update schedule for a specific user
     * @param {string} userId - User ID
     * @param {Array} scheduleData - Array of schedule blocks
     * @param {string} userName - User name for notification
     */
    const updateSchedule = React.useCallback(async (userId, scheduleData, userName = 'el docente') => {
        // Optimistic UI update
        setSchedules(prev => ({
            ...prev,
            [userId]: scheduleData
        }));

        try {
            await setDocument('schedules', userId, {
                userId: userId,
                blocks: scheduleData,
                courseSubjectPairs: computeCourseSubjectPairs(scheduleData),
            });
            toast.success(`Horario guardado exitosamente`, {
                description: `Se actualizó el horario de ${userName}`
            });
        } catch (error) {
            console.error('Error saving schedule:', error);
            toast.error('Error al guardar horario');
        }
    }, []);

    /**
     * Copy schedule from one user to another
     * @param {string} fromUserId - Source user ID
     * @param {string} toUserId - Destination user ID
     * @param {string} toUserName - Destination user name
     */
    const copySchedule = React.useCallback(async (fromUserId, toUserId, toUserName = 'el docente') => {
        const sourceSchedule = schedules[fromUserId];

        if (!sourceSchedule || sourceSchedule.length === 0) {
            toast.error('No se puede copiar', {
                description: 'El docente seleccionado no tiene horario asignado'
            });
            return null;
        }

        // Deep copy to avoid reference issues
        const copiedSchedule = JSON.parse(JSON.stringify(sourceSchedule));

        // Optimistic UI
        setSchedules(prev => ({
            ...prev,
            [toUserId]: copiedSchedule
        }));

        try {
            await setDocument('schedules', toUserId, {
                userId: toUserId,
                blocks: copiedSchedule,
                courseSubjectPairs: computeCourseSubjectPairs(copiedSchedule),
            });
            toast.success('Horario copiado exitosamente', {
                description: `Se copió el horario a ${toUserName}`
            });
            return copiedSchedule;
        } catch (error) {
            console.error('Error copying schedule:', error);
            toast.error('Error al copiar horario');
            return null;
        }
    }, [schedules]);

    /**
     * Get all schedules (for admin overview)
     * @returns {Object} - All schedules
     */
    const getAllSchedules = React.useCallback(() => {
        return schedules;
    }, [schedules]);

    /**
     * Load default schedule for a user if none exists (matches by email)
     * @param {string} userId - User ID
     * @param {string} email - User email to match against defaults
     * @returns {boolean} - Whether a default was loaded
     */
    const loadDefaultIfNeeded = React.useCallback(async (userId, email) => {
        if (!userId || !email) return false;
        if (schedules[userId] && schedules[userId].length > 0) return false;

        const defaultSchedule = DEFAULT_SCHEDULES[email];
        if (defaultSchedule) {
            // Optimistic
            setSchedules(prev => ({
                ...prev,
                [userId]: [...defaultSchedule]
            }));

            // Sync to Firestore
            try {
                await setDocument('schedules', userId, {
                    userId: userId,
                    blocks: [...defaultSchedule],
                    courseSubjectPairs: computeCourseSubjectPairs(defaultSchedule),
                });
            } catch (err) {
                console.error("Error saving default schedule to Firestore", err);
            }
            return true;
        }
        return false;
    }, [schedules]);

    /**
     * Delete schedule for a specific user
     * @param {string} userId - User ID
     * @param {string} userName - User name
     */
    const deleteSchedule = React.useCallback(async (userId, userName = 'el docente') => {
        // Optimistic
        setSchedules(prev => {
            const newSchedules = { ...prev };
            delete newSchedules[userId];
            return newSchedules;
        });

        try {
            await removeDocument('schedules', userId);
            toast.info('Horario eliminado', {
                description: `Se eliminó el horario de ${userName}`
            });
        } catch (error) {
            console.error('Error deleting schedule:', error);
            toast.error('Error al eliminar horario');
        }
    }, []);

    const value = React.useMemo(() => ({
        schedules,
        getSchedule,
        updateSchedule,
        copySchedule,
        getAllSchedules,
        deleteSchedule,
        loadDefaultIfNeeded
    }), [schedules]);

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
};

export const useSchedule = () => useContext(ScheduleContext);
