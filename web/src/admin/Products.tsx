import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Card, Loading, ProductImage, buttonClass } from '../components/ui';
import { api } from '../data';
import { useApiData } from '../data/hooks';
import { formatPrice } from '../lib/format';

export default function Products() {
  const { data: products, loading } = useApiData(() => api.listProducts(), []);
  const [seeding, setSeeding] = useState(false);
  if (loading) return <Loading />;

  async function seed() {
    setSeeding(true);
    try {
      await api.seedStarterData();
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">מוצרים</h1>
        <Link to="/admin/products/new" className={buttonClass('primary', 'text-sm')}>
          + מוצר חדש
        </Link>
      </div>
      <p className="text-sm text-muted">
        הקטלוג הקבוע. בכל אירוע בוחרים אילו מוצרים להציע. תמונה חדשה מתעדכנת גם באירועים קיימים; שינוי שם או מחיר חל רק כשמוסיפים את המוצר לאירוע.
      </p>

      {products?.length === 0 && (
        <Card className="space-y-2 text-center">
          <p className="font-semibold">הקטלוג ריק</p>
          <p className="text-sm text-muted">
            אפשר להתחיל מהתפריט הנוכחי (הקישים, עוגת השמרים והסינבונים) ואירוע סופ״ש כטיוטה, ולערוך משם.
          </p>
          <Button onClick={seed} disabled={seeding}>
            {seeding ? 'מייבא…' : 'ייבוא התפריט ההתחלתי'}
          </Button>
        </Card>
      )}

      <ul className="space-y-2">
        {(products ?? []).map((p) => (
          <li key={p.id}>
            <Link
              to={`/admin/products/${p.id}`}
              className="flex items-center gap-3 rounded-2xl bg-surface/80 p-2.5 ring-1 ring-line"
            >
              <ProductImage src={p.imageUrl} category={p.category} className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted">
                  {p.category} · {formatPrice(p.basePrice)}
                  {p.addons.length > 0 && ` · ${p.addons.map((a) => a.name).join(', ')}`}
                </p>
              </div>
              <span aria-hidden="true">‹</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
