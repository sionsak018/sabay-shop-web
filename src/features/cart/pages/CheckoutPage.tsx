import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../services/orderApi';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await orderApi.checkout();
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      alert('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-20 antialiased text-center font-sans">
      <div className="bg-white dark:bg-[#16171d] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-2xl transition-colors">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight mb-3">Secure Checkout</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-10 leading-relaxed px-4">Confirm your order details and click below to complete your purchase safely.</p>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                </>
            ) : 'Confirm & Place Order'}
          </button>

          <button onClick={() => navigate(-1)} className="mt-8 text-[11px] font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
              Return to Cart
          </button>
      </div>
    </div>
  );
};