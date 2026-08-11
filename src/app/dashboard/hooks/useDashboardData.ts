import { useMemo } from "react";
import type { Procurement, UserContext } from "../types";
import { useProcurements } from "../ProcurementContext";

interface DashboardData {
  queue: Procurement[];
  procurements: Procurement[];
}

export function useDashboardData(user: UserContext): {
  isLoading: boolean;
  data: DashboardData;
} {
  const { getProcurementsForUser, procurements, isLoading } = useProcurements();

  const data = useMemo<DashboardData>(() => {
    const visibleProcurements = getProcurementsForUser(user);
    return {
      queue: getActionQueueForUser(user, visibleProcurements),
      procurements: visibleProcurements,
    };
  }, [getProcurementsForUser, procurements, user]);

  return { isLoading, data };
}

function getActionQueueForUser(user: UserContext, procurements: Procurement[]) {
  const statusesByRole: Record<UserContext["role"], Procurement["status"][]> = {
    ADM: [],
    HOD: ["Quality Report Required"],
    BUR: ["Pending Fund Verification"],
    FBUR: ["Pending Fund Verification"],
    SDC: ["Funds Verified"],
    TEC: ["Technical Evaluation"],
    TB: ["Authority Approval"],
    STK: ["Awaiting Delivery"],
    SUP: ["Bidding Open"],
    FIN: ["Payment Pending"],
  };

  return procurements.filter(item => {
    if (!statusesByRole[user.role].includes(item.status)) return false;
    if (user.role === "BUR") return item.value >= 500_000;
    if (user.role === "FBUR") return item.value <= 500_000;
    return true;
  });
}
