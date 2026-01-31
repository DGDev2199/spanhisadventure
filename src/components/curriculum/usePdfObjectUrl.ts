import { useEffect, useState } from "react";

type PdfObjectUrlState = {
  objectUrl: string | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Fetches the PDF as a Blob and exposes a blob: URL for embedding.
 * This avoids browser PDF viewers forcing downloads due to Content-Disposition.
 */
export function usePdfObjectUrl(pdfUrl: string, enabled: boolean): PdfObjectUrlState {
  const [state, setState] = useState<PdfObjectUrlState>({
    objectUrl: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled || !pdfUrl) {
      setState((prev) => {
        if (prev.objectUrl) URL.revokeObjectURL(prev.objectUrl);
        return { objectUrl: null, isLoading: false, error: null };
      });
      return;
    }

    let cancelled = false;
    let currentObjectUrl: string | null = null;
    const controller = new AbortController();

    setState((prev) => {
      if (prev.objectUrl) URL.revokeObjectURL(prev.objectUrl);
      return { objectUrl: null, isLoading: true, error: null };
    });

    (async () => {
      try {
        const res = await fetch(pdfUrl, {
          method: "GET",
          signal: controller.signal,
          // Signed URLs are already authorized via query params.
          // Avoid sending credentials by default.
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const blob = await res.blob();
        const asPdf = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
        currentObjectUrl = URL.createObjectURL(asPdf);

        if (cancelled) return;
        setState({ objectUrl: currentObjectUrl, isLoading: false, error: null });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Error desconocido";
        setState({ objectUrl: null, isLoading: false, error: msg });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    };
  }, [pdfUrl, enabled]);

  return state;
}
