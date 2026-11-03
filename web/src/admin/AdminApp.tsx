import { useEffect, useState } from 'react';
import { GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth } from '../lib/auth';

type AuthState = { status: 'loading' } | { status: 'signedOut' } | { status: 'signedIn'; user: User; isAdmin: boolean };

// Phase 1 TODO: dashboard, production list, orders, products, sales, site content.
export default function AdminApp() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(
    () =>
      onIdTokenChanged(auth, async (user) => {
        if (!user) return setState({ status: 'signedOut' });
        const token = await user.getIdTokenResult();
        setState({ status: 'signedIn', user, isAdmin: token.claims.admin === true });
      }),
    [],
  );

  if (state.status === 'loading') return <p className="p-6 text-center">טוען…</p>;

  if (state.status === 'signedOut') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <h1 className="font-display text-2xl">ניהול Lisha Handmade</h1>
        <button
          onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
          className="rounded-full bg-cocoa px-6 py-3 font-semibold text-cream"
        >
          כניסה עם Google
        </button>
      </div>
    );
  }

  if (!state.isAdmin) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p>לחשבון {state.user.email} אין הרשאת ניהול.</p>
        <button onClick={() => signOut(auth)} className="underline">
          התנתקות
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl">ניהול</h1>
        <button onClick={() => signOut(auth)} className="text-sm underline">
          התנתקות
        </button>
      </header>
      <p className="mt-6 text-cocoa-light">שלום {state.user.displayName} 👋 – מסכי הניהול בדרך.</p>
    </div>
  );
}
