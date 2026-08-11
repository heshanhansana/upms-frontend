import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  CheckCircle2,
  Edit3,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import type { UserContext } from "../dashboard/types";
import * as adminUsersApi from "../api/adminUsers";

interface AdminDashboardProps {
  user: UserContext;
  activeTab: TabKey;
}

type TabKey = "pending" | "users";
type ApprovalStatus = adminUsersApi.UpdateAdminUserRequest["approvalStatus"];
type ActionState = { userId: number; action: "approve" | "reject" | "save" | "delete" } | null;

interface EditForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  faculty: string;
  department: string;
  isActive: boolean;
  approvalStatus: ApprovalStatus;
  roles: string[];
}

function formatDate(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRole(roles: string[]) {
  return roles.length ? roles.map((role) => role.replaceAll("_", " ")).join(", ") : "No role";
}

function fullName(user: Pick<adminUsersApi.PendingUser, "firstName" | "lastName" | "username">) {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || user.username;
}

function buildEditForm(user: adminUsersApi.AdminUser): EditForm {
  return {
    username: user.username,
    email: user.email,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    password: "",
    faculty: user.faculty ?? "",
    department: user.department ?? "",
    isActive: user.isActive,
    approvalStatus: user.approvalStatus,
    roles: user.roles,
  };
}

export function AdminDashboard({ user, activeTab }: AdminDashboardProps) {
  const [pendingUsers, setPendingUsers] = useState<adminUsersApi.PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<adminUsersApi.AdminUser[]>([]);
  const [roles, setRoles] = useState<adminUsersApi.RoleOption[]>([]);
  const [editingUser, setEditingUser] = useState<adminUsersApi.AdminUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const latestRequest = useMemo(() => {
    return pendingUsers[0]?.createdAt ? formatDate(pendingUsers[0].createdAt) : "No pending requests";
  }, [pendingUsers]);

  async function loadAdminData() {
    setIsLoading(true);
    setError("");
    try {
      const [pending, users, roleOptions] = await Promise.all([
        adminUsersApi.getPendingUsers(),
        adminUsersApi.getAllUsers(),
        adminUsersApi.getRoles(),
      ]);
      setPendingUsers(pending);
      setAllUsers(users);
      setRoles(roleOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load admin data");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function handleApprove(request: adminUsersApi.PendingUser) {
    setActionState({ userId: request.id, action: "approve" });
    setError("");
    setNotice("");
    try {
      await adminUsersApi.approveUser(request.id);
      await loadAdminData();
      setNotice(`${request.username} approved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to approve user");
    } finally {
      setActionState(null);
    }
  }

  async function handleReject(request: adminUsersApi.PendingUser) {
    const reason = window.prompt(`Reason for rejecting ${request.username}?`);
    if (reason === null) return;
    setActionState({ userId: request.id, action: "reject" });
    setError("");
    setNotice("");
    try {
      await adminUsersApi.rejectUser(request.id, reason);
      await loadAdminData();
      setNotice(`${request.username} rejected.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reject user");
    } finally {
      setActionState(null);
    }
  }

  function startEdit(nextUser: adminUsersApi.AdminUser) {
    setEditingUser(nextUser);
    setEditForm(buildEditForm(nextUser));
    setError("");
    setNotice("");
  }

  async function handleSaveEdit() {
    if (!editingUser || !editForm) return;
    if (!editForm.username.trim() || !editForm.email.trim()) {
      setError("Username and email are required.");
      return;
    }
    if (editForm.roles.length === 0) {
      setError("Select at least one role.");
      return;
    }

    setActionState({ userId: editingUser.id, action: "save" });
    setError("");
    setNotice("");
    try {
      const payload: adminUsersApi.UpdateAdminUserRequest = {
        username: editForm.username.trim(),
        email: editForm.email.trim(),
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        password: editForm.password.trim() || undefined,
        faculty: editForm.faculty.trim(),
        department: editForm.department.trim(),
        isActive: editForm.isActive,
        approvalStatus: editForm.approvalStatus,
        roles: editForm.roles,
      };
      const updated = await adminUsersApi.updateUser(editingUser.id, payload);
      setAllUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setPendingUsers((current) => current.filter((item) => item.id !== updated.id || updated.approvalStatus === "PENDING"));
      setNotice(`${updated.username} updated.`);
      setEditingUser(null);
      setEditForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user");
    } finally {
      setActionState(null);
    }
  }

  async function handleDelete(target: adminUsersApi.AdminUser) {
    const confirmed = window.confirm(`Delete ${target.username}? This cannot be undone.`);
    if (!confirmed) return;
    setActionState({ userId: target.id, action: "delete" });
    setError("");
    setNotice("");
    try {
      await adminUsersApi.deleteUser(target.id);
      setAllUsers((current) => current.filter((item) => item.id !== target.id));
      setPendingUsers((current) => current.filter((item) => item.id !== target.id));
      setNotice(`${target.username} deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user");
    } finally {
      setActionState(null);
    }
  }

  function toggleRole(roleName: string) {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      roles: editForm.roles.includes(roleName)
        ? editForm.roles.filter((role) => role !== roleName)
        : [...editForm.roles, roleName],
    });
  }

  return (
    <div style={{ padding: "28px", maxWidth: 1260 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14, marginBottom: 20 }}>
        <section style={statCardStyle}>
          <div style={statIconStyle}><ShieldCheck size={18} /></div>
          <div>
            <div style={statLabelStyle}>Signed in as</div>
            <div style={statValueStyle}>{user.name}</div>
          </div>
        </section>
        <section style={statCardStyle}>
          <div style={statIconStyle}><CheckCircle2 size={18} /></div>
          <div>
            <div style={statLabelStyle}>Pending requests</div>
            <div style={statValueStyle}>{pendingUsers.length}</div>
          </div>
        </section>
        <section style={statCardStyle}>
          <div style={statIconStyle}><RefreshCw size={18} /></div>
          <div>
            <div style={statLabelStyle}>Oldest request</div>
            <div style={{ ...statValueStyle, fontSize: 15 }}>{latestRequest}</div>
          </div>
        </section>
      </div>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>Admin User Management</h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>
              Approve access requests and manage user accounts.
            </p>
          </div>
          <button onClick={loadAdminData} disabled={isLoading} style={secondaryButtonStyle}>
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>

        {notice && <div style={noticeStyle}>{notice}</div>}
        {error && (
          <div style={errorStyle}>
            <XCircle size={15} />
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={emptyStateStyle}>
            <Loader2 size={24} className="animate-spin" />
            <span>Loading admin data...</span>
          </div>
        ) : activeTab === "pending" ? (
          <PendingTable
            pendingUsers={pendingUsers}
            actionState={actionState}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <UsersTable
            users={allUsers}
            actionState={actionState}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        )}
      </section>

      {editingUser && editForm && (
        <div style={modalBackdropStyle}>
          <section style={modalStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>Edit User</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>{editingUser.username}</p>
              </div>
              <button onClick={() => { setEditingUser(null); setEditForm(null); }} style={iconButtonStyle}>
                <X size={17} />
              </button>
            </div>

            <div style={formGridStyle}>
              <Field label="Username" value={editForm.username} onChange={(value) => setEditForm({ ...editForm, username: value })} />
              <Field label="Email" value={editForm.email} onChange={(value) => setEditForm({ ...editForm, email: value })} />
              <Field label="First Name" value={editForm.firstName} onChange={(value) => setEditForm({ ...editForm, firstName: value })} />
              <Field label="Last Name" value={editForm.lastName} onChange={(value) => setEditForm({ ...editForm, lastName: value })} />
              <Field label="New Password" value={editForm.password} type="password" placeholder="Leave blank to keep current" onChange={(value) => setEditForm({ ...editForm, password: value })} />
              <Field label="Faculty" value={editForm.faculty} onChange={(value) => setEditForm({ ...editForm, faculty: value })} />
              <Field label="Department" value={editForm.department} onChange={(value) => setEditForm({ ...editForm, department: value })} />
              <label style={fieldWrapStyle}>
                <span style={labelStyle}>Approval Status</span>
                <select
                  value={editForm.approvalStatus}
                  onChange={(event) => setEditForm({ ...editForm, approvalStatus: event.target.value as ApprovalStatus })}
                  style={inputStyle}
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13, color: "#374151", fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(event) => setEditForm({ ...editForm, isActive: event.target.checked })}
              />
              Active account
            </label>

            <div style={{ marginTop: 18 }}>
              <div style={labelStyle}>Roles</div>
              <div style={rolesGridStyle}>
                {roles.map((role) => (
                  <label key={role.id} style={roleCheckStyle}>
                    <input
                      type="checkbox"
                      checked={editForm.roles.includes(role.name)}
                      onChange={() => toggleRole(role.name)}
                    />
                    <span>{role.name.replaceAll("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
              <button onClick={() => { setEditingUser(null); setEditForm(null); }} style={secondaryButtonStyle}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={actionState?.userId === editingUser.id} style={primaryButtonStyle}>
                {actionState?.userId === editingUser.id && actionState.action === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save Changes
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function PendingTable({
  pendingUsers,
  actionState,
  onApprove,
  onReject,
}: {
  pendingUsers: adminUsersApi.PendingUser[];
  actionState: ActionState;
  onApprove: (user: adminUsersApi.PendingUser) => void;
  onReject: (user: adminUsersApi.PendingUser) => void;
}) {
  if (pendingUsers.length === 0) {
    return (
      <div style={emptyStateStyle}>
        <ShieldCheck size={28} color="#047857" />
        <span>No pending access requests.</span>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr style={headRowStyle}>
            <th style={thStyle}>User</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Requested Role</th>
            <th style={thStyle}>Faculty / Department</th>
            <th style={thStyle}>Submitted</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingUsers.map((request) => {
            const isApproveBusy = actionState?.userId === request.id && actionState.action === "approve";
            const isRejectBusy = actionState?.userId === request.id && actionState.action === "reject";
            const isBusy = actionState?.userId === request.id;
            return (
              <tr key={request.id} style={bodyRowStyle}>
                <td style={tdStyle}>
                  <div style={strongTextStyle}>{fullName(request)}</div>
                  <div style={mutedTextStyle}>@{request.username}</div>
                </td>
                <td style={tdStyle}>{request.email}</td>
                <td style={tdStyle}><span style={rolePillStyle}>{formatRole(request.roles)}</span></td>
                <td style={tdStyle}>
                  <div>{request.faculty || "Not required"}</div>
                  {request.department && <div style={mutedTextStyle}>{request.department}</div>}
                </td>
                <td style={tdStyle}>{formatDate(request.createdAt)}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 8 }}>
                    <button onClick={() => onReject(request)} disabled={isBusy} style={dangerButtonStyle}>
                      {isRejectBusy ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                      Reject
                    </button>
                    <button onClick={() => onApprove(request)} disabled={isBusy} style={primaryButtonStyle}>
                      {isApproveBusy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Approve
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({
  users,
  actionState,
  onEdit,
  onDelete,
}: {
  users: adminUsersApi.AdminUser[];
  actionState: ActionState;
  onEdit: (user: adminUsersApi.AdminUser) => void;
  onDelete: (user: adminUsersApi.AdminUser) => void;
}) {
  if (users.length === 0) {
    return <div style={emptyStateStyle}>No users found.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ ...tableStyle, minWidth: 1040 }}>
        <thead>
          <tr style={headRowStyle}>
            <th style={thStyle}>User</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Faculty / Department</th>
            <th style={thStyle}>Last Login</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((account) => {
            const isDeleteBusy = actionState?.userId === account.id && actionState.action === "delete";
            const isBusy = actionState?.userId === account.id;
            return (
              <tr key={account.id} style={bodyRowStyle}>
                <td style={tdStyle}>
                  <div style={strongTextStyle}>{fullName(account)}</div>
                  <div style={mutedTextStyle}>@{account.username} · {account.email}</div>
                </td>
                <td style={tdStyle}><span style={rolePillStyle}>{formatRole(account.roles)}</span></td>
                <td style={tdStyle}>
                  <span style={account.approvalStatus === "APPROVED" && account.isActive ? activePillStyle : warningPillStyle}>
                    {account.isActive ? account.approvalStatus : "INACTIVE"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div>{account.faculty || "Not set"}</div>
                  {account.department && <div style={mutedTextStyle}>{account.department}</div>}
                </td>
                <td style={tdStyle}>{formatDate(account.lastLogin)}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 8 }}>
                    <button onClick={() => onEdit(account)} disabled={isBusy} style={secondaryButtonStyle}>
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button onClick={() => onDelete(account)} disabled={isBusy} style={dangerButtonStyle}>
                      {isDeleteBusy ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={labelStyle}>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const statCardStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  padding: "16px",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const statIconStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 8,
  background: "#F9FAFB",
  color: "#7A0C0C",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelStyle: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 8,
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
};

const panelHeaderStyle: CSSProperties = {
  padding: "18px 20px",
  borderBottom: "1px solid #EEF2F7",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
};

const statLabelStyle: CSSProperties = { fontSize: 12, color: "#6B7280", marginBottom: 2 };
const statValueStyle: CSSProperties = { fontSize: 20, fontWeight: 800, color: "#111827" };
const thStyle: CSSProperties = { padding: "12px 16px", fontWeight: 800 };
const tdStyle: CSSProperties = { padding: "14px 16px", fontSize: 13, color: "#374151", verticalAlign: "middle" };
const tableStyle: CSSProperties = { width: "100%", borderCollapse: "collapse", minWidth: 860 };
const headRowStyle: CSSProperties = { background: "#F9FAFB", color: "#6B7280", fontSize: 12, textAlign: "left" };
const bodyRowStyle: CSSProperties = { borderTop: "1px solid #EEF2F7" };
const strongTextStyle: CSSProperties = { fontWeight: 800, color: "#111827" };
const mutedTextStyle: CSSProperties = { fontSize: 12, color: "#6B7280" };

const emptyStateStyle: CSSProperties = {
  minHeight: 220,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  gap: 10,
  color: "#6B7280",
  fontSize: 14,
};

const baseButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 7,
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const primaryButtonStyle: CSSProperties = { ...baseButtonStyle, background: "#7A0C0C", color: "#FFFFFF" };
const dangerButtonStyle: CSSProperties = { ...baseButtonStyle, background: "#FEF2F2", color: "#B91C1C" };
const secondaryButtonStyle: CSSProperties = { ...baseButtonStyle, background: "#F9FAFB", color: "#374151", border: "1px solid #E5E7EB" };
const rolePillStyle: CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: 999,
  background: "#F3F4F6",
  color: "#374151",
  fontSize: 11,
  fontWeight: 800,
};
const activePillStyle: CSSProperties = { ...rolePillStyle, background: "#ECFDF5", color: "#047857" };
const warningPillStyle: CSSProperties = { ...rolePillStyle, background: "#FEF2F2", color: "#B91C1C" };
const noticeStyle: CSSProperties = { padding: "12px 20px", background: "#ECFDF5", color: "#047857", fontSize: 13, borderBottom: "1px solid #A7F3D0" };
const errorStyle: CSSProperties = { padding: "12px 20px", background: "#FEF2F2", color: "#B91C1C", fontSize: 13, borderBottom: "1px solid #FECACA", display: "flex", gap: 8, alignItems: "center" };

const modalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.38)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 100,
};

const modalStyle: CSSProperties = {
  width: "min(760px, 100%)",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#FFFFFF",
  borderRadius: 8,
  border: "1px solid #E5E7EB",
  padding: 20,
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  marginBottom: 18,
};

const iconButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 7,
  border: "1px solid #E5E7EB",
  background: "#FFFFFF",
  color: "#374151",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const fieldWrapStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 800, color: "#374151" };
const inputStyle: CSSProperties = {
  border: "1px solid #D1D5DB",
  borderRadius: 7,
  padding: "9px 10px",
  fontSize: 13,
  outline: "none",
};

const rolesGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
  marginTop: 8,
};

const roleCheckStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  border: "1px solid #E5E7EB",
  borderRadius: 7,
  fontSize: 12,
  color: "#374151",
  fontWeight: 700,
};
