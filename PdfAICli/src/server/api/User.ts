import { get, post, setToken } from '../apiFetcher';

export type User = { _id: string; name: string; email: string };

export type LoginPayload = { identifier: string; password: string };
export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
};
export type AuthResponse = { token: string; user: User };

const endpoints = {
    register: '/auth/register',
    login: '/auth/login',
    me: '/auth/me',
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
    return get<User>(endpoints.me);
}
