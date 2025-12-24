
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import { AlertCircle } from 'lucide-react';
import Home from './pages/Home'; // Eager load Home for better LCP

// Lazy load other pages
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Payment = lazy(() => import('./pages/Payment'));
const Profile = lazy(() => import('./pages/Profile'));
const Reviews = lazy(() => import('./pages/Reviews'));

// Pure CSS Loader (No JS dependencies required for rendering)
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
  </div>
);

const ThankYou = () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2 font-display">Payment Confirmed!</h1>
        <p className="text-gray-400 mb-8 max-w-sm">Thank you for your purchase. Please check your email for delivery details.</p>
        <Link to="/" className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl transition-colors font-bold shadow-lg">Return Home</Link>
    </div>
);

const NotFound = () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
        <AlertCircle className="w-16 h-16 text-gray-700 mb-6" />
        <h1 className="text-4xl font-bold text-white mb-2 font-display">404</h1>
        <p className="text-gray-400 mb-8">Page not found.</p>
        <Link to="/" className="text-purple-400 hover:text-purple-300 font-semibold">Go back home</Link>
    </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
