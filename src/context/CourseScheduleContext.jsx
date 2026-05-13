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
    const [courseAssistants, setCourseAssistants] = useState({});
    const [coursePieAssistants, setCoursePieAssistants] = useState({});

    useEffect(() => {
        const unsubscribe = subscribeToCollection('course_schedules', (docs) => {
            const schedules = {};
            const assistants = {};
            const pieAssistants = {};
            docs.forEach(doc => {
                if (doc.course) {
                    schedules[doc.course] = doc.blocks || [];
                    assistants[doc.course] = doc.assistant || null;
                    pieAssistants[doc.course] = doc.pieAssistant || null;
                }
            });
            setCourseSchedules(schedules);
            setCourseAssistants(assistants);
            setCoursePieAssistants(pieAssistants);
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

    /** Devuelve { id, name } de la asistente asignada al curso, o null. */
    const getCourseAssistant = useCallback((course) => {
        if (!course) return null;
        return courseAssistants[course] || null;
    }, [courseAssistants]);

    /** Devuelve { id, name } del asistente PIE asignado al curso, o null. */
    const getCoursePieAssistant = useCallback((course) => {
        if (!course) return null;
        return coursePieAssistants[course] || null;
    }, [coursePieAssistants]);

    const updateCourseSchedule = useCallback(async (course, blocks, user) => {
        const docId = courseDocId(course);
        setCourseSchedules(prev => ({ ...prev, [course]: blocks }));
        try {
            await setDocument('course_schedules', docId, {
                course,
                blocks,
                updatedBy: user ? { id: user.uid, name: user.name || user.email || '' } : null,
            }, { merge: true });
            toast.success('Horario de curso guardado');
        } catch (err) {
            console.error('CourseSchedule save error:', err);
            toast.error('Error al guardar');
        }
    }, []);

    /** Actualiza solo la asistente de aula del curso sin tocar los bloques. */
    const updateCourseAssistant = useCallback(async (course, assistant) => {
        const docId = courseDocId(course);
        setCourseAssistants(prev => ({ ...prev, [course]: assistant }));
        try {
            await setDocument('course_schedules', docId, {
                course,
                assistant: assistant || null,
            }, { merge: true });
        } catch (err) {
            console.error('CourseSchedule assistant save error:', err);
            toast.error('Error al guardar asistente');
        }
    }, []);

    /** Actualiza solo el asistente PIE del curso sin tocar los bloques. */
    const updateCoursePieAssistant = useCallback(async (course, pieAssistant) => {
        const docId = courseDocId(course);
        setCoursePieAssistants(prev => ({ ...prev, [course]: pieAssistant }));
        try {
            await setDocument('course_schedules', docId, {
                course,
                pieAssistant: pieAssistant || null,
            }, { merge: true });
        } catch (err) {
            console.error('CourseSchedule pieAssistant save error:', err);
            toast.error('Error al guardar asistente PIE');
        }
    }, []);

    const value = useMemo(() => ({
        courseAssistants,
        coursePieAssistants,
        getCourseSchedule,
        getCourseAssistant,
        getCoursePieAssistant,
        updateCourseSchedule,
        updateCourseAssistant,
        updateCoursePieAssistant,
    }), [courseAssistants, coursePieAssistants, getCourseSchedule, getCourseAssistant, getCoursePieAssistant, updateCourseSchedule, updateCourseAssistant, updateCoursePieAssistant]);

    return (
        <CourseScheduleContext.Provider value={value}>
            {children}
        </CourseScheduleContext.Provider>
    );
};

export const useCourseSchedule = () => useContext(CourseScheduleContext);
