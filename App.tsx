import React, { useState, Suspense } from 'react';
import PreviewPage from './components/PreviewPage';
import AnalyticsPage from './components/AnalyticsPage';
import LandingPage from './components/LandingPage';
import DocsPage from './components/docs/DocsPage';
import { motion, AnimatePresence } from 'framer-motion';

const ENABLE_LANDING = import.meta.env.VITE_ENABLE_LANDING === 'true';
const ENABLE_PUBLIC_BUILDER = import.meta.env.VITE_ENABLE_PUBLIC_BUILDER === 'true';

// Builder is lazy loaded since it's heavier and not the first view when landing is enabled
const LazyBuilder = React.lazy(() => import('./components/Builder'));
const CataloniaPage = React.lazy(() => import('./components/CataloniaPage'));

// Helper to get current route
function getRoute(): string {
  if (typeof window === 'undefined') return '/';
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const pathname = window.location.pathname;
  const withoutBase = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  return (withoutBase || '/').replace(/\/$/, '') || '/';
}

// Separate component for the main app with landing page support
function MainApp() {
  const [page, setPage] = useState<'landing' | 'builder'>(ENABLE_LANDING ? 'landing' : 'builder');

  if (!ENABLE_LANDING) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center text-gray-400">
            Loading...
          </div>
        }
      >
        <LazyBuilder />
      </Suspense>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {page === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LandingPage onStart={() => setPage('builder')} />
        </motion.div>
      ) : (
        <Suspense
          fallback={
            <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center text-gray-400">
              Loading builder...
            </div>
          }
        >
          <motion.div
            key="builder"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <LazyBuilder onBack={() => setPage('landing')} />
          </motion.div>
        </Suspense>
      )}
    </AnimatePresence>
  );
}

function App() {
  const route = getRoute();

  if (route === '/preview' || route === '/') {
    return <PreviewPage />;
  }

  // Only allow builder access in development mode or if explicitly enabled
  if ((import.meta.env.DEV || ENABLE_PUBLIC_BUILDER) && route === '/builder') {
    return <MainApp />;
  }

  if (route === '/analytics') {
    return <AnalyticsPage />;
  }

  if (route.startsWith('/doc')) {
    return <DocsPage />;
  }

  if (route === '/cat') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
        <CataloniaPage />
      </Suspense>
    );
  }

  // Fallback for unknown routes, or maybe redirect to /
  return <PreviewPage />;
}

export default App;
