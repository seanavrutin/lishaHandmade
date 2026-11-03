import { mockApi } from './mockApi';
import type { DataApi } from './api';

// Swap for the Firebase implementation once the project is set up.
export const api: DataApi = mockApi;

export type { AdminUser, DataApi, OrderData, OrderPatch, SaleData } from './api';
