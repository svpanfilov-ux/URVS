import { useState, useEffect } from 'react';

export function useDelayedLoading(isLoading: boolean, hasData: boolean = false) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    // Никогда не показываем скелет если у нас уже есть кэшированные данные
    if (hasData) {
      setShowSkeleton(false);
      return;
    }
    
    // Показываем скелет мгновенно только для первоначальной загрузки без данных
    if (isLoading && !hasData) {
      setShowSkeleton(true);
    } else {
      setShowSkeleton(false);
    }
  }, [isLoading, hasData]);

  return showSkeleton;
}