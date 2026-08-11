import { apiRequest } from "./client";

export interface PendingUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  faculty?: string;
  department?: string;
  roles: string[];
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export interface AdminUser extends PendingUser {
  isActive: boolean;
  lastLogin: string | null;
  updatedAt: string;
}

export interface RoleOption {
  id: number;
  name: string;
  description?: string;
}

export interface UpdateAdminUserRequest {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  faculty?: string;
  department?: string;
  isActive: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  roles: string[];
}

export interface UserApprovalActionResponse {
  userId: number;
  username: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  message: string;
  emailSent: boolean;
  emailWarning?: string;
}

export function getAllUsers() {
  return apiRequest<AdminUser[]>("/v1/admin/users");
}

export function getPendingUsers() {
  return apiRequest<PendingUser[]>("/v1/admin/users/pending");
}

export function getRoles() {
  return apiRequest<RoleOption[]>("/v1/admin/users/roles");
}

export function approveUser(userId: number) {
  return apiRequest<UserApprovalActionResponse>(`/v1/admin/users/${userId}/approve`, {
    method: "POST",
  });
}

export function rejectUser(userId: number, reason?: string) {
  return apiRequest<UserApprovalActionResponse>(`/v1/admin/users/${userId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function updateUser(userId: number, payload: UpdateAdminUserRequest) {
  return apiRequest<AdminUser>(`/v1/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteUser(userId: number) {
  return apiRequest<void>(`/v1/admin/users/${userId}`, {
    method: "DELETE",
  });
}
