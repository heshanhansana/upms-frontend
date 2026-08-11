import { ChevronLeft } from "lucide-react";
import type { Procurement } from "../types";
import { formatLKR } from "../data";
import { StatusBadge } from "./StatusBadge";


interface ProcurementDetailsProps {
  procurement: Procurement;
  onBack: () => void;
}

export function ProcurementDetails({
  procurement,
  onBack,
}: ProcurementDetailsProps) {
  const formatDateTime = (value?: string) => {
    if (!value) return "Not Set";
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  };

  const fields = [
    { label: "Requisition ID", value: procurement.id, isMono: true },
    { label: "Current Status", value: <StatusBadge status={procurement.status} size="sm" /> },
    { label: "Estimated Value", value: formatLKR(procurement.value), isGold: true },
    { label: "Procurement Method", value: procurement.method !== "—" ? procurement.method : "Not Assigned" },
    { label: "Faculty / Division", value: procurement.faculty },
    // { label: "Requisition Type", value: procurement.requisitionType ?? "Not Recorded" },
    { label: "Current Stock Balance", value: procurement.currentStockBalance?.toLocaleString("en-LK") ?? "Not Recorded" },
    // { label: "Funding Source", value: procurement.fundingSource ?? "Not Recorded" },
    { label: "Opening Date", value: formatDateTime(procurement.openingDate) },
    { label: "Closing Date", value: formatDateTime(procurement.closingDate) },
    // { label: "Document Fee", value: procurement.documentFee !== undefined ? formatLKR(procurement.documentFee) : "Not Set" },
    // { label: "Bid Bond Required", value: procurement.requiresBidBond ? `${procurement.bidBondPercentage ?? 0}%` : "No" },
    { label: "Rejection Reason", value: procurement.rejectionReason ?? procurement.notes ?? "Not Applicable" },
    { label: "Department / Unit", value: procurement.department ?? "—" },
    { label: "Budget Allocation Code", value: procurement.budgetCode ?? "Pending Allocation", isMono: true },
    { label: "Submitted By (HOD)", value: procurement.submittedBy ?? "—" },
    { label: "Selected Supplier", value: procurement.supplierName ?? "Not Selected Yet" },
    { label: "Purchase Order (PO)", value: procurement.poNumber ?? "Not Issued Yet", isMono: true },
    { label: "Goods Received Note (GRN)", value: procurement.grnNumber ?? "Not Received Yet", isMono: true },
    { label: "Invoice Number", value: procurement.invoiceNumber ?? "Not Received Yet", isMono: true },
    { label: "Invoice Amount", value: procurement.invoiceAmount !== undefined ? formatLKR(procurement.invoiceAmount) : "Not Received Yet", isGold: procurement.invoiceAmount !== undefined },
    { label: "Last System Update", value: formatDateTime(procurement.updatedAt) },
  ];

  return (
    <div style={{ padding: "28px 32px 48px", minHeight: "100%" }}>
      {/* Back link */}
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
          marginBottom: 20,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#7A0C0C")}
        onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
        Back to Previous Screen
      </button>

      {/* Main simple layout card */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 14,
        padding: "36px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        maxWidth: 720,
        margin: "0 auto",
      }}>
        {/* Title Section */}
        <div style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: 24, marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", fontFamily: "monospace", letterSpacing: "0.04em" }}>
            SPECIFICATION SHEET
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: "6px 0 10px", letterSpacing: "-0.02em" }}>
            {procurement.title}
          </h1>
          {procurement.description && (
            <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6, margin: 0 }}>
              {procurement.description}
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
          {fields.map((f, i) => (
            <div key={i} style={{ borderBottom: "1px solid #FAFAFA", paddingBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>
                {f.label}
              </div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: f.isGold ? "#B45309" : "#111827",
                fontFamily: f.isMono ? "monospace" : "inherit",
              }}>
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
