import { useState, type FormEvent } from 'react';
import { useOtpCountdown } from '../hooks/useOtpCountdown';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { isGoogleSignInEnabled } from '../utils/google';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../../../context/AlertContext';
import { useTranslation } from 'react-i18next';

type Step = 'lookup' | 'telegram' | 'code' | 'google' | 'reset';

export const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('lookup');
  const [login, setLogin] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [telegramLink, setTelegramLink] = useState('');
  const [botUsername, setBotUsername] = useState('');
  // Held from /password/forgot so only this browser can finish the reset.
  const [resetToken, setResetToken] = useState('');
  const [otpSeconds, setOtpSeconds] = useState<number | null>(null);
  const { remaining, expired, label: countdownLabel } = useOtpCountdown(otpSeconds);
  const [notLinked, setNotLinked] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  /** Look up the account and route to the right recovery channel. */
  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();

    if (!login.trim()) {
      setErrors({ login: t('validation.required') });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(login.trim());

      if (res.data.method === 'google') {
        setStep('google');
        return;
      }

      // No Telegram is linked, so the API refuses to issue a code. Show the
      // message instead of dropping the customer on a dead end.
      if (res.data.method === 'telegram_not_linked') {
        setNotLinked(res.data.message || '');
        setStep('lookup');
        setErrors({ login: res.data.message || '' });
        return;
      }

      setBotUsername(res.data.bot_username || '');
      setResetToken(res.data.reset_token || '');
      setOtpSeconds(res.data.expires_in ?? null);

      if (res.data.method === 'telegram_link') {
        setTelegramLink(res.data.link || '');
        setStep('telegram');
        window.open(res.data.link, '_blank', 'noopener');
        return;
      }

      // The Telegram account is already linked, so the bot has sent the code.
      setStep('code');
    } catch (err: any) {
      const message = err.response?.data?.message || 'មិនរកឃើញគណនីនេះឡើយ។';

      if (err.response?.status === 422 && err.response?.data?.method === 'telegram_not_linked') {
        setNotLinked(message);
        setErrors({ login: message });
      } else {
        showAlert({
          title: 'បរាជ័យ!',
          message,
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setLoading(true);
    try {
      // Bind the Google identity to the account that was looked up, otherwise
      // the account chooser could sign us into a different Google account.
      await loginWithGoogle(credential, login.trim());
      showAlert({
        title: 'ជោគជ័យ!',
        message: 'ឥឡូវនេះអ្នកបានចូលដោយប្រើ Google ហើយ។ គណនីនេះមិនមានលេខសម្ងាត់ទេ។',
        type: 'success',
        onClose: () => navigate('/', { replace: true })
      });
    } catch (err: any) {
      showAlert({
        title: 'បរាជ័យ!',
        message: err.response?.data?.message || 'ការផ្ទៀងផ្ទាត់ដោយ Google មិនជោគជ័យឡើយ។',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /** Final step: swap the 6-digit Telegram code for a brand-new password. */
  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = t('validation.required');

    if (!/^\d{6}$/.test(otp.trim())) {
      newErrors.otp = 'សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់';
    } else if (expired) {
      newErrors.otp = 'លេខកូដបានផុតកំបន់ សូមស្នើសុំលេខកូដថ្មី។';
    }
    if (!password.trim()) {
      newErrors.password = Msg;
    } else if (password.length < 8) {
      newErrors.password = 'លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៨ ខ្ទង់';
    }
    if (password !== passwordConfirmation) {
      newErrors.password_confirmation = 'លេខសម្ងាត់បញ្ជាក់មិនត្រឹមត្រូវ';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await authApi.resetPassword({
        login: login.trim(),
        otp: otp.trim(),
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation,
      });
      showAlert({
        title: 'ជោគជ័យ!',
        message: 'លេខសម្ងាត់របស់អ្នកត្រូវបានប្ដូរដោយជោគជ័យ។',
        type: 'success',
        onClose: () => navigate('/login', { replace: true })
      });
    } catch (err: any) {
      showAlert({
        title: 'បរាជ័យ!',
        message: err.response?.data?.message || 'ការប្ដូរលេខសម្ងាត់មិនជោគជ័យឡើយ។',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const stepTitle: Record<Step, string> = {
    lookup: 'Reset your password',
    telegram: 'Connect Telegram',
    code: 'Enter your code',
    google: 'Verify with Google',
    reset: 'Choose a new password',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#08060d] antialiased p-4 py-12 transition-colors duration-300">
      <Link
        to="/login"
        className="mb-8 flex items-center gap-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-all font-bold text-xs uppercase tracking-widest group"
      >
        <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Login
      </Link>

      <Link to="/" className="flex items-center gap-2 mb-8 group">
        <div className="bg-blue-600 text-white font-black px-2 py-1 rounded text-2xl italic group-hover:bg-blue-700 transition">
          SABAY
        </div>
        <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">SHOP</span>
      </Link>

      <div className="max-w-md w-full bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 rounded-md shadow-sm overflow-hidden transition-colors">
        <div className="bg-gray-50 dark:bg-[#1f2028]/50 px-8 py-4 border-b border-gray-200 dark:border-gray-800 transition-colors">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase text-center tracking-widest">{stepTitle[step]}</h2>
        </div>

        <div className="p-5 sm:p-8">
          {step === 'lookup' && (
            <form onSubmit={handleLookup} noValidate className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">Email or Phone</label>
                <input
                  type="text"
                  placeholder="your@email.com or 012 345 678"
                  value={login}
                  onChange={(e) => {
                    setLogin(e.target.value);
                    if (errors.login) setErrors(prev => ({ ...prev, login: '' }));
                  }}
                  className={`w-full px-4 py-3 border rounded focus:border-blue-500 outline-none transition text-sm bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 ${errors.login ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                />
                {errors.login && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.login}</p>}
                {notLinked && (
                  <p className="text-[10px] font-bold mt-1.5 ml-1 text-gray-500 dark:text-gray-400">
                    If you can still sign in, open your profile and connect Telegram under Security, then try again.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          )}

          {step === 'telegram' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Start the bot so it can reach your chat, then come back here for your code.
              </p>
              {telegramLink && (
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#229ED9] hover:bg-[#1e8cc0] text-white py-3 rounded font-black text-xs uppercase tracking-widest text-center transition-all active:scale-95"
                >
                  Open Telegram{botUsername ? ` (@${botUsername})` : ''}
                </a>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep('code');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50"
              >
                I pressed Start
              </button>
              <button
                type="button"
                onClick={() => setStep('lookup')}
                className="w-full text-center text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 transition"
              >
                Use a different account
              </button>
            </div>
          )}

          {(step === 'code' || step === 'reset') && (
            <form onSubmit={step === 'code' ? (e) => { e.preventDefault(); setStep('reset'); } : handleReset} noValidate className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {step === 'code'
                  ? <>We sent a 6-digit code to your Telegram{botUsername ? ` (@${botUsername})` : ''}. Enter it below to continue.</>
                  : 'Enter your verification code and choose a new password.'}
              </p>

              {countdownLabel && (
                <p
                  className={`text-center text-[11px] font-bold ${expired ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {expired
                    ? 'លេខកូដបានផុតកំបន់ សូមស្នើសុំលេខកូដថ្មី។'
                    : `លេខកូដនៅសល់ ${countdownLabel} នាទី`}
                </p>
              )}

              {step === 'code' ? (
                <>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border rounded focus:border-blue-500 outline-none transition text-sm text-center tracking-[0.5em] font-black bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                  />
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6 || expired}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50"
                  >
                    Continue
                  </button>
                  {expired && (
                    <button
type="button"
                    onClick={() => {
                      setOtp('');
                      setErrors({});
                      handleLookup({ preventDefault: () => {} } as FormEvent);
                    }}
                      className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                    >
                      Request a new code
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">Verification Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className={`w-full px-4 py-3 border rounded focus:border-blue-500 outline-none transition text-sm text-center tracking-[0.5em] font-black bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 ${errors.otp ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                    />
                    {errors.otp && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.otp}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        className={`w-full px-4 py-3 pr-10 border rounded focus:border-blue-500 outline-none transition text-sm bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 ${errors.password ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={passwordConfirmation}
                        onChange={(e) => {
                          setPasswordConfirmation(e.target.value);
                          if (errors.password_confirmation) setErrors(prev => ({ ...prev, password_confirmation: '' }));
                        }}
                        className={`w-full px-4 py-3 pr-10 border rounded focus:border-blue-500 outline-none transition text-sm bg-white dark:bg-[#08060d] text-gray-800 dark:text-gray-200 ${errors.password_confirmation ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                      </button>
                    </div>
                    {errors.password_confirmation && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.password_confirmation}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || expired}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Reset Password'}
                  </button>

                  {expired && (
                    <button
                      type="button"
                      onClick={() => {
                        setStep('lookup');
                        setOtp('');
                        setErrors({});
                      }}
                      className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                    >
                      Request a new code
                    </button>
                  )}
                </>
              )}
            </form>
          )}

          {step === 'google' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This account signs in with Google, so there is no password to reset. Continue with Google and you are done.
              </p>
              {isGoogleSignInEnabled ? (
                <GoogleSignInButton onCredential={handleGoogle} text="continue_with" />
              ) : (
                <p className="text-sm text-red-500 font-bold">Google Sign-In is currently unavailable. Please contact support.</p>
              )}
              <button
                type="button"
                onClick={() => setStep('lookup')}
                className="w-full text-center text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 transition"
              >
                Use a different account
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400 dark:text-gray-600">
        &copy; {new Date().getFullYear()} Sabay Shop Marketplace. All rights reserved.
      </p>
    </div>
  );
};
