import { apiRequest } from './apiClient';
import { getAllUsers } from './userService';
import type { UserFilter } from './userService';

export type SubscriptionStatus = 'active' | 'pending' | 'pending_cancellation' | 'canceled' | string;

export interface Subscription {
    userId: string;
    email: string;
    slots: number;
    usedSlots: number;
    status: SubscriptionStatus;
    nextBillingDate: string;
    amountDue: number;
    isAdminGranted: boolean;
}

interface AdminSubscriptionResponseDTO {
    user_id: string;
    slots: number;
    used_slots: number;
    status: string;
    next_billing_date: string;
    amount_due: number;
    is_admin_granted: boolean;
}

interface AdminSubscriptionsListResponseDTO {
    subscriptions: AdminSubscriptionResponseDTO[];
    total_count: number;
}

export interface PagedSubscriptionsResult {
    items: Subscription[];
    total: number;
}

// Traemos todos los usuarios para armar un mapa userId -> email, porque el
// endpoint de subscriptions solo devuelve user_id (mismo approach que
// userService usa para cruzar gem balances contra la lista de usuarios).
const allUsersFilter: UserFilter = { query: '', verified: 'all' };

export const getSubscriptionsPage = async (offset = 0, limit = 20): Promise<PagedSubscriptionsResult> => {
    const params = new URLSearchParams();
    params.set('offset', String(offset));
    params.set('limit', String(limit));

    const [response, users] = await Promise.all([
        apiRequest<AdminSubscriptionsListResponseDTO>(`/subscriptions/admin/users?${params}`),
        getAllUsers(allUsersFilter),
    ]);

    const emailByUserId = new Map(users.map((user) => [user.id, user.email]));

    return {
        items: response.subscriptions.map((sub) => ({
            userId: sub.user_id,
            email: emailByUserId.get(sub.user_id) ?? sub.user_id,
            slots: sub.slots,
            usedSlots: sub.used_slots,
            status: sub.status,
            nextBillingDate: sub.next_billing_date,
            amountDue: sub.amount_due,
            isAdminGranted: sub.is_admin_granted,
        })),
        total: response.total_count,
    };
};

export const findUserByEmail = async (email: string) => {
    const users = await getAllUsers({ query: email, verified: 'all' });
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
};

export const createAdminSubscription = async (userId: string, email: string, slots: number): Promise<void> => {
    await apiRequest<void>(`/subscriptions/admin/users/${userId}`, {
        method: 'POST',
        body: { email, slots },
    });
};

export const cancelAdminSubscription = async (userId: string): Promise<void> => {
    await apiRequest<void>(`/subscriptions/admin/users/${userId}`, {
        method: 'DELETE',
    });
};

export const updateAdminSubscriptionSlots = async (userId: string, slots: number): Promise<void> => {
    await apiRequest<void>(`/subscriptions/admin/users/${userId}/slots`, {
        method: 'PUT',
        body: { slots },
    });
};