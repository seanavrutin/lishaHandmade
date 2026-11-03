import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { app, useEmulators } from './firebase';

export const functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION || 'europe-west1');

if (useEmulators) connectFunctionsEmulator(functions, '127.0.0.1', 5001);
