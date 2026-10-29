import { API_BASE_URL, ApiError, type CreateUploadResponse } from "./api-client";

export interface UploadProgress {
  /** Bytes transferred so far. */
  loaded: number;
  /** Total bytes, or 0 while the browser has not reported a length. */
  total: number;
}

export interface UploadTransportOptions {
  signal?: AbortSignal;
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Browser-only upload transport.
 *
 * `fetch` cannot report request-body progress, so a single file upload goes
 * through XMLHttpRequest instead. The response shape is identical to
 * `api.uploads.create`, so callers can use either.
 *
 * Rejects with {@link ApiError} on a non-2xx response, a `DOMException` named
 * `AbortError` when the signal aborts, and a plain `Error` on network failure.
 */
export function uploadFileWithProgress(
  form: FormData,
  { signal, onProgress }: UploadTransportOptions = {},
): Promise<CreateUploadResponse> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Upload cancelled", "AbortError"));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/uploads`, true);
    xhr.withCredentials = true;
    xhr.responseType = "text";

    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort, { once: true });

    const cleanup = () => signal?.removeEventListener("abort", onAbort);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        onProgress({
          loaded: event.loaded,
          total: event.lengthComputable ? event.total : 0,
        });
      };
    }

    xhr.onload = () => {
      cleanup();
      const text = xhr.responseText;
      let parsed: unknown;
      try {
        parsed = text ? JSON.parse(text) : undefined;
      } catch {
        parsed = text;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const body = parsed as CreateUploadResponse | undefined;
        if (body?.error) {
          reject(new ApiError(xhr.status, body.error, body));
          return;
        }
        if (!body || typeof body.url !== "string" || !body.url) {
          reject(new Error("The server did not return an upload link. Please try again."));
          return;
        }
        resolve(body);
        return;
      }

      const serverMessage =
        parsed && typeof parsed === "object" && "error" in parsed
          ? String((parsed as Record<string, unknown>).error)
          : undefined;
      reject(
        new ApiError(
          xhr.status,
          serverMessage ||
            xhr.statusText ||
            `Upload failed with status ${xhr.status}`,
          parsed,
        ),
      );
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error("Network error during upload"));
    };

    xhr.onabort = () => {
      cleanup();
      reject(new DOMException("Upload cancelled", "AbortError"));
    };

    xhr.ontimeout = () => {
      cleanup();
      reject(new Error("Upload timed out"));
    };

    xhr.send(form);
  });
}

/** True when a rejection came from cancelling rather than from a failure. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
