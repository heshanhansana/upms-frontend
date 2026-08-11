import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import type { UserContext, Procurement } from "../types";
import { WelcomeBanner } from "../components/WelcomeBanner";
import { StatCardRow } from "../components/StatCard";
import { ActionQueueList } from "../components/ActionQueueList";
import { ProcurementTable } from "../components/ProcurementTable";
import { StatusBadge } from "../components/StatusBadge";
import { BudgetComparison } from "../components/BudgetComparison";
import { PageTitleBar } from "../components/ContentHeader";
import { formatLKR } from "../data";
import { useDashboardData } from "../hooks/useDashboardData";
import { SkeletonWelcomeBanner, SkeletonStatCardRow, SkeletonActionQueue, SkeletonTable } from "../components/SkeletonLoader";
import { useProcurements } from "../ProcurementContext";
import { useBudgets } from "../BudgetContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { useNotifications } from "../../notifications/NotificationContext";

interface BursarDashboardProps {
  user: UserContext;
  activeTab: string;
  onTabChange: (key: string) => void;
  onViewProcurement: (id: string) => void;
  onViewProcurementDetails: (id: string) => void;
}

export function BursarDashboard({ user, activeTab, onTabChange, onViewProcurement, onViewProcurementDetails }: BursarDashboardProps) {
  if (activeTab === "fund-verification") return <FundVerificationPanel onViewProcurementDetails={onViewProcurementDetails} user={user} />;
  if (activeTab === "procurements")      return <AllProcurementsPanel onViewProcurement={onViewProcurement} user={user} />;
  return <BursarOverview user={user} onTabChange={onTabChange} />;
}

function BursarOverview({ user, onTabChange }: { user: UserContext; onTabChange: (k: string) => void }) {
  const { isLoading, data } = useDashboardData(user);

  if (isLoading) {
    return (
      <div style={{ padding: "28px 28px", animation: "fadeIn 0.3s ease" }}>
        <SkeletonWelcomeBanner />
        <SkeletonStatCardRow />
        <SkeletonActionQueue />
      </div>
    );
  }

  const { queue, procurements: myProcurements } = data!;
  return (
    <div style={{ padding: "28px 28px", animation: "fadeIn 0.4s ease" }}>
      <WelcomeBanner user={user} />
      <StatCardRow total={myProcurements.length} inQueue={queue.length} actionRequired={queue.length} completed={0} />
      <ActionQueueList items={queue} onViewAll={() => onTabChange("fund-verification")} onItemClick={() => onTabChange("fund-verification")} />
    </div>
  );
}

function FundVerificationPanel({ onViewProcurementDetails, user }: { onViewProcurementDetails: (id: string) => void; user: UserContext }) {
  const { getProcurementsForUser, updateProcurement } = useProcurements();
  const { getAllocationForFaculty, getBudgetUsageForFaculty } = useBudgets();
  const { addNotification } = useNotifications();
  const myProcurements = getProcurementsForUser(user);
  const pending = myProcurements.filter(p =>
    p.status === "Pending Fund Verification" && (user.role !== "BUR" || p.value >= 500_000)
  );
  const [selected, setSelected] = useState<Procurement | null>(pending[0] ?? null);
  const [budgetCode, setBudgetCode] = useState("");
  const [budgetAllocated, setBudgetAllocated] = useState("");
  const [verified, setVerified] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ message: string; tone: "success" | "warning" } | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!selected && pending.length > 0) {
      setSelected(pending[0]);
      return;
    }

    if (selected && !pending.some(pr => pr.id === selected.id)) {
      setSelected(pending[0] ?? null);
    }
  }, [pending, selected]);

  useEffect(() => {
    if (!selected) return;
    const allocation = getAllocationForFaculty(selected.faculty);
    setBudgetCode(allocation?.budgetCode ?? "");
  }, [getAllocationForFaculty, selected?.id]);

  const handleVerify = async () => {
    if (!selected) return;
    if (user.role === "FBUR" && selected.value > 500_000) return;
    const allocatedAmount = Number(budgetAllocated);
    const usage = getBudgetUsageForFaculty(selected.faculty, myProcurements);
    const remainingBalance = usage.available + selected.value - allocatedAmount;
    await updateProcurement(selected.id, {
      status: "Funds Verified",
      budgetCode,
      availableFunds: remainingBalance,
      notes: `Funds verified against ${selected.faculty} allocation. Allocated to this procurement: ${formatLKR(allocatedAmount)}. Faculty balance after allocation: ${formatLKR(remainingBalance)}.`,
    }, { name: user.name, role: user.role });
    setVerified(p => new Set([...p, selected.id]));
    setSelected(null);
    setBudgetCode("");
    setBudgetAllocated("");
    setFeedback({ message: `Funds verified successfully for ${selected.id}.`, tone: "success" });
  };

  const handleReject = async () => {
    if (!selected) return;
    if (user.role === "FBUR" && selected.value > 500_000) return;
    const reason = rejectionReason.trim();
    if (!reason) return;
    await updateProcurement(selected.id, {
      status: "Rejected",
      rejectionReason: reason,
      notes: `Fund verification rejected. Reason: ${reason}`,
    }, { name: user.name, role: user.role });
    addNotification({
      recipient: selected.submittedBy ?? "",
      title: "Procurement rejected",
      detail: `${selected.id} was rejected during fund verification. Reason: ${reason}`,
      destination: "procurements",
      kind: "rejection",
    });
    setRejected(p => new Set([...p, selected.id]));
    setSelected(null);
    setRejectionReason("");
    setIsRejectDialogOpen(false);
    setFeedback({ message: `${selected.id} was rejected successfully.`, tone: "warning" });
  };

  const selectedAllocation = selected ? getAllocationForFaculty(selected.faculty) : null;
  const selectedUsage = selected ? getBudgetUsageForFaculty(selected.faculty, myProcurements) : null;
  const selectedAvailableBefore = selected && selectedUsage ? selectedUsage.available + selected.value : 0;
  const requestedAllocationAmount = Number(budgetAllocated);
  const canTakeFundAction = !selected || user.role !== "FBUR" || selected.value <= 500_000;
  const canVerifyFunds = Boolean(
    canTakeFundAction &&
    selectedAllocation &&
    budgetCode &&
    budgetAllocated &&
    Number.isFinite(requestedAllocationAmount) &&
    requestedAllocationAmount > 0 &&
    requestedAllocationAmount <= selectedAvailableBefore
  );

  return (
    <div style={{ padding: "28px 28px" }}>
      <PageTitleBar
        title={user.role === "FBUR" ? "Faculty Budget Verification" : "Fund Verification"}
        subtitle={user.role === "FBUR"
          ? "Verify requisitions against the budget allocated to your faculty by Finance"
          : "Verify budget availability for pending requisitions"
        }
      />

      {feedback && (
        <div
          role="status"
          style={{
            marginBottom: 20,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 10,
            background: feedback.tone === "success" ? "#F0FDF4" : "#FFFBEB",
            border: `1px solid ${feedback.tone === "success" ? "#BBF7D0" : "#FDE68A"}`,
            color: feedback.tone === "success" ? "#166534" : "#92400E",
          }}
        >
          <CheckCircle2 size={18} strokeWidth={2.4} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 650 }}>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            aria-label="Dismiss confirmation"
            style={{ border: 0, padding: 2, background: "transparent", color: "inherit", cursor: "pointer", display: "flex" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20, alignItems: "start" }}>
        {/* Left: pending list */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F3F4F6" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>Pending Verification ({pending.length})</h3>
          </div>
          {pending.map(pr => {
            const isVerified = verified.has(pr.id);
            const isRejected = rejected.has(pr.id);
            return (
              <div
                key={pr.id}
                onClick={() => !isVerified && !isRejected && setSelected(pr)}
                style={{ padding: "14px 18px", borderBottom: "1px solid #F9FAFB", cursor: isVerified || isRejected ? "default" : "pointer", background: selected?.id === pr.id ? "#FFF7ED" : "transparent", opacity: isVerified || isRejected ? 0.5 : 1 }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", marginBottom: 2, fontFamily: "monospace" }}>{pr.id}</div>
                <div style={{ fontSize: 12, color: "#111827", fontWeight: 600, marginBottom: 4 }}>{pr.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#B45309" }}>{formatLKR(pr.value)}</span>
                  {isVerified && <StatusBadge status="Funds Verified" size="sm" />}
                  {isRejected && <StatusBadge status="Rejected" size="sm" />}
                  {!isVerified && !isRejected && <StatusBadge status={pr.status} size="sm" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: verification form */}
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 4 }}>{selected.title}</h3>
                  <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{selected.id} · {selected.faculty} · {selected.department}</p>
                </div>
                <button
                  onClick={() => onViewProcurementDetails(selected.id)}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "6px 14px",
                    background: "#F3F4F6",
                    color: "#374151",
                    border: "1px solid #E5E7EB",
                    borderRadius: 7,
                    cursor: "pointer",
                  }}
                >
                  View Details
                </button>
              </div>
            </div>

            {/* Budget Comparison */}
            <BudgetComparison
              requested={selected.value}
              allocated={budgetAllocated ? Number(budgetAllocated) : 0}
              totalAvailable={selectedAvailableBefore}
            />

            <div style={{ background: selectedAllocation ? "#F8FAFC" : "#FFFBEB", border: `1px solid ${selectedAllocation ? "#E2E8F0" : "#FDE68A"}`, borderRadius: 14, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Faculty Budget Allocation</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{selectedAllocation ? formatLKR(selectedAllocation.allocation) : "Not allocated"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Budget Code</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{selectedAllocation?.budgetCode ?? "Finance required"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", textTransform: "uppercase", marginBottom: 4 }}>Faculty Bursar Spend Authority</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: selectedAvailableBefore < selected.value ? "#B91C1C" : "#15803D" }}>{formatLKR(selectedAvailableBefore)}</div>
              </div>
            </div>

            {/* Verification Form */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "#111827", margin: 0 }}>Verification Details</h4>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Budget Code <span style={{ color: "#EF4444" }}>*</span></label>
                <input value={budgetCode} onChange={e => setBudgetCode(e.target.value)} placeholder="e.g. BUDGET-2026-FAS" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Budget Allocated (LKR) <span style={{ color: "#EF4444" }}>*</span></label>
                <input type="number" min="0" value={budgetAllocated} onChange={e => setBudgetAllocated(e.target.value)} placeholder="e.g. 80000" style={inputStyle} />
              </div>
              {budgetAllocated && Number(budgetAllocated) < selected.value && (
                <div style={{
                  padding: 12,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  display: "flex",
                  gap: 8,
                  alignItems: "start",
                }}>
                  <div style={{ fontSize: 14, marginTop: 2 }}>⚠️</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#DC2626" }}>Budget Shortfall</div>
                    <div style={{ fontSize: 11, color: "#DC2626", marginTop: 2 }}>
                      The allocated amount is less than the requested amount. Ask Finance Division to revise this faculty allocation if more spending authority is needed.
                    </div>
                  </div>
                </div>
              )}
              {budgetAllocated && Number(budgetAllocated) > selectedAvailableBefore && (
                <div style={{
                  padding: 12,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#B91C1C",
                  fontWeight: 650,
                }}>
                  This amount exceeds the faculty budget available from Finance.
                </div>
              )}
              {!selectedAllocation && (
                <div style={{
                  padding: 12,
                  background: "#FFFBEB",
                  border: "1px solid #FDE68A",
                  borderRadius: 8,
                  fontSize: 11,
                  color: "#92400E",
                  fontWeight: 650,
                }}>
                  Finance Division must allocate a budget to {selected.faculty} before funds can be verified.
                </div>
              )}

              {canTakeFundAction ? (
                <div style={{ display: "flex", gap: 10, paddingTop: 10, borderTop: "1px solid #E5E7EB" }}>
                  <button
                    onClick={() => setIsRejectDialogOpen(true)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "#FEF2F2",
                      color: "#B91C1C",
                      border: "1px solid #FECACA",
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={!canVerifyFunds}
                    style={{
                      flex: 2,
                      padding: "10px",
                      background: !canVerifyFunds ? "#D1D5DB" : "#15803D",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: !canVerifyFunds ? "not-allowed" : "pointer",
                    }}
                  >
                    Verify Funds
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: "48px 24px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
            Select a requisition from the list to verify funds
          </div>
        )}
      </div>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#111827" }}>Reject fund verification</DialogTitle>
            <DialogDescription>Please provide a reason. It will be sent to the person who created this procurement.</DialogDescription>
          </DialogHeader>
          <div style={{ marginTop: 4 }}>
            <label htmlFor="rejection-reason" style={{ display: "block", fontSize: 12, fontWeight: 650, color: "#374151", marginBottom: 6 }}>Reason <span style={{ color: "#EF4444" }}>*</span></label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={event => setRejectionReason(event.target.value)}
              placeholder="Explain why the funds cannot be verified..."
              rows={4}
              style={{ ...inputStyle, height: "auto", minHeight: 96, padding: "10px 12px", resize: "vertical" }}
            />
          </div>
          <DialogFooter style={{ marginTop: 20 }}>
            <button type="button" onClick={() => setIsRejectDialogOpen(false)} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #D1D5DB", background: "#FFFFFF", color: "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
            <button type="button" onClick={handleReject} disabled={!rejectionReason.trim()} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #B91C1C", background: rejectionReason.trim() ? "#B91C1C" : "#FCA5A5", color: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: rejectionReason.trim() ? "pointer" : "not-allowed" }}>Reject procurement</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AllProcurementsPanel({ onViewProcurement, user }: { onViewProcurement: (id: string) => void; user: UserContext }) {
  const { getProcurementsForUser, isLoading } = useProcurements();
  const list = getProcurementsForUser(user);
  if (isLoading) {
    return (
      <div style={{ padding: "28px 28px" }}>
        <PageTitleBar title="All Procurements" subtitle="Loading procurement records" />
        <SkeletonTable rows={6} />
      </div>
    );
  }
  return (
    <div style={{ padding: "28px 28px" }}>
      <PageTitleBar title="All Procurements" subtitle={`${list.length} records visible for your role`} />
      <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #F1F5F9", overflow: "hidden" }}>
        <ProcurementTable procurements={list} title="" subtitle="" onViewProcurement={onViewProcurement} />
      </div>
    </div>
  );
}


const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 13, color: "#111827", background: "#FFFFFF", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
