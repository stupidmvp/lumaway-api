export interface AuthUser {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    avatar?: string | null;
}

export interface AuthResult {
    accessToken: string;
    user: AuthUser;
    permissions: string[];
    roles: string[];
}
