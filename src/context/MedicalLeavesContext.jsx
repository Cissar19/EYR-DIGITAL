import React, { createContext, useContext, useState, useEffect } from 'react';

const MedicalLeavesContext = createContext();

export const useMedicalLeaves = () => useContext(MedicalLeavesContext);

export const MedicalLeavesProvider = ({ children }) => {
    const [leaves, setLeaves] = useState(() => {
        const saved = localStorage.getItem('medical_leaves');
        if (saved) {
            return JSON.parse(saved);
        }
        return [
            {
                id: 2001,
                userId: 't-1',
                userName: 'Álvaro Jara',
                startDate: '2026-01-12',
                endDate: '2026-01-16',
                days: 5,
                diagnosis: 'Licencia por cuadro gripal',
                returnDate: '2026-01-19',
                createdAt: '2026-01-11T09:00:00Z'
            },
            {
                id: 2002,
                userId: 't-2',
                userName: 'Belen Leal',
                startDate: '2026-02-03',
                endDate: '2026-02-07',
                days: 5,
                diagnosis: 'Reposo por esguince tobillo derecho',
                returnDate: '2026-02-09',
                createdAt: '2026-02-02T14:30:00Z'
            },
            {
                id: 2003,
                userId: 't-3',
                userName: 'Constanza Vargas',
                startDate: '2026-02-20',
                endDate: '2026-02-22',
                days: 1,
                diagnosis: 'Control postoperatorio',
                returnDate: '2026-02-23',
                createdAt: '2026-02-19T11:00:00Z'
            }
        ];
    });

    useEffect(() => {
        localStorage.setItem('medical_leaves', JSON.stringify(leaves));
    }, [leaves]);

    const addLeave = React.useCallback((userId, userName, startDate, endDate, days, diagnosis, returnDate) => {
        const newLeave = {
            id: Date.now(),
            userId,
            userName,
            startDate,
            endDate,
            days,
            diagnosis,
            returnDate,
            createdAt: new Date().toISOString()
        };

        const updated = [newLeave, ...leaves];
        setLeaves(updated);
        localStorage.setItem('medical_leaves', JSON.stringify(updated));
        return true;
    }, [leaves]);

    const deleteLeave = React.useCallback((id) => {
        const updated = leaves.filter(l => l.id !== id);
        setLeaves(updated);
        localStorage.setItem('medical_leaves', JSON.stringify(updated));
    }, [leaves]);

    const getLeavesByUser = React.useCallback((userId) => {
        return leaves.filter(l => l.userId === userId).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    }, [leaves]);

    const getAllLeaves = React.useCallback(() => {
        return [...leaves].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    }, [leaves]);

    const value = React.useMemo(() => ({
        leaves,
        addLeave,
        deleteLeave,
        getLeavesByUser,
        getAllLeaves
    }), [leaves, addLeave, deleteLeave, getLeavesByUser, getAllLeaves]);

    return (
        <MedicalLeavesContext.Provider value={value}>
            {children}
        </MedicalLeavesContext.Provider>
    );
};
