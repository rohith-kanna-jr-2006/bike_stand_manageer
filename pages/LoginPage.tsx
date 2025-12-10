import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ArrowRight, Bike, MapPin, BarChart3, Users, LayoutDashboard, CheckCircle, AlertCircle, Mail, Smartphone, User as UserIcon, X, Chrome, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, AuthProvider, User } from '../types';
import { validateEmail, validatePassword, validatePhone } from '../utils/validation';
import { authService, ConfirmationResult } from '../utils/authService';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [activePortal, setActivePortal] = useState<'user' | 'admin'>('user');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Role is derived from activePortal
  const role = activePortal === 'admin' ? UserRole.ADMIN : UserRole.USER;

  // Auth Mode State
  const [isSignUp, setIsSignUp] = useState(false);

  // Default Personas
  const USER_DEFAULT_EMAIL = 'alice.parker@gmail.com';
  const ADMIN_DEFAULT_EMAIL = 'admin@securecycle.com';

  // Form States
  const [email, setEmail] = useState(USER_DEFAULT_EMAIL);
  const [password, setPassword] = useState('SecurePass123!');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // OTP States
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Sync Email with Portal Change
  useEffect(() => {
    if (!isSignUp) {
      if (activePortal === 'admin') {
        if (email === USER_DEFAULT_EMAIL) setEmail(ADMIN_DEFAULT_EMAIL);
        setAuthMethod('email'); // Admins usually use email
      } else {
        if (email === ADMIN_DEFAULT_EMAIL) setEmail(USER_DEFAULT_EMAIL);
      }
    }
    setErrors({});
  }, [activePortal, isSignUp]);

  // Cooldown Timer Effect
  useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  // Helper: Generate Stable ID based on string input (email/phone)
  const getStableId = (identifier: string): string => {
    let hash = 0;
    const str = identifier.toLowerCase().trim();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `user_${Math.abs(hash)}`;
  };

  // Google OAuth Implementation
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Send access token to backend
        const res = await axios.post('http://localhost:3002/api/auth/google', {
          token: tokenResponse.access_token,
          role: role // Pass the selected role
        });

        const { user: backendUser, token } = res.data;

        // Enforce Role Separation
        if (activePortal === 'admin' && backendUser.role !== 'admin') {
             setErrors({ form: 'Access Denied: This account is not an administrator.' });
             return;
        }
        if (activePortal === 'user' && backendUser.role === 'admin') {
             setErrors({ form: 'Please sign in via the Admin Portal.' });
             return;
        }

        // Store JWT
        localStorage.setItem('authToken', token);

        // Map backend user to frontend user
        const userData: User = {
          id: backendUser._id,
          name: backendUser.name,
          email: backendUser.email,
          role: backendUser.role as UserRole,
          provider: AuthProvider.GOOGLE,
          avatar: backendUser.avatar
        };

        login(userData);
      } catch (error) {
        console.error('Google Auth Failed', error);
        setErrors({ form: 'Google authentication failed. Please try again.' });
      }
    },
    onError: () => {
      setErrors({ form: 'Google authentication failed.' });
    }
  });

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setConfirmPassword('');
    setShowOtpInput(false);
    setOtp('');
    setCooldown(0);
    setConfirmationResult(null);

    if (!isSignUp) {
      setFullName('');
      setEmail('');
      setPassword('');
    } else {
      setEmail(role === UserRole.ADMIN ? ADMIN_DEFAULT_EMAIL : USER_DEFAULT_EMAIL);
      setPassword('SecurePass123!');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email format (e.g., user@example.com)." }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  // Secure OTP Request Flow
  const handleRequestOtp = async (phoneNumber: string) => {
    if (authMethod === 'email') {
      alert(`[EMAIL SIMULATION] Code for ${phoneNumber}: 123456`);
      setCooldown(30);
      return true;
    }

    try {
      await authService.initRecaptcha('recaptcha-container');
      const response = await authService.requestOtp(phoneNumber);

      if (!response.success) {
        setErrors({ phone: response.message });
        return false;
      }

      if (response.confirmationResult) {
        setConfirmationResult(response.confirmationResult);
        setCooldown(60);
        setErrors({});
        return true;
      }
      return false;

    } catch (e) {
      console.error(e);
      setErrors({ form: "Failed to initialize verification system." });
      return false;
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (isSignUp && !fullName.trim()) newErrors.name = "Full Name is required.";
    if (!validateEmail(email)) newErrors.email = "Invalid format. Example: user@example.com";
    if (!validatePassword(password)) newErrors.password = "Password must be 8+ chars with numbers.";

    if (isSignUp && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      const endpoint = isSignUp ? 'http://localhost:3002/api/auth/register' : 'http://localhost:3002/api/auth/login';
      const payload = isSignUp
        ? { name: fullName, email, password, role }
        : { email, password };

      const response = await axios.post(endpoint, payload);

      if (response.data.success) {
        const userData = response.data.user;

        // Enforce Role Separation
        if (activePortal === 'admin' && userData.role !== 'admin') {
          setErrors({ form: 'Access Denied: This account is not an administrator.' });
          return;
        }
        if (activePortal === 'user' && userData.role === 'admin') {
          setErrors({ form: 'Please sign in via the Admin Portal.' });
          return;
        }

        localStorage.setItem('authToken', response.data.token);
        login({
          ...userData,
          provider: AuthProvider.LOCAL
        });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setErrors({ form: err.response?.data?.message || 'Authentication failed. Please check your credentials.' });
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (isSignUp && !fullName.trim()) newErrors.name = "Full Name is required.";

    if (!showOtpInput) {
      if (!validatePhone(phone)) {
        setErrors({ ...newErrors, phone: "Format: +1234567890" });
        return;
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});
      const sent = await handleRequestOtp(phone);
      if (sent) setShowOtpInput(true);

    } else {
      if (!confirmationResult) {
        setErrors({ form: "Session expired. Please request code again." });
        return;
      }

      const verification = await authService.verifyOtp(confirmationResult, otp);

      if (!verification.success) {
        setErrors({ otp: verification.message });
        return;
      }

      const stableId = verification.user?.uid || getStableId(phone);

      login({
        id: stableId,
        name: isSignUp ? fullName : (role === UserRole.ADMIN ? 'Mobile Administrator' : 'Mobile User'),
        phoneNumber: phone,
        role: role,
        provider: AuthProvider.PHONE,
        avatar: role === UserRole.ADMIN
          ? 'https://ui-avatars.com/api/?name=Mobile+Admin&background=4f46e5&color=fff'
          : (isSignUp ? `https://ui-avatars.com/api/?name=${fullName}` : 'https://picsum.photos/seed/mobile/200')
      });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetStatus('sending');
    setErrorMessage('');
    setTimeout(() => {
      setResetStatus('success');
    }, 1500);
  };

  const closeResetModal = () => {
    setShowForgotModal(false);
    setResetStatus('idle');
    setResetEmail('');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative">
            <button
              onClick={closeResetModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Enter your email to receive a reset link.
                </p>
              </div>

              {resetStatus === 'success' ? (
                <div className="text-center animate-in zoom-in-95">
                  <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 mb-6">
                    <div className="flex justify-center mb-2">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <p className="font-semibold">Email Sent!</p>
                    <p className="text-xs mt-1">Please check your inbox (and spam) for the link to set a new password.</p>
                  </div>
                  <Button onClick={closeResetModal} className="w-full">
                    Return to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordReset}>
                  <div className="space-y-4">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />

                    {resetStatus === 'error' && (
                      <div className="flex items-start text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                        <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      isLoading={resetStatus === 'sending'}
                    >
                      Send Reset Link <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Left Side: Visual & Branding */}
      <div className={`lg:w-1/2 relative overflow-hidden transition-colors duration-500 ${activePortal === 'admin' ? 'bg-slate-900' : 'bg-indigo-600'}`}>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2px)',
            backgroundSize: '30px 30px',
            transform: activePortal === 'admin' ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 10s ease-in-out'
          }}>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white p-12 text-center">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 ${activePortal === 'admin' ? 'bg-indigo-500 rotate-12' : 'bg-white -rotate-6'}`}>
            {activePortal === 'admin' ? (
              <ShieldCheck className="h-12 w-12 text-white" />
            ) : (
              <Bike className="h-12 w-12 text-indigo-600" />
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            {activePortal === 'admin' ? 'SecureCycle Admin' : 'SecureCycle'}
          </h1>

          <p className="text-lg md:text-xl text-indigo-100 max-w-md leading-relaxed">
            {activePortal === 'admin'
              ? 'Enterprise-grade fleet management, revenue analytics, and real-time network monitoring.'
              : 'Find the perfect parking spot, book instantly, and secure your ride with ease.'}
          </p>

          {/* Feature Pills */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {activePortal === 'admin' ? (
              <>
                <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium flex items-center"><BarChart3 className="w-4 h-4 mr-2" /> Analytics</span>
                <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium flex items-center"><Users className="w-4 h-4 mr-2" /> User Mgmt</span>
                <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium flex items-center"><Lock className="w-4 h-4 mr-2" /> MFA Secured</span>
              </>
            ) : (
              <>
                <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium flex items-center"><MapPin className="w-4 h-4 mr-2" /> Live Map</span>
                <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Instant Booking</span>
                <span className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium flex items-center"><ShieldCheck className="w-4 h-4 mr-2" /> Secure</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md space-y-6">

          {/* Portal Toggle */}
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex mb-8">
            <button
              onClick={() => setActivePortal('user')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-200 ${activePortal === 'user'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              User Portal
            </button>
            <button
              onClick={() => setActivePortal('admin')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-200 ${activePortal === 'admin'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              Admin Portal
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {activePortal === 'admin' ? 'Welcome Back, Admin' : 'Get Started'}
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                {activePortal === 'admin'
                  ? 'Please authenticate to access the dashboard.'
                  : 'Sign in to start booking parking spots.'}
              </p>
            </div>

            {/* Auth Method Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => { setAuthMethod('email'); setErrors({}); setShowOtpInput(false); }}
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${authMethod === 'email' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Email & Password
              </button>
              <button
                onClick={() => { setAuthMethod('phone'); setErrors({}); setShowOtpInput(false); }}
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${authMethod === 'phone' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Phone Number
              </button>
            </div>

            {errors.form && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start text-left mb-4">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Forms */}
            <div className="text-left space-y-4">
              {authMethod === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {isSignUp && (
                    <Input
                      label="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      icon={<UserIcon className="h-4 w-4" />}
                      error={errors.name}
                      placeholder="John Doe"
                    />
                  )}

                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    icon={<Mail className="h-4 w-4" />}
                    error={errors.email}
                    placeholder="user@example.com"
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    error={errors.password}
                    placeholder="••••••••"
                  />

                  {isSignUp && (
                    <Input
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      error={errors.confirmPassword}
                      placeholder="••••••••"
                    />
                  )}

                  {isSignUp && showOtpInput && (
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      <Input
                        label="Verification Code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        error={errors.otp}
                        placeholder="000000"
                        className="text-center tracking-widest text-lg font-mono"
                        maxLength={6}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    {!role && <div></div>}
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-indigo-600 hover:text-indigo-500 font-medium ml-auto"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className={`w-full ${activePortal === 'admin' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    isLoading={isLoading}
                  >
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Button>
                </form>
              )}

              {authMethod === 'phone' && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div id="recaptcha-container"></div>
                  {isSignUp && !showOtpInput && (
                    <Input
                      label="Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      icon={<UserIcon className="h-4 w-4" />}
                      error={errors.name}
                      placeholder="John Doe"
                    />
                  )}

                  {!showOtpInput ? (
                    <Input
                      label="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      icon={<Smartphone className="h-4 w-4" />}
                      error={errors.phone}
                      placeholder="+1234567890"
                    />
                  ) : (
                    <Input
                      label="OTP Code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      error={errors.otp}
                      placeholder="000000"
                      className="text-center tracking-widest text-lg font-mono"
                      maxLength={6}
                    />
                  )}

                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    {showOtpInput ? 'Verify & Login' : 'Send Code'}
                  </Button>
                </form>
              )}
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={() => { setErrors({}); googleLogin(); }}
              disabled={isLoading}
              className={`w-full flex items-center justify-center py-3 px-4 border rounded-xl shadow-sm text-base font-medium transition-all duration-200 relative group overflow-hidden ${activePortal === 'admin'
                ? 'bg-slate-900 border-transparent text-white hover:bg-slate-800'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200'
                }`}
            >
              {/* Google Icon SVG */}
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.059 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.799 L -6.734 42.379 C -8.804 40.449 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                </g>
              </svg>
              {activePortal === 'admin' ? 'Sign in with Google' : 'Continue with Google'}
              <ArrowRight className={`ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 ${activePortal === 'admin' ? 'text-white' : 'text-gray-400'}`} />
            </button>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <button
                  onClick={toggleAuthMode}
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  {isSignUp ? "Sign In" : "Create one"}
                </button>
              </p>
            </div>

            {activePortal === 'admin' && (
              <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 mr-2 shrink-0" />
                <p className="text-xs text-amber-800">
                  <strong>Restricted Access:</strong> Requires an authorized admin account. MFA verification may be required upon login.
                </p>
              </div>
            )}

            <p className="text-xs text-center text-gray-400 mt-8">
              Protected by SecureCycle Identity • Version 2.4.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
