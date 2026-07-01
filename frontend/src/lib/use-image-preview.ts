import { useContext } from "@builder.io/qwik";
import { ImagePreviewContext } from "./image-preview-store";

export const useImagePreview = () => {
  const context = useContext(ImagePreviewContext);

  if (!context) {
    throw new Error('useImagePreview must be used within ImagePreviewProvider');
  }

  return context;
};
