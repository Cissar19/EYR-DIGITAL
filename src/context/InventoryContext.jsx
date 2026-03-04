import React, { createContext, useContext, useState, useEffect } from 'react';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

const initialItems = [
    { id: '1', name: "Proyector EPSON", category: "Tecnología", status: "available", borrowedBy: null, borrowedByName: null },
    { id: '2', name: "Parlante Bluetooth", category: "Audio", status: "available", borrowedBy: null, borrowedByName: null },
    { id: '3', name: "Notebook Lenobo (Sala 4)", category: "Computación", status: "borrowed", borrowedBy: 2, borrowedByName: "Prof. Juan Pérez" },
    { id: '4', name: "Alargador 10m", category: "Electricidad", status: "available", borrowedBy: null, borrowedByName: null },
    { id: '5', name: "Llave Laboratorio Ciencias", category: "Llaves", status: "available", borrowedBy: null, borrowedByName: null },
];

export const InventoryProvider = ({ children }) => {
    // Initial Categories
    const [categories, setCategories] = useState(() => {
        try {
            const saved = localStorage.getItem('inventory_categories');
            return saved ? JSON.parse(saved) : ['Tecnología', 'Audio', 'Computación', 'Electricidad', 'Llaves', 'Otros'];
        } catch (error) {
            console.error("Error loading categories", error);
            return ['Tecnología', 'Audio', 'Computación', 'Electricidad', 'Llaves', 'Otros'];
        }
    });

    const [items, setItems] = useState(() => {
        try {
            const saved = localStorage.getItem('inventory');
            return saved ? JSON.parse(saved) : initialItems;
        } catch (error) {
            console.error("Error loading inventory", error);
            return initialItems;
        }
    });

    // Persistence
    useEffect(() => {
        localStorage.setItem('inventory', JSON.stringify(items));
    }, [items]);

    useEffect(() => {
        localStorage.setItem('inventory_categories', JSON.stringify(categories));
    }, [categories]);

    // --- ITEM ACTIONS ---

    const addItem = (newItem) => {
        const item = {
            ...newItem,
            id: crypto.randomUUID(), // Robust ID generation
            status: newItem.status || 'available',
            borrowedBy: null,
            borrowedByName: null,
            createdAt: new Date().toISOString()
        };
        // Add to beginning of array (LIFO for UI)
        setItems(prev => [item, ...prev]);
    };

    const updateItem = (id, validUpdates) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...validUpdates } : item
        ));
    };

    const deleteItem = (id) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    // Borrowing Logic (Special Update Case)
    const borrowItem = (itemId, userId, userName) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId && item.status === 'available') {
                return {
                    ...item,
                    status: 'borrowed',
                    borrowedBy: userId,
                    borrowedByName: userName,
                    borrowedAt: new Date().toISOString()
                };
            }
            return item;
        }));
    };

    const returnItem = (itemId) => {
        setItems(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    status: 'available',
                    borrowedBy: null,
                    borrowedByName: null,
                    borrowedAt: null
                };
            }
            return item;
        }));
    };

    // --- CATEGORY ACTIONS ---

    const addCategory = (name) => {
        if (!categories.includes(name)) {
            setCategories(prev => [...prev, name]);
        }
    };

    const deleteCategory = (name) => {
        // Validation handled in UI key logic usually, but here as failsafe
        const hasItems = items.some(i => i.category === name);
        if (hasItems) {
            // We return false to indicate failure if needed, or handle via throw
            // For now, we just don't delete. UI should check before calling.
            return false;
        }
        setCategories(prev => prev.filter(c => c !== name));
        return true;
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
