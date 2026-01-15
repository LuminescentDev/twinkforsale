import { createContextId } from "@builder.io/qwik";

export interface ImagePreviewState {
  isOpen: boolean;
  imageUrl: string;
  imageName: string;
}

export interface ImagePreviewStore {
  state: ImagePreviewState;
  openPreview: (url: string, name?: string) => void;
  closePreview: () => void;
}

export const ImagePreviewContext = createContextId<ImagePreviewStore>('image-preview');
