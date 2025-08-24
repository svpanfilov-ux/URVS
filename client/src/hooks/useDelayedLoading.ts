import { useState, useEffect } from 'react';

export function useDelayedLoading(isLoading: boolean, hasData: boolean = false, delay: number = 10) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      // Если у нас уже есть данные (кэшированные), не показываем скелет совсем
      if (hasData) {
        setShowSkeleton(false);
        return;
      }
      
      // Показываем скелет только для первоначальной загрузки после задержки
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
  }, [isLoading, hasData, delay]);

  return showSkeleton;
}