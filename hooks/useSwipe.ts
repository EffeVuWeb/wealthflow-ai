import React, { useState, useRef } from 'react';

interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

interface SwipeConfig {
    threshold?: number;
    preventDefaultTouchmoveEvent?: boolean;
}

export const useSwipe = (handlers: SwipeHandlers, config: SwipeConfig = {}) => {
    const { threshold = 50, preventDefaultTouchmoveEvent = false } = config;
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (preventDefaultTouchmoveEvent) {
            e.preventDefault();
        }
        setTouchEnd({
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY
        });
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;
        const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

        if (isHorizontalSwipe) {
            if (distanceX > threshold) {
                handlers.onSwipeLeft?.();
            } else if (distanceX < -threshold) {
                handlers.onSwipeRight?.();
            }
        } else {
            if (distanceY > threshold) {
                handlers.onSwipeUp?.();
            } else if (distanceY < -threshold) {
                handlers.onSwipeDown?.();
            }
        }
    };

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
};

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const startY = useRef(0);
    const threshold = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            startY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (window.scrollY === 0 && startY.current > 0) {
            const currentY = e.touches[0].clientY;
            const distance = currentY - startY.current;

            if (distance > 0) {
                setPullDistance(Math.min(distance, threshold * 1.5));
                setIsPulling(distance > threshold);
            }
        }
    };

    const handleTouchEnd = async () => {
        if (isPulling) {
            await onRefresh();
        }
        setIsPulling(false);
        setPullDistance(0);
        startY.current = 0;
    };

    return {
        isPulling,
        pullDistance,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    };
};
