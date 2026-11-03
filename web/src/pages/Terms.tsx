// Draft terms – to be reviewed and finalised with Lior before going live.
export default function Terms() {
  return (
    <article className="space-y-4 py-8 leading-relaxed">
      <h1 className="font-display text-3xl">תקנון</h1>
      <p className="rounded-xl bg-accent/30 p-3 text-sm">טיוטה – התקנון הסופי יעודכן לפני העלייה לאוויר.</p>

      <section>
        <h2 className="font-semibold">הזמנות</h2>
        <p>ההזמנות מתקבלות עד מועד הסגירה של כל מכירה, כפי שמופיע באתר, ובכפוף למלאי.</p>
      </section>
      <section>
        <h2 className="font-semibold">תשלום</h2>
        <p>התשלום מתבצע ב-PayBox מיד לאחר ההזמנה, או באיסוף – לפי האפשרות שנבחרה.</p>
      </section>
      <section>
        <h2 className="font-semibold">איסוף</h2>
        <p>האיסוף במועד ובמקום המפורטים בהזמנה. מוצר שלא נאסף במועד לא יוחזר.</p>
      </section>
      <section>
        <h2 className="font-semibold">ביטול</h2>
        <p>
          ניתן לבטל הזמנה עד מועד סגירת ההזמנות בפנייה לליאור. מאחר שמדובר במזון מתכלה שמוכן בהזמנה אישית, לאחר
          מועד הסגירה לא ניתן לבטל.
        </p>
      </section>
      <section>
        <h2 className="font-semibold">אלרגנים</h2>
        <p>המאפים מוכנים במטבח שבו נעשה שימוש בגלוטן, חלב, ביצים ואגוזים.</p>
      </section>
      <section>
        <h2 className="font-semibold">פרטיות</h2>
        <p>השם ומספר הטלפון משמשים רק לטיפול בהזמנה וליצירת קשר לגביה, ולא יועברו לאף גורם.</p>
      </section>
    </article>
  );
}
