import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { Addon, Product } from '@shared/types';
import ImageCropper from '../components/ImageCropper';
import { Button, Card, Field, Loading, ProductImage, inputClass } from '../components/ui';
import { api } from '../data';

const emptyProduct = (): Product => ({
  id: '',
  name: '',
  description: '',
  imageUrl: '',
  basePrice: 60,
  category: '',
  addons: [],
  active: true,
  sort: 0, // set on save: new products go to the end of the catalog
});

const NEW_CATEGORY = '__new__';

export default function ProductEditor() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [typingCategory, setTypingCategory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listProducts().then((list) => {
      setCatalog(list);
      if (isNew) {
        const first = list[0]?.category ?? '';
        setProduct({ ...emptyProduct(), category: first });
        setTypingCategory(!first);
        return;
      }
      const p = list.find((x) => x.id === id);
      if (p) setProduct(p);
      else setNotFound(true);
    });
  }, [id, isNew]);

  // Categories come from the catalog itself – a new one exists as soon as a product uses it.
  const categories = [...new Set(catalog.map((p) => p.category).filter(Boolean))];

  if (notFound) return <Card>המוצר לא נמצא</Card>;
  if (!product) return <Loading />;

  const set = <K extends keyof Product>(key: K, value: Product[K]) => setProduct({ ...product, [key]: value });
  const setAddon = (i: number, patch: Partial<Addon>) =>
    set('addons', product.addons.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));

  // Picking a photo opens the crop step first; the cropped square is what gets uploaded.
  function pick(file: File | undefined) {
    if (!file) return;
    setError('');
    setCropSrc(URL.createObjectURL(file));
  }

  function closeCropper() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const url = await api.uploadImage(file);
      setProduct((p) => (p ? { ...p, imageUrl: url } : p));
      closeCropper();
    } catch (err) {
      closeCropper();
      setError(err instanceof Error ? err.message : 'שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!product!.name.trim()) return setError('נא למלא שם מוצר');
    if (!(product!.basePrice > 0)) return setError('נא למלא מחיר');
    if (product!.addons.some((a) => !a.name.trim())) return setError('לכל תוספת צריך שם');
    const category = product!.category.trim();
    if (!category) return setError('נא לבחור או להוסיף קטגוריה');
    const sort = isNew ? Math.max(0, ...catalog.map((p) => p.sort)) + 1 : product!.sort;
    await api.saveProduct({ ...product!, category, sort });
    if (!isNew) await syncImageToSales(product!.id, product!.imageUrl);
    navigate('/admin/products');
  }

  // Events keep their own copy of each product; the photo should follow the catalog.
  async function syncImageToSales(productId: string, imageUrl: string) {
    const sales = await api.listSales();
    for (const sale of sales) {
      if (!sale.items.some((i) => i.productId === productId && i.imageUrl !== imageUrl)) continue;
      await api.saveSale({
        ...sale,
        items: sale.items.map((i) => (i.productId === productId ? { ...i, imageUrl } : i)),
      });
    }
  }

  async function remove() {
    if (!confirm(`למחוק את "${product!.name}"? (אירועים קיימים לא ישתנו)`)) return;
    await api.deleteProduct(product!.id);
    navigate('/admin/products');
  }

  return (
    <div className="space-y-4">
      {cropSrc && <ImageCropper src={cropSrc} onCancel={closeCropper} onDone={upload} />}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">{isNew ? 'מוצר חדש' : 'עריכת מוצר'}</h1>
        <Link to="/admin/products" className="text-sm underline">
          → לכל המוצרים
        </Link>
      </div>

      <Card className="space-y-3">
        <div className="flex items-center gap-4">
          <ProductImage src={product.imageUrl} category={product.category} className="h-24 w-24 shrink-0 rounded-xl" />
          <div className="space-y-2">
            <label className="inline-block cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
              {uploading ? 'מעלה…' : product.imageUrl ? 'החלפת תמונה' : 'העלאת תמונה'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  pick(e.target.files?.[0]);
                  e.target.value = ''; // so picking the same photo again still opens the cropper
                }}
              />
            </label>
            {product.imageUrl && (
              <button type="button" className="block text-sm underline" onClick={() => set('imageUrl', '')}>
                הסרת תמונה
              </button>
            )}
          </div>
        </div>

        <Field label="שם המוצר">
          <input className={inputClass} value={product.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="תיאור קצר">
          <textarea className={inputClass} rows={2} value={product.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="קטגוריה">
          {typingCategory ? (
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={product.category}
                onChange={(e) => set('category', e.target.value)}
                placeholder="שם הקטגוריה, למשל: מאפים"
                autoFocus
              />
              {categories.length > 0 && (
                <Button
                  variant="secondary"
                  className="shrink-0 px-3 text-sm"
                  onClick={() => {
                    setTypingCategory(false);
                    set('category', categories.includes(product.category) ? product.category : categories[0]);
                  }}
                >
                  ביטול
                </Button>
              )}
            </div>
          ) : (
            <select
              className={inputClass}
              value={product.category}
              onChange={(e) => {
                if (e.target.value === NEW_CATEGORY) {
                  setTypingCategory(true);
                  set('category', '');
                } else set('category', e.target.value);
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={NEW_CATEGORY}>+ קטגוריה חדשה…</option>
            </select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="מחיר (₪)">
            <input
              className={inputClass}
              type="number"
              inputMode="numeric"
              value={product.basePrice || ''}
              onChange={(e) => set('basePrice', Number(e.target.value))}
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">תוספות</h2>
        <p className="text-xs text-muted">למשל ״תוספת גבינה״ ב-10 ₪. הלקוח בוחר כמה מהיחידות יהיו עם התוספת.</p>
        {product.addons.map((a, i) => (
          <div key={a.id} className="flex items-end gap-2">
            <Field label="שם">
              <input className={inputClass} value={a.name} onChange={(e) => setAddon(i, { name: e.target.value })} />
            </Field>
            <div className="w-24 shrink-0">
              <Field label="מחיר">
                <input
                  className={inputClass}
                  type="number"
                  inputMode="numeric"
                  value={a.price}
                  onChange={(e) => setAddon(i, { price: Number(e.target.value) })}
                />
              </Field>
            </div>
            <button
              type="button"
              className="mb-2.5 text-xl text-muted"
              aria-label="הסרת תוספת"
              onClick={() => set('addons', product.addons.filter((_, idx) => idx !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        <Button
          variant="secondary"
          className="text-sm"
          onClick={() =>
            set('addons', [...product.addons, { id: Math.random().toString(36).slice(2, 8), name: 'תוספת גבינה', price: 10 }])
          }
        >
          + הוספת תוספת
        </Button>
      </Card>

      {error && <p className="rounded-xl bg-red-50 p-3 text-red-700 ring-1 ring-red-200">{error}</p>}

      <div className="flex flex-col gap-2">
        <Button onClick={save} className="py-3">
          שמירה
        </Button>
        {!isNew && (
          <Button variant="danger" onClick={remove}>
            מחיקת מוצר
          </Button>
        )}
      </div>
    </div>
  );
}
