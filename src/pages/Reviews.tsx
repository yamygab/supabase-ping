import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, User, CheckCircle, Search, Send, PenTool, ChevronDown, ChevronUp, Archive } from 'lucide-react';
import { Review } from '../types';

// --- CONFIG & TEMPLATES ---
const productNames = [
  'Linkable Debit', 
  'Spammed CCs', 
  'Dumps + Pin', 
  'Clone Cards', 
  'Bank logs + online access', 
  'HQ NFA PAYPALS'
];

interface ReviewTemplate {
  text: string;
  minStars: number;
  maxStars: number;
}

const templates: Record<string, ReviewTemplate[]> = {
  'Linkable Debit': [
    { text: "Linked to Cash app without any problem", minStars: 5, maxStars: 5 },
    { text: "Apple Pay accepted the card on first try", minStars: 4, maxStars: 5 },
    { text: "this debit worked flawlessly for PayPal linking ", minStars: 4, maxStars: 5 },
    { text: "Skipped 3DS on Venmo and i cashed that bitch highly recomended", minStars: 5, maxStars: 5 },
    { text: " am using this for the my cashout site and it's working better then expected", minStars: 4, maxStars: 5 },
    { text: "Got it, linked it, cashed out.super quality non-VBV card.", minStars: 5, maxStars: 5 },
    { text: "for cashapp cashout this is the best and easiest", minStars: 4, maxStars: 5 },
    { text: "Used for Apple Pay and it went smooth , went to bestbuy and used tap to pay function to get bought some stuff ", minStars: 4, maxStars: 5 },
    { text: "This linkable shit is so fire. i will recomend ", minStars: 5, maxStars: 5 },
    { text: "I defo recomend to eveyone linkable are are so fire", minStars: 5, maxStars: 5 },
    { text: "took a few tries to link but eventually worked", minStars: 3, maxStars: 4 },
  ],
  'Spammed CCs': [
    { text: "Hit BestBuy it had  No AVS or CVV issues.", minStars: 4, maxStars: 5 },
    { text: "i used it in nike and it worked got that new jordans for 50$ lol", minStars: 5, maxStars: 5 },
    { text: "Recived the products and am extremly satisfied with service.", minStars: 4, maxStars: 5 },
    { text: "it was my first time using this seller and i thought it is some scam but after using it for week  now ,i am fully satisfied with there profuct and service", minStars: 4, maxStars: 5 },
    { text: "idk whats wrong with them i got the card and it didnt worked they told me that i dont know how to use the card and the replacement time is gone", minStars: 1, maxStars: 2 },
    { text: "using this for 2 months now and i hit like 80% of the time and they have good service", minStars: 4, maxStars: 5 },
    { text: "Clean CC. Used $1,200 on my site and it worked ", minStars: 4, maxStars: 5 },
    { text: "Approved on first try at BestBuy i really liked this quality", minStars: 5, maxStars: 5 },
    { text: "High balance as promised", minStars: 4, maxStars: 5 },
    { text: "got replacement fast 👍 great customer support 10/10.", minStars: 5, maxStars: 5 }
  ],
  'Dumps + Pin': [
    { text: "Track data was clean and everything worked good", minStars: 4, maxStars: 5 },
    { text: "The data was good and had good balance", minStars: 4, maxStars: 5 },
    { text: "bought the dump and it worked but had like 300$ only,maybe i will try one more time and see", minStars: 2, maxStars: 3 },
    { text: "Fresh dumps with verified PIN. No issues during cloning.", minStars: 5, maxStars: 5 },
    { text: "first time it was daed but i got the replacement ", minStars: 3, maxStars: 4 },
    { text: "Track 1 and 2 data was good i will recomend ", minStars: 4, maxStars: 5 },
    { text: "This is the best site for the dumps", minStars: 5, maxStars: 5 },
    { text: "Encoded on blank card. Worked at two different ATMs.", minStars: 5, maxStars: 5 },
    { text: "service is way good then other shop", minStars: 4, maxStars: 5 },
    { text: "PIN was correct and it worked well", minStars: 4, maxStars: 5 }
  ],
  'Clone Cards': [
    { text: "Card arrived in 4 days. and it worked as promise", minStars: 5, maxStars: 5 },
    { text: "it came like in 10 days i thought i got scammed but after it arrive i used it and clone was good", minStars: 3, maxStars: 4 },
    { text: "this clones work for the tap to pay too i am using the same card for the month now and the dumb owner havent noticed yet lol", minStars: 5, maxStars: 5 },
    { text: "High-quality clone. Feels identical to real debit card.", minStars: 5, maxStars: 5 },
    { text: "Shipping was fast. Used at three different ATMs and i wiped the balance", minStars: 5, maxStars: 5 },
    { text: " recommended", minStars: 4, maxStars: 5 },
    { text: "Card quality is excellent then i thought", minStars: 5, maxStars: 5 },
    { text: "Received yesterday. Tested at local ATM  worked perfectly.", minStars: 5, maxStars: 5 },
    { text: "seller repospond in lesss than 1 day and fixed the problems", minStars: 4, maxStars: 5 },
    { text: "Used at Walmart and gas station and it worked for the most part", minStars: 3, maxStars: 4 },
    { text: "The package arrived securely and the instructions were clear", minStars: 4, maxStars: 5 }
  ],
  'Bank logs + online access': [
    { text: "it was good,i got the log and they give me all the things as they promise", minStars: 4, maxStars: 5 },
    { text: " i bought the 10k log and it went smooth", minStars: 5, maxStars: 5 },
    { text: "i think they have the best quality logs i know ", minStars: 5, maxStars: 5 },
    { text: "they give me dead log at first so i told the suppert and they fixed it,support is good", minStars: 3, maxStars: 4 },
    { text: "plz get more logs in stock", minStars: 4, maxStars: 5 },
    { text: "first i thought this was scam but i was wrong", minStars: 4, maxStars: 5 },
    { text: "bank logs are  super profitable", minStars: 5, maxStars: 5 },
    { text: "just bought and tried and it worked well.i will buy more in future", minStars: 4, maxStars: 5 },
    { text: "Full access with no session conflicts. Professional service.", minStars: 5, maxStars: 5 },
    { text: " vouched", minStars: 5, maxStars: 5 },
    { text: "logs are decent and i higly recomend", minStars: 3, maxStars: 4 }
  ],
  'HQ NFA PAYPALS': [
    { text: "this was my first time buying this logs and it worked,i got lucjy i guess", minStars: 3, maxStars: 4 },
    { text: "No recovery attempts. Log remained stable for over 48 hours.", minStars: 5, maxStars: 5 },
    { text: "made 1500$ recommended", minStars: 5, maxStars: 5 },
    { text: "i got like 40 logs and out of it 15 only worked it decent for the price i guess", minStars: 2, maxStars: 3 },
    { text: "for the price its decent", minStars: 3, maxStars: 4 },
    { text: "PayPal log was fresh and full cap and i cashout easly", minStars: 5, maxStars: 5 },
    { text: "NFA and verified. Withdrew $1,100 without any problem.", minStars: 5, maxStars: 5 },
    { text: "bought the logs and they were bad i get it. its 1$ only but most were 2fa i dont recomend the paypal logs to anyone from here", minStars: 1, maxStars: 2 },
    { text: "got the full caps logs and used my otp bot to smash them details were correct", minStars: 5, maxStars: 5 },
    { text: "totally satisfied with the service", minStars: 5, maxStars: 5 }
  ]
};

const ARCHIVED_MSG = "Review content archived (older than 2 months).";

// --- HELPER FUNCTIONS ---

const pick = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const casualize = (str: string) => {
  if (Math.random() < 0.35) {
    const variants = [
      str.replace(/([aeiou])\1/g, '$1'), // Remove double vowels
      str.toLowerCase(),
      str.replace(/ing\b/g, "in'"),
      str.replace(/\.$/, '!'),
      str.replace(/perfectly/g, "perfect"),
      str.replace(/worked/g, "work'd")
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }
  return str;
};

// Generates reviews:
// 1. ALL predefined templates are used for RECENT reviews (0-60 days).
// 2. The remaining count (up to 120-130) is filled with "Archived" messages (> 60 days).
const generateRealisticReviews = (): Review[] => {
  const reviews: Review[] = [];
  const now = Date.now();
  const RECENT_CUTOFF_DAYS = 60; // 2 months
  const MAX_DAYS = 180; // 6 months

  // --- 1. RECENT REVIEWS (0-60 days) ---
  // Use EVERY template exactly once (or more if we wanted, but logic implies we want to show these specifically)
  Object.keys(templates).forEach(productName => {
      const productTemplates = templates[productName];
      productTemplates.forEach(t => {
          // Random date between now and 60 days ago
          const daysAgo = Math.floor(Math.random() * RECENT_CUTOFF_DAYS);
          const randomTimeInDay = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
          const timestamp = now - (daysAgo * 24 * 60 * 60 * 1000) - randomTimeInDay;
          
          const stars = Math.floor(Math.random() * (t.maxStars - t.minStars + 1)) + t.minStars;
          
          reviews.push({
              userId: 'User-' + (Math.floor(Math.random() * 8999) + 1000),
              product: productName,
              review: casualize(t.text),
              stars: stars,
              timestamp: timestamp,
              id: `gen-specific-${reviews.length}-${Date.now()}`
          });
      });
  });

  // --- 2. ARCHIVED REVIEWS (60-180 days) ---
  // Calculate how many more we need to reach 120-130 total
  const targetCount = Math.floor(Math.random() * 11) + 120; // 120 to 130
  const currentCount = reviews.length;
  const needed = Math.max(0, targetCount - currentCount);

  for (let i = 0; i < needed; i++) {
    const product = pick(productNames);
    
    // Random date between 60 days and 180 days ago
    const daysAgo = Math.floor(Math.random() * (MAX_DAYS - RECENT_CUTOFF_DAYS)) + RECENT_CUTOFF_DAYS;
    
    const randomTimeInDay = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
    const timestamp = now - (daysAgo * 24 * 60 * 60 * 1000) - randomTimeInDay;
    
    // Weighted stars for archived history
    let stars = 5;
    const rand = Math.random();
    if (rand < 0.7) stars = 5;
    else if (rand < 0.9) stars = 4;
    else if (rand < 0.97) stars = 3;
    else stars = 1;

    reviews.push({
      userId: 'User-' + (Math.floor(Math.random() * 8999) + 1000),
      product: product,
      review: ARCHIVED_MSG,
      stars: stars,
      timestamp: timestamp,
      id: `gen-archived-${i}-${Date.now()}`
    });
  }

  // Sort by latest first
  return reviews.sort((a, b) => b.timestamp - a.timestamp);
};

const timeAgo = (timestamp: number) => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 30) return `${Math.floor(diffDays/30)} months ago`;
  return `${diffDays} days ago`;
};

// --- COMPONENT ---

const Reviews: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sort, setSort] = useState<'latest' | 'oldest'>('latest');
  
  // Initialize filter based on URL query param 'product'
  const [filterProduct, setFilterProduct] = useState<string>(() => {
    const param = searchParams.get('product');
    // Ensure the param matches a known product, otherwise default to 'all'
    if (param && productNames.includes(param)) {
        return param;
    }
    return 'all';
  });

  const [visibleCount, setVisibleCount] = useState(20);
  
  // Form State
  const [formProduct, setFormProduct] = useState(productNames[0]);
  const [formRating, setFormRating] = useState(5);
  const [formMessage, setFormMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    // Check localStorage or generate new set
    const saved = localStorage.getItem("persistentReviews_v5");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                setReviews(parsed);
            } else {
                setReviews([...(parsed.local || []), ...(parsed.generated || [])]);
            }
        } catch (e) {
            initFresh();
        }
    } else {
        initFresh();
    }
  }, []);

  const initFresh = () => {
      const fresh = generateRealisticReviews();
      setReviews(fresh);
      localStorage.setItem("persistentReviews_v5", JSON.stringify({ generated: fresh, local: [] }));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formMessage.trim()) return;

      const newReview: Review = {
          id: `local-${Date.now()}`,
          userId: 'You',
          product: formProduct,
          review: formMessage,
          stars: formRating,
          timestamp: Date.now()
      };

      // Update State
      setReviews(prev => [newReview, ...prev]);

      // Update Local Storage
      const saved = localStorage.getItem("persistentReviews_v5");
      let currentStore = { generated: [], local: [] as Review[] };
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              if (!Array.isArray(parsed)) {
                  currentStore = parsed;
              }
          } catch(e) {}
      }
      currentStore.local = [newReview, ...currentStore.local];
      localStorage.setItem("persistentReviews_v5", JSON.stringify(currentStore));

      // Reset Form
      setFormMessage('');
      setFormRating(5);
      setFormSubmitted(true);
      setTimeout(() => setFormSubmitted(false), 3000);

      // Scroll to top to see review
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredReviews = reviews.filter(r => 
    filterProduct === 'all' ? true : r.product === filterProduct
  );

  const sortedReviews = [...filteredReviews].sort((a, b) => 
    sort === 'latest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
  );

  // Pagination Logic
  const displayReviews = sortedReviews.slice(0, visibleCount);
  const canShowMore = visibleCount < sortedReviews.length;
  const canShowLess = visibleCount > 20;

  const handleShowMore = () => {
      setVisibleCount(prev => Math.min(prev + 20, sortedReviews.length));
  };

  const handleShowLess = () => {
      setVisibleCount(20);
      const container = document.getElementById('reviews-top-anchor');
      if (container) container.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in" id="reviews-top-anchor">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold font-display text-white tracking-wide">
          CUSTOMER REVIEWS
        </h2>
        
        <div className="flex gap-3">
            {/* Product Filter */}
            <div className="relative">
                <select 
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    className="bg-[#1a1a1a] text-gray-300 border border-gray-700 rounded-xl px-4 py-2 pr-8 text-sm outline-none focus:border-purple-500 appearance-none cursor-pointer"
                >
                    <option value="all">All Products</option>
                    {productNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Sort Selector */}
            <select 
                value={sort} 
                onChange={(e) => setSort(e.target.value as any)}
                className="bg-[#1a1a1a] text-gray-300 border border-gray-700 rounded-xl px-4 py-2 text-sm outline-none focus:border-purple-500 cursor-pointer"
            >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
            </select>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="space-y-5">
        {displayReviews.map((r, i) => {
            const isUser = r.userId === 'You';
            const isArchived = r.review === ARCHIVED_MSG;

            return (
                <div 
                    key={r.id || i} 
                    className={`bg-[#1a1a1a] p-6 rounded-2xl border shadow-lg transition-all duration-300 group ${isUser ? 'border-purple-500/50 bg-purple-900/10' : 'border-gray-800 hover:border-purple-500/30'}`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 border shadow-inner ${isUser ? 'bg-purple-600 border-purple-400' : 'bg-gradient-to-br from-gray-800 to-black border-gray-700'}`}>
                                <User className={`w-5 h-5 ${isUser ? 'text-white' : 'text-gray-500 group-hover:text-purple-400 transition-colors'}`} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                    {r.userId}
                                    {(isUser || Math.random() > 0.3) && (
                                        <span className="flex items-center text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 font-medium">
                                            <CheckCircle className="w-3 h-3 mr-1" /> Verified
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500">{timeAgo(r.timestamp)}</div>
                            </div>
                        </div>
                        <div className="flex bg-black/40 px-2 py-1 rounded-lg border border-gray-800">
                            {Array.from({length: 5}).map((_, starI) => (
                                <Star 
                                    key={starI} 
                                    className={`w-4 h-4 ${starI < r.stars ? 'text-yellow-500 fill-current' : 'text-gray-800'}`} 
                                />
                            ))}
                        </div>
                    </div>

                    <div className="mb-3">
                        <span className="text-xs font-mono font-bold text-purple-300 bg-purple-900/20 px-2 py-1 rounded border border-purple-500/20">
                            {r.product}
                        </span>
                    </div>
                    
                    {isArchived ? (
                         <p className="text-gray-600 text-sm italic flex items-center pl-1 border-l-2 border-gray-800">
                            <Archive className="w-3 h-3 mr-2" />
                            {r.review}
                         </p>
                    ) : (
                        <p className="text-gray-300 text-sm leading-relaxed pl-1 border-l-2 border-gray-700">
                            "{r.review}"
                        </p>
                    )}
                </div>
            );
        })}
        
        {sortedReviews.length === 0 && (
            <div className="text-center py-12 text-gray-500">
                No reviews found.
            </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mt-8 flex justify-center gap-4">
          {canShowMore && (
              <button 
                onClick={handleShowMore}
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors flex items-center"
              >
                Show More <ChevronDown className="w-4 h-4 ml-2" />
              </button>
          )}
          {canShowLess && (
              <button 
                onClick={handleShowLess}
                className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-semibold py-2 px-6 rounded-xl transition-colors flex items-center"
              >
                Show Less <ChevronUp className="w-4 h-4 ml-2" />
              </button>
          )}
      </div>

      {/* Add Review Form */}
      <div className="mt-16 border-t border-gray-800 pt-10">
          <div className="bg-[#1a1a1a] rounded-3xl p-6 md:p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
             {/* Background glow */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] pointer-events-none"></div>

             <div className="relative z-10">
                 <div className="flex items-center mb-6">
                     <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mr-3 border border-gray-700">
                         <PenTool className="w-5 h-5 text-purple-400" />
                     </div>
                     <h3 className="text-2xl font-bold text-white font-display">Write a Review</h3>
                 </div>

                 <form onSubmit={handleReviewSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Product</label>
                            <select 
                                value={formProduct}
                                onChange={(e) => setFormProduct(e.target.value)}
                                className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-purple-500 outline-none appearance-none"
                            >
                                {productNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Rating</label>
                            <div className="relative">
                                <select 
                                    value={formRating}
                                    onChange={(e) => setFormRating(Number(e.target.value))}
                                    className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-purple-500 outline-none appearance-none pl-10"
                                >
                                    <option value={5}>★★★★★ (Excellent)</option>
                                    <option value={4}>★★★★☆ (Good)</option>
                                    <option value={3}>★★★☆☆ (Average)</option>
                                    <option value={2}>★★☆☆☆ (Poor)</option>
                                    <option value={1}>★☆☆☆☆ (Terrible)</option>
                                </select>
                                <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Review</label>
                        <textarea
                            value={formMessage}
                            onChange={(e) => setFormMessage(e.target.value)}
                            placeholder="Share your experience with this product..."
                            rows={4}
                            className="w-full bg-black border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-purple-500 outline-none resize-none placeholder-gray-600"
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center group"
                    >
                        {formSubmitted ? (
                            <span className="flex items-center text-green-200">
                                <CheckCircle className="w-5 h-5 mr-2" /> Review Submitted!
                            </span>
                        ) : (
                            <span className="flex items-center">
                                Submit Review <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </span>
                        )}
                    </button>
                 </form>
             </div>
          </div>
      </div>
    </div>
  );
};

export default Reviews;