import { Routes, Route, Navigate, useNavigate, useParams } from "react-router";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { LoginScreen } from "./components/LoginScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { WaitingApproval } from "./components/WaitingApproval";
import { DashboardLayout } from "./dashboard/DashboardLayout";
import type { Role } from "./dashboard/types";
import { ROLE_META } from "./dashboard/types";
import { useEffect, useRef, useState } from "react";
import usjLogo from "../usj-logo.png";
import { useAuth } from "./auth/AuthContext";
import { exchangeMicrosoftCode, startMicrosoftLogin } from "./auth/microsoft";
import type { UserContext } from "./dashboard/types";

export default function App() {
  return (
    <Routes>
      <Route path="/"             element={<WelcomeRoute />} />
      <Route path="/login"        element={<LoginRoute />} />
      <Route path="/auth/microsoft/callback" element={<MicrosoftCallbackRoute />} />
      <Route path="/register"     element={<RegisterRoute />} />
      <Route path="/waiting"      element={<WaitingRoute />} />
      <Route path="/select-role"  element={<RolePickerRoute />} />
      <Route path="/dashboard/:role/*" element={<DashboardRoute />} />
      {/* Fallback — redirect anything unknown back to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


function WelcomeRoute() {
  const nav = useNavigate();
  const auth = useAuth();
  if (auth.user) return <Navigate to={dashboardPath(auth.user.role)} replace />;
  return (
    <WelcomeScreen
      onLogin={() => nav("/login")}
      onSignUp={() => nav("/register")}
    />
  );
}

function LoginRoute() {
  const nav = useNavigate();
  const auth = useAuth();
  if (auth.user) return <Navigate to={dashboardPath(auth.user.role)} replace />;
  return (
    <LoginScreen
      onBack={() => nav("/")}
      onLogin={async (username, password) => {
        const user = await auth.login(username, password);
        nav(`/dashboard/${user.role.toLowerCase()}`);
      }}
      onMicrosoftLogin={startMicrosoftLogin}
      onGoRegister={() => nav("/register")}
    />
  );
}

function MicrosoftCallbackRoute() {
  const nav = useNavigate();
  const auth = useAuth();
  const [error, setError] = useState("");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const params = new URLSearchParams(window.location.search);
    const microsoftError = params.get("error_description") ?? params.get("error");
    const code = params.get("code");
    const state = params.get("state");

    async function finishLogin() {
      try {
        if (microsoftError) {
          throw new Error(microsoftError);
        }

        if (!code) {
          throw new Error("Microsoft did not return a sign-in code.");
        }

        const microsoftAccessToken = await exchangeMicrosoftCode(code, state);
        const user = await auth.loginWithMicrosoftToken(microsoftAccessToken);
        nav(`/dashboard/${user.role.toLowerCase()}`, { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Microsoft sign-in failed.");
      }
    }

    void finishLogin();
  }, [auth, nav]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 font-sans">
      <div className="w-full max-w-[420px] rounded-2xl bg-white border border-gray-200 shadow-md p-8 text-center">
        <div className="mx-auto mb-5 w-12 h-12 rounded-xl flex items-center justify-center bg-white border border-gray-200 shadow-md p-1.5">
          <img src={usjLogo} alt="USJ Logo" className="w-9 h-9 object-contain" />
        </div>
        <h1 className="text-gray-900 text-[1.45rem] font-bold tracking-tight">
          Microsoft Sign In
        </h1>
        {error ? (
          <>
            <p className="mt-3 text-sm text-red-500">{error}</p>
            <button
              type="button"
              onClick={() => nav("/login", { replace: true })}
              className="mt-6 w-full py-3 rounded-full bg-gradient-to-br from-maroon to-maroon-dark text-white font-bold text-sm"
            >
              Return to Sign In
            </button>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-500">Finishing sign in...</p>
        )}
      </div>
    </div>
  );
}

function RegisterRoute() {
  const nav = useNavigate();
  const auth = useAuth();
  if (auth.user) return <Navigate to={dashboardPath(auth.user.role)} replace />;
  return (
    <RegisterScreen
      onBack={() => nav("/")}
      onRegister={async (payload) => {
        await auth.register(payload);
        nav(payload.role === "ADMIN" ? "/login" : "/waiting");
      }}
      onGoLogin={() => nav("/login")}
    />
  );
}

function WaitingRoute() {
  const nav = useNavigate();
  return (
    <WaitingApproval
      onGoBack={() => nav("/register")}
      onBackToLogin={() => nav("/login")}
    />
  );
}

function RolePickerRoute() {
  const nav = useNavigate();
  const auth = useAuth();
  if (auth.user) return <Navigate to={dashboardPath(auth.user.role)} replace />;
  return <RolePicker onSelect={(role) => {
    auth.setDemoUser(DEMO_USERS[role]);
    nav(`/dashboard/${role.toLowerCase()}`);
  }} />;
}

function DashboardRoute() {
  const nav = useNavigate();
  const auth = useAuth();
  const { role: roleParam } = useParams<{ role: string }>();
  const roleSlug = (roleParam ?? "").toUpperCase() as Role;
  const validRoles: Role[] = ["HOD", "BUR", "FBUR", "SDC", "TEC", "TB", "STK", "SUP", "FIN"];
  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }
  if (auth.user && auth.user.role !== roleSlug) {
    return <Navigate to={dashboardPath(auth.user.role)} replace />;
  }
  if (!validRoles.includes(roleSlug)) {
    return <Navigate to="/select-role" replace />;
  }
  return (
    <DashboardLayout
      role={roleSlug}
      onLogout={() => nav("/login")}
    />
  );
}

function dashboardPath(role: Role) {
  return `/dashboard/${role.toLowerCase()}`;
}


const ROLES: Role[] = ["ADM", "HOD", "BUR", "FBUR", "SDC", "TEC", "TB", "STK", "SUP", "FIN"];

export const DEMO_USERS: Record<Role, UserContext> = {
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

function RolePicker({ onSelect }: { onSelect: (r: Role) => void }) {
  const [hovered, setHovered] = useState<Role | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "'Inter', 'Google Sans', system-ui, sans-serif",
      }}
    >
      {/* Logo + title */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(245,158,11,0.20)",
            flexShrink: 0,
            padding: 4,
          }}
        >
          <img
            src={usjLogo}
            alt="University of Sri Jayewardenepura"
            style={{ width: 56, height: 56, objectFit: "contain" }}
          />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B", margin: 0, letterSpacing: "-0.02em" }}>
            University Procurement Management System
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "3px 0 0" }}>
            University of Sri Jayewardenepura · Demo Prototype
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
            Compliant with Sri Lanka Procurement Manual 2024 (NPC)
          </p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: "100%", maxWidth: 640, height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 28 }} />

      {/* Heading */}
      <div style={{ width: "100%", maxWidth: 640, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#F59E0B", margin: 0, marginBottom: 4 }}>
          Select a role to demo
        </h2>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          No backend required — data persists in your browser session.
        </p>
      </div>

      {/* Role grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          width: "100%",
          maxWidth: 640,
        }}
      >
        {ROLES.map(role => {
          const meta = ROLE_META[role];
          const isHovered = hovered === role;
          return (
            <button
              key={role}
              onClick={() => onSelect(role)}
              onMouseEnter={() => setHovered(role)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: isHovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isHovered ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.10)"}`,
                borderRadius: 10,
                padding: "18px 20px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF", letterSpacing: "0.04em" }}>
                    {role}
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                    {meta.label}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4, lineHeight: 1.4 }}>
                    {meta.description}
                  </div>
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginLeft: 12 }}>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Workflow hint */}
      <p
        style={{
          marginTop: 28,
          fontSize: 11,
          color: "rgba(255,255,255,0.3)",
          maxWidth: 640,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "rgba(255,255,255,0.5)" }}>Demo workflow:</strong>{" "}
        Sign in as HOD → create requisition → switch to Bursar → verify funds → Supplies Clerk → open bidding → Supplier → submit bid → TEC → evaluate → Tender Board → approve → Storekeeper → GRN → HOD quality report → Finance payment.
      </p>
    </div>
  );
}
