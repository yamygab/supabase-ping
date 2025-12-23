
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Copy, CheckCircle, AlertTriangle, Clock, X, ShieldCheck, ArrowRight } from 'lucide-react';
import { 
    supabase, 
    getCheckoutSession, 
    getWalletAddress, 
    getCryptoAmount, 
    createPayment, 
    cancelPayment, 
    checkPaymentStatus, 
    getPaymentBySessionId,
    getIp
} from '../services/supabase';

const SESSION_TTL_SECONDS = 30 * 60; // 30 minutes

const Payment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();

  // Application State
  const [viewState, setViewState] = useState<'loading' | 'confirmation' | 'payment'>('loading');
  const [sessionData, setSessionData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null); 
  
  // Payment Details
  const [walletAddress, setWalletAddress] = useState('');
  const [cryptoValue, setCryptoValue] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // UI State
  const [timeLeft, setTimeLeft] = useState(SESSION_TTL_SECONDS);
  const [expiryTime, setExpiryTime] = useState<number | null>(null); // Absolute timestamp
  const [status, setStatus] = useState('pending');
  const [copied, setCopied] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [underpaidAmount, setUnderpaidAmount] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false); 

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const didInit = useRef(false);

  // Helper to generate robust QR code
  const generateQR = async (text: string) => {
    try {
        // Dynamic import to reduce initial bundle size and main thread work
        const QRCode = (await import('qrcode')).default;
        
        // Use High Error Correction ('H') to allow for the logo overlay without breaking scanability
        const url = await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 320,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        setQrCodeUrl(url);
    } catch (e) {
        console.error("QR Gen Error", e);
    }
  };

  // 1. INITIALIZATION & RESTORATION LOGIC
  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    if (didInit.current) return;
    didInit.current = true;

    const init = async () => {
      try {
        const sData = await getCheckoutSession(sessionId);
        if (!sData) throw new Error("Invalid Session");
        setSessionData(sData);

        const localKey = `ynv_pay_${sessionId}`;
        const localState = localStorage.getItem(localKey);
        
        let restoredPayment = null;

        if (localState) {
            const parsed = JSON.parse(localState);
            if (parsed.expiry > Date.now()) {
                restoredPayment = parsed;
            }
        }

        if (!restoredPayment) {
            const dbPayment = await getPaymentBySessionId(sessionId);
            if (dbPayment && !['cancelled', 'timed_out'].includes(dbPayment.status)) {
                const created = new Date(dbPayment.created_at).getTime();
                const expiry = created + (SESSION_TTL_SECONDS * 1000);
                
                if (expiry > Date.now()) {
                    restoredPayment = {
                        id: dbPayment.id,
                        walletAddress: dbPayment.wallet_address,
                        cryptoAmount: dbPayment.required_crypto_amount,
                        expiry: expiry,
                        status: dbPayment.status
                    };
                    localStorage.setItem(localKey, JSON.stringify(restoredPayment));
                }
            }
        }

        if (restoredPayment) {
            setPaymentData({ id: restoredPayment.id });
            setWalletAddress(restoredPayment.walletAddress);
            setCryptoValue(restoredPayment.cryptoAmount);
            setExpiryTime(restoredPayment.expiry);
            setStatus(restoredPayment.status);
            await generateQR(restoredPayment.walletAddress);
            setViewState('payment');
        } else {
            const [wallet, amount] = await Promise.all([
                getWalletAddress(sData.crypto),
                getCryptoAmount(sData.crypto, sData.total)
            ]);

            setWalletAddress(wallet.address);
            setCryptoValue(amount.requiredCryptoAmount);
            setViewState('confirmation');
        }

      } catch (e) {
        console.error("Init Error", e);
        navigate('/');
      }
    };

    init();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, navigate]);


  // 2. TIMER LOGIC
  useEffect(() => {
    if (viewState === 'payment' && expiryTime) {
        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.floor((expiryTime - now) / 1000);
            
            if (remaining <= 0) {
                setTimeLeft(0);
                setStatus('timed_out');
                if (timerRef.current) clearInterval(timerRef.current);
            } else {
                setTimeLeft(remaining);
            }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);
    }
    return () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewState, expiryTime]);


  // 3. REALTIME & POLLING
  useEffect(() => {
     if (viewState === 'payment' && paymentData?.id) {
         const channel = supabase
            .channel(`pay_${paymentData.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payment', filter: `id=eq.${paymentData.id}` }, (payload) => {
                const newStatus = payload.new.status;
                setStatus(newStatus);
                if (payload.new.crypto_difference) setUnderpaidAmount(payload.new.crypto_difference);
                if (['exact_match', 'overpaid'].includes(newStatus)) {
                    localStorage.removeItem(`ynv_pay_${sessionId}`);
                    setTimeout(() => navigate('/thank-you'), 2000);
                }
            })
            .subscribe();

         return () => { supabase.removeChannel(channel); };
     }
  }, [viewState, paymentData, navigate, sessionId]);

  // OPTIMIZATION: Faster Polling (4s)
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    if (viewState === 'payment' && paymentData?.id && !['exact_match', 'overpaid', 'cancelled', 'timed_out'].includes(status)) {
        intervalId = setInterval(async () => {
            const result = await checkPaymentStatus(paymentData.id);
            if (result) {
                if (result.paymentStatus && result.paymentStatus !== status) setStatus(result.paymentStatus);
                if (result.paymentStatus === 'underpaid' && result.cryptoDifference) setUnderpaidAmount(result.cryptoDifference);
                if (result.requiredCryptoAmount) setCryptoValue(result.requiredCryptoAmount);
            }
        }, 4000); 
    }
    return () => clearInterval(intervalId);
  }, [viewState, paymentData, status]);


  // 4. HANDLERS
  const handleConfirm = async () => {
      setIsConfirming(true);
      try {
          const now = Date.now();
          const expiry = now + (SESSION_TTL_SECONDS * 1000);
          const userIp = await getIp();

          const record = await createPayment({
              session_id: sessionId,
              email: sessionData.email,
              product: sessionData.product,
              price: sessionData.total,
              crypto: sessionData.crypto,
              wallet_address: walletAddress,
              status: 'pending',
              required_crypto_amount: cryptoValue,
              ip_address: userIp,
              user_agent: navigator.userAgent,
          });
          
          await generateQR(walletAddress);

          const localState = {
              id: record.id,
              walletAddress,
              cryptoAmount: cryptoValue,
              expiry: expiry,
              status: 'pending'
          };
          localStorage.setItem(`ynv_pay_${sessionId}`, JSON.stringify(localState));

          setPaymentData(record);
          setExpiryTime(expiry);
          setViewState('payment');

      } catch (e) {
          console.error("Confirm failed", e);
      } finally {
          setIsConfirming(false);
      }
  };

  const handleCancel = async () => {
      setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
      if (paymentData?.id) {
          await cancelPayment(paymentData.id);
      }
      localStorage.removeItem(`ynv_pay_${sessionId}`);
      navigate('/');
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
      if (seconds < 0) return "00:00";
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
  };

  const getStatusDisplay = () => {
      switch(status) {
          case 'pending': 
             return { color: 'text-blue-300', bg: 'bg-gray-900 border-gray-700', icon: <Loader2 className="w-4 h-4 animate-spin" />, text: 'Monitoring blockchain...' };
          case 'detected':
             return { color: 'text-yellow-300', bg: 'bg-yellow-900/20 border-yellow-700', icon: <Loader2 className="w-4 h-4 animate-spin" />, text: 'Payment detected...' };
          case 'exact_match':
          case 'overpaid':
             return { color: 'text-green-300', bg: 'bg-green-900/20 border-green-700', icon: <CheckCircle className="w-4 h-4" />, text: 'Payment Confirmed!' };
          case 'underpaid':
             return { color: 'text-red-300', bg: 'bg-red-900/20 border-red-700', icon: <AlertTriangle className="w-4 h-4" />, text: 'Underpaid!' };
          case 'timed_out':
             return { color: 'text-red-300', bg: 'bg-red-900/20 border-red-700', icon: <Clock className="w-4 h-4" />, text: 'Expired' };
          default:
             return { color: 'text-gray-300', bg: 'bg-gray-900', icon: <AlertTriangle className="w-4 h-4" />, text: 'Unknown' };
      }
  };

  const statusObj = getStatusDisplay();

  if (viewState === 'loading') {
      return (
          <div className="w-full flex-grow flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
                 <div className="h-1 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse"></div>
                 <div className="p-8 relative">
                    <div className="text-center mb-8 space-y-3">
                       <div className="h-8 w-48 bg-gray-900 rounded-lg mx-auto shimmer opacity-50"></div>
                       <div className="h-4 w-32 bg-gray-900 rounded-lg mx-auto shimmer opacity-30"></div>
                    </div>
                    <div className="bg-gray-900/40 rounded-2xl p-6 border border-gray-800 space-y-4 mb-8">
                        <div className="flex justify-between items-center"><div className="h-4 w-16 bg-gray-800 rounded shimmer opacity-40"></div><div className="h-5 w-32 bg-gray-800 rounded shimmer opacity-40"></div></div>
                        <div className="flex justify-between items-center"><div className="h-4 w-12 bg-gray-800 rounded shimmer opacity-40"></div><div className="h-4 w-40 bg-gray-800 rounded shimmer opacity-40"></div></div>
                        <div className="h-px bg-gray-800 my-2"></div>
                        <div className="flex justify-between items-center"><div className="h-4 w-24 bg-gray-800 rounded shimmer opacity-40"></div><div className="h-7 w-16 bg-gray-800 rounded-lg shimmer opacity-40"></div></div>
                        <div className="flex justify-between items-center pt-2"><div className="h-5 w-20 bg-gray-800 rounded shimmer opacity-50"></div><div className="h-8 w-24 bg-gray-800 rounded shimmer opacity-50"></div></div>
                    </div>
                    <div className="w-full h-14 bg-gray-800 rounded-xl shimmer opacity-40"></div>
                    <div className="mt-6 flex justify-center"><div className="h-3 w-40 bg-gray-900 rounded shimmer opacity-30"></div></div>
                 </div>
              </div>
          </div>
      );
  }

  // --- CONFIRMATION SCREEN ---
  if (viewState === 'confirmation') {
      return (
          <div className="w-full flex-grow flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative animate-fade-in">
                 <div className="h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500"></div>
                 
                 <div className="p-8">
                    <div className="text-center mb-8">
                       <h2 className="text-3xl font-bold text-white font-display mb-2">Order Summary</h2>
                       <p className="text-gray-400 text-sm">Review your purchase details below</p>
                    </div>

                    <div className="bg-gray-900/40 rounded-2xl p-6 border border-gray-800 space-y-4 mb-8 backdrop-blur-sm">
                        <div className="flex justify-between items-center group">
                            <span className="text-gray-500 text-sm font-medium">Product</span>
                            <span className="text-white font-semibold text-right group-hover:text-purple-400 transition-colors">{sessionData.product}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm font-medium">Email</span>
                            <span className="text-white text-sm text-right font-mono text-gray-300">{sessionData.email}</span>
                        </div>
                        <div className="h-px bg-gray-800 my-2"></div>
                         <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm font-medium">Payment Method</span>
                            <div className="flex items-center text-white font-bold bg-gray-800 px-3 py-1 rounded-lg border border-gray-700">
                                 {sessionData.crypto}
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-gray-400 text-base font-medium">Total Price</span>
                            <span className="text-2xl font-bold text-white font-display text-green-400">${sessionData.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button 
                      onClick={handleConfirm}
                      disabled={isConfirming}
                      className="w-full bg-white hover:bg-gray-200 text-black font-extrabold py-4 rounded-xl shadow-xl transform active:scale-[0.98] transition-all flex items-center justify-center group"
                    >
                      {isConfirming ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                          <>
                            Confirm & Pay <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                      )}
                    </button>
                    
                    <div className="mt-6 flex items-center justify-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        <ShieldCheck className="w-3 h-3 mr-1.5 text-green-500" />
                        Secure Encrypted Transaction
                    </div>
                 </div>
              </div>
          </div>
      );
  }

  // --- PAYMENT SCREEN ---
  return (
    <div className="w-full flex-grow flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-lg bg-gray-800 text-white p-6 rounded-2xl shadow-2xl space-y-4 border border-gray-700 animate-fade-in relative overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                <h2 className="text-xl font-bold text-white font-display">Send Payment</h2>
                <span className={`tabular-nums font-bold font-mono ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-red-400'}`}>
                    {formatTime(timeLeft)}
                </span>
            </div>

            <p className="text-sm text-gray-300 text-center">Scan the QR or copy address to complete payment.</p>

            {/* QR Code */}
            <div className="flex justify-center py-2">
                <div className="bg-white p-3 rounded-3xl relative">
                    {qrCodeUrl ? (
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mix-blend-multiply" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-black/20">
                        <Loader2 className="w-8 h-8 animate-spin text-black" />
                      </div>
                    )}
                    {/* Brand Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                           <span className="text-black font-bold text-xs">{sessionData?.crypto?.slice(0,3)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Box */}
            <div className="bg-gray-900 p-4 rounded-xl space-y-4 border border-gray-700">
                {/* Wallet Address */}
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Crypto Address</p>
                    <div className="flex items-center gap-2 font-mono text-sm bg-gray-800 p-2 rounded-xl border border-gray-700 group hover:border-gray-600 transition-colors">
                        <span className="break-all mr-1 text-gray-200 flex-1">{walletAddress}</span>
                        <button 
                            onClick={copyToClipboard}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                                copied ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                            }`}
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Amount ({sessionData?.crypto})</p>
                    <div className="font-mono text-green-400 font-bold text-lg flex items-center">
                        {cryptoValue.toFixed(8)}
                    </div>
                    <p className="text-xs text-gray-500">Equivalent to: ${sessionData?.total?.toFixed(2)} USD</p>
                </div>
            </div>

            {/* Status Bar */}
            <div className={`w-full text-center p-3 rounded-xl text-sm font-medium flex justify-center items-center space-x-2 border transition-colors ${statusObj.bg} ${statusObj.color}`}>
                {statusObj.icon}
                <span>{statusObj.text}</span>
            </div>

            {/* Underpaid Warning */}
            {status === 'underpaid' && underpaidAmount && (
                <div className="bg-red-900/20 border border-red-600/50 p-3 rounded-xl text-center">
                    <p className="text-red-300 text-sm font-bold">You are short by: {underpaidAmount.toFixed(8)} {sessionData?.crypto}</p>
                    <p className="text-xs text-red-400 mt-1">Please contact support immediately.</p>
                </div>
            )}

            {/* Cancel Button */}
            <button 
                onClick={handleCancel}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-300 hover:underline py-2 transition-colors"
            >
                Cancel Payment
            </button>

            {/* Cancel Confirmation Overlay */}
            {showCancelConfirm && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
                    <div className="text-center space-y-4 max-w-xs w-full">
                        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Cancel Payment?</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            This specific wallet address is reserved for your order. Cancelling will discard it.
                        </p>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button 
                                onClick={() => setShowCancelConfirm(false)} 
                                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
                            >
                                Keep it
                            </button>
                            <button 
                                onClick={confirmCancel} 
                                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
                            >
                                Yes, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};

export default Payment;
