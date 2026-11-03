import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, query, where, type Timestamp } from 'firebase/firestore';
import type { Sale } from '@shared/types';
import { db } from './firebase';

type State =
  | { loading: true; sale: null }
  | { loading: false; sale: Sale<Timestamp> | null };

/** The currently open sale (status "open" and before its closing time), live-updated. */
export function useOpenSale(): State {
  const [state, setState] = useState<State>({ loading: true, sale: null });

  useEffect(() => {
    const q = query(collection(db, 'sales'), where('status', '==', 'open'), limit(5));
    return onSnapshot(
      q,
      (snap) => {
        const now = Date.now();
        const sale = snap.docs
          .map((d) => ({ ...(d.data() as Omit<Sale<Timestamp>, 'id'>), id: d.id }))
          .find((s) => s.opensAt.toMillis() <= now && s.closesAt.toMillis() > now);
        setState({ loading: false, sale: sale ?? null });
      },
      () => setState({ loading: false, sale: null }),
    );
  }, []);

  return state;
}
