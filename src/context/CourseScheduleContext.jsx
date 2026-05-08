import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { subscribeToCollection, setDocument } from '../lib/firestoreService';

const CourseScheduleContext = createContext();

function courseDocId(course) {
    return course.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Gestiona los horarios oficiales por curso (colección `course_schedules`).
 * Cada documento tiene: { course, blocks: [{ day, startTime, subject }] }
 *
 * Estos horarios son la fuente autoritativa para el PDF de agenda semanal.
 * Si no existe para un curso, el PDF hace fallback a los horarios por docente.
 */
export const CourseScheduleProvider = ({ children }) => {
    const [courseSchedules, setCourseSchedules] = useState({});

    useEffect(() => {
        const unsubscribe = subscribeToCollection('course_schedules', (docs) => {
            const result = {};
            docs.forEach(doc => {
                if (doc.course) result[doc.course] = doc.blocks || [];
            });
            setCourseSchedules(result);
        });
        return () => unsubscribe();
    }, []);

    /**
     * Devuelve los bloques del horario oficial del curso,
     * o null si todavía no se ha configurado ninguno.
     */
    const getCourseSchedule = useCallback((course) => {
        if (!course) return null;
        return Object.prototype.hasOwnProperty.call(courseSchedules, course)
            ? courseSchedules[course]
            : null;
    }, [courseSchedules]);

    const updateCourseSchedule = useCallback(async (course, blocks, user) => {
        const docId = courseDocId(course);
        setCourseSchedules(prev => ({ ...prev, [course]: blocks }));
        try {
            await setDocument('course_schedules', docId, {
                course,
                blocks,
                updatedBy: user ? { id: user.uid, name: user.name || user.email || '' } : null,
            });
            toast.success('Horario de curso guardado');
        } catch (err) {
            console.error('CourseSchedule save error:', err);
            toast.error('Error al guardar');
        }
    }, []);

    const value = useMemo(() => ({
        getCourseSchedule,
        updateCourseSchedule,
    }), [getCourseSchedule, updateCourseSchedule]);

    return (
        <CourseScheduleContext.Provider value={value}>
            {children}
        </CourseScheduleContext.Provider>
    );
};

export const useCourseSchedule = () => useContext(CourseScheduleContext);
