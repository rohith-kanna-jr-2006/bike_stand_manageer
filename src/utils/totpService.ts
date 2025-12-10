import * as OTPAuth from 'otpauth';

export const totpService = {
  /**
   * Generates a random base32 secret.
   */
  generateSecret: (): string => {
    const secret = new OTPAuth.Secret({ size: 20 });
    return secret.base32;
  },

  /**
   * Generates the OTPAuth URL used for QR Codes
   */
  generateOtpUrl: (secretBase32: string, email: string): string => {
    const totp = new OTPAuth.TOTP({
      issuer: "SecureCycle",
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
    });
    return totp.toString();
  },

  /**
   * Verifies a user provided token against the secret
   */
  verify: (secretBase32: string, token: string): boolean => {
    if (!secretBase32 || !token) return false;
    
    const totp = new OTPAuth.TOTP({
      issuer: "SecureCycle",
      label: "User",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretBase32),
    });

    // Validate returns null if invalid, or the delta (time-step difference) if valid.
    // Window 1 means we accept codes from current, previous, or next 30s block (handles slight time drift)
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  }
};
