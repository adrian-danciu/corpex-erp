import { toast } from "sonner";

/**
 * Toast helpers. By design, toasts are purely informative — they do not
 * include action buttons (no Retry, no Open, etc.). If a user wants to retry
 * a failed action, they re-trigger it from the form/page itself.
 */

export const toastSuccess = (message: string, description?: string) =>
  toast.success(message, description ? { description } : undefined);

export const toastError = (message: string, description?: string) =>
  toast.error(message, {
    description,
    duration: 6000,
  });

export const toastInfo = (message: string, description?: string) =>
  toast(message, description ? { description } : undefined);
