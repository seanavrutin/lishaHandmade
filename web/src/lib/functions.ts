import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import type { CreateOrderRequest, CreateOrderResponse } from '@shared/types';
import { app, useEmulators } from './firebase';

const functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION || 'europe-west1');

if (useEmulators) connectFunctionsEmulator(functions, '127.0.0.1', 5001);

export const createOrder = httpsCallable<CreateOrderRequest, CreateOrderResponse>(
  functions,
  'createOrder',
);
