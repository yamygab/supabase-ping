
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, Star, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import { PRODUCTS } from '../constants';

// Sub-component to handle individual image loading states efficiently
const ProductCard: React.FC<{ product: typeof PRODUCTS[0]; priority?: boolean }> = ({ product, priority = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Check if image is already loaded from cache immediately on mount
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, []);

  return (
    <Link
      to={`/product/${product.id}`}
      className="group bg-[#1a1a1a] rounded-3xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:-translate-y-2 relative flex flex-col"
    >
      {/* Image Container with explicit Aspect Ratio to prevent CLS */}
      <div className="relative w-full aspect-video bg-[#0f0f0f] overflow-hidden">
        {/* Loading Skeleton - Visible until image loads */}
        {!isLoaded && (
          <div className="absolute inset-0 z-0 shimmer"></div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent z-10 opacity-30 pointer-events-none"></div>
        
        <img
          ref={imgRef}
          src={product.image}
          alt={product.name}
          loading={priority ? "eager" : "lazy"}
          decoding="async" // Offloads image decoding from main thread
          {...((priority ? { fetchpriority: "high" } : {}) as any)} 
          width="640" 
          height="360"
          // Exact grid calculation: 
          // Mobile (<768px): 1 column = 100vw minus padding
          // Tablet/Desktop (>=768px): 2 columns = 50vw minus padding
          sizes="(min-width: 768px) 50vw, 100vw"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsLoaded(true)} // Reveal image container even on error so user sees broken icon
          className={`w-full h-full object-cover p-0 md:object-contain md:p-2 transform group-hover:scale-105 transition-all duration-700 ${
            isLoaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
          }`}
        />

        {/* Badges */}
        <div className="absolute top-4 right-4 z-20 bg-green-900/80 text-green-300 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-green-500/30 shadow-lg">
          IN STOCK
        </div>
        <div className="absolute bottom-4 left-4 z-20 flex items-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700 shadow-lg">
          <Star className="w-3 h-3 text-yellow-400 mr-1 fill-current" />
          <span className="text-white text-xs font-bold">{product.rating}</span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-xl font-bold text-white font-display group-hover:text-purple-400 transition-colors">
            {product.name}
          </h4>
          <span className="text-lg font-bold text-white bg-purple-900/30 px-3 py-1 rounded-lg border border-purple-500/20">
            ${product.price}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">
          {product.description}
        </p>
        <div className="w-full bg-gray-800 hover:bg-gray-700 text-center py-3 rounded-xl text-sm font-semibold text-gray-300 group-hover:text-white transition-colors mt-auto">
          View Details
        </div>
      </div>
    </Link>
  );
};

const Home: React.FC = () => {
  // Static stats instead of animated state to reduce initial load main thread work
  const stats = { sold: 425, customers: 178, rating: 4.8 };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16 relative animate-fade-in">
        <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-6 font-display tracking-tight drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          Welcome to <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            Yournewvendor
          </span>
        </h2>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
          The premium marketplace for digital assets. Verified, secure, and instant delivery.
        </p>
        
        <a
          href="https://t.me/yournewvendorredirect"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center bg-[#3f87c7] text-white px-8 py-3 rounded-xl hover:bg-[#3476b0] hover:-translate-y-1 transition-all shadow-[0_0_20px_rgba(63,135,199,0.3)] font-semibold"
        >
          <span className="mr-2">Join Telegram</span>
          <Send className="w-4 h-4" />
        </a>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
          <div className="bg-[#1f1f1f] border border-purple-500/20 p-6 rounded-2xl hover:border-purple-500/50 transition-colors">
            <ShoppingBag className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-4xl font-bold text-white font-display">{stats.sold}</p>
            <p className="text-gray-400 text-sm uppercase tracking-wider">Products Sold</p>
          </div>
          <div className="bg-[#1f1f1f] border border-purple-500/20 p-6 rounded-2xl hover:border-purple-500/50 transition-colors">
            <Users className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <p className="text-4xl font-bold text-white font-display">{stats.customers}</p>
            <p className="text-gray-400 text-sm uppercase tracking-wider">Customers</p>
          </div>
          <div className="bg-[#1f1f1f] border border-purple-500/20 p-6 rounded-2xl hover:border-purple-500/50 transition-colors">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-4xl font-bold text-white font-display">{stats.rating}</p>
            <p className="text-gray-400 text-sm uppercase tracking-wider">Trust Rating</p>
          </div>
        </div>
      </section>

      {/* Products Section - applied content-auto to skip rendering offscreen content */}
      <section id="products" className="py-12 max-w-5xl mx-auto content-auto">
        <div className="flex items-center justify-center mb-10">
          <TrendingUp className="w-6 h-6 text-purple-500 mr-2" />
          <h3 className="text-3xl font-bold text-white uppercase font-display tracking-widest">
            Latest Products
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {PRODUCTS.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 2} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
