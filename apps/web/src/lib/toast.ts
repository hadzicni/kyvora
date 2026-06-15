import { toast as sonnerToast } from "sonner";

import { errorMessage } from "@/lib/api/client";

type ToastOptions = {
  description?: string;
};

function normalizeDescription(description?: string | null) {
  return description && description.trim().length > 0 ? description : undefined;
}

export const toast = {
  info(title: string, options?: ToastOptions) {
    sonnerToast.info(title, {
      description: normalizeDescription(options?.description),
    });
  },
  success(title: string, options?: ToastOptions) {
    sonnerToast.success(title, {
      description: normalizeDescription(options?.description),
    });
  },
  warning(title: string, options?: ToastOptions) {
    sonnerToast.warning(title, {
      description: normalizeDescription(options?.description),
    });
  },
  error(title: string, options?: ToastOptions) {
    sonnerToast.error(title, {
      description: normalizeDescription(options?.description),
    });
  },
  critical(title: string, options?: ToastOptions) {
    sonnerToast.error(title, {
      description: normalizeDescription(options?.description),
    });
  },
  errorFromUnknown(error: unknown, title: string) {
    sonnerToast.error(title, {
      description: errorMessage(error),
    });
  },
};
