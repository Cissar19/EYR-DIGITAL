export const MOCK_SCHEDULES = {
    // Prof. Juan Pérez (ID 2)
    2: [
        { day: 'Lunes', startTime: '08:00', endTime: '09:30', subject: 'Matemáticas', grade: '1° Medio A', room: 'Sala 4' },
        { day: 'Lunes', startTime: '09:45', endTime: '11:15', subject: 'Matemáticas', grade: '2° Medio B', room: 'Sala 6' },
        { day: 'Martes', startTime: '08:00', endTime: '09:30', subject: 'Jefatura', grade: '1° Medio A', room: 'Sala 4' },
        { day: 'Martes', startTime: '11:30', endTime: '13:00', subject: 'Matemáticas', grade: '1° Medio A', room: 'Sala 4' },
        { day: 'Miércoles', startTime: '08:00', endTime: '09:30', subject: 'Matemáticas', grade: '1° Medio B', room: 'Sala 12' },
        { day: 'Jueves', startTime: '09:45', endTime: '11:15', subject: 'Planificación', grade: '-', room: 'Sala Profesores' },
        { day: 'Viernes', startTime: '08:00', endTime: '09:30', subject: 'Matemáticas', grade: '2° Medio B', room: 'Sala 6' },
    ],
    // Prof. Ana Gómez (ID 3)
    3: [
        { day: 'Lunes', startTime: '08:00', endTime: '09:30', subject: 'Lenguaje', grade: '3° Medio C', room: 'Sala 10' },
        { day: 'Lunes', startTime: '11:30', endTime: '13:00', subject: 'Lenguaje', grade: '4° Medio A', room: 'Sala 1' },
        { day: 'Miércoles', startTime: '09:45', endTime: '11:15', subject: 'Taller Literario', grade: 'Selección', room: 'Biblioteca' },
    ],
    // Prof. Carlos Ruiz (ID 4)
    4: [
        { day: 'Viernes', startTime: '14:30', endTime: '16:00', subject: 'Historia', grade: '8° Básico', room: 'Sala 3' }
    ]
};

export const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
export const BLOCKS = ['08:00', '09:45', '11:30', '13:00', '14:30', '16:15'];
