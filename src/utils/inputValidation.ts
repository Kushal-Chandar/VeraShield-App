/**
 * Input validation utilities for security and data integrity
 */

export const timeValidation = {
  /**
   * Validates time format (HH:MM)
   */
  isValidTimeFormat: (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },

  /**
   * Sanitizes time input
   */
  sanitizeTimeInput: (time: string): string => {
    return time.replace(/[^0-9:]/g, '').slice(0, 5);
  },

  /**
   * Validates if time is within reasonable bounds
   */
  isReasonableTime: (time: string): boolean => {
    if (!timeValidation.isValidTimeFormat(time)) return false;
    
    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }
};

export const intensityValidation = {
  /**
   * Validates intensity value (0-100)
   */
  isValidIntensity: (intensity: number): boolean => {
    return !isNaN(intensity) && intensity >= 0 && intensity <= 100 && Number.isInteger(intensity);
  },

  /**
   * Clamps intensity value to valid range
   */
  clampIntensity: (intensity: number): number => {
    return Math.max(0, Math.min(100, Math.floor(intensity)));
  }
};

export const bluetoothValidation = {
  /**
   * Validates Bluetooth device address format
   */
  isValidDeviceAddress: (address: string): boolean => {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(address);
  },

  /**
   * Sanitizes device name input
   */
  sanitizeDeviceName: (name: string): string => {
    return name.replace(/[<>\"'&]/g, '').trim().slice(0, 50);
  }
};

export const generalValidation = {
  /**
   * Sanitizes string input to prevent XSS
   */
  sanitizeString: (input: string): string => {
    return input
      .replace(/[<>\"'&]/g, '')
      .trim()
      .slice(0, 255);
  },

  /**
   * Validates if string contains only safe characters
   */
  isSafeString: (input: string): boolean => {
    const unsafeChars = /[<>\"'&;(){}[\]]/;
    return !unsafeChars.test(input);
  }
};