import { Component, useEffect, useState, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router";
import type { Procurement, Role, UserContext } from "./types";
import { Sidebar } from "./components/Sidebar";
import { ContentHeader } from "./components/ContentHeader";
import { HODDashboard } from "./views/HODDashboard";
import { BursarDashboard } from "./views/BursarDashboard";
import { SDCDashboard } from "./views/SDCDashboard";
import { TECDashboard } from "./views/TECDashboard";
import { TBDashboard } from "./views/TBDashboard";
import { StorekeeperDashboard } from "./views/StorekeeperDashboard";
import { SupplierDashboard } from "./views/SupplierDashboard";
import { FinanceDashboard } from "./views/FinanceDashboard";
import { AdminDashboard } from "../admin/AdminDashboard";
import { ProcurementStatusTracker } from "./components/ProcurementStatusTracker";
import { ProcurementDetails } from "./components/ProcurementDetails";
import { useProcurements } from "./ProcurementContext";
import { useAuth } from "../auth/AuthContext";
import { getProcurement } from "../api/procurements";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("Dashboard view render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const DEMO_USERS: Record<Role, UserContext> = {
  ADM:  { role: "ADM",  name: "System Administrator",       title: "System Administrator",    faculty: undefined,                     department: undefined,           avatarInitials: "SA" },
  HOD:  { role: "HOD",  name: "Dr. Nimal Perera",          title: "Head of Department",      faculty: "Faculty of Applied Sciences", department: "Computer Science",  avatarInitials: "NP" },
  BUR:  { role: "BUR",  name: "Mr. Kamal Silva",            title: "Bursar (Main)",           faculty: undefined,                     department: undefined,           avatarInitials: "KS" },
  FBUR: { role: "FBUR", name: "Mrs. Indrani Perera",        title: "Faculty Bursar",          faculty: "Faculty of Applied Sciences", department: undefined,           avatarInitials: "IP" },
  SDC:  { role: "SDC",  name: "Ms. Dilhani Jayasena",       title: "Supplies Division Clerk", faculty: undefined,                     department: "Supplies Division", avatarInitials: "DJ" },
  TEC:  { role: "TEC",  name: "Dr. Ruwan Fernando",         title: "TEC Member",              faculty: "Faculty of Engineering",      department: undefined,           avatarInitials: "RF" },
  TB:   { role: "TB",   name: "Prof. Anura Wickramasinghe", title: "Tender Board Member",     faculty: undefined,                     department: undefined,           avatarInitials: "AW" },
  STK:  { role: "STK",  name: "Mr. Saman Rathnayake",       title: "Storekeeper",             faculty: undefined,                     department: "Central Stores",    avatarInitials: "SR" },
  SUP:  { role: "SUP",  name: "Lanka Lab Supplies Co.",     title: "Supplier / Bidder",       faculty: undefined,                     department: undefined,           avatarInitials: "LL" },
  FIN:  { role: "FIN",  name: "Ms. Priyanka Perera",        title: "Finance Division",        faculty: undefined,                     department: "Finance Dept",      avatarInitials: "PP" },
};

/** Map nav key → page title for the breadcrumb header */
const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "dashboard":           { title: "Overview",             subtitle: "Here is the summary of overall data" },
  "all-users":           { title: "All Users",             subtitle: "Manage credentials, roles, and account status" },
  "new-requisition":     { title: "New Requisition",      subtitle: "Create a new purchase requisition" },
  "procurements":        { title: "All Procurements",     subtitle: "Full list of procurement records" },
  "status-tracker":      { title: "Procurement Tracker",  subtitle: "Step-by-step status and activity log" },
  "procurement-details": { title: "Procurement Details",  subtitle: "Full specification and details of the requisition" },
  "quality-report":      { title: "Quality Reports",      subtitle: "Submit quality inspection reports" },
  "rejected":            { title: "Rejected Requests",    subtitle: "Review rejected procurements and reasons" },
  "fund-verification":   { title: "Fund Verification",    subtitle: "Verify budget availability" },
  "method":              { title: "Method Selection",     subtitle: "Select procurement method for verified requisitions" },
  "suppliers":           { title: "Suppliers",            subtitle: "Registered supplier directory" },
  "bidding":             { title: "Bidding",              subtitle: "Manage bid openings and supplier invitations" },
  "evaluations":         { title: "Evaluations",          subtitle: "Technical and financial bid evaluation" },
  "approvals":           { title: "Approvals",            subtitle: "Review BES reports and authorise POs" },
  "grn":                 { title: "GRN",                  subtitle: "Generate goods received notes" },
  "my-bids":             { title: "My Bids",              subtitle: "Track your submitted bids" },
  "submit-bid":          { title: "Submit Bid",           subtitle: "Submit a sealed bid for an open tender" },
  "payments":            { title: "Payments",             subtitle: "Process payments after quality report approval" },
  "budget-allocation":   { title: "Budget Allocation",    subtitle: "Allocate faculty-wise procurement spending limits" },
};

interface DashboardLayoutProps {
  role: Role;
  onLogout: () => void;
}

export function DashboardLayout({ role, onLogout }: DashboardLayoutProps) {
  const auth = useAuth();
  const { procurements } = useProcurements();
  const [loadedProcurement, setLoadedProcurement] = useState<Procurement | null>(null);
  const [selectedLoadError, setSelectedLoadError] = useState("");
  const user = auth.user?.role === role ? auth.user : DEMO_USERS[role];
  const { "*": splat } = useParams();
  const navigate = useNavigate();

  // Parse the sub-path from the splat: e.g. "tracker/PR-001" or "tab/procurements"
  const parts = (splat ?? "").split("/").filter(Boolean);
  const subSection = parts[0] ?? "dashboard";   // e.g. "tracker", "details", "tab"
  const subId      = parts[1] ?? null;           // e.g. procurement ID

  let activeKey: string;
  let selectedProcurementId: string | null = null;

  if (subSection === "tracker" && subId) {
    activeKey = "status-tracker";
    selectedProcurementId = subId;
  } else if (subSection === "details" && subId) {
    activeKey = "procurement-details";
    selectedProcurementId = subId;
  } else if (subSection === "tab" && subId) {
    activeKey = subId;
  } else if (!subSection || subSection === "dashboard") {
    activeKey = "dashboard";
  } else {
    activeKey = subSection;
  }

  const navigateTo = (key: string) => {
    navigate(`/dashboard/${role.toLowerCase()}/tab/${key}`, { replace: false });
  };

  const handleViewProcurement = (id: string) => {
    navigate(`/dashboard/${role.toLowerCase()}/tracker/${id}`);
  };

  const handleViewProcurementDetails = (id: string) => {
    navigate(`/dashboard/${role.toLowerCase()}/details/${id}`);
  };

  const handleNavigate = (key: string) => {
    if (key === "dashboard") {
      navigate(`/dashboard/${role.toLowerCase()}`);
    } else {
      navigate(`/dashboard/${role.toLowerCase()}/tab/${key}`);
    }
  };

  const handleBackFromTracker = () => {
    navigate(`/dashboard/${role.toLowerCase()}/tab/procurements`);
  };

  const handleBackFromDetails = () => {
    let returnTab = "dashboard";
    if (role === "HOD") returnTab = "quality-report";
    else if (role === "BUR" || role === "FBUR") returnTab = "fund-verification";
    else if (role === "SDC") returnTab = "method";
    else if (role === "TEC") returnTab = "evaluations";
    else if (role === "TB") returnTab = "approvals";
    else if (role === "STK") returnTab = "grn";
    else if (role === "FIN") returnTab = "payments";
    navigate(`/dashboard/${role.toLowerCase()}/tab/${returnTab}`);
  };

  const selectedFromList = selectedProcurementId
    ? procurements.find(p => p.id === selectedProcurementId) ?? null
    : null;
  const selectedProcurement = selectedFromList ?? loadedProcurement;

  useEffect(() => {
    let isCurrent = true;

    setSelectedLoadError("");
    setLoadedProcurement(null);

    if (!selectedProcurementId || selectedFromList) {
      return () => {
        isCurrent = false;
      };
    }

    getProcurement(selectedProcurementId)
      .then(procurement => {
        if (isCurrent) setLoadedProcurement(procurement);
      })
      .catch(err => {
        if (isCurrent) {
          setSelectedLoadError(err instanceof Error ? err.message : "Unable to load procurement status");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedProcurementId, selectedFromList]);

  const pageInfo = PAGE_TITLES[activeKey] ?? { title: activeKey, subtitle: "" };

  const renderFallbackCard = (
    <div style={{ padding: "32px", maxWidth: 720 }}>
      <button
        onClick={activeKey === "status-tracker" ? handleBackFromTracker : handleBackFromDetails}
        style={{
          background: "none",
          border: "none",
          color: "#6B7280",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          padding: 0,
          marginBottom: 18,
        }}
      >
        ← Back to previous screen
      </button>
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: "28px 32px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 8px" }}>
          {selectedLoadError || !selectedProcurement ? "Procurement not found" : "Unable to display tracker"}
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
          {selectedLoadError || `The procurement record ${selectedProcurementId ?? ""} could not be found or loaded.`}
        </p>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#F7F8FA",
        fontFamily: "'Inter', 'Google Sans', system-ui, sans-serif",
      }}
    >
      {/* ── Fixed Left Sidebar ────────────────────────────────────────────── */}
      <Sidebar
        user={user}
        activeKey={activeKey}
        onNavigate={handleNavigate}
        onSignOut={() => {
          auth.logout();
          onLogout();
        }}
      />

      {/* ── Right column: header + scrollable content ─────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Sticky top header */}
        <ContentHeader
          user={user}
          pageTitle={pageInfo.title}
          pageSubtitle={pageInfo.subtitle}
          onNavigate={handleNavigate}
        />

        {/* Scrollable content area */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#F7F8FA",
          }}
        >
          {/* ── Procurement Status Tracker (shared across all roles) ── */}
          {activeKey === "status-tracker" && (
            selectedProcurement ? (
              <SectionErrorBoundary fallback={renderFallbackCard}>
                <ProcurementStatusTracker
                  procurement={selectedProcurement}
                  onBack={handleBackFromTracker}
                />
              </SectionErrorBoundary>
            ) : renderFallbackCard
          )}

          {/* ── Procurement Details Sheet (shared across all roles) ── */}
          {activeKey === "procurement-details" && (
            selectedProcurement ? (
              <SectionErrorBoundary fallback={renderFallbackCard}>
                <ProcurementDetails
                  procurement={selectedProcurement}
                  onBack={handleBackFromDetails}
                />
              </SectionErrorBoundary>
            ) : renderFallbackCard
          )}

          {/* ── Role-specific views ── */}
          {activeKey !== "status-tracker" && activeKey !== "procurement-details" && role === "ADM" && (
            <AdminDashboard
              user={user}
              activeTab={activeKey === "all-users" ? "users" : "pending"}
            />
          )}
          {activeKey !== "status-tracker" && activeKey !== "procurement-details" && role === "HOD" && (
            <HODDashboard user={user} activeTab={activeKey} onTabChange={navigateTo} onViewProcurement={handleViewProcurement} onViewProcurementDetails={handleViewProcurementDetails} />
          )}
          {activeKey !== "status-tracker" && activeKey !== "procurement-details" && (role === "BUR" || role === "FBUR") && (
            <BursarDashboard user={user} activeTab={activeKey} onTabChange={navigateTo} onViewProcurement={handleViewProcurement} onViewProcurementDetails={handleViewProcurementDetails} />
          )}
          {activeKey !== "status-tracker" && activeKey !== "procurement-details" && role === "SDC" && (
            <SDCDashboard user={user} activeTab={activeKey} onTabChange={navigateTo} onViewProcurement={handleViewProcurement} onViewProcurementDetails={handleViewProcurementDetails} />
          )}
          {activeKey !== "status-tracker" && activeKey !== "procurement-details" && role === "TEC" && (
            <TECDashboard user={user} activeTab={activeKey} onTabChange={navigateTo} onViewProcurement={handleViewProcurement} onViewProcurementDetails={handleViewProcurementDetails} />
          )}
          {activeKey !== "status-tracker" && activeKey !== "procurement-details" && role === "TB" && (
            <TBDashboard user={user} activeTab={activeKey} onTabChange={navigateTo} onViewProcurement={handleViewProcurement} onViewProcurementDetails={handleViewProcurementDetails} />
          )}
          {activeKey !== "status-tracker" && activeKey !== "procurement-details" && role === "STK" && (
            <StorekeeperDashboard user={user} activeTab={activeKey} onTabChange={navigateTo} onViewProcurement={handleViewProcurement} onViewProcurementDetails={handleViewProcurementDetails} />
          )}
          {activeKey !== "status-tracker" && activeKey !== "procurement-details" && role === "SUP" && (
            <SupplierDashboard user={user} activeTab={activeKey} onTabChange={navigateTo} onViewProcurement={handleViewProcurement} />
          )}
          {activeKey !== "status-tracker" && activeKey !== "procurement-details" && role === "FIN" && (
            <FinanceDashboard user={user} activeTab={activeKey} onTabChange={navigateTo} onViewProcurement={handleViewProcurement} onViewProcurementDetails={handleViewProcurementDetails} />
          )}
        </main>

        {/* Footer */}
        <footer
          style={{
            padding: "10px 24px",
            fontSize: 11,
            color: "#CBD5E1",
            borderTop: "1px solid #F1F5F9",
            background: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          University of Sri Jayewardenepura · Procurement Manual 2024 (NPC) · Prototype Demo
        </footer>
      </div>
    </div>
  );
}
