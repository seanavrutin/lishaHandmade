/**
 * Grants (or revokes) the admin role for a user by email.
 *
 *   npm run build && npm run set-admin -- lior@example.com          # grant
 *   npm run build && npm run set-admin -- lior@example.com --revoke # revoke
 *
 * Needs credentials: set GOOGLE_APPLICATION_CREDENTIALS to a service-account key (never commit it),
 * or FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 to target the local emulator.
 * The user must have signed in once before running this.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email) throw new Error('Usage: set-admin <email> [--revoke]');

  initializeApp();
  const user = await getAuth().getUserByEmail(email);
  const admin = flag !== '--revoke';
  await getAuth().setCustomUserClaims(user.uid, { ...user.customClaims, admin });
  console.log(`${email}: admin=${admin}. The user must sign out and back in to pick it up.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
