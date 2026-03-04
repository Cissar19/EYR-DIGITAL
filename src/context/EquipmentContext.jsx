import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Projector, Laptop, Volume2, Plug, Cable, Monitor, Keyboard, Mouse, Headphones, Webcam, Package, Store } from 'lucide-react';

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
export const EquipmentProvider = ({ children }) => {
    const [requests, setRequests] = useState([]);
    const [equipmentList, setEquipmentList] = useState([]);
    const [folders, setFolders] = useState([]);

    // Load folders from localStorage on mount
    useEffect(() => {
        const storedFolders = localStorage.getItem('school_inventory_folders');
        if (storedFolders) {
            try {
                setFolders(JSON.parse(storedFolders));
            } catch (error) {
                console.error('Error loading folders:', error);
                setFolders(DEFAULT_FOLDERS);
            }
        } else {
            // First time - seed with default folders
            setFolders(DEFAULT_FOLDERS);
        }
    }, []);

    // Save folders to localStorage whenever they change
    useEffect(() => {
        if (folders.length > 0) {
            localStorage.setItem('school_inventory_folders', JSON.stringify(folders));
        }
    }, [folders]);

    // Load equipment from localStorage on mount
    useEffect(() => {
        const storedInventory = localStorage.getItem('school_inventory');
        if (storedInventory) {
            try {
                const parsedInventory = JSON.parse(storedInventory);

                // DATA CLEANUP: Remove orphan items (items without folderId)
                // This fixes the "Ghost Data" issue where items exist but don't show in folders
                const validInventory = parsedInventory.filter(item => item.folderId);

                if (validInventory.length !== parsedInventory.length) {
                    console.log(`Cleaned up ${parsedInventory.length - validInventory.length} orphan items`);
                }

                setEquipmentList(validInventory);
            } catch (error) {
                console.error('Error loading inventory:', error);
                setEquipmentList(INITIAL_EQUIPMENT);
            }
        } else {
            // First time - seed with initial data
            setEquipmentList(INITIAL_EQUIPMENT);
        }
    }, []);

    // Save equipment to localStorage whenever it changes
    useEffect(() => {
        if (equipmentList.length > 0) {
            localStorage.setItem('school_inventory', JSON.stringify(equipmentList));
        }
    }, [equipmentList]);

    // Load requests from localStorage on mount
    useEffect(() => {
        const storedRequests = localStorage.getItem('equipment_requests');
        if (storedRequests) {
            try {
                setRequests(JSON.parse(storedRequests));
            } catch (error) {
                console.error('Error loading equipment requests:', error);
                setRequests([]);
            }
        }
    }, []);

    // Save requests to localStorage whenever they change
    useEffect(() => {
        if (requests.length > 0) {
            localStorage.setItem('equipment_requests', JSON.stringify(requests));
        }
    }, [requests]);

    // ============================================
    // INVENTORY CRUD OPERATIONS
    // ============================================

    // ============================================
    // FOLDER CRUD OPERATIONS
    // ============================================

    /**
     * Add a new folder
     * @param {Object} folder - { name, icon, color }
     * @returns {Object} - Created folder
     */
    const addFolder = React.useCallback((folderData) => {
        const newFolder = {
            id: `folder-${Date.now()}`,
            name: folderData.name,
            icon: folderData.icon || 'Package',
            color: folderData.color || 'blue',
            createdAt: new Date().toISOString()
        };

        setFolders(prev => [...prev, newFolder]);

        toast.success('Carpeta creada', {
            description: `${newFolder.name} agregada al inventario`
        });

        return newFolder;
    }, []);

    /**
     * Delete a folder (and optionally handle orphan items)
     * @param {string} folderId - Folder ID
     */
    const deleteFolder = React.useCallback((folderId) => {
        const folder = folders.find(f => f.id === folderId);
        const itemsInFolder = equipmentList.filter(item => item.folderId === folderId);

        if (itemsInFolder.length > 0) {
            const confirmDelete = window.confirm(
                `La carpeta "${folder?.name}" contiene ${itemsInFolder.length} artículos. ¿Deseas eliminarla de todos modos? Los artículos serán eliminados también.`
            );

            if (!confirmDelete) {
                return false;
            }

            // Delete items in folder
            setEquipmentList(prev => prev.filter(item => item.folderId !== folderId));
        }

        setFolders(prev => prev.filter(f => f.id !== folderId));

        toast.success('Carpeta eliminada', {
            description: `${folder?.name || 'Carpeta'} ha sido eliminada`
        });

        return true;
    }, [folders, equipmentList]);

    /**
     * Update folder properties (name, icon, color)
     * @param {string} folderId - Folder ID
     * @param {Object} updates - { name, icon, color }
     */
    const updateFolder = React.useCallback((folderId, updates) => {
        setFolders(prev => prev.map(f =>
            f.id === folderId
                ? { ...f, ...updates, updatedAt: new Date().toISOString() }
                : f
        ));

        toast.success('Carpeta actualizada', {
            description: `${updates.name || 'Carpeta'} actualizada correctamente`
        });
    }, []);

    /**
     * Get items in a specific folder
     * @param {string} folderId - Folder ID
     * @returns {Array} - Items in folder
     */
    const getItemsByFolder = React.useCallback((folderId) => {
        return equipmentList.filter(item => item.folderId === folderId);
    }, [equipmentList]);

    // ============================================
    // INVENTORY CRUD OPERATIONS
    // ============================================

    /**
     * Add a new equipment item to inventory
     * @param {Object} item - { name, icon, category, stock, description, folderId }
     * @returns {Object} - Created item
     */
    const addItem = React.useCallback((item) => {
        const newItem = {
            id: Date.now(),
            name: item.name,
            icon: item.icon || 'Plug',
            category: item.category || 'General',
            stock: parseInt(item.stock) || 1,
            status: 'active',
            description: item.description || '',
            folderId: item.folderId || null,
            createdAt: new Date().toISOString()
        };

        setEquipmentList(prev => [...prev, newItem]);

        toast.success('Equipo agregado', {
            description: `${newItem.name} añadido al inventario`
        });

        return newItem;
    }, []);

    /**
     * Update an existing equipment item
     * @param {number} id - Equipment ID
     * @param {Object} updatedFields - Fields to update
     */
    const updateItem = React.useCallback((id, updatedFields) => {
        setEquipmentList(prev => prev.map(item =>
            item.id === id
                ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() }
                : item
        ));

        toast.success('Equipo actualizado', {
            description: 'Los cambios se han guardado correctamente'
        });
    }, []);

    /**
     * Delete an equipment item
     * @param {number} id - Equipment ID
     */
    const deleteItem = React.useCallback((id) => {
        const item = equipmentList.find(eq => eq.id === id);

        setEquipmentList(prev => prev.filter(item => item.id !== id));

        toast.success('Equipo eliminado', {
            description: `${item?.name || 'Equipo'} ha sido eliminado del inventario`
        });
    }, [equipmentList]);

    /**
     * Toggle equipment status (active/maintenance)
     * @param {number} id - Equipment ID
     */
    const toggleStatus = React.useCallback((id) => {
        setEquipmentList(prev => prev.map(item => {
            if (item.id === id) {
                const newStatus = item.status === 'active' ? 'maintenance' : 'active';

                toast.info(
                    newStatus === 'maintenance'
                        ? 'Equipo en mantención'
                        : 'Equipo disponible',
                    { description: item.name }
                );

                return { ...item, status: newStatus, updatedAt: new Date().toISOString() };
            }
            return item;
        }));
    }, []);

    // ============================================
    // REQUEST OPERATIONS
    // ============================================

    /**
     * Add a new equipment request
     * @param {Object} requestData - { items, date, block, userId, userName }
     * @returns {Object} - Created request
     */
    const addRequest = React.useCallback((requestData) => {
        const newRequest = {
            id: `request-${Date.now()}`,
            userId: requestData.userId,
            userName: requestData.userName,
            items: requestData.items, // Array of equipment IDs
            date: requestData.date,
            block: requestData.block,
            status: REQUEST_STATUS.PENDING.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setRequests(prev => [newRequest, ...prev]);

        const itemNames = requestData.items
            .map(itemId => equipmentList.find(eq => eq.id === itemId)?.name)
            .filter(Boolean)
            .join(', ');

        toast.success('Solicitud enviada exitosamente', {
            description: `Equipos: ${itemNames}`
        });

        return newRequest;
    }, [equipmentList]);

    /**
     * Get requests for a specific user
     * @param {string} userId - User ID
     * @returns {Array} - User's requests
     */
    const getUserRequests = React.useCallback((userId) => {
        return requests.filter(request => request.userId === userId);
    }, [requests]);

    /**
     * Get all requests (for admin)
     * @returns {Array} - All requests
     */
    const getAllRequests = React.useCallback(() => {
        return requests;
    }, [requests]);

    /**
     * Update request status
     * @param {string} requestId - Request ID
     * @param {string} newStatus - New status
     */
    const updateRequestStatus = React.useCallback((requestId, newStatus) => {
        setRequests(prev => prev.map(request =>
            request.id === requestId
                ? { ...request, status: newStatus, updatedAt: new Date().toISOString() }
                : request
        ));

        const statusInfo = Object.values(REQUEST_STATUS).find(s => s.id === newStatus);
        toast.info(`Solicitud actualizada: ${statusInfo?.label}`);
    }, []);

    /**
     * Get equipment by ID
     * @param {number} equipmentId - Equipment ID
     * @returns {Object|null} - Equipment or null
     */
    const getEquipmentById = React.useCallback((equipmentId) => {
        return equipmentList.find(eq => eq.id === equipmentId) || null;
    }, [equipmentList]);

    /**
     * Get available stock for equipment on a specific date/block
     * @param {number} equipmentId - Equipment ID
     * @param {string} date - Date string
     * @param {number} block - Block number
     * @returns {number} - Available stock
     */
    const getAvailableStock = React.useCallback((equipmentId, date, block) => {
        const equipment = getEquipmentById(equipmentId);
        if (!equipment) return 0;

        // Count how many times this equipment is requested for the same date/block
        const reserved = requests.filter(req =>
            req.date === date &&
            req.block === block &&
            req.status !== REQUEST_STATUS.REJECTED.id &&
            req.items.includes(equipmentId)
        ).length;

        return Math.max(0, equipment.stock - reserved);
    }, [requests, getEquipmentById]);

    /**
     * Get total items on loan (requests that are approved but not returned)
     * @returns {number} - Count of loaned items
     */
    const getTotalLoaned = React.useCallback(() => {
        return requests.filter(req =>
            req.status === REQUEST_STATUS.APPROVED.id
        ).reduce((total, req) => total + req.items.length, 0);
    }, [requests]);

    /**
     * Get items with low stock (< threshold)
     * @param {number} threshold - Stock threshold (default: 2)
     * @returns {Array} - Low stock items
     */
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
