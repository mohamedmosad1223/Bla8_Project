/**
 * useSSEStream — Reusable hook for consuming SSE streaming responses via POST.
 *
 * Backend emits lines like:
 *   data: some text chunk\n\n
 *
 * This hook accumulates all chunks into a single growing string so that
 * react-markdown always receives a complete (partial-but-valid) document.
 */

import { useCallback, useRef } from 'react';

export interface SSEStreamOptions {
  /** POST body (will be JSON-serialised). */
  body: Record<string, unknown>;
  /** Called with the full accumulated text after every new chunk. */
  onChunk: (accumulated: string) => void;
  /** Called once the stream finishes cleanly. */
  onDone?: () => void;
  /** Called if the request or stream throws an error. */
  onError?: (err: unknown) => void;
}

/**
 * Returns a `stream` function you can call to start a streaming request.
 * The returned `abort` ref lets you cancel mid-flight.
 */
export function useSSEStream() {
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (url: string, options: SSEStreamOptions) => {
    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // sends HttpOnly cookies (same as axios withCredentials)
        body: JSON.stringify(options.body),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // leftover holds incomplete lines between chunks
      let leftover = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the binary chunk into text and prepend any leftover
        const text = leftover + decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        // The last element may be an incomplete line — save for next iteration
        leftover = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();

          // Ignore empty lines and SSE completion signal
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          // Strip the "data: " prefix
          const chunk = trimmed.startsWith('data: ')
            ? trimmed.slice(6)
            : trimmed;

          accumulated += chunk;
          options.onChunk(accumulated);
        }
      }

      // Handle any leftover text after the stream ends
      if (leftover.trim() && leftover.trim() !== 'data: [DONE]') {
        const chunk = leftover.trim().startsWith('data: ')
          ? leftover.trim().slice(6)
          : leftover.trim();
        if (chunk) {
          accumulated += chunk;
          options.onChunk(accumulated);
        }
      }

      options.onDone?.();
    } catch (err: unknown) {
      // Ignore AbortError — it's an intentional cancellation
      if (err instanceof Error && err.name === 'AbortError') return;
      options.onError?.(err);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { stream, abort };
}
