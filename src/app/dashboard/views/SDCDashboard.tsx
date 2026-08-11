import { useState } from "react";
import type { UserContext } from "../types";
import { WelcomeBanner } from "../components/WelcomeBanner";
import { StatCardRow } from "../components/StatCard";
import { ActionQueueList } from "../components/ActionQueueList";
import { ProcurementTable } from "../components/ProcurementTable";
import { EmptyState } from "../components/EmptyState";
import { PageTitleBar } from "../components/ContentHeader";
import { useDashboardData } from "../hooks/useDashboardData";
import { SkeletonWelcomeBanner, SkeletonStatCardRow, SkeletonActionQueue, SkeletonMiniStatTiles, SkeletonTable } from "../components/SkeletonLoader";
import { useProcurements } from "../ProcurementContext";


interface SDCDashboardProps {
  user: UserContext;
  activeTab: string;
  onTabChange: (key: string) => void;
  onViewProcurement: (id: string) => void;
  onViewProcurementDetails: (id: string) => void;
}

export function SDCDashboard({ user, activeTab, onTabChange, onViewProcurement, onViewProcurementDetails }: SDCDashboardProps) {
  if (activeTab === "method")       return <MethodSelectionPanel onViewProcurementDetails={onViewProcurementDetails} user={user} />;
  if (activeTab === "suppliers")    return <SuppliersPanel />;
  if (activeTab === "bidding")      return <BiddingPanel onViewProcurement={onViewProcurement} user={user} />;
  if (activeTab === "procurements") return <AllProcurementsPanel onViewProcurement={onViewProcurement} user={user} />;
  return <SDCOverview user={user} onTabChange={onTabChange} />;
}

function SDCOverview({ user, onTabChange }: { user: UserContext; onTabChange: (k: string) => void }) {
  const { isLoading, data } = useDashboardData(user);

  if (isLoading) {
    return (
      <div style={{ padding: "28px 32px", animation: "fadeIn 0.3s ease" }}>
        <SkeletonWelcomeBanner />
        <SkeletonStatCardRow />
        <SkeletonActionQueue />
        <SkeletonMiniStatTiles count={3} />
      </div>
    );
  }

  const { queue, procurements: myProcurements } = data!;
  const biddingOpen = myProcurements.filter(p => p.status === "Bidding Open");

  return (
    <div style={{ padding: "28px 32px", animation: "fadeIn 0.4s ease" }}>
      <WelcomeBanner user={user} />
      <StatCardRow
        total={myProcurements.length}
        inQueue={queue.length}
        actionRequired={biddingOpen.length}
        completed={1}
      />
      <ActionQueueList
        items={[...queue, ...myProcurements.filter(p => p.status === "Funds Verified")]}
        onViewAll={() => onTabChange("bidding")}
      />
      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 4 }}>
        {[
          { label: "Bidding Open", count: biddingOpen.length, color: "#1D4ED8" },
          { label: "Funds Verified (to process)", count: myProcurements.filter(p => p.status === "Funds Verified").length, color: "#15803D" },
          { label: "PO Issued", count: myProcurements.filter(p => p.status === "Purchase Order Issued").length, color: "#6D28D9" },
        ].map(s => (
          <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: "16px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MethodSelectionPanel({ onViewProcurementDetails, user }: { onViewProcurementDetails: (id: string) => void; user: UserContext }) {
  const { getProcurementsForUser, updateProcurement } = useProcurements();
  const myProcurements = getProcurementsForUser(user);
  const eligible = myProcurements.filter(p => p.status === "Funds Verified");
  const [selectedMethods, setSelectedMethods] = useState<Record<string, string>>({});

  const handleSelectMethod = async (pr: { id: string }, method: "Shopping" | "NCB" | "ICB") => {
    await updateProcurement(pr.id, {
      method,
      status: "Bidding Open",
      notes: `Procurement method selected: ${method}. Tender opened for bid submissions.`,
    }, { name: user.name, role: user.role });
    setSelectedMethods(p => ({ ...p, [pr.id]: method }));
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 2 }}>Method Selection</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Select procurement method for fund-verified requisitions</p>
      </div>
      {eligible.length === 0 ? (
        <EmptyState icon="inbox" title="No requisitions awaiting method selection" description="Fund-verified requisitions will appear here." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {eligible.map(pr => (
            <div key={pr.id} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", fontFamily: "monospace" }}>{pr.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginLeft: 10 }}>{pr.title}</span>
                  </div>
                  <button
                    onClick={() => onViewProcurementDetails(pr.id)}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      background: "#F3F4F6",
                      color: "#374151",
                      border: "1px solid #E5E7EB",
                      borderRadius: 5,
                      cursor: "pointer",
                    }}
                  >
                    View Details
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Shopping", "NCB", "ICB"].map(m => (
                    <button
                      key={m}
                      onClick={() => handleSelectMethod(pr, m)}
                      style={{
                        padding: "6px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        border: "1px solid #D1D5DB",
                        borderRadius: 6,
                        background: "#F9FAFB",
                        color: "#374151",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#7A0C0C"; (e.currentTarget as HTMLElement).style.color = "#FFFFFF"; (e.currentTarget as HTMLElement).style.borderColor = "#7A0C0C"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; (e.currentTarget as HTMLElement).style.color = "#374151"; (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB"; }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SuppliersPanel() {
  const suppliers = [
    { name: "Techno Solutions (Pvt) Ltd", category: "IT Equipment", registered: "2023", status: "Approved" },
    { name: "Lanka Lab Supplies Co.", category: "Laboratory", registered: "2021", status: "Approved" },
    { name: "Office World (Pvt) Ltd", category: "Stationery & Furniture", registered: "2022", status: "Approved" },
    { name: "SciMed Distributors", category: "Medical & Scientific", registered: "2024", status: "Pending" },
  ];

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 2 }}>Suppliers</h1>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Registered supplier directory</p>
        </div>
        <button style={{ padding: "9px 18px", background: "#7A0C0C", color: "#FFFFFF", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Add Supplier
        </button>
      </div>
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
        {suppliers.map((s, i) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: i > 0 ? "1px solid #F3F4F6" : "none" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{s.category} · Registered {s.registered}</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              background: s.status === "Approved" ? "#F0FDF4" : "#FFFBEB",
              color: s.status === "Approved" ? "#15803D" : "#B45309",
              border: `1px solid ${s.status === "Approved" ? "#BBF7D0" : "#FDE68A"}`,
            }}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BiddingPanel({ onViewProcurement, user }: { onViewProcurement: (id: string) => void; user: UserContext }) {
  const { getProcurementsForUser } = useProcurements();
  const myProcurements = getProcurementsForUser(user);
  const biddingItems = myProcurements.filter(p => p.status === "Bidding Open" || p.status === "Funds Verified");

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0, marginBottom: 2 }}>Bidding</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Manage bid openings and supplier invitations</p>
      </div>
      <ProcurementTable procurements={biddingItems} title="Active Bids" subtitle="Coordinate bid openings" onViewProcurement={onViewProcurement} />
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
        <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>{list.length} records visible for your role</p>
      </div>
      <ProcurementTable procurements={list} title="" subtitle="" onViewProcurement={onViewProcurement} />
    </div>
  );
}
