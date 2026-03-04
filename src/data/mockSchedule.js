export const SCHEDULES = {
    // Prof. Juan Pérez (ID 2)
    2: [
        { day: 'Lunes', startTime: '08:00', endTime: '09:30', subject: 'Matemáticas', grade: '1° Medio A', room: 'Sala 4', color: 'blue' },
        { day: 'Lunes', startTime: '09:45', endTime: '11:15', subject: 'Matemáticas', grade: '2° Medio B', room: 'Sala 6', color: 'blue' },
        { day: 'Martes', startTime: '08:00', endTime: '09:30', subject: 'Jefatura', grade: '1° Medio A', room: 'Sala 4', color: 'emerald' },
        { day: 'Martes', startTime: '11:30', endTime: '13:00', subject: 'Matemáticas', grade: '1° Medio A', room: 'Sala 4', color: 'blue' },
        { day: 'Miércoles', startTime: '08:00', endTime: '09:30', subject: 'Matemáticas', grade: '1° Medio B', room: 'Sala 12', color: 'blue' },
        { day: 'Jueves', startTime: '09:45', endTime: '11:15', subject: 'Planificación', grade: '-', room: 'Sala Profesores', color: 'violet' },
        { day: 'Viernes', startTime: '08:00', endTime: '09:30', subject: 'Matemáticas', grade: '2° Medio B', room: 'Sala 6', color: 'blue' },
        // Mock class for testing "Current" state on Saturday (if needed for demo)
        // { day: 'Sábado', startTime: '13:00', endTime: '15:00', subject: 'Taller Extra', grade: 'Selección', room: 'Gimnasio', color: 'orange' }
    ],
    // Prof. Ana Gómez (ID 3)
    3: [
        { day: 'Lunes', startTime: '08:00', endTime: '09:30', subject: 'Lenguaje', grade: '3° Medio C', room: 'Sala 10', color: 'indigo' },
        { day: 'Lunes', startTime: '11:30', endTime: '13:00', subject: 'Lenguaje', grade: '4° Medio A', room: 'Sala 1', color: 'indigo' },
        { day: 'Miércoles', startTime: '09:45', endTime: '11:15', subject: 'Taller Literario', grade: 'Selección', room: 'Biblioteca', color: 'pink' },
    ],
};

export const ALERTS = [
    { id: 1, text: "Revisar planificaciones 2026", type: "warning" },
    { id: 2, text: "Subir notas 1° control", type: "info" }
];
