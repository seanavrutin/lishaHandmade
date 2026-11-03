import { Link } from 'react-router';
import { formatDateTime } from '../lib/format';
import { useOpenSale } from '../lib/useOpenSale';

export default function Home() {
  const { sale } = useOpenSale();

  return (
    <div className="space-y-10 py-8">
      <section className="text-center">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Lisha Handmade</h1>
        <p className="mt-2 text-lg text-cocoa-light">קישים ומאפים בעבודת יד, באהבה 💕</p>
      </section>

      {sale && (
        <section className="rounded-2xl bg-blush/40 p-5 text-center">
          <p className="font-display text-2xl">{sale.title}</p>
          <p className="mt-1">ההזמנות נסגרות {formatDateTime(sale.closesAt.toDate())}</p>
          <p className="text-sm text-cocoa-light">איסוף: {sale.pickupText}</p>
          <Link
            to="/order"
            className="mt-4 inline-block rounded-full bg-cocoa px-8 py-3 text-lg font-semibold text-cream"
          >
            להזמנה
          </Link>
        </section>
      )}

      <section className="space-y-3 leading-relaxed">
        <h2 className="font-display text-2xl">קצת עליי</h2>
        <p>
          קוראים לי ליאור, פתחתי את לישה מתוך אהבה ענקית למטבח לאפייה ולקינוחים. זוהי הדרך שלי
          ליצור, לשמח ולהעניק רגעים מתוקים לאנשים, ואשמח להיות איתכם על השולחן בכל הרגעים המרגשים
          השמחים והמשמעותיים שלכם.
        </p>
      </section>
    </div>
  );
}
