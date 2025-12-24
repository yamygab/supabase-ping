
import { Product } from './types';

// Updated images to use local WebP files from public/images/
export const PRODUCTS: Product[] = [
  {
    id: 'linkable-debit',
    name: 'Linkable Debit',
    sku: 'LINKABLE-DEBIT',
    price: 50,
    rating: 4.6,
    image: '/images/linkable-debit.webp',
    type: 'card',
    description: 'PREMIUM NON-VBV DEBITS! Flawless Hits on Cash App, PayPal, Apple Pay & 3D Sites!',
    details: 'These are high-quality linkable debit cards with verified balances and owner info. Tested and fully working. 100% Live and Non Vbv.',
    features: [
      'Cardholder Name & Address',
      'Card Number, Exp, CVV',
      'SSN & DOB Included',
      'Phone Number Linked',
      'Works on CashApp, PayPal, Apple Pay'
    ]
  },
  {
    id: 'spammed-cc',
    name: 'Spammed CCs',
    sku: 'SPAMMED-CC',
    price: 50,
    rating: 4.8,
    image: '/images/spammed-cc.webp',
    type: 'card',
    description: 'High balance 💳 | 100% Hit Ready for Apple, BestBuy, StockX & More!',
    details: 'Verified high balance cards. Skip BIN searching, we provide tested live CCs ready for cashout.',
    features: [
      'High Balance Guaranteed',
      'Fullz Info Included',
      'Live Checked before sending',
      'Warranty: 10 Minutes'
    ]
  },
  {
    id: 'dumps-pin',
    name: 'Dumps + Pin',
    sku: 'DUMPS-PIN',
    price: 100,
    rating: 4.6,
    image: '/images/dumps-pin.webp',
    type: 'card',
    description: 'Verified dumps with PIN. 100% Working Track 1 & 2.',
    details: 'This dump set includes working cards with PINs and full owner info. 100% live.',
    features: [
      'Track 1 & 2 Data',
      'PIN Included',
      'Full Owner Info',
      '24 Hour Warranty'
    ]
  },
  {
    id: 'clone-cards',
    name: 'Clone Cards',
    sku: 'CLONE-CARD',
    price: 150,
    rating: 4.5,
    image: '/images/clone-cards.webp',
    type: 'service',
    description: 'High-quality cloned cards shipped to your address.',
    details: 'We provide best cloned in market shipping it straight to your address within 1 week.',
    features: [
      'Physical Card Shipped',
      'High Balance',
      'ATM Withdrawal Ready',
      'Tracking Number Provided'
    ],
    options: [
      { label: '$150 - Balance $3,000', value: '3000', price: 150 },
      { label: '$250 - Balance $5,000', value: '5000', price: 250 },
      { label: '$350 - Balance $7,500', value: '7500', price: 350 },
      { label: '$500 - Balance $10,000', value: '10000', price: 500 },
    ]
  },
  {
    id: 'bank-logs',
    name: 'Bank Logs',
    sku: 'BANK-LOG',
    price: 75,
    rating: 4.5,
    image: '/images/bank-logs.webp',
    type: 'log',
    description: 'Verified bank account logins with full online access.',
    details: 'Verified bank account logins with full online access including email, RDP, fullz, and 2FA bypass where applicable.',
    features: [
      'Login:Pass',
      'Email Access',
      'RDP Access',
      'Cookie/UserAgent'
    ],
    options: [
        { label: 'Chase - $83K Balance ($400)', value: '83K', price: 400 },
        { label: 'Truist - $22K Balance ($180)', value: '22K', price: 180 },
        { label: 'BOA - $15K Balance ($150)', value: '15K', price: 150 },
        { label: 'Credit Union - $10K Balance ($110)', value: '10K', price: 110 },
        { label: 'Amex Savings - $5K Balance ($85)', value: '5K', price: 85 },
    ]
  },
  {
    id: 'paypal-logs',
    name: 'PayPal Logs',
    sku: 'PAYPAL-LOG',
    price: 1,
    rating: 4.3,
    image: '/images/paypal-logs.webp',
    type: 'log',
    description: 'HQ NFA PayPal Logs USA. Freshly pulled, full cap.',
    details: 'Bulk HQ PayPal logs available. USA Verified. Login + security answers included. $1 per log.',
    features: [
      'ID:Pass',
      'Cookies Included',
      'NFA (Non-2FA)',
      'USA Verified'
    ],
    minQty: 20 // Enforce minimum order of 20 logs ($20)
  }
];

// Robust Environment Variable Support with Fallbacks
// We capture import.meta.env safely to prevent runtime crashes if it's undefined
// Cast import.meta to any to bypass TS error: Property 'env' does not exist on type 'ImportMeta'
const env: any = (import.meta as any).env || {};

export const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://zwqsnvuhsokcvolgwkid.supabase.co';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3cXNudnVoc29rY3ZvbGd3a2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTQ0ODcsImV4cCI6MjA2Nzk5MDQ4N30.Gq20DD-k4DFKfZ3zEATYlh8PmWpQamxpHmuaTSWCDnc';
