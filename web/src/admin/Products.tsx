import { Link } from 'react-router';
import { Loading, ProductImage, buttonClass } from '../components/ui';
import { api } from '../data';
import { useApiData } from '../data/hooks';
import { formatPrice } from '../lib/format';

export default function Products() {
  const { data: products, loading } = useApiData(() => api.listProducts(), []);
  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">מוצרים</h1>
        <Link to="/admin/products/new" className={buttonClass('primary', 'text-sm')}>
          + מוצר חדש
        </Link>
      </div>
      <p className="text-sm text-muted">
        הקטלוג הקבוע. בכל מכירה בוחרים אילו מוצרים להציע. שינוי כאן לא משנה מכירה שכבר פורסמה.
      </p>

      <ul className="space-y-2">
        {(products ?? []).map((p) => (
          <li key={p.id}>
            <Link
              to={`/admin/products/${p.id}`}
              className={`flex items-center gap-3 rounded-2xl bg-surface/80 p-2.5 ring-1 ring-line ${p.active ? '' : 'opacity-50'}`}
            >
              <ProductImage src={p.imageUrl} category={p.category} className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted">
                  {p.category} · {formatPrice(p.basePrice)}
                  {p.addons.length > 0 && ` · ${p.addons.map((a) => a.name).join(', ')}`}
                  {!p.active && ' · מוסתר'}
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
