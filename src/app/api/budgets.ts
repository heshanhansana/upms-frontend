import { getAuthToken } from "./client";

const PROCUREMENT_API_BASE_URL =
  import.meta.env.VITE_PROCUREMENT_API_BASE_URL ?? "https://upms-backend-37xy.onrender.com/api";

export interface FacultyBudgetAllocationResponse {
  id: number;
  faculty: string;
  fiscalYear: number;
  budgetCode: string;
  allocation: number;
  committed: number;
  spent: number;
  available: number;
  updatedBy?: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface FacultyBudgetAllocationRequest {
  faculty: string;
  fiscalYear: number;
  budgetCode: string;
  allocation: number;
  updatedBy?: string;
}

async function budgetRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${PROCUREMENT_API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => `Request failed with status ${response.status}`);
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function listFacultyBudgetAllocations(fiscalYear = new Date().getFullYear()) {
  return budgetRequest<FacultyBudgetAllocationResponse[]>(`/v1/budget-allocations?fiscalYear=${fiscalYear}`);
}

export function saveFacultyBudgetAllocation(payload: FacultyBudgetAllocationRequest) {
  return budgetRequest<FacultyBudgetAllocationResponse>("/v1/budget-allocations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
