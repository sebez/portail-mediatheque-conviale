// Authentication models
export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  token: string;
}
