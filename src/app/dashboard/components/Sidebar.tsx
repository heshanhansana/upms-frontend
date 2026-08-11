import {
  LayoutDashboard, FilePlus2, ClipboardList, FileCheck2,
  BadgeCheck, Sliders, Building2, Scale, ClipboardCheck,
  ShieldCheck, PackageCheck, FileText, Send, CreditCard,
  Landmark, LogOut, Search, X, XCircle,
  UserCheck, Users,
} from "lucide-react";
import { useState } from "react";
import usjLogo from "../../../usj-logo.png";
import type { Role, UserContext } from "../types";
import { useProcurements } from "../ProcurementContext";


type IconComponent = typeof LayoutDashboard;

interface NavItem {
  key: string;
  label: string;
  icon: IconComponent;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ROLE_NAV: Record<Role, NavSection[]> = {
  ADM: [
    {
      title: "ADMIN",
      items: [
        { key: "dashboard", label: "Pending Approvals", icon: UserCheck },
        { key: "all-users", label: "All Users", icon: Users },
      ],
    },
  ],
  HOD: [
    {
      title: "MAIN MENU",
      items: [
        { key: "dashboard",       label: "Dashboard",         icon: LayoutDashboard },
        { key: "new-requisition", label: "New Requisition",   icon: FilePlus2 },
        { key: "procurements",    label: "All Procurements",  icon: ClipboardList },
      ],
    },
    {
      title: "ACTIONS",
      items: [
        { key: "quality-report", label: "Quality Reports", icon: FileCheck2 },
        { key: "rejected",       label: "Rejected",        icon: XCircle },
      ],
    },
  ],
  BUR: [
    {
      title: "MAIN MENU",
      items: [
        { key: "dashboard",         label: "Dashboard",           icon: LayoutDashboard },
        { key: "fund-verification", label: "Fund Verification",   icon: BadgeCheck },
        { key: "procurements",      label: "All Procurements",    icon: ClipboardList },
      ],
    },
  ],
  FBUR: [
    {
      title: "MAIN MENU",
      items: [
        { key: "dashboard",         label: "Dashboard",           icon: LayoutDashboard },
        { key: "fund-verification", label: "Fund Verification",   icon: BadgeCheck },
        { key: "procurements",      label: "All Procurements",    icon: ClipboardList },
      ],
    },
  ],
  SDC: [
    {
      title: "MAIN MENU",
      items: [
        { key: "dashboard",    label: "Dashboard",          icon: LayoutDashboard },
        { key: "method",       label: "Method Selection",   icon: Sliders },
        { key: "suppliers",    label: "Suppliers",          icon: Building2 },
        { key: "bidding",      label: "Bidding",            icon: Scale },
        { key: "procurements", label: "All Procurements",   icon: ClipboardList },
      ],
    },
  ],
  TEC: [
    {
      title: "MAIN MENU",
      items: [
        { key: "dashboard",    label: "Dashboard",         icon: LayoutDashboard },
        { key: "evaluations",  label: "Evaluations",       icon: ClipboardCheck },
        { key: "procurements", label: "All Procurements",  icon: ClipboardList },
      ],
    },
  ],
  TB: [
    {
      title: "MAIN MENU",
      items: [
        { key: "dashboard",    label: "Dashboard",         icon: LayoutDashboard },
        { key: "approvals",    label: "Approvals",         icon: ShieldCheck },
        { key: "procurements", label: "All Procurements",  icon: ClipboardList },
      ],
    },
  ],
  STK: [
    {
      title: "MAIN MENU",
      items: [
        { key: "dashboard",    label: "Dashboard",         icon: LayoutDashboard },
        { key: "grn",          label: "GRN",               icon: PackageCheck },
        { key: "procurements", label: "All Procurements",  icon: ClipboardList },
      ],
    },
  ],
  SUP: [
    {
      title: "MAIN MENU",
      items: [
        { key: "dashboard",  label: "Dashboard",   icon: LayoutDashboard },
        { key: "my-bids",    label: "My Bids",     icon: FileText },
        { key: "submit-bid", label: "Submit Bid",  icon: Send },
      ],
    },
  ],
  FIN: [
    {
      title: "MAIN MENU",
      items: [
        { key: "dashboard",    label: "Dashboard",         icon: LayoutDashboard },
        { key: "budget-allocation", label: "Manage Faculty Budgets", icon: Landmark },
        { key: "payments",     label: "Payments",          icon: CreditCard },
        { key: "procurements", label: "All Procurements",  icon: ClipboardList },
      ],
    },
  ],
};

const GENERAL_ITEMS: NavItem[] = [
  { key: "_logout",   label: "Log out",   icon: LogOut },
];


interface SidebarProps {
  user: UserContext;
  activeKey: string;
  onNavigate: (key: string) => void;
  onSignOut: () => void;
}

export function Sidebar({ user, activeKey, onNavigate, onSignOut }: SidebarProps) {
  const sections = ROLE_NAV[user.role] ?? [];
  const [search, setSearch] = useState("");
  const { getProcurementsForUser } = useProcurements();
  const visibleProcurements = getProcurementsForUser(user);
  const actionStatuses: Record<string, string> = {
    "quality-report": "Quality Report Required",
    "rejected": "Rejected",
    "fund-verification": "Pending Fund Verification",
    "evaluations": "Technical Evaluation",
    "approvals": "Authority Approval",
    "grn": "Awaiting Delivery",
    "payments": "Payment Pending",
  };
  const actionCounts = Object.fromEntries(
    Object.entries(actionStatuses).map(([key, status]) => [
      key,
      visibleProcurements.filter(procurement => {
        if (procurement.status !== status) return false;
        if (key === "fund-verification" && user.role === "BUR") return procurement.value >= 500_000;
        if (key === "fund-verification" && user.role === "FBUR") return procurement.value <= 500_000;
        return true;
      }).length,
    ]),
  ) as Record<string, number>;

  return (
    <aside
      style={{
        width: 248,
        minWidth: 248,
        maxWidth: 248,
        height: "100vh",
        background: "#FFFFFF",
        borderRight: "1px solid #F1F1F1",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      {/* ── Logo ── */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid #F5F5F5",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* USJ logo image */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            overflow: "hidden",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFFFFF",
            border: "1px solid #F1F5F9",
          }}
        >
          <img
            src={usjLogo}
            alt="University of Sri Jayewardenepura"
            style={{ width: 32, height: 32, objectFit: "contain" }}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", letterSpacing: "-0.01em", lineHeight: 1 }}>
            UPMS
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2, letterSpacing: "0.01em" }}>
            Procurement System
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: "12px 16px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#F9FAFB",
            border: "1px solid #F1F5F9",
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          <Search size={13} strokeWidth={2} color="#9CA3AF" style={{ flexShrink: 0 }} />
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
              flex: 1,
              minWidth: 0,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", padding: 0, lineHeight: 1, display: "flex", alignItems: "center" }}
            ><X size={12} strokeWidth={2} /></button>
          )}
        </div>
      </div>

      {/* ── Nav sections ── */}
      <nav style={{ flex: 1, padding: "12px 12px 0", display: "flex", flexDirection: "column", gap: 20 }}>
        {sections.map(section => {
          const filteredItems = search
            ? section.items.filter(item =>
                item.label.toLowerCase().includes(search.toLowerCase())
              )
            : section.items;
          if (filteredItems.length === 0) return null;
          return (
          <div key={section.title}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#9CA3AF",
                letterSpacing: "0.08em",
                padding: "0 8px",
                marginBottom: 4,
              }}
            >
              {section.title}
            </div>
            {filteredItems.map(item => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;
              const badgeCount = actionCounts[item.key] ?? item.badge ?? 0;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    borderRadius: 9,
                    border: "none",
                    background: isActive ? "#7A0C0C" : "transparent",
                    color: isActive ? "#FFFFFF" : "#6B7280",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    transition: "all 0.13s",
                    marginBottom: 1,
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "#F9F9F9";
                      (e.currentTarget as HTMLElement).style.color = "#111827";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#6B7280";
                    }
                  }}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badgeCount > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 20,
                        background: isActive ? "rgba(255,255,255,0.25)" : "#FEE2E2",
                        color: isActive ? "#FFFFFF" : "#991B1B",
                        minWidth: 18,
                        textAlign: "center",
                      }}
                    >
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          );
        })}

        {/* GENERAL section */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#9CA3AF",
              letterSpacing: "0.08em",
              padding: "0 8px",
              marginBottom: 4,
            }}
          >
            GENERAL
          </div>
          {GENERAL_ITEMS.map(item => {
            const Icon = item.icon;
            const isLogout = item.key === "_logout";
            return (
              <button
                key={item.key}
                onClick={() => isLogout ? onSignOut() : undefined}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 9,
                  border: "none",
                  background: "transparent",
                  color: "#6B7280",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 500,
                  transition: "all 0.13s",
                  marginBottom: 1,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = isLogout ? "#FEF2F2" : "#F9F9F9";
                  (e.currentTarget as HTMLElement).style.color = isLogout ? "#B91C1C" : "#111827";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#6B7280";
                }}
              >
                <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Bottom USJ card ── */}
      <div style={{ padding: "16px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #7A0C0C, #5C0808)",
            borderRadius: 12,
            padding: "14px 16px",
          }}
        >
          {/* User avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#F59E0B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                color: "#7A0C0C",
                flexShrink: 0,
              }}
            >
              {user.avatarInitials}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>
                {user.name.split(" ").slice(-1)[0]}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.2 }}>
                {user.title}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", margin: "0 0 10px", lineHeight: 1.5 }}>
            Compliant with Sri Lanka<br />Procurement Manual 2024
          </p>
          <button
            style={{
              width: "100%",
              padding: "7px",
              background: "#F59E0B",
              color: "#7A0C0C",
              border: "none",
              borderRadius: 7,
              fontSize: 11,
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "0.02em",
            }}
          >
            USJ · Prototype Demo
          </button>
        </div>
      </div>
    </aside>
  );
}
