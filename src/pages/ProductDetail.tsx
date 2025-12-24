
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, ShieldCheck, CreditCard, ExternalLink, Minus, Plus, ChevronDown } from 'lucide-react';
import { PRODUCTS } from '../constants';
import { initiateCheckoutSession } from '../services/supabase';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = PRODUCTS.find((p) => p.id === id);

  // Initialize State
  const [email, setEmail] = useState('');
  const [crypto, setCrypto] = useState('BTC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Logic: If options exist, default to first option. If not, empty string.
  const [selectedOption, setSelectedOption] = useState<string>(
    product?.options?.[0]?.value || ''
  );
  
  // Logic: Default quantity is minQty (if exists) or 1
  const [quantity, setQuantity] = useState(product?.minQty || 1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Extra fields for specific products
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setQuantity(product.minQty || 1);
      setSelectedOption(product.options?.[0]?.value || '');
      setError(null);
      
      // CRITICAL FIX: Check if image is already cached by the browser.
      // If cached, onLoad might not fire, so we set loaded state immediately.
      if (imgRef.current && imgRef.current.complete) {
        setImgLoaded(true);
      }
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-4">Product Not Found</h2>
        <Link to="/" className="text-purple-400 hover:text-purple-300">
          Return Home
        </Link>
      </div>
    );
  }

  // PRICING LOGIC:
  const unitPrice = product.options 
    ? (product.options.find(o => o.value === selectedOption)?.price || product.price)
    : product.price;

  // Only use quantity multiplier for PayPal Logs
  const displayPrice = unitPrice * (product.id === 'paypal-logs' ? quantity : 1);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const meta: any = {};
      if (country) meta.country = country;
      if (address) meta.address = address;
      if (selectedOption) meta.selectedOption = selectedOption;

      // Backend Logic
      const session = await initiateCheckoutSession({
        product_sku: product.sku,
        email,
        crypto, 
        qty: product.id === 'paypal-logs' ? quantity : 1,
        option_price_usd: unitPrice, 
        option_meta: meta
      });

      if (session && session.session_id) {
        navigate(`/payment?session_id=${session.session_id}`);
      } else {
        throw new Error("Failed to initialize payment session");
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for quantity adjustment
  const adjustQty = (delta: number) => {
    const min = product.minQty || 1;
    setQuantity(prev => Math.max(min, prev + delta));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        to="/"
        className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
      </Link>

      <div className="bg-[#1a1a1a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Product Image & Info Side */}
          <div className="p-8 border-b md:border-b-0 md:border-r border-gray-800">
            <div className="aspect-video bg-[#0f0f0f] rounded-2xl overflow-hidden mb-6 relative group border border-gray-800">
              {/* Skeleton Loader - Only visible if image hasn't loaded */}
              {!imgLoaded && (
                <>
                  <div className="absolute inset-0 bg-gray-900 z-0" />
                  <div className="absolute inset-0 shimmer z-0 opacity-20" />
                </>
              )}
              
              <img
                ref={imgRef}
                src={product.image}
                alt={product.name}
                loading="eager"
                decoding="async"
                // Fix: Cast to any to avoid React 18 TS error for fetchpriority
                {...({ fetchpriority: "high" } as any)}
                sizes="(max-width: 768px) 100vw, 50vw" // Helping browser determine size
                onLoad={() => setImgLoaded(true)}
                // Fix: If image errors (e.g. 404), set loaded true so the broken image icon is visible 
                // instead of an invisible element.
                onError={() => setImgLoaded(true)}
                className={`w-full h-full object-contain group-hover:scale-105 transition-all duration-700 relative z-10 ${
                   imgLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
              
              <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-gray-700 shadow-lg">
                 <div className="flex items-center text-xs font-bold text-white">
                    <ShieldCheck className="w-3 h-3 text-green-400 mr-1" />
                    Verified
                 </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold font-display text-white mb-2">{product.name}</h1>
            
            {/* Clickable Reviews Link */}
            <Link 
              to={`/reviews?product=${encodeURIComponent(product.name)}`}
              className="flex items-center mb-6 group w-fit hover:bg-white/5 p-2 -ml-2 rounded-lg transition-all cursor-pointer"
            >
               <span className="text-yellow-400 font-bold mr-2 group-hover:scale-110 transition-transform">★ {product.rating}</span>
               <span className="text-gray-500 text-sm underline decoration-gray-700 group-hover:text-purple-400 group-hover:decoration-purple-500 transition-colors flex items-center">
                 (Verified Reviews)
                 <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
               </span>
            </Link>

            <div className="prose prose-invert max-w-none text-sm text-gray-400 mb-6">
              <p>{product.details}</p>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                Features
              </h3>
              <ul className="space-y-2">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="text-gray-400 text-sm flex items-start">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 mr-2 shrink-0"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-6 flex items-start p-4 bg-yellow-900/10 border border-yellow-700/30 rounded-xl">
               <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 shrink-0" />
               <div className="text-xs text-yellow-200/80">
                 <strong className="block text-yellow-500 mb-1">Important Warranty</strong>
                 Please report any issues within 30 minutes of purchase. No refunds for user error or misuse.
               </div>
            </div>
          </div>

          {/* Checkout Form Side */}
          <div className="p-8 bg-gradient-to-b from-[#1a1a1a] to-[#151515]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-purple-400" />
              Secure Checkout
            </h2>

            <form onSubmit={handleCheckout} className="space-y-5">
              
              {/* Option Selector (Only if product has options) */}
              {product.options && (
                 <div>
                   <label className="block text-gray-400 text-sm mb-2 font-medium">Select Option</label>
                   <div className="relative">
                      <select
                        value={selectedOption}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none appearance-none"
                      >
                        {product.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                   </div>
                 </div>
              )}

              {/* Quantity Input (Custom Stepper for PAYPAL LOGS) */}
              {product.id === 'paypal-logs' && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium flex justify-between">
                    <span>Quantity</span>
                    <span className="text-xs text-purple-400">Min Order: {product.minQty}</span>
                  </label>
                  <div className="flex items-center space-x-0 bg-black border border-gray-700 rounded-xl overflow-hidden">
                    <button 
                      type="button" 
                      onClick={() => adjustQty(-1)}
                      className="px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border-r border-gray-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      readOnly
                      value={quantity}
                      className="w-full bg-transparent text-center text-white font-bold outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => adjustQty(1)}
                      className="px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border-l border-gray-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-2 font-medium">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="For product delivery"
                  className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none placeholder-gray-600"
                  required
                />
              </div>

              {/* Dynamic Fields based on product type */}
              {(product.id === 'linkable-debit' || product.id === 'dumps-pin') && (
                 <div>
                   <label className="block text-gray-400 text-sm mb-2 font-medium">Country Preference</label>
                   <div className="relative">
                       <select
                         value={country}
                         onChange={(e) => setCountry(e.target.value)}
                         className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-purple-500 outline-none appearance-none"
                         required
                       >
                         <option value="" disabled>Select a Region</option>
                         <option value="USA">United States (USA)</option>
                         <option value="UK">United Kingdom (UK)</option>
                         <option value="Canada">Canada</option>
                         <option value="Australia">Australia</option>
                         <option value="Germany">Germany</option>
                         <option value="France">France</option>
                         <option value="Spain">Spain</option>
                         <option value="Italy">Italy</option>
                         <option value="Netherlands">Netherlands</option>
                         <option value="Worldwide">Worldwide / Mixed</option>
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                   </div>
                 </div>
              )}

              {product.id === 'clone-cards' && (
                 <div>
                   <label className="block text-gray-400 text-sm mb-2 font-medium">Shipping Address</label>
                   <textarea
                     value={address}
                     onChange={(e) => setAddress(e.target.value)}
                     placeholder="Full shipping address..."
                     className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-purple-500 outline-none min-h-[100px]"
                     required
                   />
                 </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-2 font-medium">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                   {['BTC', 'LTC', 'ETH', 'USDT'].map((c) => (
                     <button
                       key={c}
                       type="button"
                       onClick={() => setCrypto(c)}
                       className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                         crypto === c 
                           ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' 
                           : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'
                       }`}
                     >
                       {c}
                     </button>
                   ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-200 text-xs">
                  {error}
                </div>
              )}

              <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-4">
                   <span className="text-gray-400">Total</span>
                   <span className="text-2xl font-bold text-white font-display">${displayPrice.toFixed(2)}</span>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'BUY NOW'}
                </button>
                <p className="text-center text-xs text-gray-600 mt-3">
                   Secure SSL Encryption • Instant Delivery
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
