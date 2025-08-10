import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';

function genId() {
  return Math.random().toString(36).substr(2, 9);
}

export const useFormBuilderStore = create((set) => ({
  fields: [],
  addField: () => set((state) => ({
    fields: [...state.fields, { id: genId(), type: 'text', label: '', config: {} }],
  })),
  removeField: (id) => set((state) => ({
    fields: state.fields.filter((f) => f.id !== id),
  })),
  updateField: (id, updates) => set((state) => ({
    fields: state.fields.map((f) => f.id === id ? { ...f, ...updates } : f),
  })),
  reorderFields: (oldIndex, newIndex) => set((state) => ({
    fields: arrayMove(state.fields, oldIndex, newIndex)
  })),
}));
