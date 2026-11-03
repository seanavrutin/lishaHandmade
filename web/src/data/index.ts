import { firebaseApi } from './firebaseApi';
import { mockApi } from './mockApi';
import type { DataApi } from './api';

// VITE_DATA_SOURCE=firebase uses the real backend; anything else runs the in-browser demo.
export const api: DataApi = import.meta.env.VITE_DATA_SOURCE === 'firebase' ? firebaseApi : mockApi;

export type { AdminUser, DataApi, OrderData, OrderPatch, SaleData } from './api';
