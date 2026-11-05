// Demo data based on Lior's current Google Form menu.
import type { Addon, Product, SiteSettings } from '@shared/types';
import type { OrderData, SaleData } from './api';

const cheese = (productId: string): Addon => ({ id: `${productId}-cheese`, name: 'תוספת גבינה', price: 10 });

export const seedProducts: Product[] = [
  {
    id: 'pesto-goat',
    name: 'קיש ספיישל פסטו, פלפלים קלויים וגבינת עיזים',
    description: 'חדש בתפריט! מילוי פסטו ביתי, פלפלים קלויים וגבינת עיזים',
    imageUrl: '',
    basePrice: 90,
    category: 'קישים',
    addons: [],
    active: true,
    sort: 1,
  },
  {
    id: 'onion-thyme',
    name: 'קיש משפחתי בצל וטימין',
    description: 'בצל מקורמל וטימין טרי',
    imageUrl: '',
    basePrice: 60,
    category: 'קישים',
    addons: [cheese('onion-thyme')],
    active: true,
    sort: 2,
  },
  {
    id: 'sweet-potato',
    name: 'קיש משפחתי בטטה',
    description: 'בטטה צלויה ותבלינים',
    imageUrl: '',
    basePrice: 60,
    category: 'קישים',
    addons: [cheese('sweet-potato')],
    active: true,
    sort: 3,
  },
  {
    id: 'mushrooms',
    name: 'קיש משפחתי פטריות',
    description: 'פטריות מוקפצות ושום',
    imageUrl: '',
    basePrice: 60,
    category: 'קישים',
    addons: [cheese('mushrooms')],
    active: true,
    sort: 4,
  },
  {
    id: 'chocolate-babka',
    name: 'עוגת שמרים שוקולד',
    description: 'עוגת שמרים רכה במילוי שוקולד עשיר',
    imageUrl: '',
    basePrice: 45,
    category: 'מתוקים',
    addons: [],
    active: true,
    sort: 5,
  },
  {
    id: 'cinnabons',
    name: 'מארז 3 סינבונים',
    description: 'שלושה סינבונים עם ציפוי גבינה',
    imageUrl: '',
    basePrice: 45,
    category: 'מתוקים',
    addons: [],
    active: true,
    sort: 6,
  },
];

export const seedSettings: SiteSettings = {
  aboutText:
    'קוראים לי ליאור, פתחתי את לישה מתוך אהבה ענקית למטבח, לאפייה ולקינוחים. זוהי הדרך שלי ליצור, לשמח ולהעניק רגעים מתוקים לאנשים, ואשמח להיות איתכם על השולחן בכל הרגעים המרגשים, השמחים והמשמעותיים שלכם 💕',
  phone: '0507811215',
  payboxLink: 'https://payboxapp.page.link/demo',
  pickupAddress: 'כתובת לדוגמה – תעודכן בהגדרות',
  instagram: '',
  theme: 'cocoa',
  terms: '',
};

/** Next occurrence of `weekday` (0 = Sunday) at `hour`:00 local time, strictly in the future. */
export function nextWeekday(weekday: number, hour: number, from = new Date()): number {
  const d = new Date(from);
  d.setHours(hour, 0, 0, 0);
  let add = (weekday - d.getDay() + 7) % 7;
  if (add === 0 && d.getTime() <= from.getTime()) add = 7;
  d.setDate(d.getDate() + add);
  return d.getTime();
}

const DAY = 24 * 60 * 60 * 1000;

export function seedSales(now = Date.now()): SaleData[] {
  const closesAt = nextWeekday(3, 17, new Date(now)); // Wednesday 17:00
  const pickupAt = nextWeekday(5, 12, new Date(closesAt)); // following Friday 12:00

  const items = seedProducts.map((p) => ({
    productId: p.id,
    name: p.name,
    description: p.description,
    imageUrl: p.imageUrl,
    category: p.category,
    price: p.basePrice,
    addons: p.addons,
    maxQty: p.id === 'pesto-goat' ? 8 : null,
    sort: p.sort,
  }));

  return [
    {
      id: 'demo-weekend',
      title: 'הזמנות לסופ״ש',
      message:
        'שבוע טוב לכולם 💕\nפותחת הזמנות לסופ״ש הקרוב – קיש או מאפה לסופ״ש, או גם וגם למי שלא מתאפק 😉\nנכנס לתפריט קיש חדש במילוי פסטו, גבינת עיזים ופלפל קלוי!',
      opensAt: now - DAY,
      closesAt,
      pickupAt,
      pickupText: 'שישי בצהריים',
      location: seedSettings.pickupAddress,
      status: 'open',
      paymentModes: ['paybox', 'pickup'],
      maxOrders: null,
      items,
      sold: { 'pesto-goat': 3, 'onion-thyme': 3, 'chocolate-babka': 2 },
      orderCount: 3,
    },
    {
      id: 'demo-last-week',
      title: 'הזמנות לסופ״ש שעבר',
      message: 'שבוע טוב 💕 פותחת הזמנות לסופ״ש!',
      opensAt: now - 8 * DAY,
      closesAt: closesAt - 7 * DAY,
      pickupAt: pickupAt - 7 * DAY,
      pickupText: 'שישי בצהריים',
      location: seedSettings.pickupAddress,
      status: 'closed',
      paymentModes: ['paybox', 'pickup'],
      maxOrders: null,
      items: items.filter((i) => i.productId !== 'pesto-goat'),
      sold: {},
      orderCount: 0,
    },
  ];
}

export function seedOrders(now = Date.now()): OrderData[] {
  return [
    {
      id: 'demo-order-1',
      orderNo: 1001,
      saleId: 'demo-weekend',
      customer: { name: 'דנה כהן', phone: '0521234567' },
      notes: '',
      items: [
        { productId: 'pesto-goat', name: 'קיש ספיישל פסטו, פלפלים קלויים וגבינת עיזים', addonIds: [], addonNames: [], unitPrice: 90, qty: 1, lineTotal: 90 },
        { productId: 'onion-thyme', name: 'קיש משפחתי בצל וטימין', addonIds: ['onion-thyme-cheese'], addonNames: ['תוספת גבינה'], unitPrice: 70, qty: 2, lineTotal: 140 },
      ],
      total: 230,
      paymentMethod: 'paybox',
      paymentStatus: 'paid',
      status: 'new',
      createdAt: now - 20 * 60 * 60 * 1000,
    },
    {
      id: 'demo-order-2',
      orderNo: 1002,
      saleId: 'demo-weekend',
      customer: { name: 'יוסי לוי', phone: '0549876543' },
      notes: 'אפשר לאסוף ב-13:00?',
      items: [
        { productId: 'onion-thyme', name: 'קיש משפחתי בצל וטימין', addonIds: [], addonNames: [], unitPrice: 60, qty: 1, lineTotal: 60 },
        { productId: 'chocolate-babka', name: 'עוגת שמרים שוקולד', addonIds: [], addonNames: [], unitPrice: 45, qty: 2, lineTotal: 90 },
      ],
      total: 150,
      paymentMethod: 'paybox',
      paymentStatus: 'unpaid',
      status: 'new',
      createdAt: now - 6 * 60 * 60 * 1000,
    },
    {
      id: 'demo-order-3',
      orderNo: 1003,
      saleId: 'demo-weekend',
      customer: { name: 'מיכל אברהם', phone: '0505551234' },
      notes: '',
      items: [
        { productId: 'pesto-goat', name: 'קיש ספיישל פסטו, פלפלים קלויים וגבינת עיזים', addonIds: [], addonNames: [], unitPrice: 90, qty: 2, lineTotal: 180 },
      ],
      total: 180,
      paymentMethod: 'pickup',
      paymentStatus: 'unpaid',
      status: 'new',
      createdAt: now - 2 * 60 * 60 * 1000,
    },
  ];
}
