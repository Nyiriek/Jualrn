// src/services/tokenService.js

interface TokenUpdater {
  (token: string): void;
}

let accessTokenUpdater: TokenUpdater | null = null;
let refreshTokenUpdater: TokenUpdater | null = null;

interface SetAccessTokenUpdaterFn {
  (fn: TokenUpdater): void;
}

export const setAccessTokenUpdater: SetAccessTokenUpdaterFn = function(fn: TokenUpdater) {
  accessTokenUpdater = fn;
};

export function setRefreshTokenUpdater(fn: TokenUpdater | null) {
  refreshTokenUpdater = fn;
}

export function updateAccessToken(token: string) {
  if (accessTokenUpdater) accessTokenUpdater(token);
  localStorage.setItem('accessToken', token);
}

export function updateRefreshToken(token: string) {
  if (refreshTokenUpdater) refreshTokenUpdater(token);
  localStorage.setItem('refreshToken', token);
}
