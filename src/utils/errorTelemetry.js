/**
 * Centralized Client-Side Error Telemetry & Diagnostics Engine
 * Maintains a rolling memory buffer of recent errors, API failures, and app state.
 */

const MAX_BUFFER_SIZE = 50;
const telemetryEvents = [];
const errorLogs = [];

const SENSITIVE_KEY_REGEX = /password|secret|token|apikey|authorization|auth_token|sec|creditcard|pin|cvv|access_token|refresh_token/i;

/**
 * Recursively sanitizes diagnostic data by redacting sensitive tokens, passwords, and credentials
 */
export function sanitizeTelemetryData(val, depth = 0, seen = new WeakSet()) {
  if (depth > 4) return '[Max Depth Exceeded]';
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    return val
      .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
      .replace(/sk_(live|test)_[a-zA-Z0-9]+/gi, 'sk_[REDACTED]')
      .replace(/sec=[^&\s]+/gi, 'sec=[REDACTED]')
      .replace(/(["']?(?:password|token|secret|apiKey|authorization|accessToken|refreshToken)["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, '$1[REDACTED]');
  }

  if (typeof val === 'number' || typeof val === 'boolean') {
    return val;
  }

  if (typeof val === 'object') {
    if (seen.has(val)) return '[Circular]';
    seen.add(val);

    if (Array.isArray(val)) {
      return val.map(item => sanitizeTelemetryData(item, depth + 1, seen));
    }

    const cleanObj = {};
    for (const [k, v] of Object.entries(val)) {
      if (SENSITIVE_KEY_REGEX.test(k)) {
        cleanObj[k] = '[REDACTED]';
      } else {
        cleanObj[k] = sanitizeTelemetryData(v, depth + 1, seen);
      }
    }
    return cleanObj;
  }

  return String(val);
}

export function recordError(err, context = {}) {
  const rawMessage = err?.message || String(err);
  const rawStack = err?.stack?.slice(0, 800) || null;
  const rawContext = typeof context === 'string' ? { info: context } : context;

  const entry = {
    timestamp: new Date().toISOString(),
    message: sanitizeTelemetryData(rawMessage),
    stack: rawStack ? sanitizeTelemetryData(rawStack) : null,
    context: sanitizeTelemetryData(rawContext)
  };

  errorLogs.unshift(entry);
  if (errorLogs.length > MAX_BUFFER_SIZE) {
    errorLogs.pop();
  }

  // Also log to console in non-production
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    console.warn('[Telemetry Error Captured]:', entry.message, entry.context);
  }
}

export function recordEvent(category, action, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    category: sanitizeTelemetryData(category),
    action: sanitizeTelemetryData(action),
    data: sanitizeTelemetryData(data)
  };

  telemetryEvents.unshift(entry);
  if (telemetryEvents.length > MAX_BUFFER_SIZE) {
    telemetryEvents.pop();
  }
}

export function getRecentErrors(count = 10) {
  return errorLogs.slice(0, count);
}

export function getRecentEvents(count = 15) {
  return telemetryEvents.slice(0, count);
}

/**
 * Builds a sanitized, comprehensive diagnostic snapshot for customer support tickets
 */
export function getDiagnosticSnapshot() {
  const snapshot = {
    timestamp: new Date().toISOString(),
    appVersion: '2.1.0',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'Unknown',
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
    recentErrorsCount: errorLogs.length,
    recentErrors: errorLogs.slice(0, 5),
    recentEvents: telemetryEvents.slice(0, 10),
    storageQuota: getStorageEstimate()
  };

  return snapshot;
}

function getStorageEstimate() {
  if (typeof localStorage === 'undefined') return { usedBytes: 0, itemsCount: 0 };
  let totalBytes = 0;
  let itemsCount = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const val = localStorage.getItem(key);
      if (key && val) {
        totalBytes += (key.length + val.length) * 2;
        itemsCount++;
      }
    }
  } catch (_) {}

  return {
    usedKb: Math.round(totalBytes / 1024),
    itemsCount
  };
}

/**
 * 1-click Download Sanitized Diagnostic Report JSON for Trader Self-Diagnosis
 */
export function downloadDiagnosticReport() {
  if (typeof document === 'undefined') return;
  const snapshot = getDiagnosticSnapshot();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tradepigeon_diagnostics_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Global Unhandled Error & Promise Rejection Handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    recordError(event.error || event.message, {
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    recordError(event.reason || 'Unhandled Promise Rejection', {
      type: 'unhandledrejection'
    });
  });
}
