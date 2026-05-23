export const jwtConfig = {
  accessTokenSecret:
    process.env.JWT_ACCESS_SECRET || 'countpos-access-secret-change-in-prod',
  refreshTokenSecret:
    process.env.JWT_REFRESH_SECRET || 'countpos-refresh-secret-change-in-prod',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000,
};
