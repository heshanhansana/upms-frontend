import { useState } from "react";
import type { UserContext } from "../types";
import { WelcomeBanner } from "../components/WelcomeBanner";
import { StatCardRow } from "../components/StatCard";
import { ActionQueueList } from "../components/ActionQueueList";
import { ProcurementTable } from "../components/ProcurementTable";
import { PageTitleBar } from "../components/ContentHeader";
import { formatLKR } from "../data";
import { useDashboardData } from "../hooks/useDashboardData";
import { SkeletonWelcomeBanner, SkeletonBudgetBanner, SkeletonStatCardRow, SkeletonActionQueue, SkeletonTable } from "../components/SkeletonLoader";
import { useProcurements } from "../ProcurementContext";
import { useBudgets } from "../BudgetContext";


interface FinanceDashboardProps {
  user: UserContext;
  activeTab: string;
  onTabChange: (key: string) => void;
  onViewProcurement: (id: string) => void;
  onViewProcurementDetails: (id: string) => void;
}

export function FinanceDashboard({ user, activeTab, onTabChange, onViewProcurement, onViewProcurementDetails }: FinanceDashboardProps) {
  if (activeTab === "budget-allocation") return <BudgetAllocationPanel user={user} />;
  if (activeTab === "payments")     return <PaymentsPanel onViewProcurementDetails={onViewProcurementDetails} user={user} />;
  if (activeTab === "procurements") return <AllProcurementsPanel onViewProcurement={onViewProcurement} user={user} />;
  return <FinanceOverview user={user} onTabChange={onTabChange} />;
}

function FinanceOverview({ user, onTabChange }: { user: UserContext; onTabChange: (k: string) => void }) {
  const { isLoading, data } = useDashboardData(user);
  const { allocations } = useBudgets();

  if (isLoading) {
    return (
      <div style={{ padding: "28px 32px", animation: "fadeIn 0.3s ease" }}>
        <SkeletonWelcomeBanner />
        <SkeletonBudgetBanner />
        <SkeletonStatCardRow />
        <SkeletonActionQueue />
      </div>
    );
  }

  const { queue, procurements: myProcurements } = data!;
  const totalPending = queue.reduce((sum, pr) => sum + pr.value, 0);

  const ANNUAL_BUDGET = 85_000_000; // LKR 85 Million
  const facultyAllocated = allocations.reduce((sum, item) => sum + item.allocation, 0);
  const spent = myProcurements
    .filter(p => p.status === "Completed")
    .reduce((sum, p) => sum + p.value, 0);
  const pending_val = myProcurements
    .filter(p => p.status !== "Completed" && p.status !== "Rejected")
    .reduce((sum, p) => sum + p.value, 0);
  const remaining = ANNUAL_BUDGET - spent - pending_val;
  const spentPct   = Math.min(100, Math.round((spent / ANNUAL_BUDGET) * 100));
  const pendingPct = Math.min(100 - spentPct, Math.round((pending_val / ANNUAL_BUDGET) * 100));

  return (
    <div style={{ padding: "28px 32px", animation: "fadeIn 0.4s ease" }}>
      <WelcomeBanner user={user} />

      <div style={{
        background: "linear-gradient(135deg, #7a530cff 0%, #a37717ff 100%)",
        borderRadius: 16,
        padding: "24px 28px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(122,83,12,0.25)",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, right: 80, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.88)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Annual Procurement Budget — {new Date().getFullYear()}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              {formatLKR(ANNUAL_BUDGET)}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", marginTop: 4 }}>
              Faculty allocations issued: {formatLKR(facultyAllocated)}
            </div>
          </div>
          <button
            onClick={() => onTabChange("budget-allocation")}
            style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 10,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 700,
            color: "#FFFFFF",
            backdropFilter: "blur(4px)",
            cursor: "pointer",
          }}>
            Manage Faculty Budgets
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            height: 10,
            borderRadius: 8,
            background: "rgba(255,255,255,0.2)",
            overflow: "hidden",
            display: "flex",
          }}>
            {/* Spent segment */}
            <div style={{
              width: `${spentPct}%`,
              background: "rgba(255,255,255,0.85)",
              borderRadius: spentPct > 0 ? "8px 0 0 8px" : 0,
              transition: "width 0.6s ease",
            }} />
            {/* Committed/pending segment */}
            <div style={{
              width: `${pendingPct}%`,
              background: "rgba(255,255,255,0.40)",
              transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.85)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>Spent ({spentPct}%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.40)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>Committed ({pendingPct}%)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 600 }}>Available ({100 - spentPct - pendingPct}%)</span>
            </div>
          </div>
        </div>

        {/* Three metric tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {/* Spent */}
          <div style={{
            background: "rgba(255,255,255,0.13)",
            borderRadius: 12,
            padding: "14px 16px",
            backdropFilter: "blur(4px)",
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Total Spent
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF", marginBottom: 2 }}>
              {formatLKR(spent)}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
              Payments processed
            </div>
          </div>

          {/* Committed */}
          <div style={{
            background: "rgba(255,255,255,0.13)",
            borderRadius: 12,
            padding: "14px 16px",
            backdropFilter: "blur(4px)",
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.88)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Committed
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF", marginBottom: 2 }}>
              {formatLKR(pending_val)}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
              Active procurements
            </div>
          </div>

          {/* Remaining */}
          <div style={{
            background: "rgba(255,255,255,0.20)",
            borderRadius: 12,
            padding: "14px 16px",
            border: "1px solid rgba(255,255,255,0.25)",
            backdropFilter: "blur(4px)",
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.95)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Available Balance
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#FFFFFF", marginBottom: 2 }}>
              {formatLKR(Math.max(0, remaining))}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.90)" }}>
              {remaining < 0 ? "⚠ Over budget" : "Unallocated funds"}
            </div>
          </div>
        </div>
      </div>

      <StatCardRow total={myProcurements.length} inQueue={queue.length} actionRequired={queue.length} completed={2} />

      {/* Total pending amount */}
      {queue.length > 0 && (
        <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "14px 20px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>Total Payment Pending</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#B45309" }}>{formatLKR(totalPending)}</span>
        </div>
      )}

      <ActionQueueList items={queue} onViewAll={() => onTabChange("payments")} onItemClick={() => onTabChange("payments")} />
    </div>
  );
}

function PaymentsPanel({ onViewProcurementDetails, user }: { onViewProcurementDetails: (id: string) => void; user: UserContext }) {
  const { getProcurementsForUser, updateProcurement } = useProcurements();
  const myProcurements = getProcurementsForUser(user);
  const pending = myProcurements.filter(p => p.status === "Payment Pending");
  const [processed, setProcessed] = useState<Set<string>>(new Set());
  const [voucherNos, setVoucherNos] = useState<Record<string, string>>({});

  const handleProcess = async (id: string) => {
    if (!voucherNos[id]) return;
    await updateProcurement(id, {
      status: "Completed",
      notes: `Payment processed and dispatched. Voucher: ${voucherNos[id]} issued. Requisition completed.`,
    }, { name: user.name, role: user.role });
    setProcessed(p => new Set([...p, id]));
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 2 }}>Payments</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Process payments after quality report approval</p>
      </div>

      {pending.length === 0 ? (
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, padding: "48px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
          No payments pending
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pending.map(pr => {
            const done = processed.has(pr.id);
            return (
              <div
                key={pr.id}
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${done ? "#BBF7D0" : "#E5E7EB"}`,
                  borderRadius: 10,
                  padding: "20px 24px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", fontFamily: "monospace" }}>{pr.id}</span>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "4px 0" }}>{pr.title}</h3>
                    <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px" }}>{pr.faculty}</p>
                    <button
                      onClick={() => onViewProcurementDetails(pr.id)}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "5px 12px",
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
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#B45309" }}>{formatLKR(pr.value)}</div>
                    {done && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" }}>
                        ✓ Payment Processed · Voucher #{voucherNos[pr.id]}
                      </span>
                    )}
                  </div>
                </div>

                {!done && (
                  <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Payment Voucher No.</label>
                      <input
                        value={voucherNos[pr.id] ?? ""}
                        onChange={e => setVoucherNos(p => ({ ...p, [pr.id]: e.target.value }))}
                        placeholder="e.g. PV-2026-0089"
                        style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 7, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" as const }}
                      />
                    </div>
                    <button
                      onClick={() => handleProcess(pr.id)}
                      disabled={!voucherNos[pr.id]}
                      style={{ marginTop: 22, padding: "9px 20px", background: voucherNos[pr.id] ? "#15803D" : "#D1D5DB", color: "#FFFFFF", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: voucherNos[pr.id] ? "pointer" : "not-allowed", flexShrink: 0 }}
                    >
                      Mark as Paid
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BudgetAllocationPanel({ user }: { user: UserContext }) {
  const { procurements } = useProcurements();
  const { allocations, allocateFacultyBudget, getBudgetUsageForFaculty, error } = useBudgets();
  const faculties = Array.from(new Set([
    ...allocations.map(item => item.faculty),
    ...procurements.map(item => item.faculty),
  ].filter(Boolean))).sort();
  const [faculty, setFaculty] = useState(faculties[0] ?? "Faculty of Applied Sciences");
  const selectedAllocation = allocations.find(item => item.faculty === faculty);
  const [amount, setAmount] = useState(String(selectedAllocation?.allocation ?? ""));
  const [budgetCode, setBudgetCode] = useState(selectedAllocation?.budgetCode ?? "");
  const [message, setMessage] = useState("");

  const totalAllocated = allocations.reduce((sum, item) => sum + item.allocation, 0);
  const totalSpent = allocations.reduce((sum, item) => sum + getBudgetUsageForFaculty(item.faculty, procurements).spent, 0);
  const totalCommitted = allocations.reduce((sum, item) => sum + getBudgetUsageForFaculty(item.faculty, procurements).committed, 0);

  const handleFacultyChange = (nextFaculty: string) => {
    const nextAllocation = allocations.find(item => item.faculty === nextFaculty);
    setFaculty(nextFaculty);
    setAmount(String(nextAllocation?.allocation ?? ""));
    setBudgetCode(nextAllocation?.budgetCode ?? "");
    setMessage("");
  };

  const handleSave = async () => {
    const allocation = Number(amount);
    if (!faculty || !budgetCode.trim() || !Number.isFinite(allocation) || allocation <= 0) return;
    await allocateFacultyBudget({
      faculty,
      allocation,
      budgetCode: budgetCode.trim(),
      fiscalYear: new Date().getFullYear(),
      updatedBy: user.name,
    });
    setMessage(`${faculty} procurement budget updated to ${formatLKR(allocation)}.`);
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <PageTitleBar title="Faculty-wise Budget Allocation" subtitle="Set the procurement money each faculty bursar can spend" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        <FinanceMetric label="Allocated to Faculties" value={formatLKR(totalAllocated)} detail={`${allocations.length} faculty budgets`} />
        <FinanceMetric label="Committed + Spent" value={formatLKR(totalCommitted + totalSpent)} detail="Active procurements and completed payments" />
        <FinanceMetric label="Unspent Balance" value={formatLKR(totalAllocated - totalCommitted - totalSpent)} detail="Remaining faculty spending authority" tone="green" />
      </div>

      {message && (
        <div role="status" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534", borderRadius: 10, padding: "12px 14px", fontSize: 13, fontWeight: 650, marginBottom: 18 }}>
          {message}
        </div>
      )}
      {error && (
        <div role="alert" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: 10, padding: "12px 14px", fontSize: 13, fontWeight: 650, marginBottom: 18 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", margin: "0 0 16px" }}>Allocate Faculty Budget</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Faculty</label>
              <select value={faculty} onChange={event => handleFacultyChange(event.target.value)} style={inputStyle}>
                {faculties.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Annual Procurement Budget (LKR)</label>
              <input type="number" min="0" value={amount} onChange={event => setAmount(event.target.value)} placeholder="e.g. 15000000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Budget Code</label>
              <input value={budgetCode} onChange={event => setBudgetCode(event.target.value)} placeholder="e.g. FIN-2026-FAS" style={inputStyle} />
            </div>
            <button
              onClick={handleSave}
              disabled={!faculty || !budgetCode.trim() || Number(amount) <= 0}
              style={{
                padding: "10px 14px",
                borderRadius: 9,
                border: "none",
                background: !faculty || !budgetCode.trim() || Number(amount) <= 0 ? "#D1D5DB" : "#7A530C",
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: 800,
                cursor: !faculty || !budgetCode.trim() || Number(amount) <= 0 ? "not-allowed" : "pointer",
              }}
            >
              Save Allocation
            </button>
          </div>
        </div>

        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", gap: 12, padding: "12px 18px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", fontSize: 11, fontWeight: 800, color: "#6B7280", textTransform: "uppercase" }}>
            <span>Faculty</span>
            <span>Allocated</span>
            <span>Committed</span>
            <span>Spent</span>
            <span>Available</span>
          </div>
          {allocations.map(item => {
            const usage = getBudgetUsageForFaculty(item.faculty, procurements);
            const availableTone = usage.available < 0 ? "#B91C1C" : "#15803D";
            return (
              <button
                key={item.faculty}
                onClick={() => handleFacultyChange(item.faculty)}
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr",
                  gap: 12,
                  alignItems: "center",
                  padding: "14px 18px",
                  border: 0,
                  borderBottom: "1px solid #F3F4F6",
                  background: item.faculty === faculty ? "#FFF7ED" : "#FFFFFF",
                  textAlign: "left",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <span>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 750, color: "#111827" }}>{item.faculty}</span>
                  <span style={{ display: "block", fontSize: 11, color: "#6B7280", marginTop: 2 }}>{item.budgetCode}</span>
                </span>
                <span style={tableAmountStyle}>{formatLKR(usage.allocated)}</span>
                <span style={tableAmountStyle}>{formatLKR(usage.committed)}</span>
                <span style={tableAmountStyle}>{formatLKR(usage.spent)}</span>
                <span style={{ ...tableAmountStyle, color: availableTone }}>{formatLKR(usage.available)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FinanceMetric({ label, value, detail, tone = "amber" }: { label: string; value: string; detail: string; tone?: "amber" | "green" }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 850, color: tone === "green" ? "#15803D" : "#92400E", marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#9CA3AF" }}>{detail}</div>
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
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 2 }}>All Procurements</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>{list.length} records</p>
      </div>
      <ProcurementTable procurements={list} title="" subtitle="" onViewProcurement={onViewProcurement} />
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 650,
  color: "#374151",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  fontSize: 13,
  color: "#111827",
  background: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const tableAmountStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 750,
  color: "#374151",
};
