import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToCollection, createDocument, updateDocument, removeDocument } from '../lib/firestoreService';

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

export const InventoryProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);

    // Persistence with Firestore
    useEffect(() => {
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
            await createDocument('inventory', item);
        } catch (error) {
            console.error("Error al agregar ítem:", error);
        }
    };

    const updateItem = async (id, validUpdates) => {
        try {
            await updateDocument('inventory', String(id), validUpdates);
        } catch (error) {
            console.error("Error al actualizar ítem:", error);
        }
    };

    const deleteItem = async (id) => {
        try {
            await removeDocument('inventory', String(id));
        } catch (error) {
            console.error("Error al eliminar ítem:", error);
        }
    };

    // Borrowing Logic (Special Update Case)
    const borrowItem = async (itemId, userId, userName) => {
        const item = items.find(i => i.id === itemId);
        if (item && item.status === 'available') {
            try {
                await updateDocument('inventory', String(itemId), {
                    status: 'borrowed',
                    borrowedBy: userId,
                    borrowedByName: userName,
                    borrowedAt: new Date().toISOString()
                });
            } catch (error) {
                console.error("Error al pedir prestado:", error);
            }
        }
    };

    const returnItem = async (itemId) => {
        const item = items.find(i => i.id === itemId);
        if (item) {
            try {
                await updateDocument('inventory', String(itemId), {
                    status: 'available',
                    borrowedBy: null,
                    borrowedByName: null,
                    borrowedAt: null
                });
            } catch (error) {
                console.error("Error al devolver:", error);
            }
        }
    };

    // --- CATEGORY ACTIONS ---

    const addCategory = async (name) => {
        if (!categories.includes(name)) {
            try {
                await createDocument('inventory_categories', { name }, name);
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
            await removeDocument('inventory_categories', name);
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
