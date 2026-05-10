import type { DocumentNode, OperationVariables } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import type { MutationHookOptions } from "@apollo/client/react";
import { toastError, toastSuccess } from "@/lib/toast";

type ToastOptions<TData, TVariables extends OperationVariables> = {
  /**
   * Success toast message. String or function of mutation result data.
   * Omit to suppress success toast (e.g. when the page already navigates away
   * and the new page shows its own confirmation).
   */
  successMessage?: string | ((data: TData) => string);
  /**
   * Override error toast text. Receives the thrown error; defaults to err.message.
   */
  errorMessage?: string | ((err: Error) => string);
} & MutationHookOptions<TData, TVariables>;

/**
 * Wraps Apollo `useMutation` so every call surfaces a sonner toast:
 * - success → green toast with `successMessage` (if provided)
 * - error   → red toast with the error message (purely informative; no action
 *   button — users re-trigger the action from the form/page itself)
 *
 * Returns the same `[mutate, result]` tuple as `useMutation`. The wrapped
 * `mutate` re-throws on error after firing the toast, so callers can `try/catch`
 * to keep the user on the form.
 */
export function useMutationWithToast<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
>(mutation: DocumentNode, options?: ToastOptions<TData, TVariables>) {
  const { successMessage, errorMessage, ...mutationOptions } = options ?? {};

  const [mutate, result] = useMutation<TData, TVariables>(
    mutation,
    mutationOptions,
  );

  const wrappedMutate = (async (callOptions?: unknown) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (mutate as any)(callOptions);
      if (successMessage && res.data) {
        const msg =
          typeof successMessage === "function"
            ? successMessage(res.data as TData)
            : successMessage;
        toastSuccess(msg);
      }
      return res;
    } catch (err) {
      const error = err as Error;
      const msg =
        typeof errorMessage === "function"
          ? errorMessage(error)
          : (errorMessage ?? error.message ?? "Something went wrong");
      toastError(msg);
      throw err;
    }
  }) as typeof mutate;

  return [wrappedMutate, result] as const;
}
