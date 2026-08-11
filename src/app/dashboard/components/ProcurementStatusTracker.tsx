import { useState } from "react";
import {
  CheckCircle2, Clock, AlertCircle, ChevronLeft, User,
  FileText, DollarSign, Package, Truck, ClipboardCheck,
  CreditCard, Gavel, ShieldCheck, ShoppingCart, Users,
} from "lucide-react";
import type { Procurement, ProcurementStatus } from "../types";
import { WORKFLOW_STEPS } from "../types";
import { formatLKR, getStepIndexForStatus } from "../data";
import { StatusBadge } from "./StatusBadge";


interface ProcurementStatusTrackerProps {
  procurement: Procurement;
  onBack: () => void;
}

export function ProcurementStatusTracker({
  procurement,
  onBack,
}: ProcurementStatusTrackerProps) {
  const activeStepIndex = getStepIndexForStatus(procurement.status);
  const isCompleted = procurement.status === "Completed";
  const isRejected  = procurement.status === "Rejected";

  return (
    <div style={{ padding: "28px 32px 48px", minHeight: "100%" }}>
      {/* Back button + header */}
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6B7280",
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            marginBottom: 16,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#7A0C0C")}
          onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          Back to All Procurements
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                {procurement.id}
              </span>
              <StatusBadge status={procurement.status} size="sm" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.02em" }}>
              {procurement.title}
            </h1>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>
              {procurement.faculty}{procurement.department ? ` · ${procurement.department}` : ""} · Submitted by {procurement.submittedBy ?? "—"}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#B45309" }}>{formatLKR(procurement.value)}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Estimated Value</div>
          </div>
        </div>
      </div>

      {/* ── Step Progress Bar ───────────────────────────────────────────────── */}
      <StepProgressBar activeStepIndex={activeStepIndex} isCompleted={isCompleted} isRejected={isRejected} />

      {/* ── Current Stage Card ─────────────────────────────────────────────── */}
      {!isRejected && (
        <CurrentStageCard
          procurement={procurement}
          activeStepIndex={activeStepIndex}
          isCompleted={isCompleted}
        />
      )}

      {isRejected && (
        <div style={{
          background: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <AlertCircle size={24} color="#B91C1C" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#B91C1C", marginBottom: 3 }}>Procurement Rejected</div>
            <div style={{ fontSize: 13, color: "#6B7280" }}>
              This procurement has been rejected and will not proceed further. Contact the relevant authority for details.
            </div>
          </div>
        </div>
      )}

      {/* ── Two-column layout: Info + Log ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <ProcurementInfoGrid procurement={procurement} />
          {procurement.bids && procurement.bids.length > 0 && (
            <BiddersSection procurement={procurement} activeStepIndex={activeStepIndex} />
          )}
        </div>

        {/* Right column */}
        <ActivityTimeline procurement={procurement} />
      </div>
    </div>
  );
}


const STEP_ICONS = [FileText, DollarSign, FileText, ShoppingCart, Gavel, ShieldCheck, Package, Truck, ClipboardCheck, CreditCard];

function StepProgressBar({
  activeStepIndex,
  isCompleted,
  isRejected,
}: {
  activeStepIndex: number;
  isCompleted: boolean;
  isRejected: boolean;
}) {


  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #F1F5F9",
        borderRadius: 16,
        padding: "24px 20px 20px",
        marginBottom: 20,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>Procurement Progress</h3>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>
            {isCompleted ? "All 10 steps completed successfully" :
             isRejected  ? "Procurement was rejected" :
             `Step ${activeStepIndex + 1} of 10 — ${WORKFLOW_STEPS[activeStepIndex]?.label}`}
          </p>
        </div>
        {isCompleted && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700, padding: "4px 12px",
            borderRadius: 20, background: "#FEF0F0", color: "#7A0C0C",
            border: "1px solid #F5C6C6",
          }}>
            <CheckCircle2 size={12} /> Completed
          </span>
        )}
      </div>

      {/* Steps */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", paddingBottom: 4 }}>
        {WORKFLOW_STEPS.map((step, i) => {
          const done   = isCompleted || i < activeStepIndex;
          const active = !isCompleted && !isRejected && i === activeStepIndex;
          const future = !done && !active;
          const Icon   = STEP_ICONS[i];

          return (
            <div
              key={step.index}
              style={{ display: "flex", alignItems: "center", flex: i < 9 ? 1 : "0 0 auto" }}
            >
              {/* Step node */}
              <div
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, position: "relative" }}
              >

                {/* Circle */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: done
                    ? "linear-gradient(135deg, #7A0C0C, #9B1515)"
                    : active
                    ? "linear-gradient(135deg, #C2410C, #EA580C)"
                    : "#F3F4F6",
                  border: active
                    ? "2.5px solid #C2410C"
                    : done
                    ? "2.5px solid #7A0C0C"
                    : "2px solid #D1D5DB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.25s ease",
                  boxShadow: active ? "0 0 0 4px rgba(194,65,12,0.15)" : "none",
                }}>
                  {done ? (
                    <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.5} />
                  ) : (
                    <Icon size={15} color={future ? "#9CA3AF" : "#FFFFFF"} strokeWidth={2} />
                  )}
                </div>

                {/* Short label */}
                <span style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : done ? 600 : 500,
                  color: active ? "#C2410C" : done ? "#7A0C0C" : "#9CA3AF",
                  textAlign: "center",
                  maxWidth: 52,
                  lineHeight: 1.3,
                }}>
                  {step.shortLabel}
                </span>
              </div>

              {/* Connector line */}
              {i < 9 && (
                <div style={{
                  flex: 1,
                  height: 3,
                  marginBottom: 18,
                  background: done
                    ? "linear-gradient(to right, #7A0C0C, #9B1515)"
                    : active
                    ? "linear-gradient(to right, #C2410C40, #D1D5DB)"
                    : "#E5E7EB",
                  borderRadius: 2,
                  transition: "background 0.3s ease",
                  marginLeft: 2,
                  marginRight: 2,
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function CurrentStageCard({
  procurement,
  activeStepIndex,
  isCompleted,
}: {
  procurement: Procurement;
  activeStepIndex: number;
  isCompleted: boolean;
}) {
  const step = isCompleted ? null : WORKFLOW_STEPS[activeStepIndex];

  if (isCompleted) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #7a530cff 0%, #a37717ff 100%)",
        borderRadius: 14,
        padding: "24px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 20,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <CheckCircle2 size={26} color="#FFFFFF" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Current Status
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF", marginBottom: 5 }}>
            Procurement Completed
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
            All 10 stages have been completed successfully. Payment has been processed and the procurement is closed.
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div style={{
      background: "linear-gradient(135deg, #7a530cff 0%, #a37717ff 100%)",
      borderRadius: 14,
      padding: "22px 24px",
      marginBottom: 24,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative */}
      <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -20, right: 60, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        {/* Role avatar */}
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "rgba(255,255,255,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, backdropFilter: "blur(4px)",
        }}>
          <User size={22} color="#FFFFFF" strokeWidth={2} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 9px",
              background: "rgba(255,255,255,0.20)",
              color: "#FFFFFF", borderRadius: 20,
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              Step {activeStepIndex + 1} of 10
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 9px",
              background: "rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.9)", borderRadius: 20,
              letterSpacing: "0.04em",
            }}>
              {step.roleLabel}
            </span>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
            {step.label}
          </h2>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.80)", margin: "0 0 14px", lineHeight: 1.6, maxWidth: 600 }}>
            {step.description}
          </p>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(0,0,0,0.20)",
            padding: "8px 14px", borderRadius: 10,
          }}>
            <Clock size={13} color="rgba(255,255,255,0.7)" />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
              {step.waitingMessage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


function InfoField({ label, value, mono }: { label: string; value: string | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 600, color: "#111827",
        fontFamily: mono ? "monospace" : "inherit",
        letterSpacing: mono ? "0.03em" : "normal",
      }}>
        {value}
      </div>
    </div>
  );
}

function ProcurementInfoGrid({ procurement }: { procurement: Procurement }) {
  const formatDateTime = (value?: string) => {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  };

  const rows: { label: string; value: string | undefined; mono?: boolean }[] = [
    { label: "Requisition ID",  value: procurement.id, mono: true },
    { label: "Item Description", value: procurement.description },
    { label: "Faculty",          value: procurement.faculty },
    { label: "Department",       value: procurement.department },
    // { label: "Requisition Type", value: procurement.requisitionType },
    { label: "Current Stock Balance", value: procurement.currentStockBalance?.toLocaleString("en-LK") },
    // { label: "Funding Source",   value: procurement.fundingSource },
    { label: "Submitted By",     value: procurement.submittedBy },
    { label: "Estimated Value",  value: formatLKR(procurement.value) },
    { label: "Opening Date",     value: formatDateTime(procurement.openingDate) },
    { label: "Closing Date",     value: formatDateTime(procurement.closingDate) },
    // { label: "Document Fee",     value: procurement.documentFee !== undefined ? formatLKR(procurement.documentFee) : undefined },
    // { label: "Bid Bond",         value: procurement.requiresBidBond ? `${procurement.bidBondPercentage ?? 0}% required` : "Not required" },
    { label: "Procurement Method", value: procurement.method !== "—" ? procurement.method : undefined },
    { label: "Budget Code",      value: procurement.budgetCode, mono: true },
    { label: "Supplier",         value: procurement.supplierName },
    { label: "Purchase Order",   value: procurement.poNumber, mono: true },
    { label: "GRN Number",       value: procurement.grnNumber, mono: true },
    { label: "Invoice Number",   value: procurement.invoiceNumber, mono: true },
    { label: "Invoice Amount",   value: procurement.invoiceAmount !== undefined ? formatLKR(procurement.invoiceAmount) : undefined },
    { label: "Last Updated",     value: formatDateTime(procurement.updatedAt) },
  ].filter(r => !!r.value);

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #F1F5F9",
      borderRadius: 14,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>Procurement Details</h3>
        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>Information grows as each stage is completed</p>
      </div>
      <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
        {rows.map(r => (
          <InfoField key={r.label} label={r.label} value={r.value} mono={r.mono} />
        ))}
      </div>
    </div>
  );
}


function BiddersSection({ procurement, activeStepIndex }: { procurement: Procurement; activeStepIndex: number }) {
  const bids = procurement.bids ?? [];
  const showScores = activeStepIndex >= 4; // TEC evaluation and beyond

  const formatDateSafe = (value?: string) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString("en-LK", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #F1F5F9",
      borderRadius: 14,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
            <Users size={14} color="#6D28D9" />
            Bidder Submissions
          </h3>
          <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>{bids.length} bid{bids.length !== 1 ? "s" : ""} received</p>
        </div>
        {bids.some(b => b.isWinner) && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0",
          }}>
            Winner Selected
          </span>
        )}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#FAFAFA" }}>
              <th style={thStyle}>Bidder</th>
              <th style={thStyle}>Bid Amount</th>
              <th style={thStyle}>Submitted</th>
              {showScores && <th style={thStyle}>Tech Score</th>}
              {showScores && <th style={thStyle}>Fin Score</th>}
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid #F9FAFB",
                  background: bid.isWinner ? "#F0FDF4" : "transparent",
                }}
                onMouseEnter={e => { if (!bid.isWinner) e.currentTarget.style.background = "#FAFAFA"; }}
                onMouseLeave={e => { e.currentTarget.style.background = bid.isWinner ? "#F0FDF4" : "transparent"; }}
              >
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{bid.bidderName}</div>
                  {bid.notes && (
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2, maxWidth: 200 }}>{bid.notes}</div>
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#B45309" }}>{formatLKR(bid.amount)}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>
                    {formatDateSafe(bid.submittedAt)}
                  </span>
                </td>
                {showScores && (
                  <td style={{ padding: "12px 16px" }}>
                    {bid.technicalScore != null ? (
                      <ScorePill score={bid.technicalScore} />
                    ) : <span style={{ color: "#D1D5DB", fontSize: 12 }}>—</span>}
                  </td>
                )}
                {showScores && (
                  <td style={{ padding: "12px 16px" }}>
                    {bid.financialScore != null ? (
                      <ScorePill score={bid.financialScore} />
                    ) : <span style={{ color: "#D1D5DB", fontSize: 12 }}>—</span>}
                  </td>
                )}
                <td style={{ padding: "12px 16px" }}>
                  {bid.isWinner ? (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0",
                      display: "inline-flex", alignItems: "center", gap: 4,
                    }}>
                      <CheckCircle2 size={10} /> Winner
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                      background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0",
                    }}>
                      {showScores && bid.technicalScore != null ? "Evaluated" : "Submitted"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const color = score >= 85 ? "#15803D" : score >= 70 ? "#B45309" : "#B91C1C";
  const bg    = score >= 85 ? "#F0FDF4" : score >= 70 ? "#FFFBEB" : "#FEF2F2";
  const border= score >= 85 ? "#BBF7D0" : score >= 70 ? "#FDE68A" : "#FECACA";
  return (
    <span style={{
      fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      background: bg, color, border: `1px solid ${border}`,
    }}>
      {score}/100
    </span>
  );
}


const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  HOD: { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
  BUR: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  SDC: { bg: "#EDE9FE", text: "#5B21B6", dot: "#7C3AED" },
  TEC: { bg: "#BAE6FD", text: "#0C4A6E", dot: "#0284C7" },
  TB:  { bg: "#FEF3C7", text: "#92400E", dot: "#D97706" },
  STK: { bg: "#D1FAE5", text: "#065F46", dot: "#059669" },
  SUP: { bg: "#DBEAFE", text: "#1E40AF", dot: "#3B82F6" },
  FIN: { bg: "#CCFBF1", text: "#134E4A", dot: "#0D9488" },
};

function ActivityTimeline({ procurement }: { procurement: Procurement }) {
  const logs = [...(procurement.activityLog ?? [])].reverse(); // newest first

  const formatLogTime = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div style={{
      background: "#FFFFFF",
      border: "1px solid #F1F5F9",
      borderRadius: 14,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>Activity Log</h3>
        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>
          {logs.length} event{logs.length !== 1 ? "s" : ""} · Most recent first
        </p>
      </div>

      {logs.length === 0 ? (
        <div style={{ padding: "40px 24px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
          No activity recorded yet
        </div>
      ) : (
        <div style={{ padding: "16px 20px 4px" }}>
          {logs.map((log, i) => {
            const roleColor = ROLE_COLORS[log.role] ?? { bg: "#F1F5F9", text: "#475569", dot: "#94A3B8" };
            const step = WORKFLOW_STEPS[log.stepIndex];
            const isLast = i === logs.length - 1;

            return (
              <div key={log.id || i} style={{ display: "flex", gap: 14, paddingBottom: isLast ? 16 : 0 }}>
                {/* Timeline line + dot */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: roleColor.dot,
                    border: `2px solid ${roleColor.dot}33`,
                    flexShrink: 0,
                    marginTop: 4,
                    boxSizing: "border-box",
                  }} />
                  {!isLast && (
                    <div style={{ width: 2, flex: 1, background: "#F3F4F6", margin: "4px 0 4px" }} />
                  )}
                </div>

                {/* Log body */}
                <div style={{ paddingBottom: isLast ? 0 : 18, flex: 1 }}>
                  {/* Header row */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px",
                      background: roleColor.bg, color: roleColor.text,
                      borderRadius: 20,
                    }}>
                      {log.role}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{log.actor}</span>
                    {step && (
                      <span style={{
                        fontSize: 10, color: "#6B7280", padding: "2px 7px",
                        background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 20,
                      }}>
                        Step {log.stepIndex + 1} · {step.shortLabel}
                      </span>
                    )}
                  </div>

                  {/* Action text */}
                  <p style={{ fontSize: 13, color: "#374151", margin: "0 0 6px", lineHeight: 1.5 }}>
                    {log.action}
                  </p>

                  {/* Notes */}
                  {log.notes && (
                    <div style={{
                      fontSize: 12, color: "#6B7280", background: "#FAFAFA",
                      border: "1px solid #F3F4F6", borderRadius: 8,
                      padding: "8px 12px", lineHeight: 1.5, marginBottom: 6,
                    }}>
                      {log.notes}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                    {formatLogTime(log.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 16px",
  fontSize: 11,
  fontWeight: 700,
  color: "#9CA3AF",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "1px solid #F3F4F6",
  whiteSpace: "nowrap",
};
