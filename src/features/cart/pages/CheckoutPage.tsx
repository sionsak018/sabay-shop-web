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
    <div className="max-w-md mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <p>Confirm your order and complete purchase.</p>
      <button onClick={handleCheckout} disabled={loading}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400">
        {loading ? 'Processing...' : 'Place Order'}
      </button>
    </div>
  );
};