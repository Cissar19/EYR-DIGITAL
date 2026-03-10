import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Projector, Laptop, Volume2, Plug, Cable, Monitor, Keyboard, Mouse, Headphones, Webcam, Package, Store } from 'lucide-react';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { useAuth } from './AuthContext';
import { validateRequiredString, validateUserId, validatePositiveNumber, validateEnum, sanitizeText } from '../lib/validation';

const EquipmentContext = createContext();

// ============================================
// DEFAULT FOLDERS
// ============================================
const DEFAULT_FOLDERS = [
    { id: 'supplies', name: 'Insumos', icon: 'Package', color: 'blue' },
    { id: 'kiosk', name: 'Recursos Kiosko', icon: 'Store', color: 'yellow' },
    { id: 'tech', name: 'Enlace', icon: 'Monitor', color: 'purple' }
];

// ============================================
// INITIAL EQUIPMENT CATALOG (Seed Data)
// ============================================
const INITIAL_EQUIPMENT = [
    {
        id: 1,
        name: 'Proyector Epson',
        icon: 'Projector',
        category: 'Tecnología',
        stock: 5,
        status: 'active',
        description: 'Proyector HD para presentaciones',
        folderId: 'tech'
    },
    {
        id: 2,
        name: 'Notebook Lenovo',
        icon: 'Laptop',
        category: 'Tecnología',
        stock: 10,
        status: 'active',
        description: 'Portátil para trabajo en aula',
        folderId: 'tech'
    },
    {
        id: 3,
        name: 'Parlante Bluetooth',
        icon: 'Volume2',
        category: 'Audio',
        stock: 3,
        status: 'active',
        description: 'Altavoz portátil para audio',
        folderId: 'tech'
    },
    {
        id: 4,
        name: 'Alargador / Zapatilla',
        icon: 'Plug',
        category: 'Eléctrico',
        stock: 8,
        status: 'active',
        description: 'Extensión eléctrica múltiple',
        folderId: 'supplies'
    },
    {
        id: 5,
        name: 'Cable HDMI',
        icon: 'Cable',
        category: 'Conectividad',
        stock: 10,
        status: 'active',
        description: 'Cable de conexión de video',
        folderId: 'tech'
    }
];

// ============================================
// ICON MAPPING
// ============================================
export const ICON_MAP = {
    Projector,
    Laptop,
    Volume2,
    Plug,
    Cable,
    Monitor,
    Keyboard,
    Mouse,
    Headphones,
    Webcam,
    Package,
    Store
};

// Helper to get icon component from string
export const getIconComponent = (iconName) => {
    return ICON_MAP[iconName] || Plug;
};

// ============================================
// BACKWARD COMPATIBILITY
// Export as EQUIPMENT_CATALOG for existing components
// ============================================
export const EQUIPMENT_CATALOG = INITIAL_EQUIPMENT.map(item => ({
    ...item,
    icon: getIconComponent(item.icon)
}));

// ============================================
// REQUEST STATUS
// ============================================
export const REQUEST_STATUS = {
    PENDING: { id: 'pending', label: 'Pendiente', color: 'yellow', icon: '🟡' },
    APPROVED: { id: 'approved', label: 'Aprobado', color: 'green', icon: '✅' },
    REJECTED: { id: 'rejected', label: 'Rechazado', color: 'red', icon: '❌' },
    RETURNED: { id: 'returned', label: 'Devuelto', color: 'blue', icon: '🔵' }
};

// ============================================
// TIME BLOCKS
// ============================================
export const TIME_BLOCKS = [
    { id: 1, label: 'Bloque 1', time: '08:00 - 09:30' },
    { id: 2, label: 'Bloque 2', time: '09:45 - 11:15' },
    { id: 3, label: 'Bloque 3', time: '11:30 - 13:00' },
    { id: 4, label: 'Bloque 4', time: '14:00 - 15:30' },
    { id: 5, label: 'Bloque 5', time: '15:45 - 17:15' }
];

// ============================================
// EQUIPMENT PROVIDER
// ============================================
const ADMIN_ROLES = ['admin', 'super_admin', 'director'];
const VALID_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'returned'];

export const EquipmentProvider = ({ children }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [equipmentList, setEquipmentList] = useState([]);
    const [folders, setFolders] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial fetch and subscription
    useEffect(() => {
        let unsubscribeFolders;
        let unsubscribeEquipment;
        let unsubscribeRequests;

        const initData = async () => {
            // Subscribe to Folders
            unsubscribeFolders = subscribeToCollection('equipment_folders', (docs) => {
                // If collection is empty, seed defaults (only locally until someone adds a folder to avoid spam writes, or just show them)
                // For simplicity, we just use DEFAULT_FOLDERS if docs is empty.
                if (docs.length === 0) {
                    setFolders(DEFAULT_FOLDERS);
                    DEFAULT_FOLDERS.forEach(f => createDocument('equipment_folders', f, f.id));
                } else {
                    setFolders(docs);
                }
            });

            // Subscribe to Equipment
            unsubscribeEquipment = subscribeToCollection('equipment', (docs) => {
                if (docs.length === 0) {
                    setEquipmentList(INITIAL_EQUIPMENT);
                    INITIAL_EQUIPMENT.forEach(e => createDocument('equipment', { ...e, id: undefined }, String(e.id)));
                } else {
                    // DATA CLEANUP: Remove orphan items (items without folderId)
                    const validInventory = docs.filter(item => item.folderId);
                    setEquipmentList(validInventory);
                }
            });

            // Subscribe to Requests
            unsubscribeRequests = subscribeToCollection('equipment_requests', (docs) => {
                // Sort by creation date descending
                setRequests(docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
            });

            setIsInitialized(true);
        };

        initData();

        return () => {
            if (unsubscribeFolders) unsubscribeFolders();
            if (unsubscribeEquipment) unsubscribeEquipment();
            if (unsubscribeRequests) unsubscribeRequests();
        };
    }, []);

    // ============================================
    // FOLDER CRUD OPERATIONS
    // ============================================

    const addFolder = React.useCallback(async (folderData) => {
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para crear carpetas');
            return null;
        }
        validateRequiredString(folderData.name, 'nombre carpeta', 100);

        const newFolder = {
            name: sanitizeText(folderData.name),
            icon: folderData.icon || 'Package',
            color: folderData.color || 'blue',
            createdAt: new Date().toISOString()
        };

        try {
            await createDocument('equipment_folders', newFolder);
            toast.success('Carpeta creada', { description: `${newFolder.name} agregada al inventario` });
            return newFolder;
        } catch (error) {
            console.error(error);
            toast.error('Error al crear carpeta');
            return null;
        }
    }, [user]);

    const deleteFolder = React.useCallback(async (folderId) => {
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para eliminar carpetas');
            return false;
        }

        const folder = folders.find(f => f.id === folderId);
        const itemsInFolder = equipmentList.filter(item => item.folderId === folderId);

        if (itemsInFolder.length > 0) {
            const confirmDelete = window.confirm(
                `La carpeta "${folder?.name}" contiene ${itemsInFolder.length} artículos. ¿Deseas eliminarla de todos modos? Los artículos serán eliminados también.`
            );

            if (!confirmDelete) return false;

            // Delete items in folder
            for (const item of itemsInFolder) {
                await removeDocument('equipment', String(item.id));
            }
        }

        try {
            await removeDocument('equipment_folders', folderId);
            toast.success('Carpeta eliminada', { description: `${folder?.name || 'Carpeta'} ha sido eliminada` });
            return true;
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar carpeta');
            return false;
        }
    }, [user, folders, equipmentList]);

    const updateFolder = React.useCallback(async (folderId, updates) => {
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para actualizar carpetas');
            return;
        }
        if (updates.name) {
            validateRequiredString(updates.name, 'nombre carpeta', 100);
            updates.name = sanitizeText(updates.name);
        }

        try {
            await updateDocument('equipment_folders', folderId, { ...updates, updatedAt: new Date().toISOString() });
            toast.success('Carpeta actualizada', { description: `${updates.name || 'Carpeta'} actualizada correctamente` });
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar carpeta');
        }
    }, [user]);

    const getItemsByFolder = React.useCallback((folderId) => {
        return equipmentList.filter(item => item.folderId === folderId);
    }, [equipmentList]);

    // ============================================
    // INVENTORY CRUD OPERATIONS
    // ============================================

    const addItem = React.useCallback(async (item) => {
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para agregar equipos');
            return null;
        }

        validateRequiredString(item.name, 'nombre del equipo', 100);
        const stock = validatePositiveNumber(item.stock || 1, 'stock');

        const newItem = {
            name: sanitizeText(item.name),
            icon: item.icon || 'Plug',
            category: sanitizeText(item.category || 'General'),
            stock: Math.min(stock, 9999),
            status: 'active',
            description: sanitizeText(item.description || ''),
            folderId: item.folderId || null,
            createdAt: new Date().toISOString()
        };

        try {
            await createDocument('equipment', newItem);
            toast.success('Equipo agregado', { description: `${newItem.name} añadido al inventario` });
            return newItem;
        } catch (error) {
            console.error(error);
            toast.error('Error al agregar equipo');
            return null;
        }
    }, [user]);

    const updateItem = React.useCallback(async (id, updatedFields) => {
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para actualizar equipos');
            return;
        }
        // Validate stock if being updated
        if (updatedFields.stock !== undefined) {
            updatedFields.stock = validatePositiveNumber(updatedFields.stock, 'stock');
            updatedFields.stock = Math.min(updatedFields.stock, 9999);
        }
        if (updatedFields.name) {
            updatedFields.name = sanitizeText(updatedFields.name);
        }

        try {
            await updateDocument('equipment', String(id), { ...updatedFields, updatedAt: new Date().toISOString() });
            toast.success('Equipo actualizado', { description: 'Los cambios se han guardado correctamente' });
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar equipo');
        }
    }, [user]);

    const deleteItem = React.useCallback(async (id) => {
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para eliminar equipos');
            return;
        }

        const item = equipmentList.find(eq => eq.id === id);
        try {
            await removeDocument('equipment', String(id));
            toast.success('Equipo eliminado', { description: `${item?.name || 'Equipo'} ha sido eliminado del inventario` });
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar equipo');
        }
    }, [user, equipmentList]);

    const toggleStatus = React.useCallback(async (id) => {
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para cambiar estado de equipos');
            return;
        }

        const item = equipmentList.find(eq => eq.id === id);
        if (item) {
            const newStatus = item.status === 'active' ? 'maintenance' : 'active';
            try {
                await updateDocument('equipment', String(id), { status: newStatus, updatedAt: new Date().toISOString() });
                toast.info(newStatus === 'maintenance' ? 'Equipo en mantencion' : 'Equipo disponible', { description: item.name });
            } catch (error) {
                console.error(error);
                toast.error('Error al cambiar de estado');
            }
        }
    }, [user, equipmentList]);

    // ============================================
    // REQUEST OPERATIONS
    // ============================================

    const addRequest = React.useCallback(async (requestData) => {
        if (!user) throw new Error('No autenticado');

        validateUserId(requestData.userId);
        validateRequiredString(requestData.userName, 'nombre', 100);

        if (!Array.isArray(requestData.items) || requestData.items.length === 0) {
            throw new Error('Debes seleccionar al menos un equipo');
        }

        const newRequest = {
            userId: requestData.userId,
            userName: sanitizeText(requestData.userName),
            items: requestData.items,
            date: requestData.date,
            block: requestData.block,
            status: REQUEST_STATUS.PENDING.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            const docRef = await createDocument('equipment_requests', newRequest);
            const itemNames = requestData.items
                .map(itemId => equipmentList.find(eq => eq.id === itemId)?.name)
                .filter(Boolean)
                .join(', ');

            toast.success('Solicitud enviada exitosamente', { description: `Equipos: ${itemNames}` });
            return { id: docRef.id, ...newRequest };
        } catch (error) {
            console.error(error);
            toast.error('Error al enviar solicitud');
            return null;
        }
    }, [equipmentList]);

    const getUserRequests = React.useCallback((userId) => {
        return requests.filter(request => request.userId === userId);
    }, [requests]);

    const getAllRequests = React.useCallback(() => {
        return requests;
    }, [requests]);

    const updateRequestStatus = React.useCallback(async (requestId, newStatus) => {
        // Only admins can approve/reject equipment requests
        if (!user || !ADMIN_ROLES.includes(user.role)) {
            toast.error('No tienes permisos para actualizar solicitudes de equipos');
            return;
        }

        validateEnum(newStatus, VALID_REQUEST_STATUSES, 'estado');

        try {
            await updateDocument('equipment_requests', String(requestId), { status: newStatus, updatedAt: new Date().toISOString() });
            const statusInfo = Object.values(REQUEST_STATUS).find(s => s.id === newStatus);
            toast.info(`Solicitud actualizada: ${statusInfo?.label}`);
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar solicitud');
        }
    }, [user]);

    const getEquipmentById = React.useCallback((equipmentId) => {
        return equipmentList.find(eq => eq.id === equipmentId) || null;
    }, [equipmentList]);

    const getAvailableStock = React.useCallback((equipmentId, date, block) => {
        const equipment = getEquipmentById(equipmentId);
        if (!equipment) return 0;

        const reserved = requests.filter(req =>
            req.date === date &&
            req.block === block &&
            req.status !== REQUEST_STATUS.REJECTED.id &&
            req.items.includes(equipmentId)
        ).length;

        return Math.max(0, equipment.stock - reserved);
    }, [requests, getEquipmentById]);

    const getTotalLoaned = React.useCallback(() => {
        return requests.filter(req =>
            req.status === REQUEST_STATUS.APPROVED.id
        ).reduce((total, req) => total + req.items.length, 0);
    }, [requests]);

    const getLowStockItems = React.useCallback((threshold = 2) => {
        return equipmentList.filter(item =>
            item.stock < threshold && item.status === 'active'
        );
    }, [equipmentList]);

    const value = React.useMemo(() => ({
        // Folders
        folders,
        addFolder,
        updateFolder,
        deleteFolder,
        getItemsByFolder,

        // Equipment inventory
        equipmentList,
        addItem,
        updateItem,
        deleteItem,
        toggleStatus,
        getTotalLoaned,
        getLowStockItems,

        // Requests
        requests,
        addRequest,
        getUserRequests,
        getAllRequests,
        updateRequestStatus,
        getEquipmentById,
        getAvailableStock,

        // Deprecated - for backward compatibility
        catalog: equipmentList
    }), [
        folders,
        addFolder,
        updateFolder,
        deleteFolder,
        getItemsByFolder,
        equipmentList,
        addItem,
        updateItem,
        deleteItem,
        toggleStatus,
        getTotalLoaned,
        getLowStockItems,
        requests,
        addRequest,
        getUserRequests,
        getAllRequests,
        updateRequestStatus,
        getEquipmentById,
        getAvailableStock
    ]);

    return (
        <EquipmentContext.Provider value={value}>
            {children}
        </EquipmentContext.Provider>
    );
};

export const useEquipment = () => useContext(EquipmentContext);
