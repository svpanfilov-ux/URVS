import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ObjectStore {
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;
}

export const useObjectStore = create<ObjectStore>()(
  persist(
    (set) => ({
      selectedObjectId: null,
      setSelectedObjectId: (id) => set({ selectedObjectId: id }),
    }),
    {
      name: 'selected-object',
    }
  )
);