/**
 * Layouts disponibles para la tabla del alumno en el editor de formatos.
 * Compartido entre EditorFormato.jsx y templateExport.js.
 */
export const INFO_LAYOUTS = {
    'n-f-p': {
        label: 'Nombre | Fecha | Puntaje',
        cols: [
            { field: 'nombre',  label: 'Nombre',                         w: 50 },
            { field: 'fecha',   label: 'Fecha',                          w: 25 },
            { field: 'puntaje', label: 'Puntaje (__ / {total_puntos})',   w: 25 },
        ],
    },
    'n-c-f': {
        label: 'Nombre | Curso | Fecha',
        cols: [
            { field: 'nombre', label: 'Nombre', w: 50 },
            { field: 'curso',  label: 'Curso',  w: 25 },
            { field: 'fecha',  label: 'Fecha',  w: 25 },
        ],
    },
    'n-c-f-p': {
        label: 'Nombre | Curso | Fecha | Puntaje',
        cols: [
            { field: 'nombre',  label: 'Nombre',                         w: 38 },
            { field: 'curso',   label: 'Curso',                          w: 27 },
            { field: 'fecha',   label: 'Fecha',                          w: 18 },
            { field: 'puntaje', label: 'Puntaje (__ / {total_puntos})',   w: 17 },
        ],
    },
    'n-f': {
        label: 'Nombre | Fecha',
        cols: [
            { field: 'nombre',  label: 'Nombre', w: 65 },
            { field: 'fecha',   label: 'Fecha',  w: 35 },
        ],
    },
    'n': {
        label: 'Solo Nombre',
        cols: [
            { field: 'nombre', label: 'Nombre', w: 100 },
        ],
    },
};
