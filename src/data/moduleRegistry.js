import {
    LayoutDashboard, Monitor, LifeBuoy, Users, CalendarClock,
    CalendarCheck, HeartPulse, Shuffle, Shield, BarChart3, Settings as SettingsIcon, Clock,
    FileCheck, MessageSquare, GraduationCap, HeartHandshake, Stethoscope, ClipboardCheck, Heart, BookOpen, PieChart, LayoutTemplate, Flag
} from 'lucide-react';

/**
 * Canonical registry of all navigable modules.
 *
 * - key: unique identifier (used in Firestore permissions docs)
 * - name: display label in sidebar / permissions UI
 * - icon: lucide-react component
 * - path: router path
 * - category: 'common' | 'role_specific'
 * - defaultRoles: roles that see this module when NO Firestore overrides exist
 *                 (null = everyone, array = only listed roles)
 */

const ALL_ROLES = ['super_admin', 'admin', 'director', 'utp_head', 'inspector', 'convivencia_head', 'convivencia', 'teacher', 'staff', 'printer', 'pie'];
const MANAGEMENT = ['super_admin', 'admin', 'director', 'utp_head', 'inspector', 'convivencia_head'];

export const MODULE_REGISTRY = [
    // ── Common ──
    {
        key: 'dashboard',
        name: 'Inicio',
        icon: LayoutDashboard,
        path: '/',
        category: 'common',
        defaultRoles: null, // everyone
    },
    {
        key: 'labs',
        name: 'Reservar Enlace',
        icon: Monitor,
        path: '/labs',
        category: 'common',
        defaultRoles: null,
    },
    {
        key: 'tickets',
        name: 'Tickets / Soporte',
        icon: LifeBuoy,
        path: '/tickets',
        category: 'common',
        defaultRoles: null,
    },

    // ── Role-specific ──
    {
        key: 'users',
        name: 'Equipo EYR',
        icon: Users,
        path: '/users',
        category: 'role_specific',
        group: 'administracion',
        defaultRoles: ['super_admin', 'admin', 'director'],
    },
    {
        key: 'schedules',
        name: 'Gestionar Horarios',
        icon: CalendarClock,
        path: '/admin/schedules',
        category: 'role_specific',
        group: 'administracion',
        defaultRoles: ['super_admin', 'admin', 'utp_head'],
    },
    {
        key: 'days_tracking',
        name: 'Gestion Dias Admin',
        icon: CalendarCheck,
        path: '/admin/days-tracking',
        category: 'role_specific',
        group: 'administracion',
        defaultRoles: ['super_admin', 'admin', 'utp_head', 'inspector'],
    },
    {
        key: 'medical_leaves',
        name: 'Licencias Medicas',
        icon: HeartPulse,
        path: '/admin/medical-leaves',
        category: 'role_specific',
        group: 'administracion',
        defaultRoles: ['super_admin', 'admin', 'director', 'utp_head', 'inspector'],
    },
    {
        key: 'replacements',
        name: 'Registro Reemplazos',
        icon: Shuffle,
        path: '/admin/replacements',
        category: 'role_specific',
        group: 'administracion',
        defaultRoles: ['super_admin', 'admin', 'utp_head', 'inspector'],
    },
    {
        key: 'convivencia',
        name: 'Convivencia Escolar',
        icon: Shield,
        path: '/convivencia',
        category: 'role_specific',
        defaultRoles: ['super_admin', 'admin', 'director', 'utp_head', 'inspector', 'convivencia_head', 'convivencia', 'teacher'],
    },
    {
        key: 'teacher_hours',
        name: 'Horarios Permanencia',
        icon: Clock,
        path: '/admin/teacher-hours',
        category: 'role_specific',
        group: 'administracion',
        defaultRoles: [...MANAGEMENT, 'convivencia'],
    },
    {
        key: 'attendance_monitor',
        name: 'Atrasos',
        icon: Clock,
        path: '/admin/attendance',
        category: 'role_specific',
        group: 'administracion',
        defaultRoles: ['super_admin', 'admin', 'director', 'utp_head', 'inspector'],
    },
    {
        key: 'justificatives',
        name: 'Justificativos',
        icon: FileCheck,
        path: '/inspectoria/justificativos',
        category: 'role_specific',
        group: 'inspectoria',
        defaultRoles: ['super_admin', 'admin', 'director', 'utp_head', 'inspector'],
    },
    {
        key: 'entrevistas',
        name: 'Entrevistas',
        icon: MessageSquare,
        path: '/inspectoria/entrevistas',
        category: 'role_specific',
        group: 'inspectoria',
        defaultRoles: ['super_admin', 'admin', 'director', 'utp_head', 'inspector'],
    },
    {
        key: 'utp_evaluaciones',
        name: 'Evaluaciones UTP',
        icon: GraduationCap,
        path: '/utp',
        category: 'role_specific',
        group: 'utp',
        defaultRoles: ['super_admin', 'admin', 'director', 'utp_head', 'teacher'],
    },
    {
        key: 'utp_formatos',
        name: 'Crear formatos',
        icon: LayoutTemplate,
        path: '/utp/formatos',
        category: 'role_specific',
        group: 'utp',
        defaultRoles: ['super_admin', 'admin', 'director', 'utp_head'],
    },
    {
        key: 'pie',
        name: 'PIE',
        icon: HeartHandshake,
        path: '/pie',
        category: 'role_specific',
        group: 'pie',
        defaultRoles: ['super_admin', 'admin', 'director', 'utp_head', 'teacher', 'pie'],
    },
    {
        key: 'control_sano',
        name: 'Control Sano',
        icon: ClipboardCheck,
        path: '/enfermeria/control-sano',
        category: 'role_specific',
        group: 'enfermeria',
        defaultRoles: ['super_admin', 'admin', 'director', 'inspector'],
    },
    {
        key: 'ficha_clap',
        name: 'Ficha CLAP',
        icon: Heart,
        path: '/enfermeria/ficha-clap',
        category: 'role_specific',
        group: 'enfermeria',
        defaultRoles: ['super_admin', 'admin', 'director', 'inspector'],
    },
    {
        key: 'atenciones_diarias',
        name: 'Atenciones Diarias',
        icon: BookOpen,
        path: '/enfermeria/atenciones-diarias',
        category: 'role_specific',
        group: 'enfermeria',
        defaultRoles: ['super_admin', 'admin', 'director', 'inspector'],
    },
    {
        key: 'enfermeria_resumen',
        name: 'Resumen',
        icon: PieChart,
        path: '/enfermeria/resumen',
        category: 'role_specific',
        group: 'enfermeria',
        defaultRoles: ['super_admin', 'admin', 'director', 'inspector'],
    },
    {
        key: 'stats',
        name: 'Estadisticas',
        icon: BarChart3,
        path: '/admin/stats',
        category: 'role_specific',
        defaultRoles: [...MANAGEMENT],
    },
    {
        key: 'corrida_escolar',
        name: 'Corrida Escolar',
        icon: Flag,
        path: '/corrida-escolar',
        category: 'role_specific',
        group: 'administracion',
        defaultRoles: ['super_admin', 'admin', 'director', 'inspector'],
    },
    {
        key: 'permissions',
        name: 'Gestionar Permisos',
        icon: SettingsIcon,
        path: '/admin/permissions',
        category: 'role_specific',
        group: 'administracion',
        defaultRoles: ['super_admin', 'admin'],
    },
];

/** Lookup module by key */
export const getModuleByKey = (key) => MODULE_REGISTRY.find(m => m.key === key);

/** Lookup module by path */
export const getModuleByPath = (path) => MODULE_REGISTRY.find(m => m.path === path);

/** All module keys */
export const ALL_MODULE_KEYS = MODULE_REGISTRY.map(m => m.key);

/** Configurable roles (excludes super_admin and admin which always have full access) */
export const CONFIGURABLE_ROLES = ['director', 'utp_head', 'inspector', 'convivencia_head', 'convivencia', 'teacher', 'staff', 'printer', 'pie'];
