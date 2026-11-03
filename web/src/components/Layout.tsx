import { Link, Outlet } from 'react-router';

const phone = import.meta.env.VITE_CONTACT_PHONE || '0507811215';
const whatsappUrl = `https://wa.me/972${phone.replace(/^0/, '')}`;

export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-cream-dark bg-cream/90 backdrop-blur">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-display text-xl text-cocoa">
            Lisha Handmade
          </Link>
          <Link
            to="/order"
            className="rounded-full bg-cocoa px-4 py-2 text-sm font-semibold text-cream"
          >
            להזמנה
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-cream-dark px-4 py-6 text-center text-sm text-cocoa-light">
        <p>Lisha Handmade · ליאור · {phone}</p>
      </footer>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="שליחת הודעה בוואטסאפ"
        className="fixed bottom-5 left-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
        </svg>
      </a>
    </div>
  );
}
