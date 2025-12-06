/**
 * Log Sanitization Utility
 * Prevents log injection attacks by sanitizing user input before logging
 */

export function sanitizeForLog(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  let str = String(value);
  
  // Remove newlines and carriage returns to prevent log injection
  str = str.replace(/[\n\r]/g, ' ');
  
  // Remove control characters
  str = str.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Truncate long strings
  if (str.length > 500) {
    str = str.substring(0, 500) + '... (truncated)';
  }
  
  return str;
}

export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return sanitizeForLog(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Remove sensitive fields
    if (['password', 'token', 'accessToken', 'refreshToken', 'passcode', 'secret'].includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = sanitizeForLog(value);
    }
  }
  
  return sanitized;
}

export function safeLog(message: string, data?: any): void {
  const sanitizedMessage = sanitizeForLog(message);
  
  if (data !== undefined) {
    const sanitizedData = sanitizeObject(data);
    console.log(sanitizedMessage, sanitizedData);
  } else {
    console.log(sanitizedMessage);
  }
}

export function safeError(message: string, error?: any): void {
  const sanitizedMessage = sanitizeForLog(message);
  
  if (error !== undefined) {
    const sanitizedError = error instanceof Error 
      ? { message: sanitizeForLog(error.message), name: error.name }
      : sanitizeObject(error);
    console.error(sanitizedMessage, sanitizedError);
  } else {
    console.error(sanitizedMessage);
  }
}
