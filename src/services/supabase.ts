
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// OPTIMIZATION: Configured for minimal background resource usage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: {
        params: {
            eventsPerSecond: 2, // Reduced from 10 to 2 to save CPU on idle client
        },
    },
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    }
});

// --- PERFORMANCE: BFCACHE HELPER ---
export const disconnectRealtime = () => {
    try {
        if (supabase.realtime) {
            supabase.realtime.disconnect();
        }
    } catch (e) {
        // Ignore
    }
};

// --- HELPER: TIMEOUT WRAPPER ---
const withTimeout = async <T>(promise: Promise<T>, ms: number = 6000): Promise<T> => {
    let timeoutId: any;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timed out')), ms);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId);
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

// --- HELPER: COIN SANITIZER ---
const sanitizeCoin = (rawCoin: string): string => {
    if (!rawCoin) return 'BTC';
    let clean = rawCoin.toUpperCase().trim();
    clean = clean.replace(/[^A-Z0-9]/g, '');
    if (clean !== 'USDT' && clean.endsWith('USDT')) {
        clean = clean.replace('USDT', '');
    }
    return clean;
};

// --- MOCK / FALLBACK SYSTEM ---
const generateMockId = () => `sess_${Math.random().toString(36).substr(2, 9)}`;

const saveMockOrder = (sessionId: string, payload: any) => {
    try {
        const mockData = {
            session_id: sessionId,
            product_sku: payload.product_sku,
            product: payload.product_sku.replace(/-/g, ' ').toUpperCase(),
            total: payload.option_price_usd || 0,
            crypto: sanitizeCoin(payload.crypto),
            email: payload.email,
            created_at: new Date().toISOString(),
            status: 'pending',
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };
        sessionStorage.setItem(`mock_order_${sessionId}`, JSON.stringify(mockData));
    } catch (e) {}
};

const getMockOrder = (sessionId: string) => {
    try {
        const data = sessionStorage.getItem(`mock_order_${sessionId}`);
        if (data) return JSON.parse(data);
    } catch (e) {}
    return { 
        product: 'Unknown Product', 
        total: 0, 
        crypto: 'BTC', 
        email: 'error@example.com',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
};

// --- API FUNCTIONS ---

export const getIp = async () => {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(id);
        const data = await response.json();
        return data.ip;
    } catch (e) {
        try {
             const { data, error } = await withTimeout<{ data: any; error: any }>(
                supabase.functions.invoke('get-ip-g', { method: 'GET' }), 
                5000
            );
            if (error) throw error;
            return data.ip || data.clientIp || (typeof data === 'string' ? data : '0.0.0.0');
        } catch (inner) {
             return '0.0.0.0';
        }
    }
};

export const initiateCheckoutSession = async (payload: any) => {
    const cleanPayload = { 
        ...payload, 
        crypto: sanitizeCoin(payload.crypto) 
    };

    try {
        const { data, error } = await withTimeout<{ data: any; error: any }>(
            supabase.functions.invoke('checkout-create', { body: cleanPayload }), 
            10000
        );
        
        if (error) throw error;
        return data;
    } catch (err) {
        const mockId = generateMockId();
        saveMockOrder(mockId, cleanPayload);
        return { session_id: mockId };
    }
};

export const getCheckoutSession = async (sessionId: string) => {
    try {
        if (sessionId.startsWith('sess_')) return getMockOrder(sessionId);

        const { data, error } = await withTimeout<{ data: any; error: any }>(
            supabase.functions.invoke(`checkout-get/${sessionId}`, { method: 'GET' }), 
            5000
        );

        if (error) throw error;
        return data;
    } catch (err) {
        return getMockOrder(sessionId);
    }
};

export const getWalletAddress = async (crypto: string) => {
    const cleanCrypto = sanitizeCoin(crypto);

    try {
        const { data, error } = await withTimeout<{ data: any; error: any }>(
            supabase.functions.invoke('get-wallet-address', { body: { crypto: cleanCrypto } }), 
            5000
        );
        
        if (error) throw error;
        return data;
    } catch (err) {
        const addresses: any = {
            'BTC': 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            'ETH': '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            'LTC': 'ltc1qgqp5427d9290w506505671029302',
            'USDT': 'TXj129048120948120948120948'
        };
        return { address: addresses[cleanCrypto] || addresses['BTC'] };
    }
};

export const getCryptoAmount = async (coin: string, usdAmount: number) => {
    const cleanCoin = sanitizeCoin(coin);

    try {
        const { data, error } = await withTimeout<{ data: any; error: any }>(
            supabase.functions.invoke('get-crypto-amount', { body: { coin: cleanCoin, usdAmount } }), 
            5000
        );
        
        if (error) throw error;
        return data;
    } catch (err) {
        try {
            if (cleanCoin === 'USDT') return { requiredCryptoAmount: usdAmount };
            
            const symbol = `${cleanCoin}USDT`;
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, { 
                signal: controller.signal 
            });
            clearTimeout(id);
            
            if (response.ok) {
                const data = await response.json();
                if (data.price) {
                    const rate = parseFloat(data.price);
                    return { requiredCryptoAmount: usdAmount / rate };
                }
            }
        } catch (e) {
            // ignore
        }

        const rates: any = { 'BTC': 95000, 'ETH': 3500, 'LTC': 100, 'USDT': 1 };
        const rate = rates[cleanCoin] || rates['BTC'];
        return { requiredCryptoAmount: usdAmount / rate };
    }
};

export const checkPaymentStatus = async (paymentId: string) => {
    try {
        const { data, error } = await withTimeout<{ data: any; error: any }>(
            supabase.functions.invoke('super-handler', {
                body: { 
                    paymentId, 
                    traceId: `frontend-${Math.random().toString(36).substring(7)}` 
                }
            }), 4000
        );
        
        if (error) throw error;
        return data;
    } catch (err) {
        return null;
    }
};

export const createPayment = async (payload: any) => {
    try {
        payload.crypto = sanitizeCoin(payload.crypto);
        
        const { data, error } = await supabase
            .from('payment')
            .insert([payload])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    } catch (err) {
        return { id: `mock_pay_${Date.now()}`, status: 'pending' };
    }
};

export const getPaymentBySessionId = async (sessionId: string) => {
    try {
        if (sessionId.startsWith('sess_')) return null;

        const { data, error } = await supabase
            .from('payment')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(); 

        if (error) return null; 
        return data;
    } catch (err) {
        return null;
    }
};

export const cancelPayment = async (paymentId: string) => {
    try {
        if (paymentId.startsWith('mock_')) return true;
        
        const { error } = await supabase
            .from('payment')
            .update({ status: 'cancelled' })
            .eq('id', paymentId);
            
        if (error) throw error;
        return true;
    } catch (err) {
        return false;
    }
};
