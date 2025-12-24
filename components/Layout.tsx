
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, Clock, ChevronRight } from 'lucide-react';

// Lazy load AuthModal to keep Supabase out of the main bundle
const AuthModal = React.lazy(() => import('./AuthModal'));

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // PERFORMANCE: We only render the AuthModal (and load its heavy chunks) 
  // if the user interacts with login.
  const [hasAuthRequested, setHasAuthRequested] = useState(false);

  const location = useLocation();
  const authSubscription = useRef<any>(null);

  // CLS FIX: Initialize date synchronously
  const [currentDate] = useState<string>(() => {
    const now = new Date();
    const updateTarget = new Date(now);
    updateTarget.setHours(22, 45, 0, 0);
    if (now < updateTarget) {
      updateTarget.setDate(updateTarget.getDate() - 1);
    }
    return updateTarget.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  });

  useEffect(() => {
    // 1. LISTENER FOR AUTH MODAL
    // This allows us to load the modal from anywhere without importing it everywhere
    const handleOpenAuth = () => setHasAuthRequested(true);
    document.addEventListener('open-auth-modal', handleOpenAuth);

    // 2. DEFERRED AUTH CHECK
    // Don't check auth immediately. Let the UI paint first.
    const timer = setTimeout(() => {
        const initAuth = async () => {
            try {
                const { supabase } = await import('../services/supabase');
                const { data } = await supabase.auth.getUser();
                setUser(data.user);

                const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
                    setUser(session?.user ?? null);
                });
                authSubscription.current = authListener.subscription;
            } catch (e) {
                // Silent fail
            }
        };
        initAuth();
    }, 2000); 

    // 3. CLEANUP
    const handlePageHide = async () => {
        try {
            const { disconnectRealtime } = await import('../services/supabase');
            disconnectRealtime();
        } catch (e) {}
    };
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('open-auth-modal', handleOpenAuth);
      window.removeEventListener('pagehide', handlePageHide);
      if (authSubscription.current) authSubscription.current.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
        const { supabase } = await import('../services/supabase');
        await supabase.auth.signOut();
        window.location.reload();
    } catch (e) {
        console.error("Logout failed", e);
    }
  };

  // Robust Auth Trigger
  const triggerAuth = () => {
      setHasAuthRequested(true);
      // Dispatch event to ensure modal opens if it was already mounted but closed
      setTimeout(() => document.dispatchEvent(new CustomEvent('open-auth-modal')), 0);
      setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-purple-100 selection:bg-purple-500/30">
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-center py-2 shadow-lg z-50 min-h-[40px] flex items-center justify-center">
        <h1 className="text-sm md:text-base font-bold font-display tracking-[0.2em] text-white">
          WELCOME TO YOURNEWVENDOR
        </h1>
      </div>

      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center group shrink-0">
            <div className="w-10 h-10 bg-purple-700 rounded-full flex items-center justify-center mr-3 group-hover:bg-purple-600 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.5)]">
              <span className="text-xs font-bold font-display text-white">YNV</span>
            </div>
            <h2 className="text-xl font-semibold font-display text-white group-hover:text-purple-300 transition-colors">
              Yournewvendor
            </h2>
          </Link>

          {/* Desktop Navigation - Visible only on md+ screens */}
          <nav className="hidden md:flex items-center space-x-8 bg-gray-900/50 px-6 py-2 rounded-full border border-white/5 backdrop-blur-sm">
            <Link to="/" className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors relative group">
              Home
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/reviews" className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors relative group">
              Reviews
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full"></span>
            </Link>
            <a
              href="https://t.me/Yournewvendorsupport"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-gray-300 hover:text-purple-400 transition-colors relative group"
            >
              Support
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-500 transition-all group-hover:w-full"></span>
            </a>
          </nav>

          <div className="flex items-center space-x-6">
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center space-x-4 border-r border-gray-800 pr-6 mr-2">
                {user ? (
                    <div className="flex items-center space-x-3">
                        <Link to="/profile" className="text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center">
                            <User className="w-4 h-4 mr-2 text-purple-500" />
                            Account
                        </Link>
                    </div>
                ) : (
                    <button 
                        onClick={triggerAuth}
                        className="text-sm font-bold text-white hover:text-purple-400 transition-colors flex items-center"
                    >
                        Sign In <ChevronRight className="w-3 h-3 ml-1 opacity-50" />
                    </button>
                )}
            </div>

            <Link to="/cart" className="relative hover:text-white transition-colors group">
              <ShoppingCart className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                0
              </span>
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors focus:outline-none md:hidden"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <nav
          className={`absolute top-full left-0 w-full bg-gray-900/95 backdrop-blur-xl border-b border-purple-800 transition-all duration-300 ease-in-out origin-top ${
            isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
          }`}
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link to="/" className="text-gray-300 hover:text-purple-400 font-medium py-2">
              Home
            </Link>
            <Link to="/reviews" className="text-gray-300 hover:text-purple-400 font-medium py-2">
              Reviews
            </Link>
            <a
              href="https://t.me/Yournewvendorsupport"
              target="_blank"
              rel="noreferrer"
              className="text-gray-300 hover:text-purple-400 font-medium py-2">
              Support
            </a>
            {user ? (
              <>
                <Link to="/profile" className="flex items-center text-yellow-400 font-medium py-2">
                  <User className="w-4 h-4 mr-2" /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-red-400 font-medium py-2 text-left"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </>
            ) : (
              <button
                 onClick={triggerAuth}
                 className="text-accent-cyan font-bold py-2 text-left text-blue-400 flex items-center"
              >
                Sign In <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-grow flex flex-col">
        {children}
      </main>

      {location.pathname !== '/reviews' && !location.pathname.startsWith('/product/') && !location.pathname.startsWith('/payment') && (
        <footer className="relative bg-[#050505] border-t border-white/5 pt-12 pb-8 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[100px] bg-purple-600/20 blur-[60px] pointer-events-none"></div>

            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center gap-8">
                <div className="text-center space-y-3 max-w-lg mx-auto">
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Payment through crypto only. If you don't have crypto, contact our
                        <a href="https://t.me/Yournewvendorsupport" target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 font-bold ml-1 transition-colors">
                             Telegram support
                        </a>.
                    </p>
                </div>
                <div className="inline-flex items-center gap-3 bg-[#111] border border-gray-800 text-gray-400 px-5 py-2 rounded-full text-xs font-mono shadow-lg hover:border-purple-500/30 transition-colors">
                    <Clock className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                    <span>Last stock update: <span className="text-gray-200 font-bold">{currentDate}</span></span>
                </div>
            </div>
        </footer>
      )}
      
      {/* 
         Lazily load the AuthModal. 
         Ideally, this chunk is never loaded for 90% of visitors (who just browse),
         saving significant bandwidth and CPU.
      */}
      {hasAuthRequested && (
          <Suspense fallback={null}>
              <AuthModal />
          </Suspense>
      )}
    </div>
  );
};

export default Layout;
