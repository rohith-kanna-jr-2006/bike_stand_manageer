// Mock auth service replacing Firebase for now
// In a production environment, this should be replaced with a real SMS service or proper backend integration

export const authService = {
    /**
     * Initialize the Recaptcha Verifier
     * Mock implementation
     */
    initRecaptcha: async (elementId) => {
        console.log("Mock Recaptcha Initialized for", elementId);
        return true;
    },

    /**
     * Send OTP via Mock
     */
    requestOtp: async (phoneNumber) => {
        console.log(`[MOCK SMS] Sending OTP to ${phoneNumber}...`);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real app we'd verify the phone number format
        if (!phoneNumber || phoneNumber.length < 10) {
            return { success: false, message: "Invalid phone number." };
        }

        console.log(`[MOCK SMS] OTP for ${phoneNumber} is 123456`);
        alert(`[MOCK SMS] OTP for ${phoneNumber} is 123456`);

        return {
            success: true,
            message: 'Code sent successfully via Mock SMS.',
            confirmationResult: { verificationId: 'mock-verification-id', phoneNumber }
        };
    },

    /**
     * Verify OTP
     */
    verifyOtp: async (confirmationResult, code) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        if (code === '123456') {
            return {
                success: true,
                message: 'Verified successfully.',
                user: {
                    uid: 'mock-user-id-' + Date.now(),
                    phoneNumber: confirmationResult.phoneNumber
                }
            };
        } else {
            return { success: false, message: 'Invalid verification code.' };
        }
    }
};
