import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';
import { FLAGS } from '../lib/featureFlags';
import { apiClient } from '../lib/apiClient';
import { getSocket } from '../lib/socket';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

const initialItems = [
    { id: '1', name: "Proyector EPSON", category: "Tecnología", status: "available", borrowedBy: null, borrowedByName: null },
    { id: '2', name: "Parlante Bluetooth", category: "Audio", status: "available", borrowedBy: null, borrowedByName: null },
    { id: '3', name: "Notebook Lenobo (Sala 4)", category: "Computación", status: "borrowed", borrowedBy: 2, borrowedByName: "Prof. Juan Pérez" },
    { id: '4', name: "Alargador 10m", category: "Electricidad", status: "available", borrowedBy: null, borrowedByName: null },
    { id: '5', name: "Llave Laboratorio Ciencias", category: "Llaves", status: "available", borrowedBy: null, borrowedByName: null },
];

const INITIAL_CATEGORIES = ['Tecnología', 'Audio', 'Computación', 'Electricidad', 'Llaves', 'Otros'];

const normalizeItem = (item) => ({
    ...item,
    borrowedBy: item.borrowed_by ?? item.borrowedBy,
    borrowedByName: item.borrowed_by_name ?? item.borrowedByName,
    borrowedAt: item.borrowed_at ?? item.borrowedAt,
    createdAt: item.created_at ?? item.createdAt,
});

export const InventoryProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);

    const sortItems = (list) => list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    // Persistence with Firestore / API
    useEffect(() => {
        if (FLAGS.USE_NEW_API_INVENTORY) {
            let cancelled = false;

            Promise.all([
                apiClient.get('/inventory'),
                apiClient.get('/inventory/categories'),
            ]).then(([itemsData, catsData]) => {
                if (cancelled) return;
                setItems(sortItems(itemsData.map(normalizeItem)));
                setCategories(catsData.map(c => c.name ?? c));
            }).catch(err => {
                console.error('Error cargando inventario:', err);
            });

            const socket = getSocket();
            const onCreated = (item) => setItems(prev => sortItems([...prev, normalizeItem(item)]));
            const onUpdated = (item) => setItems(prev => sortItems(prev.map(i => i.id === item.id ? normalizeItem(item) : i)));
            const onDeleted = ({ id }) => setItems(prev => prev.filter(i => i.id !== id));

            socket?.on('inventory:created', onCreated);
            socket?.on('inventory:updated', onUpdated);
            socket?.on('inventory:deleted', onDeleted);

            return () => {
                cancelled = true;
                socket?.off('inventory:created', onCreated);
                socket?.off('inventory:updated', onUpdated);
                socket?.off('inventory:deleted', onDeleted);
            };
        }

        // Firebase original
        let unsubscribeCategories;
        let unsubscribeItems;

        const initData = async () => {
            // Subscribe to Categories
            unsubscribeCategories = subscribeToCollection('inventory_categories', (docs) => {
                if (docs.length === 0) {
                    setCategories(INITIAL_CATEGORIES);
                    INITIAL_CATEGORIES.forEach(c => {
                        createDocument('inventory_categories', { name: c }, c);
                    });
                } else {
                    setCategories(docs.map(doc => doc.name));
                }
            });

            // Subscribe to Inventory
            unsubscribeItems = subscribeToCollection('inventory', (docs) => {
                if (docs.length === 0) {
                    setItems(initialItems);
                    initialItems.forEach(item => {
                        // eslint-disable-next-line no-unused-vars
                        const { id, ...itemData } = item;
                        createDocument('inventory', itemData, String(item.id));
                    });
                } else {
                    // Sort descending by createdAt as fallback
                    setItems(docs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
                }
            });
        };

        initData();

        return () => {
            if (unsubscribeCategories) unsubscribeCategories();
            if (unsubscribeItems) unsubscribeItems();
        };
    }, []);

    // --- ITEM ACTIONS ---

    const addItem = async (newItem) => {
        const item = {
            ...newItem,
            status: newItem.status || 'available',
            borrowedBy: null,
            borrowedByName: null,
            createdAt: new Date().toISOString()
        };
        try {
            if (FLAGS.USE_NEW_API_INVENTORY) {
                await apiClient.post('/inventory', item);
                const data = await apiClient.get('/inventory');
                setItems(sortItems(data.map(normalizeItem)));
            } else {
                await createDocument('inventory', item);
            }
        } catch (error) {
            console.error("Error al agregar ítem:", error);
        }
    };

    const updateItem = async (id, validUpdates) => {
        try {
            if (FLAGS.USE_NEW_API_INVENTORY) {
                await apiClient.patch(`/inventory/${id}`, validUpdates);
            } else {
                await updateDocument('inventory', String(id), validUpdates);
            }
        } catch (error) {
            console.error("Error al actualizar ítem:", error);
        }
    };

    const deleteItem = async (id) => {
        try {
            if (FLAGS.USE_NEW_API_INVENTORY) {
                await apiClient.delete(`/inventory/${id}`);
            } else {
                await removeDocument('inventory', String(id));
            }
        } catch (error) {
            console.error("Error al eliminar ítem:", error);
        }
    };

    // Borrowing Logic (Special Update Case)
    const borrowItem = async (itemId, userId, userName) => {
        const item = items.find(i => i.id === itemId);
        if (item && item.status === 'available') {
            const updates = {
                status: 'borrowed',
                borrowedBy: userId,
                borrowedByName: userName,
                borrowedAt: new Date().toISOString()
            };
            try {
                if (FLAGS.USE_NEW_API_INVENTORY) {
                    await apiClient.patch(`/inventory/${itemId}`, updates);
                } else {
                    await updateDocument('inventory', String(itemId), updates);
                }
            } catch (error) {
                console.error("Error al pedir prestado:", error);
            }
        }
    };

    const returnItem = async (itemId) => {
        const item = items.find(i => i.id === itemId);
        if (item) {
            const updates = {
                status: 'available',
                borrowedBy: null,
                borrowedByName: null,
                borrowedAt: null
            };
            try {
                if (FLAGS.USE_NEW_API_INVENTORY) {
                    await apiClient.patch(`/inventory/${itemId}`, updates);
                } else {
                    await updateDocument('inventory', String(itemId), updates);
                }
            } catch (error) {
                console.error("Error al devolver:", error);
            }
        }
    };

    // --- CATEGORY ACTIONS ---

    const addCategory = async (name) => {
        if (!categories.includes(name)) {
            try {
                if (FLAGS.USE_NEW_API_INVENTORY) {
                    await apiClient.post('/inventory/categories', { name });
                    const data = await apiClient.get('/inventory/categories');
                    setCategories(data.map(c => c.name ?? c));
                } else {
                    await createDocument('inventory_categories', { name }, name);
                }
            } catch (error) {
                console.error("Error al agregar categoría:", error);
            }
        }
    };

    const deleteCategory = async (name) => {
        const hasItems = items.some(i => i.category === name);
        if (hasItems) {
            return false;
        }
        try {
            if (FLAGS.USE_NEW_API_INVENTORY) {
                await apiClient.delete(`/inventory/categories/${encodeURIComponent(name)}`);
                setCategories(prev => prev.filter(c => c !== name));
            } else {
                await removeDocument('inventory_categories', name);
            }
            return true;
        } catch (error) {
            console.error("Error al eliminar categoría:", error);
            return false;
        }
    };

    const value = React.useMemo(() => ({
        items,
        categories,
        addItem,
        updateItem,
        deleteItem,
        borrowItem,
        returnItem,
        addCategory,
        deleteCategory
    }), [items, categories]);

    return (
        <InventoryContext.Provider value={value}>
            {children}
        </InventoryContext.Provider>
    );
};
