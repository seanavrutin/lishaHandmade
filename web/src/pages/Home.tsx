import { Link } from 'react-router';
import { WhatsAppIcon } from '../components/Layout';
import SaleCountdown from '../components/SaleCountdown';
import { buttonClass } from '../components/ui';
import { api } from '../data';
import { useApiData } from '../data/hooks';
import { formatDateTime, whatsappLink } from '../lib/format';
import { useReveal } from '../lib/useReveal';

export default function Home() {
  const { data: sale, loading } = useApiData(() => api.getOpenSale(), []);
  const { data: settings } = useApiData(() => api.getSettings(), []);
  const orderRef = useReveal<HTMLElement>();
  const contactRef = useReveal<HTMLElement>();

  return (
    <div className="pb-8">
      {/* Hero: text slides in from the right, Lior's photo from the left */}
      {/* Phone: portrait on top, text centred below. Desktop: photo on the left, text on the right. */}
      <section className="relative flex min-h-[calc(100svh-5.5rem)] flex-col justify-center overflow-x-clip py-4 sm:py-10">
        <div className="flex flex-col items-center sm:flex-row-reverse sm:items-center sm:gap-12">
          {/* Portrait: upper body in front of an arch in the theme colour, fading into the page at the bottom */}
          <div className="animate-from-left w-full sm:w-[42%]" style={{ animationDelay: '0.15s' }}>
            <div className="hero-fade-bottom relative mx-auto aspect-[6/7] w-[82%] max-w-[330px] overflow-hidden sm:w-full sm:max-w-[400px]">
              <div className="absolute inset-x-[4%] bottom-0 top-[24%] rounded-t-full bg-accent/70" aria-hidden="true" />
              <div className="absolute inset-x-[16%] bottom-0 top-[34%] rounded-t-full ring-1 ring-accent-strong/25" aria-hidden="true" />
              <img
                src="/images/lior.webp"
                alt="ליאור מחזיקה קיש טרי"
                width={721}
                height={1810}
                className="absolute left-1/2 top-[3%] w-[70%] -translate-x-1/2"
                fetchPriority="high"
              />
            </div>
          </div>

          <div className="relative -mt-6 max-w-md space-y-3 text-center sm:mt-0 sm:flex-1 sm:space-y-5 sm:text-start">
            <h1
              className="animate-from-right font-display text-4xl leading-tight sm:text-6xl"
              style={{ animationDelay: '0.3s' }}
            >
              היי, אני ליאור
            </h1>
            <div
              className="animate-from-right mx-auto h-1 w-12 rounded-full bg-accent-strong sm:mx-0"
              style={{ animationDelay: '0.45s' }}
              aria-hidden="true"
            />
            {settings && (
              <p
                className="animate-from-right whitespace-pre-line px-2 text-base leading-relaxed text-ink/85 sm:px-0 sm:text-lg"
                style={{ animationDelay: '0.6s' }}
              >
                {settings.aboutText}
              </p>
            )}
          </div>
        </div>

        <a
          href="#order"
          className="animate-from-right relative mx-auto mt-6 flex flex-col items-center text-sm text-muted"
          style={{ animationDelay: '0.9s' }}
        >
          {sale ? 'להזמנות השבוע' : 'עוד עליי'}
          <span className="animate-nudge text-xl" aria-hidden="true">
            ↓
          </span>
        </a>
      </section>

      {/* Order block fades in on scroll */}
      <section id="order" ref={orderRef} className="reveal scroll-mt-20">
        {!loading && sale ? (
          <div className="relative overflow-hidden rounded-3xl bg-surface p-6 text-center shadow-lg ring-1 ring-line sm:p-10">
            <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-accent/50" aria-hidden="true" />
            <div className="absolute -bottom-20 -right-12 h-44 w-44 rounded-full bg-accent/40" aria-hidden="true" />
            <div className="relative space-y-4">
              <SaleCountdown closesAt={sale.closesAt} />
              <h2 className="font-display text-3xl sm:text-4xl">{sale.title}</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted">{sale.message}</p>
              <dl className="mx-auto grid max-w-sm grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-page p-3">
                  <dt className="text-muted">הזמנות עד</dt>
                  <dd className="mt-0.5 font-semibold">{formatDateTime(sale.closesAt)}</dd>
                </div>
                <div className="rounded-2xl bg-page p-3">
                  <dt className="text-muted">איסוף</dt>
                  <dd className="mt-0.5 font-semibold">{sale.pickupText}</dd>
                </div>
              </dl>
              <Link to="/order" className={buttonClass('primary', 'w-full py-4 text-lg shadow-md sm:w-auto sm:px-16')}>
                להזמנה ←
              </Link>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="rounded-3xl bg-surface p-6 text-center ring-1 ring-line">
              <h2 className="font-display text-2xl">אין כרגע הזמנות פתוחות</h2>
              <p className="mt-2 text-muted">האירוע הבא ייפתח בקרוב – שלחו הודעה כדי לשמוע עליה ראשונים 💕</p>
            </div>
          )
        )}
      </section>

      {settings && (
        <section ref={contactRef} className="reveal mt-12 space-y-3 text-center">
          <h2 className="font-display text-2xl">יש שאלה?</h2>
          <p className="text-muted">מוזמנים לפנות אליי – ליאור, {settings.phone}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <a href={whatsappLink(settings.phone)} target="_blank" rel="noreferrer" className={buttonClass('primary')}>
              <WhatsAppIcon className="h-5 w-5" /> וואטסאפ
            </a>
            <a href={`tel:${settings.phone}`} className={buttonClass('secondary')}>
              📞 התקשרות
            </a>
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
                אינסטגרם
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
