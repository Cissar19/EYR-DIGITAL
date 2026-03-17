import {
    LayoutDashboard, Monitor, LifeBuoy, Users, CalendarClock,
    CalendarCheck, HeartPulse, Shuffle, Shield, BarChart3, Settings as SettingsIcon
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

const ALL_ROLES = ['super_admin', 'admin', 'director', 'utp_head', 'inspector', 'convivencia', 'teacher', 'staff', 'printer'];
const MANAGEMENT = ['super_admin', 'admin', 'director', 'utp_head', 'inspector'];

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
        defaultRoles: ['super_admin', 'admin', 'director'],
    },
    {
        key: 'schedules',
        name: 'Gestionar Horarios',
        icon: CalendarClock,
        path: '/admin/schedules',
        category: 'role_specific',
        defaultRoles: ['super_admin', 'admin', 'utp_head'],
    },
    {
        key: 'days_tracking',
        name: 'Gestion Dias Admin',
        icon: CalendarCheck,
        path: '/admin/days-tracking',
        category: 'role_specific',
        defaultRoles: ['super_admin', 'admin', 'utp_head', 'inspector'],
    },
    {
        key: 'medical_leaves',
        name: 'Licencias Medicas',
        icon: HeartPulse,
        path: '/admin/medical-leaves',
        category: 'role_specific',
        defaultRoles: ['super_admin', 'admin', 'director', 'utp_head', 'inspector'],
    },
    {
        key: 'replacements',
        name: 'Registro Reemplazos',
        icon: Shuffle,
        path: '/admin/replacements',
        category: 'role_specific',
        defaultRoles: ['super_admin', 'admin', 'utp_head', 'inspector'],
    },
    {
        key: 'convivencia',
        name: 'Convivencia Escolar',
        icon: Shield,
        path: '/convivencia',
        category: 'role_specific',
        defaultRoles: ['super_admin', 'admin', 'director', 'utp_head', 'inspector', 'convivencia', 'teacher'],
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
        key: 'permissions',
        name: 'Gestionar Permisos',
        icon: SettingsIcon,
        path: '/admin/permissions',
        category: 'role_specific',
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
export const CONFIGURABLE_ROLES = ['director', 'utp_head', 'inspector', 'convivencia', 'teacher', 'staff', 'printer'];
