// SDK 54 moved documentDirectory / readAsStringAsync / writeAsStringAsync out
// of the default export into this legacy subpath — the new default API uses
// object-based File/Directory/Paths classes instead. Using /legacy keeps
// this file's simple string-path approach working without a rewrite.
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useRef, useState } from 'react';

const DIR = FileSystem.documentDirectory;

async function readJsonFile<T>(filename: string): Promise<T | null> {
  if (!DIR) {
    console.warn('[persistence] no documentDirectory available — reads/writes are no-ops on this platform (e.g. web)');
    return null;
  }
  try {
    const path = `${DIR}${filename}`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const contents = await FileSystem.readAsStringAsync(path);
    return JSON.parse(contents) as T;
  } catch (err) {
    console.error(`[persistence] failed to read ${filename}:`, err);
    return null;
  }
}

async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  if (!DIR) return;
  try {
    const path = `${DIR}${filename}`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[persistence] failed to write ${filename}:`, err);
  }
}

/**
 * Persists state to a JSON file on-device (via expo-file-system) so edits
 * survive app reloads, instead of resetting to the seed data every time.
 *
 * On first run (file doesn't exist yet), writes `seed` to disk and uses it.
 * On every later run, loads whatever was last saved. Every call to the
 * returned setter writes the new value through to disk immediately — same
 * usage as useState, just backed by a file instead of memory only.
 *
 * Returns [value, setValue, isLoaded] — isLoaded flips to true once the
 * initial read has completed, so callers can hold off rendering (or hide a
 * splash screen) until real saved data is in, rather than briefly showing
 * the seed data before it's replaced.
 */
export function usePersistentState<T>(
  filename: string,
  seed: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValueState] = useState<T>(seed);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const existing = await readJsonFile<T>(filename);
      if (existing !== null) {
        setValueState(existing);
      } else {
        await writeJsonFile(filename, seed);
      }
      hasLoadedRef.current = true;
      setIsLoaded(true);
    })();
    // Only ever run once per filename — this hook is meant to be called
    // with a fixed filename for the lifetime of the component using it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filename]);

  const setValue = (next: T | ((prev: T) => T)) => {
    setValueState((prev) => {
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
      // Guard against writing before the initial load finishes — otherwise
      // an update that happens to fire during startup could overwrite the
      // real saved file with the seed data before it's even been read.
      if (hasLoadedRef.current) {
        writeJsonFile(filename, resolved);
      }
      return resolved;
    });
  };

  return [value, setValue, isLoaded];
}
