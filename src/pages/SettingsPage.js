import React, { useState, useContext, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ConfigContext } from '../contexts/ConfigContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, User as UserIcon, Settings, IndianRupee, Clock, ShieldCheck, AlertCircle, CreditCard, Trash2, Plus, CheckCircle, X, Smartphone, MapPin, Camera, SmartphoneNfc, Lock, QrCode, Shield, RefreshCw, Bike, Car, Zap } from 'lucide-react';
import { validatePhone } from '../utils/validation';
import { authService } from '../utils/authService';
import { totpService } from '../utils/totpService';

// Enum simulation for UserRole and AuthProvider if they were enums in TS
const UserRole = {
    ADMIN: 'admin',
    USER: 'user',
    STAND_OWNER: 'stand_owner'
};

const AuthProvider = {
    GOOGLE: 'google',
    EMAIL: 'email',
    PHONE: 'phone'
};

export const SettingsPage = () => {
    const { user, updateProfile } = useAuth();
    const config = useContext(ConfigContext);
    const fileInputRef = useRef(null);

    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    // OTP Verification State
    const [showOtpStep, setShowOtpStep] = useState(false);
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);

    // 2FA State
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [twoFaStep, setTwoFaStep] = useState('select');
    const [twoFaMethod, setTwoFaMethod] = useState('app');
    const [twoFaCode, setTwoFaCode] = useState('');
    const [twoFaError, setTwoFaError] = useState('');

    // Real TOTP State
    const [tempSecret, setTempSecret] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    // Validation Errors State
    const [errors, setErrors] = useState({});

    // User Form State
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phoneNumber || '');
    const [address, setAddress] = useState(user?.address || '');
    const [savedVehicles, setSavedVehicles] = useState({
        bike: [],
        car: [],
        ebike: []
    });

    // Avatar State (Preview)
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');

    // Admin Form State
    const [baseRate, setBaseRate] = useState(config?.baseRate?.toString() || '50.00');
    const [gracePeriod, setGracePeriod] = useState(config?.gracePeriod?.toString() || '15');
    const [penaltyRate, setPenaltyRate] = useState(config?.penaltyMultiplier?.toString() || '1.5');

    // Payment Methods State (Now persisted)
    const [cards, setCards] = useState([]);

    const [isAddingMethod, setIsAddingMethod] = useState(false);
    const [newMethodType, setNewMethodType] = useState('card');
    const [newPayment, setNewPayment] = useState({
        number: '', expiry: '', cvc: '', name: '', upiId: ''
    });

    // --- PERSISTENCE: Fetch User Data from Backend ---
    useEffect(() => {
        // In a real app, we would fetch user details from an endpoint like /api/users/me
        // For now, we rely on the AuthContext which should be populated from the login response
        if (user) {
            setName(user.name || '');
            setPhone(user.phoneNumber || '');
            setAddress(user.address || '');
            setAvatarPreview(user.avatar || '');
            if (user.paymentMethods) {
                setCards(user.paymentMethods);
            }
            if (user.savedVehicles) {
                setSavedVehicles(user.savedVehicles);
            } else if (user.vehicleNumber) {
                // Backward compatibility: Populate from old fields
                const type = user.vehicleType === 'car' ? 'car' : 'bike';
                setSavedVehicles({
                    bike: type === 'bike' ? [{ number: user.vehicleNumber, model: user.vehicleModel || '' }] : [],
                    car: type === 'car' ? [{ number: user.vehicleNumber, model: user.vehicleModel || '' }] : [],
                    ebike: []
                });
            }
        }
    }, [user]);

    const handlePhotoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            setAvatarPreview(imageUrl);
        }
    };

    const sendSettingsOtp = async () => {
        setOtp('');
        setErrors({});
        try {
            await authService.initRecaptcha('recaptcha-settings-container');
            const response = await authService.requestOtp(phone);
            if (!response.success) {
                setErrors({ otp: response.message });
            } else if (response.confirmationResult) {
                setConfirmationResult(response.confirmationResult);
            }
        } catch (e) {
            console.error(e);
            setErrors({ otp: "Failed to initialize verification." });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!name.trim()) newErrors.name = "Display name cannot be empty";

        if (phone && !validatePhone(phone)) {
            newErrors.phone = "Invalid phone format (e.g., +1234567890)";
        }

        // Validate Vehicles
        let hasVehicleError = false;
        ['bike', 'car', 'ebike'].forEach(type => {
            savedVehicles[type].forEach((v, i) => {
                if (!v.number.trim()) {
                    alert(`Please enter a vehicle number for ${type} #${i + 1}`);
                    hasVehicleError = true;
                }
            });
        });
        if (hasVehicleError) return;

        if (user?.role === UserRole.ADMIN) {
            const rate = parseFloat(baseRate);
            if (isNaN(rate) || rate <= 0) newErrors.baseRate = "Invalid Rate";
            const grace = parseInt(gracePeriod);
            if (isNaN(grace) || grace < 0) newErrors.gracePeriod = "Invalid Grace Period";
            const penalty = parseFloat(penaltyRate);
            if (isNaN(penalty) || penalty < 1) newErrors.penaltyRate = "Invalid Penalty";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        const phoneChanged = phone !== (user?.phoneNumber || '');
        const isGoogleUser = user?.provider === AuthProvider.GOOGLE;

        if (phoneChanged && !isGoogleUser) {
            setShowOtpStep(true);
        } else {
            setShowOtpStep(false);
        }

        setShowConfirm(true);
        if (phoneChanged && !isGoogleUser) {
            setTimeout(() => sendSettingsOtp(), 500);
        }
    };

    const handleConfirmSave = async () => {
        if (showOtpStep) {
            if (!confirmationResult) {
                setErrors({ ...errors, otp: "Session expired. Resend code." });
                return;
            }
            const verify = await authService.verifyOtp(confirmationResult, otp);
            if (!verify.success) {
                setErrors({ ...errors, otp: verify.message });
                return;
            }
        }

        setShowConfirm(false);
        setIsLoading(true);

        try {
            if (user) {
                // 1. Update Auth Context (and ideally backend)
                // Note: updateProfile in AuthContext currently just updates local state/localStorage
                // We need a backend endpoint to update user profile to make this persistent
                updateProfile({
                    name,
                    avatar: avatarPreview,
                    phoneNumber: phone,
                    address: address,
                    paymentMethods: cards,
                    savedVehicles
                });

                // Call backend API to update user profile
                const userId = user.id || user._id;
                await fetch(`http://localhost:3002/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        phoneNumber: phone,
                        address,
                        avatar: avatarPreview,
                        paymentMethods: cards,
                        savedVehicles
                    }),
                });

                updateProfile({
                    name,
                    avatar: avatarPreview,
                    phoneNumber: phone,
                    address: address,
                    paymentMethods: cards,
                    savedVehicles
                });
            }

            if (user?.role === UserRole.ADMIN && config) {
                config.updateConfig({
                    baseRate: parseFloat(baseRate),
                    gracePeriod: parseInt(gracePeriod),
                    penaltyMultiplier: parseFloat(penaltyRate)
                });
            }

            setIsLoading(false);
            setSuccessMsg('Settings saved successfully');
            setTimeout(() => setSuccessMsg(''), 3000);
            setOtp('');
            setConfirmationResult(null);

        } catch (e) {
            console.error("Save failed", e);
            setIsLoading(false);
            setSuccessMsg('Failed to save settings.');
        }
    };

    // --- Payment Methods Logic ---
    const savePaymentMethodsToFirestore = async (newCards) => {
        setCards(newCards);
        // In a real app, we would sync this to the backend immediately
        // For now, we'll rely on the main "Save Changes" button to persist everything
        // or update the local context immediately
        if (user) {
            updateProfile({ paymentMethods: newCards });
        }
    };

    const resetPaymentForm = () => {
        setNewPayment({ number: '', expiry: '', cvc: '', name: '', upiId: '' });
        setNewMethodType('card');
        setIsAddingMethod(false);
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.payment;
            return newErrors;
        });
    };

    const handleAddPaymentMethod = () => {
        const currentErrors = { ...errors };
        delete currentErrors.payment;

        if (newMethodType === 'card') {
            const numClean = newPayment.number.replace(/\s/g, '');
            const numRegex = /^\d{16}$/;
            const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
            const cvcRegex = /^\d{3,4}$/;

            if (!numRegex.test(numClean)) {
                setErrors({ ...currentErrors, payment: "Invalid Card Number (16 digits required)." });
                return;
            }
            if (!newPayment.expiry || !expiryRegex.test(newPayment.expiry)) {
                setErrors({ ...currentErrors, payment: "Invalid Expiry (Format: MM/YY)." });
                return;
            }
            if (!newPayment.cvc || !cvcRegex.test(newPayment.cvc)) {
                setErrors({ ...currentErrors, payment: "Invalid CVC (3-4 digits)." });
                return;
            }
            if (!newPayment.name.trim()) {
                setErrors({ ...currentErrors, payment: "Cardholder name is required." });
                return;
            }
        } else {
            const upiRegex = /^[\w.-]+@[\w.-]+$/;
            if (!newPayment.upiId || !upiRegex.test(newPayment.upiId)) {
                setErrors({ ...currentErrors, payment: "Invalid UPI ID (e.g., user@bank)." });
                return;
            }
        }

        const type = newMethodType === 'card'
            ? (newPayment.number.startsWith('4') ? 'VISA' : 'MasterCard')
            : undefined;

        const newMethod = {
            id: Date.now().toString(),
            method: newMethodType,
            type,
            last4: newMethodType === 'card' ? newPayment.number.slice(-4) : undefined,
            expiry: newMethodType === 'card' ? newPayment.expiry : undefined,
            upiId: newMethodType === 'upi' ? newPayment.upiId : undefined,
            isDefault: cards.length === 0,
            holderName: newPayment.name || user?.name || 'User'
        };

        savePaymentMethodsToFirestore([...cards, newMethod]);

        setSuccessMsg('Payment method saved');
        setTimeout(() => setSuccessMsg(''), 3000);
        resetPaymentForm();
    };

    const handleDeleteCard = (id) => {
        const updated = cards.filter(c => c.id !== id);
        savePaymentMethodsToFirestore(updated);
        setSuccessMsg('Payment method removed');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleSetDefaultCard = (id) => {
        const updated = cards.map(c => ({ ...c, isDefault: c.id === id }));
        savePaymentMethodsToFirestore(updated);
        setSuccessMsg('Default payment method updated');
        setTimeout(() => setSuccessMsg(''), 2000);
    };

    const getDetectedCardType = (number) => {
        if (number.startsWith('4')) return 'VISA';
        if (number.startsWith('5')) return 'MasterCard';
        return null;
    };

    // --- Vehicle Management Handlers ---
    const addVehicle = (type) => {
        if (savedVehicles[type].length < 2) {
            setSavedVehicles(prev => ({
                ...prev,
                [type]: [...prev[type], { number: '', model: '' }]
            }));
        }
    };

    const removeVehicle = (type, index) => {
        setSavedVehicles(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const updateVehicle = (type, index, field, value) => {
        setSavedVehicles(prev => ({
            ...prev,
            [type]: prev[type].map((v, i) => i === index ? { ...v, [field]: value } : v)
        }));
    };

    // --- 2FA Logic ---
    const handleStart2FA = () => {
        setShow2FAModal(true);
        setTwoFaStep('select');
        setTwoFaCode('');
        setTwoFaError('');
    };

    const handleDisable2FA = async () => {
        updateProfile({ isTwoFactorEnabled: false, twoFactorMethod: undefined });

        // Call backend to disable 2FA
        try {
            if (user) {
                const userId = user.id || user._id;
                await fetch(`http://localhost:3002/api/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        isTwoFactorEnabled: false,
                        twoFactorMethod: null
                    }),
                });
            }
        } catch (error) {
            console.error("Failed to disable 2FA on backend", error);
        }

        setSuccessMsg('Two-Factor Authentication Disabled');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handle2FAMethodSelect = async (method) => {
        if (method === 'sms') {
            if (!phone) {
                setTwoFaError('Please add a phone number to your profile first.');
                return;
            }

            setTwoFaError('');
            // Initiate SMS sending
            try {
                await authService.initRecaptcha('recaptcha-settings-container');
                const response = await authService.requestOtp(phone);

                if (!response.success) {
                    setTwoFaError(response.message);
                    return;
                }

                if (response.confirmationResult) {
                    setConfirmationResult(response.confirmationResult);
                    setTwoFaMethod(method);
                    setTwoFaStep('verify');
                }
            } catch (e) {
                console.error(e);
                setTwoFaError("Failed to send verification code. Please try again.");
            }
        } else {
            // App Logic
            setTwoFaMethod(method);
            const secret = totpService.generateSecret();
            setTempSecret(secret);
            const url = totpService.generateOtpUrl(secret, user?.email || 'user@securepark');
            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`);
            setTwoFaStep('setup');
            setTwoFaError('');
        }
    };

    const handleVerify2FA = async () => {
        setTwoFaError('');
        let isValid = false;

        if (twoFaMethod === 'app') {
            if (!twoFaCode) {
                setTwoFaError('Please enter the code.');
                return;
            }
            isValid = totpService.verify(tempSecret, twoFaCode);
            if (!isValid) {
                setTwoFaError('Invalid verification code from app.');
                return;
            }
        } else {
            // SMS Verification
            if (!confirmationResult) {
                setTwoFaError('Session expired. Please try again.');
                return;
            }
            if (!twoFaCode) {
                setTwoFaError('Please enter the SMS code.');
                return;
            }

            const verify = await authService.verifyOtp(confirmationResult, twoFaCode);
            if (!verify.success) {
                setTwoFaError(verify.message || 'Invalid SMS code.');
                return;
            }
            isValid = true;
        }

        if (isValid) {
            // Update Context
            updateProfile({ isTwoFactorEnabled: true, twoFactorMethod: twoFaMethod });

            // Call backend to enable 2FA
            try {
                if (user) {
                    const userId = user.id || user._id;
                    await fetch(`http://localhost:3002/api/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            isTwoFactorEnabled: true,
                            twoFactorMethod: twoFaMethod
                        }),
                    });
                }
            } catch (error) {
                console.error("Failed to update 2FA status on backend", error);
            }

            setShow2FAModal(false);
            setSuccessMsg('Two-Factor Authentication Enabled Successfully');
            setTimeout(() => setSuccessMsg(''), 3000);
            setTwoFaCode('');
            setConfirmationResult(null);
            setTempSecret('');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 relative pb-12">
            {/* HIDDEN RECAPTCHA FOR SETTINGS */}
            <div id="recaptcha-settings-container"></div>

            {/* ... 2FA Modal ... */}
            {show2FAModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center">
                                <ShieldCheck className="h-5 w-5 mr-2 text-indigo-600" />
                                Enable Two-Factor Auth
                            </h3>
                            <button onClick={() => setShow2FAModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            {/* ... 2FA Modal Content ... */}
                            {twoFaStep === 'select' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 mb-4">Select a verification method to secure your account:</p>
                                    <button onClick={() => handle2FAMethodSelect('app')} className="w-full flex items-center p-4 border rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group">
                                        <div className="bg-indigo-100 p-3 rounded-lg mr-4 group-hover:bg-indigo-200"><QrCode className="h-6 w-6 text-indigo-700" /></div>
                                        <div><h4 className="font-bold text-gray-900">Authenticator App</h4><p className="text-xs text-gray-500">Google Authenticator, Authy, etc.</p></div>
                                    </button>
                                    <button onClick={() => handle2FAMethodSelect('sms')} className="w-full flex items-center p-4 border rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group">
                                        <div className="bg-blue-100 p-3 rounded-lg mr-4 group-hover:bg-blue-200"><Smartphone className="h-6 w-6 text-blue-700" /></div>
                                        <div><h4 className="font-bold text-gray-900">SMS / Text Message</h4><p className="text-xs text-gray-500">Code sent to {phone || 'your phone'}</p></div>
                                    </button>
                                    {twoFaError && <p className="text-xs text-red-600 mt-2">{twoFaError}</p>}
                                </div>
                            )}
                            {twoFaStep === 'setup' && twoFaMethod === 'app' && (
                                <div className="text-center space-y-4">
                                    <p className="text-sm text-gray-600">Scan this QR code with your authenticator app:</p>
                                    <div className="bg-white p-2 border inline-block rounded-lg shadow-sm">
                                        <img src={qrCodeUrl} alt="2FA QR" className="w-40 h-40" />
                                    </div>
                                    <p className="text-xs text-gray-400 font-mono break-all px-4">Secret: {tempSecret}</p>
                                    <Button onClick={() => setTwoFaStep('verify')} className="w-full">Continue</Button>
                                </div>
                            )}
                            {(twoFaStep === 'verify' || (twoFaStep === 'setup' && twoFaMethod === 'sms')) && (
                                <div className="space-y-4">
                                    <div className="bg-indigo-50 p-4 rounded-lg text-sm text-indigo-800 mb-4">
                                        {twoFaMethod === 'app' ? "Enter the 6-digit code from your authenticator app." : `We sent a 6-digit code to ${phone}. Enter it below.`}
                                    </div>
                                    <Input label="Verification Code" placeholder="000000" value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)} className="text-center tracking-[0.5em] text-lg font-mono" maxLength={6} error={twoFaError} />

                                    <Button onClick={handleVerify2FA} className="w-full">Verify & Enable</Button>
                                    <button onClick={() => setTwoFaStep('select')} className="w-full text-center text-sm text-gray-500 hover:text-gray-800 mt-2">Back</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal with Dynamic OTP Logic */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-start space-x-4">
                            <div className="bg-indigo-100 p-3 rounded-full shrink-0">
                                {showOtpStep ? <Smartphone className="h-6 w-6 text-indigo-600" /> : <AlertCircle className="h-6 w-6 text-indigo-600" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {showOtpStep ? 'Verify Phone Number' : 'Confirm Changes'}
                                </h3>

                                {showOtpStep ? (
                                    <div className="space-y-4">
                                        <p className="text-gray-500 text-sm">
                                            Since you updated your phone number, please verify it by entering the secure code sent to <strong>{phone}</strong>.
                                        </p>
                                        <div className="flex items-end space-x-2">
                                            <div className="flex-1">
                                                <Input
                                                    label="Verification Code"
                                                    placeholder="000000"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    error={errors.otp}
                                                    className="text-center tracking-widest font-mono"
                                                    maxLength={6}
                                                />
                                            </div>
                                            <button
                                                onClick={sendSettingsOtp}
                                                type="button"
                                                className="mb-5 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                title="Resend Code"
                                            >
                                                <RefreshCw className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm mb-6">
                                        Are you sure you want to update these settings?
                                    </p>
                                )}

                                <div className="flex justify-end space-x-3 mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setShowConfirm(false); setOtp(''); setShowOtpStep(false); setConfirmationResult(null); }}
                                        type="button"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleConfirmSave}
                                        type="button"
                                    >
                                        {showOtpStep ? 'Verify & Save' : 'Confirm Update'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Toast */}
            {successMsg && (
                <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center transform transition-all duration-300 animate-in slide-in-from-bottom-5">
                    <CheckCircle className="h-5 w-5 mr-3" />
                    <span className="font-medium">{successMsg}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
                <div className="p-3 bg-indigo-100 rounded-full">
                    <Settings className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {user?.role === UserRole.ADMIN ? 'System Configuration' : 'Account Settings'}
                    </h1>
                    <p className="text-gray-500">Manage your profile, preferences, and security</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
                <div className="p-6 space-y-8">

                    {/* Profile Section */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
                            <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                            Profile Information
                        </h3>

                        <div className="flex items-center space-x-6">
                            <div className="relative group">
                                <img src={avatarPreview || 'https://via.placeholder.com/150'} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transition-transform hover:scale-105">
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">Profile Photo</h4>
                                <p className="text-xs text-gray-500 mt-1">Accepts JPG, PNG. Max 2MB.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="col-span-2 sm:col-span-1">
                                <Input label="Display Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" error={errors.name} />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" icon={<Smartphone className="h-4 w-4" />} error={errors.phone} />
                            </div>
                            <div className="col-span-2">
                                <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, Country" icon={<MapPin className="h-4 w-4" />} />
                            </div>

                            <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Manage Vehicles</h4>
                                <p className="text-xs text-gray-500 mb-4">You can add up to 2 vehicles for each category.</p>

                                <div className="space-y-6">
                                    {/* Bike Section */}
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-bold text-gray-700 uppercase flex items-center">
                                            <Bike className="h-4 w-4 mr-2" /> Two-Wheelers
                                        </h5>
                                        {savedVehicles.bike.map((v, i) => (
                                            <div key={i} className="flex gap-2">
                                                <Input value={v.number} onChange={(e) => updateVehicle('bike', i, 'number', e.target.value)} placeholder="Vehicle Number" className="flex-1" />
                                                <Input value={v.model} onChange={(e) => updateVehicle('bike', i, 'model', e.target.value)} placeholder="Model (Optional)" className="flex-1" />
                                                <button type="button" onClick={() => removeVehicle('bike', i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                        {savedVehicles.bike.length < 2 && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => addVehicle('bike')} className="w-full border-dashed">
                                                <Plus className="h-3 w-3 mr-2" /> Add Bike
                                            </Button>
                                        )}
                                    </div>

                                    {/* Car Section */}
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-bold text-gray-700 uppercase flex items-center">
                                            <Car className="h-4 w-4 mr-2" /> Cars
                                        </h5>
                                        {savedVehicles.car.map((v, i) => (
                                            <div key={i} className="flex gap-2">
                                                <Input value={v.number} onChange={(e) => updateVehicle('car', i, 'number', e.target.value)} placeholder="Vehicle Number" className="flex-1" />
                                                <Input value={v.model} onChange={(e) => updateVehicle('car', i, 'model', e.target.value)} placeholder="Model (Optional)" className="flex-1" />
                                                <button type="button" onClick={() => removeVehicle('car', i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                        {savedVehicles.car.length < 2 && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => addVehicle('car')} className="w-full border-dashed">
                                                <Plus className="h-3 w-3 mr-2" /> Add Car
                                            </Button>
                                        )}
                                    </div>

                                    {/* E-Bike Section */}
                                    <div className="space-y-3">
                                        <h5 className="text-xs font-bold text-gray-700 uppercase flex items-center">
                                            <Zap className="h-4 w-4 mr-2" /> Electric Bikes
                                        </h5>
                                        {savedVehicles.ebike.map((v, i) => (
                                            <div key={i} className="flex gap-2">
                                                <Input value={v.number} onChange={(e) => updateVehicle('ebike', i, 'number', e.target.value)} placeholder="Vehicle Number" className="flex-1" />
                                                <Input value={v.model} onChange={(e) => updateVehicle('ebike', i, 'model', e.target.value)} placeholder="Model (Optional)" className="flex-1" />
                                                <button type="button" onClick={() => removeVehicle('ebike', i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        ))}
                                        {savedVehicles.ebike.length < 2 && (
                                            <Button type="button" variant="outline" size="sm" onClick={() => addVehicle('ebike')} className="w-full border-dashed">
                                                <Plus className="h-3 w-3 mr-2" /> Add E-Bike
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase">Login Email</p>
                                        <p className="text-sm text-gray-900">{user?.email || 'N/A'}</p>
                                    </div>
                                    {user?.provider === AuthProvider.GOOGLE && (
                                        <span className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                            <ShieldCheck className="h-3 w-3 mr-1" /> Google Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security / 2FA Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
                            <Lock className="h-5 w-5 mr-2 text-gray-400" />
                            Security & Authentication
                        </h3>

                        <div className={`p-4 rounded-xl border transition-all ${user?.isTwoFactorEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-lg ${user?.isTwoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                        <Shield className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-bold text-gray-900">Two-Factor Authentication (2FA)</h4>
                                            {user?.isTwoFactorEnabled && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full">
                                                    Enabled
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1 max-w-sm">
                                            {user?.isTwoFactorEnabled
                                                ? `Your account is secured using ${user.twoFactorMethod === 'app' ? 'Authenticator App' : 'SMS'} verification.`
                                                : "Add an extra layer of security to your account by requiring a code when logging in."}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    {user?.isTwoFactorEnabled ? (
                                        <Button type="button" variant="outline" size="sm" onClick={handleDisable2FA} className="text-red-600 border-red-200 hover:bg-red-50">
                                            Disable 2FA
                                        </Button>
                                    ) : (
                                        <Button type="button" size="sm" onClick={handleStart2FA}>
                                            Enable 2FA
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods Section (Persistent per User) */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
                            <CreditCard className="h-5 w-5 mr-2 text-gray-400" />
                            Payment Methods
                        </h3>

                        <div className="space-y-3">
                            {cards.map((card) => (
                                <div key={card.id} className={`flex items-center justify-between p-4 border rounded-lg transition-all ${card.isDefault ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                    <div className="flex items-center space-x-4">
                                        {card.method === 'upi' ? (
                                            <div className="h-10 w-16 bg-green-100 rounded flex items-center justify-center text-green-700 shadow-sm border border-green-200"><SmartphoneNfc className="h-5 w-5" /></div>
                                        ) : (
                                            <div className={`h-10 w-16 rounded flex items-center justify-center text-white text-xs font-bold shadow-sm ${card.type === 'VISA' ? 'bg-blue-700' : card.type === 'MasterCard' ? 'bg-orange-600' : 'bg-slate-800'}`}>
                                                {card.type}
                                            </div>
                                        )}

                                        <div>
                                            <div className="flex items-center space-x-2">
                                                {card.method === 'upi' ? (<p className="text-sm font-medium text-gray-900">{card.upiId}</p>) : (<p className="text-sm font-medium text-gray-900">•••• {card.last4}</p>)}
                                                {card.isDefault && (<span className="flex items-center text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Default Method</span>)}
                                            </div>
                                            <p className="text-xs text-gray-500">{card.method === 'upi' ? 'Unified Payments Interface' : `Expires ${card.expiry}`} • {card.holderName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {!card.isDefault && (
                                            <button type="button" onClick={() => handleSetDefaultCard(card.id)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 hover:bg-indigo-50 rounded">Make Default</button>
                                        )}
                                        {!card.isDefault && (
                                            <button type="button" onClick={() => handleDeleteCard(card.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="h-4 w-4" /></button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isAddingMethod ? (
                                <div className="p-4 border border-dashed border-indigo-300 rounded-lg bg-indigo-50/30 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-semibold text-gray-800">Add Payment Method</h4>
                                        <button type="button" onClick={resetPaymentForm} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                                    </div>
                                    <div className="flex space-x-4 mb-4">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input type="radio" checked={newMethodType === 'card'} onChange={() => setNewMethodType('card')} className="text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm font-medium text-gray-700">Card</span>
                                        </label>
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input type="radio" checked={newMethodType === 'upi'} onChange={() => setNewMethodType('upi')} className="text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm font-medium text-gray-700">UPI</span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {newMethodType === 'card' ? (
                                            <>
                                                <div className="col-span-2 relative">
                                                    <Input label="Card Number" placeholder="0000 0000 0000 0000" value={newPayment.number} onChange={(e) => setNewPayment({ ...newPayment, number: e.target.value })} className="bg-white" maxLength={19} />
                                                    {getDetectedCardType(newPayment.number) && (
                                                        <div className="absolute top-8 right-3">
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded text-white font-bold ${getDetectedCardType(newPayment.number) === 'VISA' ? 'bg-blue-700' : 'bg-orange-600'}`}>
                                                                {getDetectedCardType(newPayment.number)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div><Input label="Expiry (MM/YY)" placeholder="MM/YY" value={newPayment.expiry} onChange={(e) => setNewPayment({ ...newPayment, expiry: e.target.value })} className="bg-white" maxLength={5} /></div>
                                                <div><Input label="CVC" placeholder="123" type="password" maxLength={4} value={newPayment.cvc} onChange={(e) => setNewPayment({ ...newPayment, cvc: e.target.value })} className="bg-white" /></div>
                                                <div className="col-span-2"><Input label="Cardholder Name" placeholder="Name on card" value={newPayment.name} onChange={(e) => setNewPayment({ ...newPayment, name: e.target.value })} className="bg-white" /></div>
                                            </>
                                        ) : (
                                            <div className="col-span-2 space-y-4">
                                                <Input label="UPI ID" placeholder="username@bank" value={newPayment.upiId} onChange={(e) => setNewPayment({ ...newPayment, upiId: e.target.value })} className="bg-white" icon={<SmartphoneNfc className="h-4 w-4" />} />
                                                <Input label="Account Name (Optional)" placeholder="Name associated with UPI" value={newPayment.name} onChange={(e) => setNewPayment({ ...newPayment, name: e.target.value })} className="bg-white" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.payment && <p className="text-xs text-red-600 mt-2 font-medium flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> {errors.payment}</p>}
                                    <div className="mt-4 flex justify-end space-x-3">
                                        <Button type="button" variant="outline" size="sm" onClick={resetPaymentForm}>Cancel</Button>
                                        <Button type="button" size="sm" onClick={handleAddPaymentMethod}>Save {newMethodType === 'card' ? 'Card' : 'UPI'}</Button>
                                    </div>
                                </div>
                            ) : (
                                <Button variant="outline" type="button" onClick={() => setIsAddingMethod(true)} className="w-full border-dashed border-2 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50"><Plus className="h-4 w-4 mr-2" /> Add Payment Method</Button>
                            )}
                        </div>
                    </div>

                    {/* Admin Specific Section */}
                    {user?.role === UserRole.ADMIN && (
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center pb-2">
                                <Settings className="h-5 w-5 mr-2 text-gray-400" />
                                Parking Configuration
                            </h3>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                <Input label="Base Rate (₹/hr)" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} icon={<IndianRupee className="h-4 w-4" />} error={errors.baseRate} type="number" step="0.50" min="0" />
                                <Input label="Grace Period (mins)" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} icon={<Clock className="h-4 w-4" />} error={errors.gracePeriod} type="number" min="0" />
                                <Input label="Penalty Multiplier" value={penaltyRate} onChange={(e) => setPenaltyRate(e.target.value)} error={errors.penaltyRate} type="number" step="0.1" min="1" />
                            </div>
                        </div>
                    )}

                </div>

                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                    <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
};
