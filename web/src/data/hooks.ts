import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { api } from '.';

/** Loads data through the api and reloads it whenever the data changes. */
export function useApiData<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true });
  const run = useCallback(load, deps);

  useEffect(() => {
    let alive = true;
    const fetch = () =>
      run().then(
        (data) => alive && setState({ data, loading: false }),
        (err: Error) => alive && setState({ error: err.message, loading: false }),
      );
    fetch();
    const unsubscribe = api.subscribe(fetch);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [run]);

  return state;
}

/** Current admin user (null when signed out), kept in sync with sign-in / sign-out. */
export function useAdmin() {
  const email = useSyncExternalStore(api.subscribe, () => api.getAdmin()?.email ?? null);
  return email ? api.getAdmin() : null;
}

/** Email of whoever is signed in (admin or not). */
export function useSignedInEmail() {
  return useSyncExternalStore(api.subscribe, () => api.getSignedInEmail());
}

/** Re-renders every `intervalMs` – for countdowns. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
