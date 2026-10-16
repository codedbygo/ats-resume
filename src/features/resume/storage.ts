import { useSyncExternalStore } from "react";

// The resume is kept in this browser only, so a refresh does not lose it.
// If storage is blocked (private mode), it lives in memory for the tab.
const KEY = "swaramatch:resume";
const listeners = new Set<() => void>();
let memory = "";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** writeResume saves the text and notifies every component using it. */
export function writeResume(text: string): void {
  memory = text;
  try {
    if (text) localStorage.setItem(KEY, text);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: memory still holds it.
  }
  for (const listener of listeners) listener();
}

/** useResume returns the saved resume; the server render sees an empty one. */
export function useResume(): string {
  return useSyncExternalStore(subscribe, read, () => "");
}
