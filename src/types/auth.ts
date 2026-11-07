export interface LoginRequest {
  authorizationCode: string;
  referrer: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutByUserKeyRequest {
  userKey: string;
}

export interface TokenResponse {
  statusCode: number;
  data: {
    success?: {
      accessToken: string;
      refreshToken: string;
    };
    error?: string;
  };
}

export interface UserInfoResponse {
  statusCode: number;
  data: {
    success?: {
      userKey: string;
      name?: string;
      phone?: string;
      gender?: string;
      birthday?: string;
      [key: string]: any;
    };
    error?: string;
  };
}

export type LogoutResult = { ok: boolean } | null;

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userInfo: UserInfoResponse['data']['success'] | null;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  getUserInfo: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  logout: () => Promise<void>;
}
