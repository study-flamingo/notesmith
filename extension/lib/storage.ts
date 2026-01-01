/**
 * Secure storage utilities
 * Uses session storage (cleared on browser close) for HIPAA compliance
 */

import type { AuthState } from './types';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  TOKEN_EXPIRY: 'tokenExpiry',
} as const;

export const storage = {
  async getAccessToken(): Promise<string | null> {
    const result = await browser.storage.session.get(STORAGE_KEYS.ACCESS_TOKEN);
    return result[STORAGE_KEYS.ACCESS_TOKEN] ?? null;
  },

  async getAuthState(): Promise<AuthState | null> {
    const result = await browser.storage.session.get([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRY,
    ]);

    if (!result[STORAGE_KEYS.ACCESS_TOKEN]) {
      return null;
    }

    return {
      accessToken: result[STORAGE_KEYS.ACCESS_TOKEN],
      refreshToken: result[STORAGE_KEYS.REFRESH_TOKEN],
      tokenExpiry: result[STORAGE_KEYS.TOKEN_EXPIRY],
    };
  },

  async setAuthState(state: AuthState): Promise<void> {
    await browser.storage.session.set({
      [STORAGE_KEYS.ACCESS_TOKEN]: state.accessToken,
      [STORAGE_KEYS.REFRESH_TOKEN]: state.refreshToken,
      [STORAGE_KEYS.TOKEN_EXPIRY]: state.tokenExpiry,
    });
  },

  async clearAuth(): Promise<void> {
    await browser.storage.session.remove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.TOKEN_EXPIRY,
    ]);
  },

  async isTokenExpired(): Promise<boolean> {
    const state = await this.getAuthState();
    if (!state) return true;
    return Date.now() >= state.tokenExpiry;
  },
};

