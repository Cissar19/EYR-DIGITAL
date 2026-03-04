import { useState, useEffect } from 'react';

const DAYS_MAP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function useCurrentBlock(schedule = []) {
    const [currentBlock, setCurrentBlock] = useState(null);
    const [nextBlock, setNextBlock] = useState(null);
    const [timeStatus, setTimeStatus] = useState({ progress: 0, minutesLeft: 0, minutesUntilNext: 0 });

    useEffect(() => {
        if (!schedule || schedule.length === 0) return;

        const updateTime = () => {
            const now = new Date();
            const currentDayName = DAYS_MAP[now.getDay()];

            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

            // Filter classes for today
            const todayClasses = schedule.filter(block => block.day === currentDayName);

            let active = null;
            let next = null;

            // Find active and next blocks
            for (const block of todayClasses) {
                const [startHour, startMin] = block.startTime.split(':').map(Number);
                const [endHour, endMin] = block.endTime.split(':').map(Number);

                const startTotal = startHour * 60 + startMin;
                const endTotal = endHour * 60 + endMin;

                if (currentTimeMinutes >= startTotal && currentTimeMinutes < endTotal) {
                    active = { ...block, startTotal, endTotal };
                } else if (currentTimeMinutes < startTotal) {
                    if (!next || startTotal < next.startTotal) {
                        next = { ...block, startTotal, endTotal };
                    }
                }
            }

            setCurrentBlock(active);
            setNextBlock(next);

            // Calculate progress and time left
            if (active) {
                const totalDuration = active.endTotal - active.startTotal;
                const elapsed = currentTimeMinutes - active.startTotal;
                const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
                const minutesLeft = active.endTotal - currentTimeMinutes;

                setTimeStatus({ progress, minutesLeft, minutesUntilNext: 0 });
            } else if (next) {
                const minutesUntilNext = next.startTotal - currentTimeMinutes;
                setTimeStatus({ progress: 0, minutesLeft: 0, minutesUntilNext });
            } else {
                setTimeStatus({ progress: 0, minutesLeft: 0, minutesUntilNext: 0 });
            }
        };

        updateTime(); // Initial call
        const interval = setInterval(updateTime, 60000); // 1 minute update

        return () => clearInterval(interval);
    }, [JSON.stringify(schedule)]); // Stabilize with JSON.stringify

    return { currentBlock, nextBlock, ...timeStatus };
}
