import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from './firebaseConfig';

// Helper to extract resolved type from Promise
type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

// Extract ConfirmationResult type from the return type of signInWithPhoneNumber
// This handles cases where ConfirmationResult is not explicitly exported by the SDK
type ConfirmationResult = Awaited<ReturnType<typeof signInWithPhoneNumber>>;

export type { ConfirmationResult };

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
    recaptchaWidgetId: any;
  }
}

export const authService = {
  /**
   * Initialize the Recaptcha Verifier
   */
  initRecaptcha: async (elementId: string) => {
    try {
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.warn("Recaptcha clear error", e);
            }
            window.recaptchaVerifier = undefined;
        }

        const verifier = new RecaptchaVerifier(auth, elementId, {
            'size': 'invisible',
            'callback': (response: any) => {
                console.log("Recaptcha solved");
            },
            'expired-callback': () => {
                console.warn("Recaptcha expired");
            }
        });

        window.recaptchaVerifier = verifier;
        const widgetId = await verifier.render();
        window.recaptchaWidgetId = widgetId;
        
        return verifier;
    } catch (error) {
        console.error("Recaptcha Initialization Failed", error);
        throw error;
    }
  },

  /**
   * Send OTP via Firebase
   */
  async requestOtp(phoneNumber: string): Promise<{ success: boolean; message: string; confirmationResult?: ConfirmationResult }> {
    try {
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) {
          throw new Error("Recaptcha not initialized. Call initRecaptcha first.");
      }

      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      
      return { 
        success: true, 
        message: 'Code sent successfully via SMS.', 
        confirmationResult 
      };
    } catch (error: any) {
      console.error("Firebase SMS Error:", error);
      
      if (window.recaptchaWidgetId !== undefined && (window as any).grecaptcha) {
          (window as any).grecaptcha.reset(window.recaptchaWidgetId);
      }

      let msg = "Failed to send code.";
      if (error.code === 'auth/invalid-phone-number') msg = "Invalid phone number format.";
      if (error.code === 'auth/too-many-requests') msg = "Too many requests. Please try again later.";
      
      return { success: false, message: msg };
    }
  },

  /**
   * Verify OTP
   */
  async verifyOtp(confirmationResult: ConfirmationResult, code: string): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const result = await confirmationResult.confirm(code);
      return { success: true, message: 'Verified successfully.', user: result.user };
    } catch (error: any) {
      console.error("Verification Error:", error);
      return { success: false, message: 'Invalid verification code.' };
    }
  }
};