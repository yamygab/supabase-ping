import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { ShoppingBag, DollarSign, Clock, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const didInit = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (didInit.current) return;
    didInit.current = true;

    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }
      setUser(user);

      // Fetch Orders from Edge Function or direct DB query if RLS permits
      // Using mock implementation based on prompt's logic if function fails
      try {
        const { data, error } = await supabase.functions.invoke('get-user-orders');
        if (data && data.orders) {
            setOrders(data.orders);
        }
      } catch (e) {
        console.error("Error fetching orders", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading Profile...</div>;
  }

  const totalSpent = orders.reduce((acc, order) => acc + (order.price || 0), 0);
  const completedOrders = orders.filter(o => ['exact_match', 'overpaid'].includes(o.status)).length;
  const pendingOrders = orders.length - completedOrders;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 shadow-xl mb-8">
        <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
                {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Welcome back!</h2>
                <p className="text-gray-400">{user.email}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Orders</span>
                    <ShoppingBag className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-white">{orders.length}</div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Total Spent</span>
                    <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-white">${totalSpent.toFixed(2)}</div>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Pending</span>
                    <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-2xl font-bold text-white">{pendingOrders}</div>
            </div>
        </div>
      </div>

      <h3 className="text-xl font-bold text-white mb-4">Order History</h3>
      
      {orders.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-2xl border border-gray-800">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No orders yet.</p>
          </div>
      ) : (
          <div className="space-y-4">
              {orders.map((order, i) => (
                  <div key={i} className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800 flex justify-between items-center hover:border-purple-500/30 transition-colors">
                      <div>
                          <div className="font-bold text-white mb-1">{order.product || 'Unknown Product'}</div>
                          <div className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()} • {order.crypto?.toUpperCase()}
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="font-mono font-bold text-white mb-1">${order.price}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                              ['exact_match', 'overpaid'].includes(order.status) 
                              ? 'bg-green-900/50 text-green-400 border border-green-500/20'
                              : 'bg-yellow-900/50 text-yellow-400 border border-yellow-500/20'
                          }`}>
                              {order.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default Profile;