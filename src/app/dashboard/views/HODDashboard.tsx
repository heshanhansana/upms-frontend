import { useState, useRef, useEffect } from "react";
import { Plus, TrendingUp, MoreHorizontal, ArrowUpRight, Search, Filter, Building2, ArrowRight, Check, ChevronLeft, AlertCircle, XCircle } from "lucide-react";
import { SignaturePad, SignaturePadRef } from "@/components/SignaturePad";
import { WelcomeBanner } from "../components/WelcomeBanner";
import { StatCardRow } from "../components/StatCard";
import { InventoryCard } from "../components/InventoryCard";
import type { Procurement, UserContext } from "../types";
import { PageTitleBar } from "../components/ContentHeader";
import { ActionQueueList } from "../components/ActionQueueList";
import { ProcurementTable } from "../components/ProcurementTable";
import { StatusBadge } from "../components/StatusBadge";
import { formatLKR } from "../data";
import { useDashboardData } from "../hooks/useDashboardData";
import { SkeletonWelcomeBanner, SkeletonStatCardRow, SkeletonTable } from "../components/SkeletonLoader";
import { useProcurements } from "../ProcurementContext";


interface HODDashboardProps {
  user: UserContext;
  activeTab: string;
  onTabChange: (key: string) => void;
  onViewProcurement: (id: string) => void;
  onViewProcurementDetails: (id: string) => void;
}

export function HODDashboard({ user, activeTab, onTabChange, onViewProcurement, onViewProcurementDetails }: HODDashboardProps) {
  if (activeTab === "new-requisition") return <NewRequisitionPanel onSubmit={() => onTabChange("dashboard")} onViewProcurement={onViewProcurement} user={user} />;
  if (activeTab === "stock-inquiry")   return <StockInquiryPanel />;
  if (activeTab === "procurements")    return <AllProcurementsPanel onViewProcurement={onViewProcurement} user={user} />;
  if (activeTab === "rejected")        return <RejectedPanel onViewProcurementDetails={onViewProcurementDetails} user={user} />;
  if (activeTab === "quality-report")  return <QualityReportPanel onViewProcurementDetails={onViewProcurementDetails} user={user} />;
  return <HODOverview user={user} onTabChange={onTabChange} />;
}



function HODOverview({ user, onTabChange }: { user: UserContext; onTabChange: (k: string) => void }) {
  const { isLoading, data } = useDashboardData(user);
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div style={{ padding: "28px 32px 40px", animation: "fadeIn 0.3s ease" }}>
        <SkeletonWelcomeBanner />
        <SkeletonStatCardRow />
        {/* Button placeholder */}
        <div
          className="upms-skel"
          style={{ width: 200, height: 40, borderRadius: 9, marginBottom: 24 }}
        />
        <SkeletonTable rows={6} />
      </div>
    );
  }

  const { queue, procurements: myProcurements } = data!;

  return (
    <div style={{ padding: "28px 32px 40px", animation: "fadeIn 0.4s ease" }}>
      {/* Welcome Banner */}
      <WelcomeBanner user={user} />

      {/* 4 Stat Cards */}
      <StatCardRow
        total={myProcurements.length}
        inQueue={queue.length}
        actionRequired={queue.length}
        completed={0}
      />

      {/* Create Purchase Requisition button */}
      <button
        onClick={() => onTabChange("new-requisition")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 20px",
          background: "#7A0C0C",
          color: "#FFFFFF",
          border: "none",
          borderRadius: 9,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 24,
        }}
      >
        <Plus size={14} strokeWidth={2.5} />
        Create Purchase Requisition
      </button>

      {/* ── Bottom: Recent Procurements table ── */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 14,
          border: "1px solid #F1F5F9",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #F3F4F6",
          }}
        >
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>Recent Activities</h3>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "3px 0 0" }}></p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid #E5E7EB", borderRadius: 7, background: "#FAFAFA" }}>
              <Search size={12} strokeWidth={2} color="#9CA3AF" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  border: "none",
                  background: "none",
                  outline: "none",
                  fontSize: 12,
                  color: "#374151",
                  width: 140,
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, lineHeight: 1 }}
                >✕</button>
              )}
            </div>
            {/* Filter */}
            <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "1px solid #E5E7EB", borderRadius: 7, background: "#FAFAFA", color: "#374151", fontSize: 12, cursor: "pointer" }}>
              <Filter size={12} strokeWidth={2} />
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA" }}>
                <th style={thStyle}></th>
                <th style={thStyle}>Activity</th>
                <th style={thStyle}>Order ID</th>
                <th style={thStyle}>Faculty</th>
                <th style={thStyle}>Value</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {myProcurements.filter(pr => {
                const q = search.toLowerCase();
                return !q ||
                  pr.title.toLowerCase().includes(q) ||
                  pr.id.toLowerCase().includes(q) ||
                  pr.faculty.toLowerCase().includes(q) ||
                  pr.status.toLowerCase().includes(q) ||
                  (pr.department ?? "").toLowerCase().includes(q);
              }).slice(0, 8).map((pr, i) => (
                <tr
                  key={pr.id}
                  style={{ borderBottom: "1px solid #F9FAFB" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 10px 12px 20px" }}>
                    <input type="checkbox" style={{ width: 14, height: 14, accentColor: "#7A0C0C", cursor: "pointer" }} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: ["#FEF3C7","#F0FDF4","#EFF6FF","#F5F3FF","#FEF2F2"][i % 5],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                          color: ["#B45309","#15803D","#1D4ED8","#6D28D9","#B91C1C"][i % 5],
                          flexShrink: 0,
                        }}
                      >
                        PR
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {pr.title}
                        </div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{pr.department ?? pr.faculty}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", fontFamily: "monospace" }}>{pr.id}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>{pr.faculty.replace("Faculty of ", "")}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#B45309" }}>{formatLKR(pr.value)}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={pr.status} />
                  </td>
                  <td style={{ padding: "12px 20px 12px 10px" }}>
                    <button style={{ border: "none", background: "none", cursor: "pointer", color: "#D1D5DB" }}>
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function HeroStatCard({ title, subtitle, value, badge, badgeUp, linkLabel, onClick }: {
  title: string; subtitle: string; value: string; badge: string;
  badgeUp: boolean; linkLabel: string; onClick: () => void;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #7A0C0C 0%, #5C0808 100%)",
        borderRadius: 14,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {/* Decorative circle */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Building2 size={18} strokeWidth={2} color="#F59E0B" />
        </div>
        <button style={{ border: "none", background: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
          <MoreHorizontal size={16} />
        </button>
      </div>
      <div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{subtitle}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF" }}>{value}</div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: badgeUp ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)", color: badgeUp ? "#4ADE80" : "#FCA5A5" }}>
            {badge} {badgeUp ? "↑" : "↓"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{title}</div>
      </div>
      <button
        onClick={onClick}
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.6)",
          fontSize: 12,
          padding: 0,
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingTop: 6,
          borderTop: "1px solid rgba(255,255,255,0.12)",
          width: "100%",
        }}
      >
        {linkLabel} <ArrowUpRight size={12} />
      </button>
    </div>
  );
}

function RegularStatCard({ icon, iconBg, title, subtitle, value, badge, badgeUp, linkLabel, onClick, highlight }: {
  icon: React.ReactNode; iconBg: string; title: string; subtitle: string;
  value: string; badge: string; badgeUp: boolean; linkLabel: string;
  onClick: () => void; highlight?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        padding: "20px",
        border: highlight ? "1.5px solid #FCA5A5" : "1px solid #F1F5F9",
        boxShadow: highlight ? "0 0 0 3px rgba(239,68,68,0.06)" : "0 1px 4px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <button style={{ border: "none", background: "none", cursor: "pointer", color: "#D1D5DB" }}>
          <MoreHorizontal size={16} />
        </button>
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{subtitle}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: highlight ? "#991B1B" : "#111827" }}>{value}</div>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: highlight ? "#FEE2E2" : badgeUp ? "#F0FDF4" : "#FEF3C7", color: highlight ? "#991B1B" : badgeUp ? "#15803D" : "#B45309" }}>
            {badge}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{title}</div>
      </div>
      <button
        onClick={onClick}
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
          color: highlight ? "#991B1B" : "#7A0C0C",
          fontSize: 12,
          fontWeight: 600,
          padding: 0,
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingTop: 6,
          borderTop: "1px solid #F3F4F6",
          width: "100%",
        }}
      >
        {linkLabel} <ArrowUpRight size={12} />
      </button>
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
};

const STEPS = [
  { label: "Basic Info",       icon: "📋" },
  { label: "Product Details",  icon: "📦" },
  { label: "Quantity & Value", icon: "💰" },
  { label: "Review & Sign",    icon: "✍️" },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {STEPS.map((step, i) => {
        const done    = i < current;
        const active  = i === current;
        const last    = i === total - 1;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: last ? "0 0 auto" : 1 }}>
            {/* Circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: done ? "#7A0C0C" : active ? "#7A0C0C" : "#F3F4F6",
                  border: active ? "2.5px solid #7A0C0C" : done ? "2.5px solid #7A0C0C" : "2px solid #D1D5DB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: done ? 14 : 13,
                  color: done || active ? "#FFFFFF" : "#B0B7C3",
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: "all 0.25s ease",
                  boxShadow: "none",
                }}
              >
                {done ? <Check size={15} strokeWidth={3} /> : i + 1}
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                color: active ? "#7A0C0C" : done ? "#6B7280" : "#B0B7C3",
                whiteSpace: "nowrap",
              }}>
                {step.label}
              </span>
            </div>
            {/* Connector bar */}
            {!last && (
              <div style={{
                flex: 1,
                height: 3,
                marginBottom: 22,
                marginLeft: 4,
                marginRight: 4,
                borderRadius: 4,
                background: done ? "#7A0C0C" : "#E5E7EB",
                transition: "background 0.3s ease",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ReqForm {
  title: string;
  faculty: string;
  department: string;
  requisitionType: "Consumables" | "Capital Goods";
  stockBalance: string;
  fundingSource: string;
  description: string;
  reason: string;
  quantity: string;
  unit: string;
  approxValue: string;
  procurementMethodId: string;
  procurementCategoryId: string;
  openingDate: string;
  closingDate: string;
  documentFee: string;
  requiresBidBond: string;
  bidBondPercentage: string;
  preparedBy: string;
  signature: string;
}

const PROCUREMENT_METHODS = [
  { id: "1", label: "National Shopping Method" },
  { id: "2", label: "National Competitive Bidding" },
  { id: "3", label: "Limited Competitive Bidding" },
  { id: "4", label: "Direct Buying" },
];

const PROCUREMENT_CATEGORIES = [
  { id: "1", label: "Goods" },
  { id: "2", label: "Services" },
  { id: "3", label: "Works" },
  { id: "4", label: "Information Technology" },
  { id: "5", label: "Maintenance" },
];

function toDateTimeLocal(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toBackendDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

function formatOrgValue(value?: string) {
  if (!value) return "";
  return value
    .replace(/^FACULTY_OF_/, "Faculty of ")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/^Faculty Of /, "Faculty of ");
}

function NewRequisitionPanel({ onSubmit, onViewProcurement, user }: { onSubmit: () => void; onViewProcurement: (id: string) => void; user?: { name?: string; title?: string; department?: string; faculty?: string } }) {
  const { createRequisition } = useProcurements();
  const hodName = user?.name ?? "Dr. Nimal Perera";
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const [step, setStep]       = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors]   = useState<Partial<Record<keyof ReqForm, string>>>({});
  const defaultOpeningDate = toDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const defaultClosingDate = toDateTimeLocal(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
  const [form, setForm]       = useState<ReqForm>({
    title:            "",
    faculty:          user?.faculty ?? "",
    department:       user?.department ?? "",
    requisitionType:  "Consumables",
    stockBalance:     "",
    fundingSource:    "Operating Budget",
    description:      "",
    reason:           "",
    quantity:         "",
    unit:             "units",
    approxValue:      "",
    procurementMethodId: "1",
    procurementCategoryId: "1",
    openingDate:      defaultOpeningDate,
    closingDate:      defaultClosingDate,
    documentFee:      "8000",
    requiresBidBond:  "true",
    bidBondPercentage: "5",
    preparedBy:       hodName,
    signature:        "",
  });

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      faculty: user?.faculty ?? "",
      department: user?.department ?? "",
      preparedBy: user?.name ?? prev.preparedBy,
    }));
  }, [user?.faculty, user?.department, user?.name]);

  const set = (key: keyof ReqForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  // Per-step validation
  const validate = (s: number): boolean => {
    const e: Partial<Record<keyof ReqForm, string>> = {};
    if (s === 0) {
      if (!form.title.trim())    e.title    = "Requisition title is required.";
      if (!form.faculty.trim())  e.faculty  = "Your faculty is missing from your user profile.";
      if (!form.department.trim()) e.department = "Your department is missing from your user profile.";
      if (form.stockBalance.trim() && (isNaN(Number(form.stockBalance)) || Number(form.stockBalance) < 0))
        e.stockBalance = "Enter a valid stock balance.";
      // if (!form.fundingSource.trim()) e.fundingSource = "Funding source is required.";
    }
    if (s === 1) {
      if (!form.description.trim()) e.description = "Product description is required.";
      if (!form.reason.trim())      e.reason      = "Reason for requisition is required.";
    }
    if (s === 2) {
      if (!form.quantity.trim() || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
        e.quantity = "Enter a valid quantity.";
      if (!form.approxValue.trim() || isNaN(Number(form.approxValue)) || Number(form.approxValue) <= 0)
        e.approxValue = "Enter a valid approximate value.";
      // if (!form.documentFee.trim() || isNaN(Number(form.documentFee)) || Number(form.documentFee) < 0)
      //   e.documentFee = "Enter a valid document fee.";
      if (!form.openingDate) e.openingDate = "Opening date is required.";
      if (!form.closingDate) e.closingDate = "Closing date is required.";
      if (form.openingDate && form.closingDate && new Date(form.closingDate) <= new Date(form.openingDate))
        e.closingDate = "Closing date must be after opening date.";
      // if (form.requiresBidBond === "true" && (!form.bidBondPercentage.trim() || isNaN(Number(form.bidBondPercentage)) || Number(form.bidBondPercentage) <= 0))
      //   e.bidBondPercentage = "Enter a valid bid bond percentage.";
    }
    if (s === 3) {
      const isSignatureEmpty = signaturePadRef.current
        ? signaturePadRef.current.isEmpty()
        : !form.signature.trim();
      if (isSignatureEmpty) {
        e.signature = "Please provide your signature before submitting the procurement request.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep(s => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => { setErrors({}); setStep(s => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    let signatureDataUrl = form.signature;
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      signatureDataUrl = signaturePadRef.current.toDataURL("image/png");
    }

    if (!validate(3)) return;

    const submittedProcurementData = {
      ...form,
      signature: signatureDataUrl,
    };
    setForm(submittedProcurementData);
    console.log("Procurement Request Submitted Data:", submittedProcurementData);

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const created = await createRequisition({
        title: form.title,
        faculty: form.faculty,
        department: form.department,
        description: form.description,
        estimatedValue: Number(form.approxValue),
        procurementMethodId: Number(form.procurementMethodId),
        procurementCategoryId: Number(form.procurementCategoryId),
        openingDate: toBackendDateTime(form.openingDate),
        closingDate: toBackendDateTime(form.closingDate),
        // documentFee: Number(form.documentFee),
        // requiresBidBond: form.requiresBidBond === "true",
        // bidBondPercentage: form.requiresBidBond === "true" ? Number(form.bidBondPercentage) : undefined,
        // requisitionType: form.requisitionType,
        currentStockBalance: form.stockBalance ? Number(form.stockBalance) : undefined,
        // fundingSource: form.fundingSource,
      });
      setCreatedId(created.id);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to submit requisition");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    // In a real system we'd get the new PR ID from the server response.
    // For the demo we use the most recently created mock record as a stand-in.
    const newPrId = createdId || "PR-2026-001";
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "75vh",
        textAlign: "center",
        padding: "40px",
        boxSizing: "border-box",
      }}>
        <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 36px", letterSpacing: "-0.02em" }}>
            Requisition Submitted!
          </h2>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => onViewProcurement(newPrId)}
              style={{
                padding: "11px 24px",
                background: "#7A0C0C",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#9B1515")}
              onMouseLeave={e => (e.currentTarget.style.background = "#7A0C0C")}
            >
              Track Request Status
            </button>

            <button
              onClick={onSubmit}
              style={{
                padding: "11px 24px",
                background: "#F3F4F6",
                color: "#374151",
                border: "1.5px solid #9CA3AF",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#E5E7EB")}
              onMouseLeave={e => (e.currentTarget.style.background = "#F3F4F6")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 28px 48px" }}>
      <PageTitleBar title="New Requisition" subtitle="Complete all steps to create a purchase requisition" />

      <div style={{
        maxWidth: 760,
        background: "#FFFFFF",
        border: "1px solid #F1F5F9",
        borderRadius: 18,
        padding: "32px 36px 28px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}>

        {/* ── Step indicator ── */}
        <StepIndicator current={step} total={STEPS.length} />

        {/* ── Step panels ── */}
        {step === 0 && (
          <StepCard title="Basic Information" subtitle="Enter the requisition title, faculty and department are auto-filled">
            <MField label="Requisition Title" error={errors.title} required>
              <input
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Laboratory Microscopes — Biology Dept"
                style={mInput(!!errors.title)}
              />
            </MField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <MField label="Faculty" error={errors.faculty}>
                <input
                  value={formatOrgValue(form.faculty)}
                  readOnly
                  style={{ ...mInput(!!errors.faculty), background: "#F9FAFB", color: "#6B7280", cursor: "default" }}
                />
              </MField>
              <MField label="Department" error={errors.department}>
                <input
                  value={formatOrgValue(form.department)}
                  readOnly
                  style={{ ...mInput(!!errors.department), background: "#F9FAFB", color: "#6B7280", cursor: "default" }}
                />
              </MField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* <MField label="Requisition Type">
                <select value={form.requisitionType} onChange={set("requisitionType")} style={mInput(false)}>
                  <option value="Consumables">Consumables</option>
                  <option value="Capital Goods">Capital Goods</option>
                </select>
              </MField> */}
              <MField label="Current Stock Balance" error={errors.stockBalance}>
                <input
                  type="number"
                  min={0}
                  value={form.stockBalance}
                  onChange={set("stockBalance")}
                  placeholder="e.g. 12"
                  style={mInput(!!errors.stockBalance)}
                />
              </MField>
            </div>
            {/* <MField label="Funding Source" error={errors.fundingSource} required>
              <input
                value={form.fundingSource}
                onChange={set("fundingSource")}
                placeholder="e.g. Faculty Recurrent Budget"
                style={mInput(!!errors.fundingSource)}
              />
            </MField> */}
          </StepCard>
        )}

        {step === 1 && (
          <StepCard title="Product Details" subtitle="Describe the product/service and state the reason for requisition">
            <MField label="Description of Product / Service" error={errors.description} required>
              <textarea
                rows={4}
                value={form.description}
                onChange={set("description")}
                placeholder="Describe the items or services required in detail…"
                style={{ ...mInput(!!errors.description), resize: "vertical" as const }}
              />
            </MField>
            <MField label="Reason for Requisition" error={errors.reason} required>
              <textarea
                rows={3}
                value={form.reason}
                onChange={set("reason")}
                placeholder="Why is this procurement necessary? (e.g. existing equipment failure, new project requirement…)"
                style={{ ...mInput(!!errors.reason), resize: "vertical" as const }}
              />
            </MField>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard title="Quantity & Value" subtitle="Specify the quantity required and approximate cost">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <MField label="Quantity Required" error={errors.quantity} required>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={set("quantity")}
                  placeholder="e.g. 10"
                  style={mInput(!!errors.quantity)}
                />
              </MField>
              <MField label="Unit of Measure">
                <select value={form.unit} onChange={set("unit")} style={mInput(false)}>
                  {["units","boxes","sets","litres","kg","metres","packets","pairs"].map(u => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </MField>
            </div>
            <MField label="Approximate Value (LKR)" error={errors.approxValue} required>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 600, color: "#6B7280" }}>LKR</span>
                <input
                  type="number"
                  min={0}
                  value={form.approxValue}
                  onChange={set("approxValue")}
                  placeholder="e.g. 320000"
                  style={{ ...mInput(!!errors.approxValue), paddingLeft: 48 }}
                />
              </div>
            </MField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <MField label="Procurement Method" error={errors.procurementMethodId} required>
                <select value={form.procurementMethodId} onChange={set("procurementMethodId")} style={mInput(!!errors.procurementMethodId)}>
                  {PROCUREMENT_METHODS.map(method => (
                    <option key={method.id} value={method.id}>{method.label}</option>
                  ))}
                </select>
              </MField>
              <MField label="Procurement Category" error={errors.procurementCategoryId} required>
                <select value={form.procurementCategoryId} onChange={set("procurementCategoryId")} style={mInput(!!errors.procurementCategoryId)}>
                  {PROCUREMENT_CATEGORIES.map(category => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </MField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <MField label="Opening Date" error={errors.openingDate} required>
                <input
                  type="datetime-local"
                  value={form.openingDate}
                  onChange={set("openingDate")}
                  style={mInput(!!errors.openingDate)}
                />
              </MField>
              <MField label="Closing Date" error={errors.closingDate} required>
                <input
                  type="datetime-local"
                  value={form.closingDate}
                  onChange={set("closingDate")}
                  style={mInput(!!errors.closingDate)}
                />
              </MField>
            </div>
            {/* <div style={{ display: "grid", gridTemplateColumns: form.requiresBidBond === "true" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 16 }}>
              <MField label="Document Fee (LKR)" error={errors.documentFee} required>
                <input
                  type="number"
                  min={0}
                  value={form.documentFee}
                  onChange={set("documentFee")}
                  placeholder="e.g. 8000"
                  style={mInput(!!errors.documentFee)}
                />
              </MField>
              <MField label="Bid Bond Required">
                <select value={form.requiresBidBond} onChange={set("requiresBidBond")} style={mInput(false)}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </MField>
              {form.requiresBidBond === "true" && (
                <MField label="Bid Bond Percentage" error={errors.bidBondPercentage} required>
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={form.bidBondPercentage}
                    onChange={set("bidBondPercentage")}
                    placeholder="e.g. 5"
                    style={mInput(!!errors.bidBondPercentage)}
                  />
                </MField>
              )}
            </div> */}
            {form.approxValue && !isNaN(Number(form.approxValue)) && Number(form.approxValue) > 0 && (
              <div style={{
                padding: "12px 16px",
                background: "linear-gradient(135deg,#FFF7ED,#FEF3C7)",
                border: "1px solid #FDE68A",
                borderRadius: 10,
                fontSize: 12,
                color: "#92400E",
                fontWeight: 600,
              }}>
                💡 Estimated value:{" "}
                <span style={{ fontWeight: 800 }}>
                  LKR {Number(form.approxValue).toLocaleString("en-LK")}
                </span>
                {Number(form.approxValue) >= 500000
                  ? " — This will require TEC evaluation."
                  : " — HOD can directly approve this requisition."}
              </div>
            )}
          </StepCard>
        )}

        {step === 3 && (
          <StepCard title="Review & Sign" subtitle="Review your requisition details and sign before submitting">
            {/* Review summary */}
            <div style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 20,
            }}>
              <ReviewRow label="Requisition Title"      value={form.title} />
              <ReviewRow label="Faculty"                value={formatOrgValue(form.faculty)} />
              {/* <ReviewRow label="Requisition Type"       value={form.requisitionType} /> */}
              <ReviewRow label="Current Stock Balance"  value={form.stockBalance || "Not recorded"} />
              {/* <ReviewRow label="Funding Source"         value={form.fundingSource} /> */}
              <ReviewRow label="Department"             value={formatOrgValue(form.department) || "—"} />
              <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 12 }} />
              <ReviewRow label="Description"            value={form.description} multiline />
              <ReviewRow label="Reason for Requisition" value={form.reason} multiline />
              <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 12 }} />
              <ReviewRow label="Quantity Required"      value={`${form.quantity} ${form.unit}`} />
              <ReviewRow label="Approximate Value"      value={`LKR ${Number(form.approxValue || 0).toLocaleString("en-LK")}`} highlight />
              <ReviewRow label="Procurement Method"     value={PROCUREMENT_METHODS.find(method => method.id === form.procurementMethodId)?.label ?? form.procurementMethodId} />
              <ReviewRow label="Procurement Category"   value={PROCUREMENT_CATEGORIES.find(category => category.id === form.procurementCategoryId)?.label ?? form.procurementCategoryId} />
              <ReviewRow label="Opening Date"           value={new Date(form.openingDate).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })} />
              <ReviewRow label="Closing Date"           value={new Date(form.closingDate).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })} />
              {/* <ReviewRow label="Document Fee"           value={`LKR ${Number(form.documentFee || 0).toLocaleString("en-LK")}`} /> */}
              {/* <ReviewRow label="Bid Bond"               value={form.requiresBidBond === "true" ? `${form.bidBondPercentage}% required` : "Not required"} /> */}
            </div>

            {/* Prepared By (pre-filled, read-only) */}
            <MField label="Requisition Prepared By (Head of Department)">
              <input
                value={form.preparedBy}
                readOnly
                style={{ ...mInput(false), background: "#F9FAFB", color: "#374151", fontWeight: 600, cursor: "not-allowed" }}
              />
            </MField>

            {/* Digital Signature Pad */}
            <div style={{ marginBottom: 20 }}>
              <SignaturePad
                ref={signaturePadRef}
                label="Authorized Signature"
                error={errors.signature}
                required
                value={form.signature}
                onChange={(sigUrl) => {
                  setForm(p => ({ ...p, signature: sigUrl || "" }));
                  if (sigUrl && errors.signature) {
                    setErrors(p => ({ ...p, signature: undefined }));
                  }
                }}
                onClear={() => {
                  setForm(p => ({ ...p, signature: "" }));
                }}
              />
            </div>

            {/* Declaration */}
            <div style={{
              padding: "12px 16px",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: 10,
              fontSize: 11,
              color: "#166534",
              lineHeight: 1.6,
            }}>
              <strong>Declaration:</strong> I hereby certify that the above requisition is genuine and within the approved budget allocation for my department. This requisition will be forwarded to the Bursar for fund verification.
            </div>
          </StepCard>
        )}

        {/* ── Navigation buttons ── */}
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 24 }}>
          <button
            type="button"
            onClick={step === 0 ? onSubmit : back}
            style={{
              padding: "10px 22px",
              background: "#F3F4F6",
              color: "#374151",
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {step === 0 ? "Cancel" : <><ChevronLeft size={15} strokeWidth={2.5} /> Back</>}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              style={{
                padding: "10px 28px",
                background: "#7A0C0C",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Next <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                padding: "10px 28px",
                background: isSubmitting ? "#D1D5DB" : "#7A0C0C",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Requisition"}
            </button>
          )}
        </div>
        {submitError && (
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "#DC2626", fontWeight: 600 }}>{submitError}</p>
        )}
      </div>
    </div>
  );
}

function StepCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ marginBottom: 4 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>{title}</h3>
        <p style={{ fontSize: 12, color: "#6B7280", margin: 0 }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function MField({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && <p style={{ margin: "5px 0 0", fontSize: 11, color: "#DC2626", fontWeight: 500 }}>⚠ {error}</p>}
    </div>
  );
}

function ReviewRow({ label, value, multiline, highlight }: { label: string; value: string; multiline?: boolean; highlight?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8, alignItems: multiline ? "flex-start" : "center" }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{
        fontSize: 13,
        fontWeight: highlight ? 800 : 500,
        color: highlight ? "#B45309" : "#111827",
        wordBreak: "break-word",
        whiteSpace: multiline ? "pre-wrap" : "normal",
      }}>{value}</span>
    </div>
  );
}

const mInput = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "10px 13px",
  border: `1.5px solid ${hasError ? "#EF4444" : "#E5E7EB"}`,
  borderRadius: 9,
  fontSize: 13,
  color: "#111827",
  background: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
});

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

function getRejectionReason(procurement: Procurement) {
  if (procurement.rejectionReason?.trim()) return procurement.rejectionReason.trim();
  const latestRejectionLog = [...(procurement.activityLog ?? [])]
    .reverse()
    .find(log => /reject/i.test(log.action) || /reject/i.test(log.notes ?? ""));
  const source = latestRejectionLog?.notes || latestRejectionLog?.action || procurement.notes || "";
  const match = source.match(/Reason:\s*(.+)$/i);
  return (match?.[1] || source || "No rejection reason was recorded.").trim();
}

function RejectedPanel({ onViewProcurementDetails, user }: { onViewProcurementDetails: (id: string) => void; user: UserContext }) {
  const { getProcurementsForUser, isLoading } = useProcurements();
  const rejected = getProcurementsForUser(user).filter(procurement => procurement.status === "Rejected");

  if (isLoading) {
    return (
      <div style={{ padding: "28px 28px" }}>
        <PageTitleBar title="Rejected Requests" subtitle="Loading rejected procurement records" />
        <SkeletonTable rows={4} />
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 28px" }}>
      <PageTitleBar title="Rejected Requests" subtitle={`${rejected.length} rejected procurement request${rejected.length === 1 ? "" : "s"}`} />

      <div style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        background: "#FFFBEB",
        border: "1px solid #FDE68A",
        borderRadius: 10,
        marginBottom: 18,
        color: "#92400E",
      }}>
        <AlertCircle size={18} strokeWidth={2.4} style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 3 }}>Review rejection details before creating a new request</div>
          <div style={{ fontSize: 12, lineHeight: 1.5 }}>Use the reason from the Bursar or approving authority to revise budget details, funding source, or item justification before resubmission.</div>
        </div>
      </div>

      {rejected.length === 0 ? (
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 14,
          padding: "48px 24px",
          textAlign: "center",
          color: "#15803D",
        }}>
          <Check size={28} strokeWidth={2.5} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "12px 0 4px" }}>No rejected requests</h3>
          <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>Rejected procurements for your faculty or department will appear here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {rejected.map(procurement => (
            <div key={procurement.id} style={{
              background: "#FFFFFF",
              border: "1px solid #FECACA",
              borderRadius: 14,
              padding: 18,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#2563EB", fontFamily: "monospace", marginBottom: 3 }}>{procurement.id}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0 }}>{procurement.title}</h3>
                <p style={{ fontSize: 12, color: "#6B7280", margin: "4px 0 0" }}>{procurement.faculty}{procurement.department ? ` - ${procurement.department}` : ""}</p>
              </div>

              <div style={{ fontSize: 18, fontWeight: 800, color: "#B45309", marginBottom: 12 }}>{formatLKR(procurement.value)}</div>

              <div style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 14,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 800, color: "#B91C1C", marginBottom: 5 }}>
                  <XCircle size={14} /> Rejection Reason
                </div>
                <p style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.5, margin: 0 }}>{getRejectionReason(procurement)}</p>
              </div>

              <button
                onClick={() => onViewProcurementDetails(procurement.id)}
                style={{
                  padding: "9px 14px",
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QualityReportPanel({ onViewProcurementDetails, user }: { onViewProcurementDetails: (id: string) => void; user: UserContext }) {
  const { getProcurementsForUser, updateProcurement } = useProcurements();
  const list = getProcurementsForUser(user);
  const needsReport = list.filter(p => p.status === "Quality Report Required");
  const [submittedReports, setSubmittedReports] = useState<Set<string>>(new Set());

  const handleSubmitReport = async (pr: Procurement) => {
    await updateProcurement(pr.id, {
      status: "Payment Pending",
      notes: "Quality inspection completed. Goods meet requested specifications. Quality Report approved and forwarded to Finance.",
    }, { name: user.name, role: user.role });
    setSubmittedReports(p => new Set([...p, pr.id]));
  };

  const pendingReports = needsReport.filter(p => !submittedReports.has(p.id));

  return (
    <div style={{ padding: "28px 28px" }}>
      <PageTitleBar title="Quality Reports" subtitle="Submit inspection reports for delivered goods" />
      {pendingReports.length === 0 ? (
        <div style={{ background: "#FFFFFF", borderRadius: 14, padding: "48px", textAlign: "center", color: "#9CA3AF", border: "1px solid #F1F5F9" }}>No quality reports pending</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pendingReports.map(pr => (
            <div key={pr.id} style={{ background: "#FFFFFF", border: "1px solid #F1F5F9", borderRadius: 14, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", fontFamily: "monospace" }}>{pr.id}</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "4px 0" }}>{pr.title}</h3>
                <p style={{ fontSize: 12, color: "#6B7280", margin: "0 0 10px" }}>{pr.faculty} · {formatLKR(pr.value)}</p>
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
              <button onClick={() => handleSubmitReport(pr)} style={{ padding: "9px 20px", background: "#7A0C0C", color: "#FFFFFF", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Submit Report</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#111827", background: "#FFFFFF", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

function StockInquiryPanel() {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Mock central stock inventory
  const mockInventory = [
    { name: "Whiteboards (4x6ft)", quantity: 12, unit: "pcs", lastUpdated: "2026-02-20T08:00:00Z", location: "Central Store - Shelf B3" },
    { name: "Markers (Black, Box)", quantity: 45, unit: "boxes", lastUpdated: "2026-02-20T08:00:00Z", location: "Central Store - Drawer D2" },
    { name: "A4 Paper (80gsm)", quantity: 250, unit: "reams", lastUpdated: "2026-02-19T14:00:00Z", location: "Central Store - Shelf A1" },
    { name: "Printer Toner (HP LaserJet)", quantity: 8, unit: "cartridges", lastUpdated: "2026-02-19T10:00:00Z", location: "IT Storage - Cabinet 1" },
    { name: "Desk Lamps (LED)", quantity: 23, unit: "pcs", lastUpdated: "2026-02-18T16:00:00Z", location: "Facilities - Shelf F2" },
    { name: "Microscope Slides", quantity: 500, unit: "boxes", lastUpdated: "2026-02-17T09:00:00Z", location: "Biology Lab - Storage 2" },
    { name: "Petri Dishes (90mm)", quantity: 1200, unit: "pcs", lastUpdated: "2026-02-17T09:00:00Z", location: "Biology Lab - Cabinet A" },
    { name: "Distilled Water (1L)", quantity: 30, unit: "bottles", lastUpdated: "2026-02-16T11:00:00Z", location: "Chemistry Lab - Shelf C3" },
  ];

  return (
    <div style={{ padding: "28px 32px" }}>
      <PageTitleBar
        title="Stock Inquiry"
        subtitle="Query real-time stock levels from Supply Division Central Store"
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
        {/* Left: Inventory Search */}
        <div>
          <InventoryCard items={mockInventory} onSelect={setSelectedItem} />
        </div>

        {/* Right: Selected Item Details */}
        <div>
          {selectedItem ? (
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                Item Details
              </h3>

              <div style={{
                padding: 12,
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Item Name</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                  {selectedItem.name}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{
                  padding: 12,
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Current Stock</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1D4ED8" }}>
                    {selectedItem.quantity}
                  </div>
                </div>
                <div style={{
                  padding: 12,
                  background: "#FFF7ED",
                  border: "1px solid #FED7AA",
                  borderRadius: 8,
                }}>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Unit</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#C2410C" }}>
                    {selectedItem.unit}
                  </div>
                </div>
              </div>

              <div style={{
                padding: 12,
                background: "#F5F3FF",
                border: "1px solid #DDD6FE",
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Location</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6D28D9" }}>
                  {selectedItem.location}
                </div>
              </div>

              <div style={{
                padding: 12,
                background: "#FAFAFA",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
              }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Last Updated</div>
                <div style={{ fontSize: 12, color: "#111827" }}>
                  {new Date(selectedItem.lastUpdated).toLocaleString()}
                </div>
              </div>

              {selectedItem.quantity < 10 && (
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
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#DC2626" }}>
                      Low Stock Alert
                    </div>
                    <div style={{ fontSize: 11, color: "#DC2626", marginTop: 2 }}>
                      Current quantity is below safe reorder level. Consider placing a procurement request.
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                display: "flex",
                gap: 10,
                paddingTop: 12,
                borderTop: "1px solid #E5E7EB",
              }}>
                <button style={{
                  flex: 1,
                  padding: "9px 16px",
                  background: "#7A0C0C",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}>
                  Place Request
                </button>
                <button style={{
                  flex: 1,
                  padding: "9px 16px",
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}>
                  Export Details
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              color: "#9CA3AF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 300,
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
              <p style={{ fontSize: 12, margin: 0 }}>Select an item to view detailed stock information</p>
            </div>
          )}
        </div>
      </div>

      {/* Info section */}
      <div style={{
        marginTop: 20,
        padding: 14,
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
        borderRadius: 8,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#1D4ED8", marginBottom: 4 }}>
          ℹ️ How to use Stock Inquiry
        </div>
        <div style={{ fontSize: 11, color: "#1D4ED8" }}>
          Search for items in the left panel to check current stock levels. Use this information to verify item availability before submitting a purchase requisition. Contact Supply Division directly if you need items not listed here.
        </div>
      </div>
    </div>
  );
}
