import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { api } from '../data';
import { useApiData } from '../data/hooks';
import { whatsappLink } from '../lib/format';
import DemoBanner from './DemoBanner';

export default function Layout() {
  const { pathname } = useLocation();
  const { data: settings } = useApiData(() => api.getSettings(), []);
  // The order flow has its own sticky bar at the bottom, so the floating WhatsApp button stays out of its way.
  const showWhatsApp = !pathname.startsWith('/order') && !pathname.startsWith('/checkout');

  return (
    <div className="flex min-h-dvh flex-col">
      <DemoBanner />
      <header className="sticky top-0 z-30 h-14 border-b border-line bg-page/90 backdrop-blur">
        <nav className="mx-auto grid h-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center px-4">
          <NavLink
            to="/"
            end
            aria-label="דף הבית"
            className={({ isActive }) =>
              `flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${
                isActive ? 'bg-accent/60 ring-transparent' : 'ring-line hover:bg-accent/40'
              }`
            }
          >
            <HomeIcon className="h-5 w-5" />
            בית
          </NavLink>
          <Link to="/" className="font-display text-lg text-ink sm:text-xl">
            Lisha Handmade
          </Link>
          <div className="flex justify-end">
            {pathname !== '/order' && (
              <Link to="/order" className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary">
                להזמנה
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-line px-4 py-6 text-center text-sm text-muted">
        <p>Lisha Handmade · ליאור · {settings?.phone}</p>
        <p className="mt-2 flex justify-center gap-4">
          <Link to="/terms" className="underline">
            תקנון
          </Link>
          <Link to="/admin" className="underline">
            כניסת מנהלת
          </Link>
        </p>
      </footer>

      {showWhatsApp && settings && (
        <a
          href={whatsappLink(settings.phone)}
          target="_blank"
          rel="noreferrer"
          aria-label="שליחת הודעה בוואטסאפ"
          className="fixed bottom-5 left-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg"
        >
          <WhatsAppIcon className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}

export function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
