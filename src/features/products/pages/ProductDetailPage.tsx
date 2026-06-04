import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productApi } from '../services/productApi';
import { profileApi } from '../../profile/services/profileApi';
import { messageApi } from '../../messages/services/messageApi';
import { type Product } from '../types/product.types';
import { useAuth } from '../../auth/context/AuthContext';
import { MapView } from '../../../components/common/MapView';

import { getImageUrl } from '../../../utils/imageUrl';

// Toast UI Viewer
import '@toast-ui/editor/dist/toastui-editor-viewer.css';
import { Viewer } from '@toast-ui/react-editor';

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (id) {
      productApi.getOne(parseInt(id))
        .then(res => {
          setProduct(res.data);
          setIsLiked(!!res.data.is_favorited);
        })
        .catch(err => {
          console.error('Failed to load product', err);
          setError(err.response?.data?.message || 'Product not found');
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleToggleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!product) return;
    try {
      await profileApi.toggleFavorite(product.id);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to toggle favorite', error);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!message.trim() || !product) return;
    try {
      const sellerId = product.seller?.id;
      if (!sellerId) {
        alert('Seller information is missing');
        return;
      }

      const formData = new FormData();
      formData.append('to_user_id', String(sellerId));
      formData.append('message', message);
      formData.append('product_id', String(product.id));
      formData.append('type', 'text');

      await messageApi.sendMessage(formData);
      alert('Message sent!');
      setMessage('');
      setShowMessageBox(false);
    } catch (error) {
      alert('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="animate-pulse flex flex-col lg:flex-row gap-8 text-left">
          <div className="lg:w-2/3 space-y-4">
            <div className="bg-gray-200 aspect-video rounded-md"></div>
            <div className="h-8 bg-gray-200 w-3/4 rounded"></div>
            <div className="h-4 bg-gray-200 w-full rounded"></div>
          </div>
          <div className="lg:w-1/3 space-y-4">
            <div className="bg-gray-200 h-64 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{error || 'Product not found'}</h2>
        <Link to="/" className="text-blue-600 hover:underline font-bold uppercase tracking-widest text-xs">Back to Homepage</Link>
      </div>
    );
  }

  const images = product.images?.length > 0
    ? product.images.map((img: any) => getImageUrl(img.image_url))
    : ['https://placehold.co/800x600?text=No+Image'];

  const mainCategory = product.category?.parent || product.category;
  const subCategory = product.category?.parent ? product.category : null;

  const getTelecomProvider = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const prefix = cleanPhone.startsWith('855') ? '0' + cleanPhone.substring(3, 5) : cleanPhone.substring(0, 3);

    const providers = [
      {
        name: 'Smart',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Smart_Axiata_logo.svg/100px-Smart_Axiata_logo.svg.png',
        color: '#1fb25a',
        textColor: 'white',
        prefixes: ['010', '015', '016', '069', '070', '081', '086', '087', '093', '096', '098']
      },
      {
        name: 'Cellcard',
        logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0e/Cellcard_logo.png/100px-Cellcard_logo.png',
        color: '#f37021',
        textColor: 'white',
        prefixes: ['011', '012', '014', '017', '061', '076', '077', '078', '085', '089', '092', '095', '099']
      },
      {
        name: 'Metfone',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Metfone_logo.png/100px-Metfone_logo.png',
        color: '#ed1c24',
        textColor: 'white',
        prefixes: ['031', '060', '066', '067', '068', '071', '088', '090', '097']
      },
      {
        name: 'Yes',
        logo: 'https://yes.com.kh/wp-content/uploads/2020/03/yes-logo.png',
        color: '#fcee21',
        textColor: '#333333',
        prefixes: ['018']
      }
    ];

    return providers.find(p => p.prefixes.includes(prefix));
  };

  let posterPhones: string[] = [];
  try {
    if (product.poster_phones) {
      posterPhones = typeof product.poster_phones === 'string' ? JSON.parse(product.poster_phones) : product.poster_phones;
    }
  } catch(e) {}

  return (
    <div className="bg-[#f1f2f6] dark:bg-[#08060d] min-h-screen antialiased text-left pb-20 font-sans transition-colors duration-300">

      {/* Khmer24 Style Breadcrumbs */}
      <div className="bg-white dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 py-3 shadow-sm transition-colors">
        <div className="container mx-auto px-4 max-w-7xl">
          <nav className="flex text-xs font-bold text-gray-400 dark:text-gray-500 gap-2 items-center uppercase tracking-tight">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
            <Link to={`/products?category_id=${mainCategory.id}`} className="hover:text-blue-600 transition-colors">{mainCategory.name}</Link>
            {subCategory && (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                <Link to={`/products?category_id=${subCategory.id}`} className="hover:text-blue-600 transition-colors">{subCategory.name}</Link>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Column: Media & Details */}
          <div className="lg:w-2/3 space-y-6">

            <div className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden shadow-sm transition-colors">
              {/* Image Gallery - Exact ratio */}
              <div className="relative bg-black aspect-video flex items-center justify-center group">
                <img
                  src={images[activeImageIndex]}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain"
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full transition opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <button
                      onClick={() => setActiveImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full transition opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </>
                )}

                <button
                  onClick={handleToggleLike}
                  className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all ${isLiked ? 'bg-red-500 text-white shadow-xl' : 'bg-black/20 text-white hover:bg-white hover:text-red-500'}`}
                >
                  <svg className="w-6 h-6" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.01 0 000 6.364L12 20.364l7.682-7.682a4.5 4.01 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.01 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-[#f8f9fa] dark:bg-[#16171d] border-b border-gray-200 dark:border-gray-800 transition-colors">
                  {images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-12 rounded border-2 transition-all ${activeImageIndex === idx ? 'border-blue-600' : 'border-white dark:border-gray-700'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Header */}
              <div className="p-6">
                <div className="mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-4">{product.title}</h1>
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-4">
                            <p className="text-3xl font-black text-blue-600 dark:text-blue-500">${Number(product.discount_price ?? product.price ?? 0).toLocaleString()}</p>
                            {product.discount_price && (
                                <p className="text-xl font-bold text-gray-400 dark:text-gray-600 line-through">${Number(product.price || 0).toLocaleString()}</p>
                            )}
                        </div>
                        <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter space-y-0.5 text-right">
                           <p className="flex items-center justify-end gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                Posted on {new Date(product.created_at).toLocaleDateString()}
                           </p>
                           <p className="flex items-center justify-end gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                                {product.village?.name ? `${product.village.name}, ` : ''}
                                {product.commune?.name ? `${product.commune.name}, ` : ''}
                                {product.district?.name ? `${product.district.name}, ` : ''}
                                {product.province?.name || product.location}
                           </p>
                        </div>
                    </div>
                </div>

                {/* Specifications Grid - THE KEY REQUESTED PART */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4 mb-10">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase font-black tracking-tight">Category</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-500 hover:underline"><Link to={`/products?category_id=${product.category?.id}`}>{product.category?.name}</Link></p>
                  </div>

                  {/* Dynamic Attributes based on Category */}
                  {product.attribute_values?.map((av: any) => (
                    <div key={av.id} className="space-y-1">
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase font-black tracking-tight">{av.attribute?.name}</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{av.value}</p>
                    </div>
                  ))}

                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase font-black tracking-tight">Condition</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">{product.condition}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 uppercase font-black tracking-tight">Ad ID</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">#SS-{product.id}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-6">Description</h3>
                  <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed prose dark:prose-invert max-w-none">
                    {product.description ? (
                      <Viewer initialValue={product.description} />
                    ) : (
                      "No description provided."
                    )}
                  </div>
                </div>

                {/* Map Integration */}
                {product.lat && product.lng && (
                    <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-6">Location Map</h3>
                        <div className="h-80 w-full rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden relative shadow-inner group transition-colors">
                            <MapView lat={String(product.lat)} lng={String(product.lng)} />
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${product.lat},${product.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 z-20 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center group"
                            >
                                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-2xl border border-gray-100 dark:border-gray-800 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all font-black text-[11px] uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                    Open in Google Maps
                                </div>
                            </a>
                        </div>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Seller Info */}
          <div className="lg:w-1/3 space-y-4">

            <div className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-md shadow-sm sticky top-24 overflow-hidden transition-colors">
              <div className="bg-[#f8f9fa] dark:bg-[#16171d] px-4 py-2 border-b border-gray-100 dark:border-gray-800 transition-colors">
                <h2 className="text-[11px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest">Seller Contact</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Link to={`/u/${product.seller?.id}`} className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-black border-4 border-[#f1f2f6] dark:border-[#08060d] shadow-inner overflow-hidden flex-shrink-0 transition-colors">
                    {product.seller?.avatar ? (
                        <img src={getImageUrl(product.seller.avatar)} className="w-full h-full object-cover" />
                    ) : (
                        (product.poster_name || product.seller?.name || '?').charAt(0).toUpperCase()
                    )}
                  </Link>
                  <div className="min-w-0">
                    <Link to={`/u/${product.seller?.id}`} className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate">{product.poster_name || product.seller?.name}</Link>
                    {product.company_name && (
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tight truncate">{product.company_name}</p>
                    )}
                    <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[9px] font-black uppercase rounded border border-green-100 dark:border-green-900/30 w-fit transition-colors">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                        Verified
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {posterPhones.length > 0 ? posterPhones.map((phone, i) => {
                    const provider = getTelecomProvider(phone);
                    return (
                      <div
                        key={i}
                        style={provider ? { backgroundColor: provider.color, color: provider.textColor } : {}}
                        className={`group ${!provider ? 'bg-[#28a745] text-white' : ''} hover:opacity-95 flex items-center justify-between px-4 py-3 rounded font-bold transition-all shadow-md cursor-pointer select-none`}
                      >
                        <div className="flex items-center gap-3">
                          {provider ? (
                            <div className="bg-white p-0.5 rounded-full shadow-sm flex items-center justify-center overflow-hidden w-7 h-7">
                                <img
                                    src={provider.logo}
                                    className="w-full h-full object-contain"
                                    alt={provider.name}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + provider.name.charAt(0) + '&background=fff&color=' + provider.color.replace('#', '');
                                    }}
                                />
                            </div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                          )}
                          <span className="text-lg tracking-tight">{phone}</span>
                        </div>
                        {provider && (
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{provider.name}</span>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="p-4 bg-gray-50 dark:bg-[#16171d] rounded text-center text-xs text-gray-400 dark:text-gray-600 font-bold uppercase transition-colors">No phone provided</div>
                  )}

                  <button 
                    onClick={() => setShowMessageBox(!showMessageBox)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-bold transition-all active:scale-95 border ${showMessageBox ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-[#1f2028] border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    {showMessageBox ? 'CANCEL' : 'SEND MESSAGE'}
                  </button>

                  {showMessageBox && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-300">
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full border border-gray-200 dark:border-gray-700 p-3 rounded text-sm focus:border-blue-500 dark:focus:border-blue-400 outline-none min-h-[100px] transition-all bg-[#f8f9fa] dark:bg-[#16171d] text-gray-800 dark:text-gray-200"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="mt-2 w-full bg-blue-600 dark:bg-blue-500 text-white py-2 rounded font-bold text-xs hover:bg-blue-700 dark:hover:bg-blue-600 transition shadow-md shadow-blue-600/20"
                      >
                        SEND
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-[#16171d] p-4 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-500 dark:text-gray-500 leading-relaxed font-medium transition-colors">
                  <p className="flex items-center gap-2 mb-2 font-bold text-gray-800 dark:text-gray-400">
                    <svg className="w-4 h-4 text-orange-500 dark:text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                    Safety Tips
                  </p>
                  <ul className="list-disc ml-4 space-y-1">
                      <li>Meet seller at a public place</li>
                      <li>Check the item before you buy</li>
                      <li>Pay only after collecting the item</li>
                  </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
