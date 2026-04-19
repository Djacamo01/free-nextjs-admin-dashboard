export type LoginRequest = {
  email: string;
  password: string;
  /** Slug del tenant (subdominio); si se omite, el API acepta el primer staff con ese email (solo desarrollo / un solo tenant). */
  tenantSlug?: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type AuthResponse = {
  token: string;
  refreshToken: string;
  message: string;
};

export type ApiRequestInit = RequestInit & {
  /** No añade Authorization ni intenta refresh */
  skipAuth?: boolean;
};
