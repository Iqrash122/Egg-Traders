import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDjfk4Y-69kz1KI0IrjXyL2tSR-gWPxLUU',
  authDomain: 'eggstraders.firebaseapp.com',
  projectId: 'eggstraders',
  storageBucket: 'eggstraders.firebasestorage.app',
  messagingSenderId: '908001978791',
  appId: '1:908001978791:web:4d3975863effeb57fb2e82',
  measurementId: 'G-XDLJKN7E4F',
};

let app = null;
let db = null;
let analyticsInstance = null;
let analyticsLogEvent = null;

try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);

  // Dynamically load Analytics so ad-blockers blocking "*analytics*.js" never block app startup
  if (typeof window !== 'undefined') {
    import('firebase/analytics')
      .then(async (analyticsMod) => {
        const supported = await analyticsMod.isSupported();
        if (supported && app) {
          analyticsInstance = analyticsMod.getAnalytics(app);
          analyticsLogEvent = analyticsMod.logEvent;
        }
      })
      .catch(() => {
        // Blocked by ad-blocker or unsupported environment — ignore safely
      });
  }
} catch (err) {
  console.warn('Firebase initialization skipped (running in local mode):', err);
}

export { app, db };

export function trackEvent(eventName, params = {}) {
  if (!analyticsInstance || !analyticsLogEvent) return;
  try {
    analyticsLogEvent(analyticsInstance, eventName, params);
  } catch {
    // Ignore analytics errors
  }
}
