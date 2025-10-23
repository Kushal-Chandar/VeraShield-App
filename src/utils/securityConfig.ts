/**
 * Security configuration and utilities
 */

export const securityConfig = {
  // Environment detection
  isProduction: () => import.meta.env.PROD,
  isDevelopment: () => import.meta.env.DEV,

  // CSP nonce generation for dynamic content
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Secure headers for fetch requests
  getSecureHeaders: (): HeadersInit => ({
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-Content-Type-Options': 'nosniff',
  }),

  // Input sanitization patterns
  patterns: {
    allowedChars: /^[a-zA-Z0-9\s\-_.:@]+$/,
    timeFormat: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    macAddress: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
    safeString: /^[^<>\"'&;(){}[\]]*$/,
  },

  // Rate limiting configuration
  rateLimits: {
    bluetoothScan: { maxAttempts: 10, windowMs: 60000 }, // 10 attempts per minute
    timeUpdate: { maxAttempts: 20, windowMs: 60000 }, // 20 updates per minute
    intensityChange: { maxAttempts: 30, windowMs: 60000 }, // 30 changes per minute
  }
};

// Rate limiter utility
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < windowMs);
    
    if (validAttempts.length >= maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();