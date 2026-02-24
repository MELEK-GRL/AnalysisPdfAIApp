import { get, post, del, setToken } from '../apiFetcher';

export type User = { _id: string; name: string; email: string };

export type LoginPayload = { identifier: string; password: string };
export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    termsAccepted?: boolean;
};
export type AuthResponse = { token: string; user: User };

const endpoints = {
    register: '/auth/register',
    login: '/auth/login',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    resetPasswordByCode: '/auth/reset-password-by-code',
    resetPasswordByEmail: '/auth/reset-password-by-email',
    deleteAccount: '/auth/account',
};

export async function register(
    payload: RegisterPayload,
): Promise<AuthResponse> {
    const data = await post<AuthResponse>(endpoints.register, payload);
    if (data?.token) {
        await setToken(data.token);
    }
    return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
    const data = await post<AuthResponse>(endpoints.login, payload);
    if (data?.token) {
        await setToken(data.token);
    }
    return data;
}

export async function getProfile(): Promise<User> {
    const { user } = await get<{ user: User }>(endpoints.me);
    return user;
}

export async function forgotPassword(
    email: string,
): Promise<{ ok: true; email: string; devCode?: string }> {
    const body = { email };
    console.log('[User.forgotPassword] POST', endpoints.forgotPassword, body);
    return post<{ ok: true; email: string; devCode?: string }>(endpoints.forgotPassword, body);
}

export async function resetPasswordByCode(
    email: string,
    code: string,
    newPassword: string,
): Promise<{ message: string }> {
    return post<{ message: string }>(endpoints.resetPasswordByCode, {
        email,
        code,
        newPassword,
    });
}

export async function resetPasswordByEmail(
    email: string,
    newPassword: string,
): Promise<{ message: string }> {
    return post<{ message: string }>(endpoints.resetPasswordByEmail, {
        email,
        newPassword,
    });
}

export async function resetPasswordByToken(
    token: string,
    newPassword: string,
): Promise<{ message: string }> {
    return post<{ message: string }>(endpoints.resetPassword, {
        token,
        newPassword,
    });
}

export async function deleteAccount(): Promise<{ success: true }> {
    return del<{ success: true }>(endpoints.deleteAccount);
}
