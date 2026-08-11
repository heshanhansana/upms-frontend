import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as budgetApi from "../api/budgets";
import type { Procurement } from "./types";

const FACULTY_BUDGETS_KEY = "upms_faculty_budget_allocations";

export interface FacultyBudgetAllocation {
  faculty: string;
  allocation: number;
  budgetCode: string;
  fiscalYear: number;
  committed?: number;
  spent?: number;
  available?: number;
  updatedAt?: string;
  updatedBy?: string;
}

interface BudgetContextValue {
  allocations: FacultyBudgetAllocation[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  allocateFacultyBudget: (payload: Omit<FacultyBudgetAllocation, "updatedAt" | "committed" | "spent" | "available">) => Promise<void>;
  getAllocationForFaculty: (faculty?: string) => FacultyBudgetAllocation | null;
  getBudgetUsageForFaculty: (faculty: string, procurements: Procurement[]) => {
    allocated: number;
    committed: number;
    spent: number;
    available: number;
  };
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

function readCachedAllocations() {
  try {
    const raw = window.localStorage.getItem(FACULTY_BUDGETS_KEY);
    return raw ? JSON.parse(raw) as FacultyBudgetAllocation[] : [];
  } catch {
    return [];
  }
}

function writeCachedAllocations(allocations: FacultyBudgetAllocation[]) {
  window.localStorage.setItem(FACULTY_BUDGETS_KEY, JSON.stringify(allocations));
}

function mapAllocation(response: budgetApi.FacultyBudgetAllocationResponse): FacultyBudgetAllocation {
  return {
    faculty: response.faculty,
    allocation: Number(response.allocation ?? 0),
    budgetCode: response.budgetCode,
    fiscalYear: response.fiscalYear,
    committed: Number(response.committed ?? 0),
    spent: Number(response.spent ?? 0),
    available: Number(response.available ?? 0),
    updatedAt: response.updatedDate,
    updatedBy: response.updatedBy,
  };
}

function sameText(left?: string, right?: string) {
  return (left ?? "").trim().toLowerCase() === (right ?? "").trim().toLowerCase();
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [allocations, setAllocations] = useState<FacultyBudgetAllocation[]>(readCachedAllocations);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await budgetApi.listFacultyBudgetAllocations();
      const next = response.map(mapAllocation);
      setAllocations(next);
      writeCachedAllocations(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load faculty budget allocations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<BudgetContextValue>(() => ({
    allocations,
    isLoading,
    error,
    refresh,
    async allocateFacultyBudget(payload) {
      const saved = await budgetApi.saveFacultyBudgetAllocation({
        faculty: payload.faculty,
        allocation: payload.allocation,
        budgetCode: payload.budgetCode,
        fiscalYear: payload.fiscalYear,
        updatedBy: payload.updatedBy,
      });
      const nextAllocation = mapAllocation(saved);
      setAllocations(current => {
        const next = current.some(item => sameText(item.faculty, nextAllocation.faculty) && item.fiscalYear === nextAllocation.fiscalYear)
          ? current.map(item => sameText(item.faculty, nextAllocation.faculty) && item.fiscalYear === nextAllocation.fiscalYear ? nextAllocation : item)
          : [...current, nextAllocation].sort((a, b) => a.faculty.localeCompare(b.faculty));
        writeCachedAllocations(next);
        return next;
      });
    },
    getAllocationForFaculty(faculty) {
      if (!faculty) return null;
      return allocations.find(item => sameText(item.faculty, faculty)) ?? null;
    },
    getBudgetUsageForFaculty(faculty, procurements) {
      const allocation = allocations.find(item => sameText(item.faculty, faculty));
      const facultyProcurements = procurements.filter(item => sameText(item.faculty, faculty));
      const spent = facultyProcurements
        .filter(item => item.status === "Completed")
        .reduce((sum, item) => sum + item.value, 0);
      const committed = facultyProcurements
        .filter(item => item.status !== "Rejected" && item.status !== "Completed")
        .reduce((sum, item) => sum + item.value, 0);
      const allocated = allocation?.allocation ?? 0;

      return {
        allocated,
        committed,
        spent,
        available: allocated - committed - spent,
      };
    },
  }), [allocations, error, isLoading, refresh]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudgets() {
  const value = useContext(BudgetContext);
  if (!value) {
    throw new Error("useBudgets must be used inside BudgetProvider");
  }
  return value;
}
