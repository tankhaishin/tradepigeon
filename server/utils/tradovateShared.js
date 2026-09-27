import { pairFillsFIFOWithOpenPositions } from '../../src/utils/fillPairingEngine.js';

/**
 * Tradovate Shared API Utilities
 * Unified controller functions used by both Express server routes and Vercel serverless functions.
 */

export function getTradovateBaseUrl(env = 'LIVE') {
  return env === 'DEMO'
    ? 'https://demo.tradovateapi.com/v1'
    : 'https://live.tradovateapi.com/v1';
}

/**
 * Authenticates credentials against Tradovate REST API and retrieves registered sub-accounts.
 */
export async function authenticateTradovate({
  name,
  password,
  appId = 'TradePigeon',
  appVersion = '2.0.0',
  cid = 1,
  sec = (process.env.TRADOVATE_API_SECRET || 'tradepigeon-telemetry'),
  env = 'LIVE'
}) {
  if (!name || !password) {
    return {
      status: 400,
      data: { success: false, error: 'Username and password are required.' }
    };
  }

  const baseUrl = getTradovateBaseUrl(env);

  try {
    const authRes = await fetch(`${baseUrl}/auth/accesstokenrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        password,
        appId,
        appVersion,
        cid,
        sec
      })
    });

    const authData = await authRes.json();

    if (authData.errorText || !authData.accessToken) {
      return {
        status: 401,
        data: {
          success: false,
          error: authData.errorText || 'Authentication failed. Please verify your Tradovate credentials.'
        }
      };
    }

    const accessToken = authData.accessToken;
    const userId = authData.userId;
    const expirationTime = authData.expirationTime;

    // Discover registered sub-accounts
    let accountsList = [];
    try {
      const accRes = await fetch(`${baseUrl}/account/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      const accountsData = await accRes.json();
      if (Array.isArray(accountsData)) {
        accountsList = accountsData.map(acc => ({
          id: acc.id,
          name: acc.name,
          accountType: acc.accountType || (env === 'DEMO' ? 'Demo' : 'Funded'),
          active: acc.active !== false,
          clearingHouseId: acc.clearingHouseId
        }));
      }
    } catch (accErr) {
      console.warn('Failed to query Tradovate sub-account list:', accErr);
    }

    if (accountsList.length === 0) {
      accountsList = [{
        id: userId || 'primary',
        name,
        accountType: env === 'DEMO' ? 'Demo' : 'Live Funded',
        active: true
      }];
    }

    return {
      status: 200,
      data: {
        success: true,
        accessToken,
        userId,
        expirationTime,
        environment: env,
        accounts: accountsList,
        accountName: name,
        message: `Successfully connected ${accountsList.length} Tradovate account(s).`
      }
    };
  } catch (error) {
    console.error('Tradovate shared auth exception:', error);
    return {
      status: 500,
      data: { success: false, error: 'Failed to connect to Tradovate API server.' }
    };
  }
}

/**
 * Fetches recent execution fills and pairs them with open positions using FIFO matching.
 */
export async function fetchTradovateFills({ token, env = 'LIVE' }) {
  if (!token) {
    return {
      status: 401,
      data: { success: false, error: 'Missing Authorization token.' }
    };
  }

  const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  const baseUrl = getTradovateBaseUrl(env);

  try {
    const fillRes = await fetch(`${baseUrl}/fill/list`, {
      method: 'GET',
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json'
      }
    });

    if (fillRes.status === 401) {
      return {
        status: 401,
        data: { success: false, error: 'Tradovate session expired. Please re-authenticate.' }
      };
    }

    const fills = await fillRes.json();
    if (!Array.isArray(fills)) {
      return {
        status: 400,
        data: { success: false, error: 'Unable to retrieve fills from Tradovate.', details: fills }
      };
    }

    const { closedTrades, openPositions } = pairFillsFIFOWithOpenPositions(fills);
    return {
      status: 200,
      data: {
        success: true,
        count: closedTrades.length,
        fills: closedTrades,
        openPositions: openPositions || []
      }
    };
  } catch (error) {
    console.error('Tradovate shared fills exception:', error);
    return {
      status: 500,
      data: { success: false, error: 'Failed to fetch Tradovate fills.' }
    };
  }
}

/**
 * Fetches cash balance snapshot from Tradovate API.
 */
export async function fetchTradovateCashBalance({ token, env = 'LIVE' }) {
  if (!token) {
    return {
      status: 401,
      data: { success: false, error: 'Missing Authorization token.' }
    };
  }

  const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  const baseUrl = getTradovateBaseUrl(env);

  try {
    const balRes = await fetch(`${baseUrl}/cashBalance/getcashbalancesnapshot`, {
      method: 'GET',
      headers: {
        'Authorization': cleanToken,
        'Content-Type': 'application/json'
      }
    });

    if (balRes.status === 401) {
      return {
        status: 401,
        data: { success: false, error: 'Tradovate session expired. Please re-authenticate.' }
      };
    }

    const balanceData = await balRes.json();
    return {
      status: 200,
      data: { success: true, balance: balanceData }
    };
  } catch (error) {
    console.error('Tradovate shared balance exception:', error);
    return {
      status: 500,
      data: { success: false, error: 'Failed to fetch Tradovate cash balance.' }
    };
  }
}
