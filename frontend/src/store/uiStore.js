import { create } from 'zustand';

export const useUiStore = create((set) => ({
  previewFile: null,
  setPreviewFile: (file) => set({ previewFile: file }),
  closePreview: () => set({ previewFile: null }),
}));
