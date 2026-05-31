import { useCart } from '../hooks/useCart';
import { Link } from 'react-router-dom';

export const CartPage = () => {
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-gray-400 uppercase tracking-widest">Loading Cart...</div>;
  if (!cart || cart.items.length === 0) return (
    <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2 uppercase">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 font-medium">Add some products to your cart and they will appear here.</p>
        <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all">Go Shopping</Link>
    </div>
  );

  const total = cart.items.reduce((sum, item) => {
      const price = (item.product.discount_price && Number(item.product.discount_price) > 0)
        ? Number(item.product.discount_price)
        : Number(item.product.price);
      return sum + (price * item.quantity);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 antialiased text-left font-sans">
      <div className="flex items-center justify-between mb-10">
        <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Your Cart</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{cart.items.length} Items Selected</p>
        </div>
        <button onClick={clearCart} className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-[0.2em] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Empty Cart
        </button>
      </div>

      <div className="space-y-4">
        {cart.items.map(item => {
          const discountVal = item.product.discount_price ? Number(item.product.discount_price) : 0;
          const originalVal = Number(item.product.price);
          const hasDiscount = discountVal > 0 && discountVal < originalVal;
          const currentPrice = hasDiscount ? discountVal : originalVal;

          return (
            <div key={item.id} className="flex flex-col sm:flex-row gap-6 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group">
              <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                <img src={item.product.images[0]?.image_url ? `http://127.0.0.1:8000/storage/${item.product.images[0].image_url}` : 'https://via.placeholder.com/200x200?text=No+Image'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors leading-tight mb-1">{item.product.title}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-blue-600 font-black text-lg">${currentPrice.toLocaleString()}</span>
                        {hasDiscount && (
                            <span className="text-gray-400 text-sm line-through font-bold">${originalVal.toLocaleString()}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors font-black"
                      >-</button>
                      <span className="w-10 text-center font-black text-sm text-gray-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors font-black"
                      >+</button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-[10px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">Remove</button>
                </div>
              </div>
              <div className="sm:text-right flex flex-col justify-between items-end border-t sm:border-t-0 border-gray-50 pt-4 sm:pt-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</p>
                <div className="text-xl font-black text-gray-900">${(currentPrice * item.quantity).toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 bg-white border border-gray-100 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 text-center md:text-left">Order Summary</p>
            <div className="text-4xl font-black text-gray-900 flex items-center gap-4">
                <span className="text-lg text-gray-300 font-black">TOTAL</span>
                ${total.toLocaleString()}
            </div>
        </div>
        <Link to="/checkout" className="w-full md:w-auto min-w-[280px] bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm text-center shadow-2xl shadow-blue-600/30 active:scale-95 transition-all">
            Secure Checkout
        </Link>
      </div>
    </div>
  );
};