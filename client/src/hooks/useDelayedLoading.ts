import { useState, useEffect } from 'react';

export function useDelayedLoading(isLoading: boolean, delay: number = 300) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      // Показываем скелет только если загрузка длится дольше указанной задержки
      timeoutId = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      // Сразу скрываем скелет когда загрузка завершена
      setShowSkeleton(false);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, delay]);

  return showSkeleton;
}