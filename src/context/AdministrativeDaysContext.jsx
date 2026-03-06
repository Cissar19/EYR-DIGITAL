import React, { createContext, useContext, useState, useEffect } from 'react';

const AdministrativeDaysContext = createContext();

export const useAdministrativeDays = () => useContext(AdministrativeDaysContext);

export const AdministrativeDaysProvider = ({ children }) => {
    // 1. Initialize Requests from LocalStorage (or mock data)
    const [requests, setRequests] = useState(() => {
        const saved = localStorage.getItem('admin_requests');
        if (saved) {
            return JSON.parse(saved);
        }
        // Mock data for testing
        return [
            {
                id: 1001,
                userId: 't-1',
                userName: 'Álvaro Jara',
                date: '2026-02-10',
                reason: 'Reunión con apoderados',
                status: 'approved',
                createdAt: '2026-02-08T10:00:00Z'
            },
            {
                id: 1002,
                userId: 't-1',
                userName: 'Álvaro Jara',
                date: '2026-01-15',
                reason: 'Capacitación pedagógica',
                status: 'approved',
                createdAt: '2026-01-10T14:30:00Z'
            },
            {
                id: 1003,
                userId: 't-2',
                userName: 'Belen Leal',
                date: '2026-02-05',
                reason: 'Trámites personales',
                status: 'rejected',
                createdAt: '2026-02-01T09:15:00Z'
            },
            {
                id: 1004,
                userId: 't-3',
                userName: 'Constanza Vargas',
                date: '2026-02-12',
                reason: 'Consulta médica',
                status: 'pending',
                createdAt: '2026-02-11T16:00:00Z'
            }
        ];
    });

    // 2. Initialize Balances from LocalStorage (or default)
    // We store balances as an object: { userId: number }
    const [balances, setBalances] = useState(() => {
        const saved = localStorage.getItem('admin_balances');
        return saved ? JSON.parse(saved) : {};
    });

    // 3. Initialize Hour Usage (Accumulator)
    const [hoursUsedState, setHoursUsedState] = useState(() => {
        const saved = localStorage.getItem('admin_hours_used');
        return saved ? JSON.parse(saved) : {};
    });

    // 4. Initialize Discount Days Counter
    const [discountDaysState, setDiscountDaysState] = useState(() => {
        const saved = localStorage.getItem('admin_discount_days');
        return saved ? JSON.parse(saved) : {};
    });

    // Validar y guardar siempre en LocalStorage al cambiar
    useEffect(() => {
        localStorage.setItem('admin_requests', JSON.stringify(requests));
    }, [requests]);

    useEffect(() => {
        localStorage.setItem('admin_balances', JSON.stringify(balances));
    }, [balances]);

    useEffect(() => {
        localStorage.setItem('admin_hours_used', JSON.stringify(hoursUsedState));
    }, [hoursUsedState]);

    useEffect(() => {
        localStorage.setItem('admin_discount_days', JSON.stringify(discountDaysState));
    }, [discountDaysState]);

    // --- Actions ---

    // --- Actions ---

    const getBalance = React.useCallback((userId) => {
        // If undefined, return default 6 (or 0 for admin? Logic says 'starts at 6')
        // We'll assume 6 for everyone for simplicity unless logic requires role check here.
        // User requirements: "inicia en 6".
        return balances[userId] !== undefined ? balances[userId] : 6;
    }, [balances]);

    const getHoursUsed = React.useCallback((userId) => {
        // Default 0 hours used
        return hoursUsedState[userId] !== undefined ? hoursUsedState[userId] : 0;
    }, [hoursUsedState]);

    const getDiscountDays = React.useCallback((userId) => {
        return discountDaysState[userId] !== undefined ? discountDaysState[userId] : 0;
    }, [discountDaysState]);

    /**
     * Adjust balance manually (for admin corrections)
     * @param {string} userId - User ID
     * @param {number} newAmount - New balance amount
     */
    const adjustBalance = React.useCallback((userId, newAmount) => {
        const updatedBalances = { ...balances, [userId]: newAmount };
        setBalances(updatedBalances);
        localStorage.setItem('admin_balances', JSON.stringify(updatedBalances));
    }, [balances]);

    const addRequest = React.useCallback((userId, userName, date, reason) => {
        const newRequest = {
            id: Date.now(), // Unique ID
            userId,
            userName,
            date,
            reason,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        setRequests(prev => {
            const updated = [newRequest, ...prev];
            // Immediate LocalStorage update (redundant due to useEffect but requested for robustness)
            localStorage.setItem('admin_requests', JSON.stringify(updated));
            return updated;
        });

        console.log("✅ Solicitud guardada:", newRequest);
        return true;
    }, []); // No deps needed if using functional updates correctly, but requests ref is handled by setRequests

    const approveRequest = React.useCallback((requestId) => {
        // Must read current requests/balances state or use functional updates. 
        // Functional updates are better for stability.
        setRequests(prevRequests => {
            const request = prevRequests.find(r => r.id === requestId);
            if (!request || request.status !== 'pending') return prevRequests;

            const updatedRequests = prevRequests.map(r =>
                r.id === requestId ? { ...r, status: 'approved' } : r
            );

            // Side effect: Update balance (needs access to current balances or separate functional update)
            // This is tricky with two states. We will perform the balance update in a separate strict block or use refs.
            // For now, let's keep it simple but stable.
            // We'll trust the outer scope 'requests' and 'balances' if we add them to deps.
            localStorage.setItem('admin_requests', JSON.stringify(updatedRequests));
            return updatedRequests;
        });

        // We need to trigger balance update separately to be safe with functional updates
        setBalances(prevBalances => {
            // We need to find the request again to get userId... 
            // This structure is complex. Let's simplify: 
            // We will assume the component re-renders correctly and uses the latest scope.
            return prevBalances;
        });
        // REVERTING TO SIMPLE STABLE CLOSURE WITH DEPS for approve/reject to ensure consistency
    }, []);

    // REDEFINING WITH FULL DEPS FOR STABILITY
    const approveRequestStable = React.useCallback((requestId) => {
        const request = requests.find(r => r.id === requestId);
        if (!request || request.status !== 'pending') return;

        // Update Request Status
        const updatedRequests = requests.map(r =>
            r.id === requestId ? { ...r, status: 'approved' } : r
        );
        setRequests(updatedRequests);

        // Decrement Balance
        const currentBalance = balances[request.userId] !== undefined ? balances[request.userId] : 6;
        const newBalances = { ...balances, [request.userId]: currentBalance - 1 };
        setBalances(newBalances);

        // Immediate Persistence
        localStorage.setItem('admin_requests', JSON.stringify(updatedRequests));
        localStorage.setItem('admin_balances', JSON.stringify(newBalances));
    }, [requests, balances]);

    const rejectRequestStable = React.useCallback((requestId) => {
        const request = requests.find(r => r.id === requestId);
        if (!request) return;

        const updatedRequests = requests.map(r =>
            r.id === requestId ? { ...r, status: 'rejected' } : r
        );
        setRequests(updatedRequests);

        localStorage.setItem('admin_requests', JSON.stringify(updatedRequests));
    }, [requests]);

    /**
     * Manually assign a day (Admin functionality)
     * Creates a pre-approved request and immediately decrements balance
     * @param {string} userId - User ID
     * @param {string} userName - User name
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} reason - Reason for the day
     */
    const assignDayManual = React.useCallback((userId, userName, date, reason) => {
        // Create new pre-approved request
        const newRequest = {
            id: Date.now(),
            userId,
            userName,
            date,
            reason,
            status: 'approved', // Pre-approved since admin is creating it
            createdAt: new Date().toISOString()
        };

        // Add to requests
        const updatedRequests = [newRequest, ...requests];
        setRequests(updatedRequests);

        // Decrement balance
        const currentBalance = balances[userId] !== undefined ? balances[userId] : 6;
        const newBalances = { ...balances, [userId]: currentBalance - 1 };
        setBalances(newBalances);

        // Persist to localStorage
        localStorage.setItem('admin_requests', JSON.stringify(updatedRequests));
        localStorage.setItem('admin_balances', JSON.stringify(newBalances));

        return true;
    }, [requests, balances]);

    /**
     * Assign a Special Permission (No balance decrement)
     */
    const assignSpecialPermission = React.useCallback((userId, userName, date, reason) => {
        const newRequest = {
            id: Date.now(),
            userId,
            userName,
            date,
            reason: `[Excepción] ${reason}`,
            status: 'approved',
            createdAt: new Date().toISOString()
        };

        const updatedRequests = [newRequest, ...requests];
        setRequests(updatedRequests);
        localStorage.setItem('admin_requests', JSON.stringify(updatedRequests));

        return true;
    }, [requests]);

    /**
     * Manually assign hours (Admin functionality)
     * Incrments hour usage
     */
    const assignHoursManual = React.useCallback((userId, userName, date, startTime, endTime, minutesUsed, reason) => {
        const newRequest = {
            id: Date.now(),
            userId,
            userName,
            date,
            reason: `[Horas] ${startTime} - ${endTime} (${minutesUsed} min): ${reason}`,
            status: 'approved',
            createdAt: new Date().toISOString(),
            type: 'hour_permission'
        };

        const updatedRequests = [newRequest, ...requests];
        setRequests(updatedRequests);
        localStorage.setItem('admin_requests', JSON.stringify(updatedRequests));

        // Increment hours usage (Cumulative)
        const hoursToAdd = minutesUsed / 60;

        const currentUsage = hoursUsedState[userId] !== undefined ? hoursUsedState[userId] : 0;
        const newUsage = currentUsage + hoursToAdd;

        const newHoursUsedState = { ...hoursUsedState, [userId]: newUsage };
        setHoursUsedState(newHoursUsedState);
        localStorage.setItem('admin_hours_used', JSON.stringify(newHoursUsedState));

        return true;
    }, [requests, hoursUsedState]);

    /**
     * Return hours (subtract from accumulated hours)
     * Creates a record with type: 'hour_return' and subtracts from hoursUsedState
     */
    const returnHoursManual = React.useCallback((userId, userName, date, startTime, endTime, minutesReturned, reason) => {
        const newRequest = {
            id: Date.now(),
            userId,
            userName,
            date,
            reason: `[Devolución] ${startTime} - ${endTime} (${minutesReturned} min): ${reason}`,
            status: 'approved',
            createdAt: new Date().toISOString(),
            type: 'hour_return'
        };

        const updatedRequests = [newRequest, ...requests];
        setRequests(updatedRequests);
        localStorage.setItem('admin_requests', JSON.stringify(updatedRequests));

        // Subtract hours (allows going below 0 = credit)
        const hoursToSubtract = minutesReturned / 60;
        const currentUsage = hoursUsedState[userId] !== undefined ? hoursUsedState[userId] : 0;
        const newUsage = currentUsage - hoursToSubtract;

        const newHoursUsedState = { ...hoursUsedState, [userId]: newUsage };
        setHoursUsedState(newHoursUsedState);
        localStorage.setItem('admin_hours_used', JSON.stringify(newHoursUsedState));

        return true;
    }, [requests, hoursUsedState]);

    /**
     * Assign a Discount Day (does NOT affect admin balance)
     */
    const assignDiscountDay = React.useCallback((userId, userName, date, reason, observation) => {
        const reasonText = observation
            ? `[Descuento] ${reason}: ${observation}`
            : `[Descuento] ${reason}`;

        const newRequest = {
            id: Date.now(),
            userId,
            userName,
            date,
            reason: reasonText,
            status: 'approved',
            createdAt: new Date().toISOString(),
            type: 'discount'
        };

        const updatedRequests = [newRequest, ...requests];
        setRequests(updatedRequests);
        localStorage.setItem('admin_requests', JSON.stringify(updatedRequests));

        // Increment discount counter
        const currentCount = discountDaysState[userId] !== undefined ? discountDaysState[userId] : 0;
        const newDiscountState = { ...discountDaysState, [userId]: currentCount + 1 };
        setDiscountDaysState(newDiscountState);
        localStorage.setItem('admin_discount_days', JSON.stringify(newDiscountState));

        return true;
    }, [requests, discountDaysState]);

    // --- Getters ---

    const getPendingRequests = React.useCallback(() => {
        return requests.filter(r => r.status === 'pending').sort((a, b) => b.id - a.id);
    }, [requests]);

    const getUserRequests = React.useCallback((userId) => {
        return requests.filter(r => r.userId === userId).sort((a, b) => b.id - a.id);
    }, [requests]);

    const value = React.useMemo(() => ({
        requests,
        balances,
        getBalance,
        adjustBalance,
        addRequest,
        approveRequest: approveRequestStable,
        rejectRequest: rejectRequestStable,
        assignDayManual,
        assignSpecialPermission,
        assignHoursManual,
        returnHoursManual,
        assignDiscountDay,
        getPendingRequests,
        getUserRequests,
        getHoursUsed,
        getDiscountDays
    }), [requests, balances, hoursUsedState, discountDaysState, getBalance, getHoursUsed, getDiscountDays, adjustBalance, addRequest, approveRequestStable, rejectRequestStable, assignDayManual, assignSpecialPermission, assignHoursManual, returnHoursManual, assignDiscountDay, getPendingRequests, getUserRequests]);

    return (
        <AdministrativeDaysContext.Provider value={value}>
            {children}
        </AdministrativeDaysContext.Provider>
    );
};
