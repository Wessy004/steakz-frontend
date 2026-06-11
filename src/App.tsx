import {
  BarChart3,
  Bell,
  Beef,
  Building2,
  CreditCard,
  Flame,
  LayoutDashboard,
  LogOut,
  Minus,
  Plus,
  Printer,
  Search,
  Settings,
  Shield,
  Soup,
  Store,
  UserRound,
  Utensils,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { api } from "./api/client.js";
import { useAuth } from "./context/AuthContext.js";
import type { LucideIcon } from "lucide-react";
import type { ApiResponse, DashboardReport, Role, User as ApiUser } from "./types/index.js";

type View = "dashboard" | "admin" | "hq" | "branch" | "orders" | "kitchen" | "payments";

type Branch = {
  id: number;
  name: string;
  city: string;
  detail: string;
  status: "Operational" | "Offline";
  load: number;
};

type CartItem = {
  id: number;
  name: string;
  meta: string;
  price: number;
  quantity: number;
  categoryId: number;
  categoryName: string;
};

type Ticket = {
  id: number;
  backendOrderId: number;
  branchId: number;
  tableId: number;
  table: string;
  status: "Confirmed" | "Preparing" | "Ready" | "Paid";
  items: string[];
  time: string;
  customer: string;
  total: number;
};

type DiningTable = {
  id: number;
  number: string;
  branchId: number;
  seats: number;
  zone: string;
};

type AdminPerson = {
  id: number;
  backendId: number;
  email?: string;
  name: string;
  branch: string;
  role: string;
  apiRole: Role;
  status: string;
};

type SalesReportRow = {
  branchId: number;
  branchName: string;
  salesTotal: number;
  orders: number;
};

type BackendBranch = {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string;
};

type BackendTable = {
  id: number;
  tableNumber: string;
  branchId: number;
  capacity: number;
};

type BackendOrder = {
  id: number;
  branchId: number;
  tableId: number | null;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "PAID" | "CANCELLED";
  totalAmount: number;
  customerId: number | null;
  items: Array<{ menuItemId: number; quantity: number; unitPrice: number }>;
};

type BackendMenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  categoryId: number;
};

type BackendMenuCategory = {
  id: number;
  name: string;
  description: string;
};

type SignInShortcut = {
  id: number;
  label: string;
  roleLabel: string;
  email: string;
};

const roleHome: Record<Role, View> = {
  ADMIN: "admin",
  HEADQUARTERS_MANAGER: "hq",
  BRANCH_MANAGER: "branch",
  CUSTOMER: "orders",
  WAITER: "orders",
  CHEF: "kitchen",
  CASHIER: "payments"
};

const navItems: Array<{ view: View; label: string; roles: Role[]; icon: LucideIcon }> = [
  { view: "dashboard", label: "Dashboard", roles: ["ADMIN"], icon: LayoutDashboard },
  { view: "admin", label: "Admin", roles: ["ADMIN"], icon: Shield },
  { view: "hq", label: "HQ", roles: ["ADMIN", "HEADQUARTERS_MANAGER"], icon: BarChart3 },
  { view: "branch", label: "Branch", roles: ["ADMIN", "HEADQUARTERS_MANAGER", "BRANCH_MANAGER"], icon: Store },
  { view: "orders", label: "Orders", roles: ["CUSTOMER", "WAITER"], icon: Utensils },
  { view: "kitchen", label: "Chef", roles: ["CHEF"], icon: Soup },
  { view: "payments", label: "Cashier", roles: ["CASHIER"], icon: CreditCard }
];

const fallbackMenuItems: CartItem[] = [
  { id: 1, name: "Signature Ribeye", meta: "Medium rare + peppercorn", price: 54, quantity: 1, categoryId: 2, categoryName: "Steaks" },
  { id: 2, name: "Steakz Burger", meta: "Smoked cheddar + relish", price: 14.5, quantity: 1, categoryId: 3, categoryName: "Burgers" },
  { id: 3, name: "Truffle Mac", meta: "Extra shavings", price: 18.5, quantity: 1, categoryId: 4, categoryName: "Sides" },
  { id: 4, name: "Old Fashioned", meta: "Smoked oak base", price: 18, quantity: 1, categoryId: 5, categoryName: "Drinks" }
];

const initialBranches: Branch[] = [
  { id: 1, name: "Steakz Manchester", city: "Manchester", detail: "1 Deansgate, Manchester", status: "Operational", load: 74 },
  { id: 2, name: "Steakz London", city: "London", detail: "10 Oxford Street, London", status: "Operational", load: 82 }
];

const initialTickets: Ticket[] = [];

const initialDiningTables: DiningTable[] = [
  { id: 1, number: "M1", branchId: 1, seats: 4, zone: "Window" },
  { id: 2, number: "M2", branchId: 1, seats: 6, zone: "Main Hall" },
  { id: 3, number: "M3", branchId: 1, seats: 2, zone: "Bar" },
  { id: 4, number: "M4", branchId: 1, seats: 4, zone: "Main Hall" },
  { id: 5, number: "M5", branchId: 1, seats: 6, zone: "Private" },
  { id: 6, number: "M6", branchId: 1, seats: 2, zone: "Window" },
  { id: 7, number: "M7", branchId: 1, seats: 4, zone: "Patio" },
  { id: 8, number: "M8", branchId: 1, seats: 8, zone: "Family" },
  { id: 9, number: "M9", branchId: 1, seats: 4, zone: "Main Hall" },
  { id: 10, number: "M10", branchId: 1, seats: 6, zone: "Private" },
  { id: 11, number: "L1", branchId: 2, seats: 4, zone: "London" }
];

const roleCycle: Array<{ label: string; apiRole: Role }> = [
  { label: "Waiter", apiRole: "WAITER" },
  { label: "Chef", apiRole: "CHEF" },
  { label: "Cashier", apiRole: "CASHIER" },
  { label: "Branch Manager", apiRole: "BRANCH_MANAGER" }
];

const staffRoleOptions = roleCycle;

const initialAdminPeople: AdminPerson[] = [];

function tablesForNewBranch(branchId: number, startId: number, city = "Main"): DiningTable[] {
  const seats = [4, 6, 2, 4, 6, 2, 4, 8, 4, 6];
  const zones = ["Window", "Main Hall", "Bar", "Main Hall", "Private", "Window", "Patio", "Family", "Main Hall", "Private"];
  const prefix = city.trim().charAt(0).toUpperCase() || "T";
  return seats.map((seatCount, index) => ({
    id: startId + index,
    number: `${prefix}${index + 1}`,
    branchId,
    seats: seatCount,
    zone: zones[index] ?? "Main Hall"
  }));
}

function formatCurrency(value: number): string {
  return `GBP ${value.toFixed(2)}`;
}

function orderPayloadItems(items: CartItem[]): Array<{ menuItemId: number; quantity: number }> {
  return items.map((item) => ({ menuItemId: item.id, quantity: item.quantity }));
}

function priceForTicketItem(name: string, ticket: Ticket, menuItems: CartItem[]): number {
  return menuItems.find((item) => item.name === name)?.price ?? ticket.total / Math.max(ticket.items.length, 1);
}

function branchName(branchId: number | null | undefined, branches = initialBranches): string {
  if (branchId === null || branchId === undefined) return "All Branches";
  return branches.find((branch) => branch.id === branchId)?.name ?? `Branch ${branchId}`;
}

function branchById(branchId: number | null | undefined, branches = initialBranches): Branch | undefined {
  return branchId === null || branchId === undefined ? undefined : branches.find((branch) => branch.id === branchId);
}

function roleLabel(role: Role): string {
  return role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function branchLoad(branchId: number): number {
  return 40 + ((branchId * 17) % 55);
}

function mapBranch(branch: BackendBranch): Branch {
  return {
    id: branch.id,
    name: branch.name,
    city: branch.city,
    detail: branch.address,
    status: "Operational",
    load: branchLoad(branch.id)
  };
}

function mapTable(table: BackendTable): DiningTable {
  return {
    id: table.id,
    number: table.tableNumber,
    branchId: table.branchId,
    seats: table.capacity,
    zone: table.tableNumber.startsWith("L") ? "London" : "Main Hall"
  };
}

function mapMenuItem(item: BackendMenuItem, categories: BackendMenuCategory[] = []): CartItem {
  const categoryName = categories.find((category) => category.id === item.categoryId)?.name ?? `Category ${item.categoryId}`;
  return {
    id: item.id,
    name: item.name,
    meta: item.description,
    price: Number(item.price),
    quantity: 1,
    categoryId: item.categoryId,
    categoryName
  };
}

function groupMenuItems(items: CartItem[]): Array<{ categoryId: number; categoryName: string; items: CartItem[] }> {
  return Array.from(items.reduce((groups, item) => {
    const group = groups.get(item.categoryId) ?? { categoryId: item.categoryId, categoryName: item.categoryName, items: [] };
    group.items.push(item);
    groups.set(item.categoryId, group);
    return groups;
  }, new Map<number, { categoryId: number; categoryName: string; items: CartItem[] }>()).values());
}

function mapAdminPerson(user: ApiUser, branches: Branch[]): AdminPerson {
  return {
    id: user.id ?? user.userId ?? 0,
    backendId: user.id ?? user.userId ?? 0,
    email: user.email,
    name: user.name ?? user.email,
    branch: branchName(user.branchId, branches),
    role: roleLabel(user.role),
    apiRole: user.role,
    status: "Active"
  };
}

function ticketStatus(status: BackendOrder["status"]): Ticket["status"] | null {
  if (status === "CONFIRMED" || status === "PENDING") return "Confirmed";
  if (status === "PREPARING") return "Preparing";
  if (status === "READY" || status === "SERVED") return "Ready";
  if (status === "PAID") return "Paid";
  return null;
}

function mapTicket(order: BackendOrder, tables: DiningTable[], menuItems: CartItem[]): Ticket | null {
  const status = ticketStatus(order.status);
  if (!status) return null;
  const table = tables.find((candidate) => candidate.id === order.tableId);
  const items = order.items.flatMap((item) => {
    const menuItem = menuItems.find((candidate) => candidate.id === item.menuItemId);
    return Array.from({ length: item.quantity }, () => menuItem?.name ?? `Menu item ${item.menuItemId}`);
  });

  return {
    id: order.id,
    backendOrderId: order.id,
    branchId: order.branchId,
    tableId: order.tableId ?? 0,
    table: table?.number ?? `Table ${order.tableId ?? "Unassigned"}`,
    status,
    items,
    time: "0m",
    customer: order.customerId ? `Customer #${order.customerId}` : "Walk-in guest",
    total: order.totalAmount
  };
}

function visibleTicketsForUser(tickets: Ticket[], branchId: number | null | undefined): Ticket[] {
  return tickets.filter((ticket) => branchId === null || ticket.branchId === branchId);
}

function salesTotal(tickets: Ticket[]): number {
  return tickets.filter((ticket) => ticket.status === "Paid").reduce((sum, ticket) => sum + ticket.total, 0);
}

function kitchenCount(tickets: Ticket[]): number {
  return tickets.filter((ticket) => ticket.status === "Preparing" || ticket.status === "Ready").length;
}

function chartHeight(value: number, max: number): string {
  if (max <= 0) return "8%";
  return `${Math.max(8, Math.round((value / max) * 100))}%`;
}

function LoginScreen() {
  const { login, shortcutLogin } = useAuth();
  const [email, setEmail] = useState("admin@steakz.com");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shortcuts, setShortcuts] = useState<SignInShortcut[]>([]);
  const shortcutGroups = Array.from(shortcuts.reduce((groups, shortcut) => {
    const group = groups.get(shortcut.roleLabel) ?? [];
    group.push(shortcut);
    groups.set(shortcut.roleLabel, group);
    return groups;
  }, new Map<string, SignInShortcut[]>()).entries());

  useEffect(() => {
    let cancelled = false;

    async function loadShortcuts(): Promise<void> {
      try {
        const response = await api.get<ApiResponse<ApiUser[]>>("/auth/shortcuts");
        if (!cancelled && response.data.success) {
          setShortcuts(response.data.data.map((user) => ({
            id: user.id ?? user.userId ?? 0,
            email: user.email,
            label: user.name ?? user.email,
            roleLabel: roleLabel(user.role)
          })).filter((shortcut) => shortcut.id > 0));
        }
      } catch {
        if (!cancelled) setShortcuts([]);
      }
    }

    void loadShortcuts();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn(nextEmail = email, nextPassword = password): Promise<void> {
    setError("");
    setLoading(true);
    try {
      await login(nextEmail, nextPassword);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await signIn();
  }

  async function signInShortcut(shortcut: SignInShortcut): Promise<void> {
    setEmail(shortcut.email);
    setError("");
    setLoading(true);
    try {
      await shortcutLogin(shortcut.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Shortcut login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-hero">
          <Beef size={54} />
          <span className="eyebrow">Premium British Wood-Fired Hospitality</span>
          <h1>STEAKZ Management System</h1>
          <p>Operational control, branch performance, kitchen status, payments, and customer ordering in one secure suite.</p>
        </div>
        <form className="login-card" onSubmit={submit}>
          <h2>System Login</h2>
          <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? "Entering..." : "Enter Suite"}</button>
          <div className="signin-shortcuts">
            {shortcutGroups.map(([roleLabel, shortcuts]) => shortcuts.length === 1 ? (
              <button key={shortcuts[0].email} type="button" disabled={loading} onClick={() => {
                setEmail(shortcuts[0].email);
                void signInShortcut(shortcuts[0]);
              }}>{roleLabel}</button>
            ) : (
              <select key={roleLabel} disabled={loading} value="" onChange={(event) => {
                const selected = shortcuts.find((shortcut) => String(shortcut.id) === event.target.value);
                if (!selected) return;
                void signInShortcut(selected);
              }}>
                <option value="">{roleLabel}</option>
                {shortcuts.map((shortcut) => <option key={shortcut.email} value={shortcut.id}>{shortcut.label}</option>)}
              </select>
            ))}
          </div>
        </form>
      </section>
    </main>
  );
}

function Shell({ view, setView, notice, branches, tables, tickets, children }: { view: View; setView: (view: View) => void; notice: string; branches: Branch[]; tables: DiningTable[]; tickets: Ticket[]; children: ReactNode }) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<"alerts" | "settings" | null>(null);
  const visibleNav = navItems.filter((item) => user && item.roles.includes(user.role));
  const branchLabel = branchName(user?.branchId, branches);
  const normalizedQuery = query.trim().toLowerCase();
  const scopedBranches = user?.branchId === null ? branches : branches.filter((branch) => branch.id === user?.branchId);
  const scopedTables = tables.filter((table) => user?.branchId === null || table.branchId === user?.branchId);
  const scopedTickets = tickets.filter((ticket) => user?.branchId === null || ticket.branchId === user?.branchId);
  const canOpen = (target: View): boolean => Boolean(user && navItems.some((item) => item.view === target && item.roles.includes(user.role)));
  const searchResults = normalizedQuery ? [
    ...visibleNav.filter((item) => item.label.toLowerCase().includes(normalizedQuery)).map((item) => ({ key: `nav-${item.view}`, label: item.label, meta: "Module", view: item.view })),
    ...scopedBranches.filter((branch) => `${branch.name} ${branch.city} ${branch.detail}`.toLowerCase().includes(normalizedQuery)).map((branch) => ({ key: `branch-${branch.id}`, label: branch.name, meta: `${branch.city} branch`, view: canOpen("branch") ? "branch" as View : roleHome[user?.role ?? "CUSTOMER"] })),
    ...scopedTables.filter((table) => `${table.number} ${table.zone} ${branchName(table.branchId, branches)}`.toLowerCase().includes(normalizedQuery)).map((table) => ({ key: `table-${table.id}`, label: `Table ${table.number}`, meta: `${branchName(table.branchId, branches)} · ${table.seats} seats`, view: canOpen("branch") ? "branch" as View : roleHome[user?.role ?? "CUSTOMER"] })),
    ...scopedTickets.filter((ticket) => `#${ticket.id} ${ticket.table} ${ticket.customer} ${ticket.status} ${ticket.items.join(" ")}`.toLowerCase().includes(normalizedQuery)).map((ticket) => {
      const target = user?.role === "CHEF" ? "kitchen" : user?.role === "CASHIER" ? "payments" : user?.role === "WAITER" || user?.role === "CUSTOMER" ? "orders" : "branch";
      return { key: `ticket-${ticket.id}`, label: `Order #${ticket.id}`, meta: `${ticket.table} · ${ticket.status}`, view: canOpen(target) ? target as View : roleHome[user?.role ?? "CUSTOMER"] };
    })
  ].slice(0, 8) : [];

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand-block"><strong>STEAKZ</strong><span>Executive Suite</span></div>
        <nav>{visibleNav.map((item) => {
          const Icon = item.icon;
          return <button className={view === item.view ? "active" : ""} key={item.view} type="button" onClick={() => setView(item.view)}><Icon size={20} />{item.label}</button>;
        })}</nav>
        <div className="operator-card"><UserRound size={22} /><div><strong>{user?.name ?? user?.email}</strong><span>{user?.role.replaceAll("_", " ")}</span></div></div>
        <button className="logout-button" type="button" onClick={logout}><LogOut size={18} /> Logout</button>
      </aside>
      <main className="main-canvas">
        <header className="top-nav">
          <div className="search-control">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
              if (event.key === "Enter" && searchResults[0]) {
                setView(searchResults[0].view);
                setQuery("");
              }
            }} placeholder="Search order, table, branch..." />
            {query ? <div className="search-results">{searchResults.length ? searchResults.map((item) => <button key={item.key} type="button" onClick={() => {
              setView(item.view);
              setQuery("");
            }}><strong>{item.label}</strong><span>{item.meta}</span></button>) : <span>No result found</span>}</div> : null}
          </div>
          <button className="ghost-icon" type="button" onClick={() => setPanel("alerts")} aria-label="Notifications"><Bell size={20} /></button>
          <button className="ghost-icon" type="button" onClick={() => setPanel("settings")} aria-label="Settings"><Settings size={20} /></button>
        </header>
        {notice ? <div className="notice-bar">{notice}</div> : null}
        {children}
      </main>
      {panel ? <div className="modal-backdrop" onClick={() => setPanel(null)}>
        <section className="modal-card" onClick={(event) => event.stopPropagation()}>
          {panel === "alerts" ? <><span className="eyebrow">Live Alerts</span><h2>Notifications</h2>{notice ? <div className="modal-line">{notice}</div> : <div className="modal-line">No active notifications for {branchLabel}.</div>}<div className="modal-line">Order visibility is scoped to {branchLabel}.</div></> : null}
          {panel === "settings" ? <><span className="eyebrow">System Controls</span><h2>Settings</h2><div className="modal-line">User: {user?.name ?? user?.email}.</div><div className="modal-line">Role: {user?.role.replaceAll("_", " ")}.</div><div className="modal-line">Branch access: {branchLabel}.</div><div className="modal-line">API: /api/v1 connected.</div></> : null}
          <button className="secondary-button" type="button" onClick={() => setPanel(null)}>Close</button>
        </section>
      </div> : null}
    </div>
  );
}

function DashboardView({ setView, tickets, branches, dashboardReport }: { setView: (view: View) => void; tickets: Ticket[]; branches: Branch[]; dashboardReport: DashboardReport | null }) {
  const { user } = useAuth();
  const scopedTickets = visibleTicketsForUser(tickets, user?.branchId);
  const activeOrders = dashboardReport?.orders ?? scopedTickets.filter((ticket) => ticket.status !== "Paid").length;
  const visibleBranches = user?.branchId === null ? branches : branches.filter((branch) => branch.id === user?.branchId);
  const canOpenHq = user?.role === "ADMIN" || user?.role === "HEADQUARTERS_MANAGER";
  const canOpenBranch = user?.role === "ADMIN" || user?.role === "BRANCH_MANAGER";

  return <section className="page-grid">
    <PageTitle eyebrow="Live operations" title="Command Dashboard" status={branchName(user?.branchId, branches)} />
    <div className="metric-grid">
      <article className="metric-card wide"><span>Mainframe Health</span><strong>Online</strong><small>{branchName(user?.branchId, branches)} API session active</small><div className="signal-bars"><i /><i /><i /><i /><i /></div></article>
      <Metric icon={Building2} label="Branches" value={String(dashboardReport?.branches ?? visibleBranches.length)} />
      <Metric icon={Utensils} label="Open Orders" value={String(activeOrders)} />
      <Metric icon={WalletCards} label="Paid Sales" value={formatCurrency(dashboardReport?.salesTotal ?? salesTotal(scopedTickets))} />
      <Metric icon={Flame} label="Payments" value={String(dashboardReport?.payments ?? kitchenCount(scopedTickets))} />
    </div>
    <div className="branch-grid">{visibleBranches.map((branch) => <BranchCard branch={branch} key={branch.id} />)}</div>
    <div className="action-row">{canOpenHq ? <button className="primary-button" type="button" onClick={() => setView("hq")}>Open HQ Analytics</button> : null}{canOpenBranch ? <button className="secondary-button" type="button" onClick={() => setView("branch")}>Open Branch Floor</button> : null}</div>
  </section>;
}

function PageTitle({ eyebrow, title, status }: { eyebrow: string; title: string; status: string }) {
  return <div className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div><div className="status-pill"><span /> {status}</div></div>;
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <article className="metric-card"><Icon size={24} /><span>{label}</span><strong>{value}</strong></article>;
}

function BranchCard({ branch, action }: { branch: Branch; action?: ReactNode }) {
  return <article className={branch.status === "Offline" ? "branch-card offline" : "branch-card"}>
    <div className="tag-row"><span className={branch.status === "Offline" ? "tag error" : "tag"}>{branch.status}</span><span>{branch.load}% load</span></div>
    <h3>{branch.name}</h3><p>{branch.detail}</p><div className="progress"><span style={{ width: `${branch.load}%` }} /></div>{action ? <div className="card-actions">{action}</div> : null}
  </article>;
}

function AdminView({ branches, setBranches, tables, setTables, users, setUsers, setNotice }: { branches: Branch[]; setBranches: (branches: Branch[]) => void; tables: DiningTable[]; setTables: (tables: DiningTable[]) => void; users: AdminPerson[]; setUsers: (users: AdminPerson[]) => void; setNotice: (notice: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [form, setForm] = useState({ name: "Steakz Birmingham", city: "Birmingham", detail: "Mailbox | 10 terminals" });
  const [staffForm, setStaffForm] = useState<{ branchId: number; role: Role }>({ branchId: 1, role: "WAITER" });

  async function createBranch(): Promise<void> {
    const next: Branch = { id: branches.length + 1, name: form.name, city: form.city, detail: form.detail, status: "Operational", load: 42 };
    try {
      const response = await api.post<{ success: true; data?: { id?: number } }>("/admin/branches", { name: next.name, city: next.city, address: next.detail, phone: "+44 121 000 0000" });
      next.id = response.data.data?.id ?? next.id;
    } catch {
      setNotice("Branch could not be created by the API.");
      return;
    }
    setBranches([...branches, next]);
    setTables([...tables, ...tablesForNewBranch(next.id, Math.max(...tables.map((table) => table.id), 0) + 1, next.city)]);
    setShowForm(false);
    setNotice(`${next.name} added.`);
  }

  function generatedStaff(): { name: string; email: string; password: string; label: string; roleLabel: string; branch: Branch } {
    const branch = branches.find((candidate) => candidate.id === staffForm.branchId) ?? branches[0];
    const role = staffRoleOptions.find((candidate) => candidate.apiRole === staffForm.role) ?? staffRoleOptions[0];
    const branchSlug = branch.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
    const roleSlug = role.label.toLowerCase().replace(/[^a-z0-9]+/g, ".");
    const existingCount = users.filter((user) => user.branch === branch.name && user.apiRole === role.apiRole).length;
    const sequence = existingCount + 1;
    return {
      branch,
      roleLabel: role.label,
      name: `${branch.city} ${role.label} ${sequence}`,
      email: `${branchSlug}.${roleSlug}.${sequence}@steakz.com`,
      password: `${role.label.replaceAll(" ", "")}@12345`,
      label: `${branch.city} ${role.label}`
    };
  }

  async function createStaffRole(): Promise<void> {
    const generated = generatedStaff();
    try {
      const response = await api.post<{ success: true; data: { id?: number } }>("/admin/users", {
        email: generated.email,
        password: generated.password,
        name: generated.name,
        role: staffForm.role,
        branchId: generated.branch.id
      });
      setUsers([...users, { id: users.length + 1, backendId: response.data.data.id ?? users.length + 5, email: generated.email, name: generated.name, branch: generated.branch.name, role: generated.roleLabel, apiRole: staffForm.role, status: "Active" }]);
      setShowStaffForm(false);
      setNotice(`${generated.name} created. Sign in with ${generated.email}.`);
    } catch {
      setNotice("Staff role could not be created by the API.");
    }
  }

  async function changeRole(id: number): Promise<void> {
    const target = users.find((user) => user.id === id);
    if (!target) return;

    const currentIndex = roleCycle.findIndex((role) => role.apiRole === target.apiRole);
    const nextRole = roleCycle[(currentIndex + 1) % roleCycle.length] ?? roleCycle[0];

    try {
      await api.patch(`/admin/users/${target.backendId}`, { role: nextRole.apiRole });
      setNotice(`${target.name} changed to ${nextRole.label}.`);
    } catch {
      setNotice("Role could not be changed by the API.");
      return;
    }

    setUsers(users.map((user) => user.id === id ? { ...user, role: nextRole.label, apiRole: nextRole.apiRole } : user));
  }

  async function removeStaffRole(id: number): Promise<void> {
    const target = users.find((user) => user.id === id);
    if (!target) return;

    const confirmed = window.confirm(`Remove ${target.name} from ${target.branch}?`);
    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${target.backendId}`);
      setUsers(users.filter((user) => user.id !== id));
      setNotice(`${target.name} removed.`);
    } catch {
      setNotice(`${target.name} could not be removed by the API.`);
    }
  }

  async function removeBranch(id: number): Promise<void> {
    const target = branches.find((branch) => branch.id === id);
    if (!target) return;

    const confirmed = window.confirm(`Remove ${target.name}? This also removes its tables, orders, and branch staff.`);
    if (!confirmed) return;

    try {
      await api.delete(`/admin/branches/${id}`);
      const remainingBranches = branches.filter((branch) => branch.id !== id);
      setBranches(remainingBranches);
      setTables(tables.filter((table) => table.branchId !== id));
      setUsers(users.filter((user) => user.branch !== target.name));
      if (staffForm.branchId === id && remainingBranches[0]) {
        setStaffForm({ ...staffForm, branchId: remainingBranches[0].id });
      }
      setNotice(`${target.name} removed.`);
    } catch {
      setNotice(`${target.name} could not be removed by the API.`);
    }
  }

  return <section className="page-grid">
    <PageTitle eyebrow="System Management" title="Admin Dashboard" status="Synced" />
    <div className="section-header"><div><h2>Branch Network</h2><p>UK-wide footprint management and deployment controls.</p></div><button className="primary-button" type="button" onClick={() => setShowForm(true)}>Add New Branch</button></div>
    {showForm ? <div className="form-panel">
      <label>Branch name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label>City<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
      <label>Details<input value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} /></label>
      <button className="primary-button" type="button" onClick={() => void createBranch()}>Create Branch</button><button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button>
    </div> : null}
    <div className="branch-grid">{branches.map((branch) => <BranchCard branch={branch} key={branch.id} action={<button className="danger-button compact" type="button" onClick={() => void removeBranch(branch.id)}>Remove Branch</button>} />)}</div>
    <div className="table-panel"><div className="section-header"><div><h2>Personnel Matrix</h2><p>Manage credentials and hierarchy.</p></div><button className="secondary-button" type="button" onClick={() => setShowStaffForm(true)}>Create Staff Role</button></div>
      {showStaffForm ? <div className="form-panel">
        <label>Branch<select value={staffForm.branchId} onChange={(event) => setStaffForm({ ...staffForm, branchId: Number(event.target.value) })}>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
        <label>Role<select value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value as Role })}>{staffRoleOptions.map((role) => <option key={role.apiRole} value={role.apiRole}>{role.label}</option>)}</select></label>
        <div className="modal-line">Name: {generatedStaff().name}</div>
        <div className="modal-line">Email: {generatedStaff().email}</div>
        <div className="modal-line">Password: {generatedStaff().password}</div>
        <button className="primary-button" type="button" onClick={() => void createStaffRole()}>Create Role Login</button><button className="secondary-button" type="button" onClick={() => setShowStaffForm(false)}>Cancel</button>
      </div> : null}
      <table><thead><tr><th>Employee</th><th>Branch</th><th>Role</th><th>Status</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.branch}</td><td><span className="tag">{user.role}</span></td><td>{user.status}</td><td><div className="table-actions"><button className="secondary-button compact" type="button" onClick={() => void changeRole(user.id)}>Change Role</button><button className="danger-button compact" type="button" onClick={() => void removeStaffRole(user.id)}>Remove</button></div></td></tr>)}</tbody></table>
    </div>
  </section>;
}

function HqView({ tickets, branches, tables, dashboardReport }: { tickets: Ticket[]; branches: Branch[]; tables: DiningTable[]; dashboardReport: DashboardReport | null }) {
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">("all");
  const selectedTickets = selectedBranchId === "all" ? tickets : tickets.filter((ticket) => ticket.branchId === selectedBranchId);
  const selectedTables = selectedBranchId === "all" ? tables : tables.filter((table) => table.branchId === selectedBranchId);
  const selectedBranches = selectedBranchId === "all" ? branches : branches.filter((branch) => branch.id === selectedBranchId);
  const isNetworkView = selectedBranchId === "all";
  const orderCount = isNetworkView && dashboardReport ? dashboardReport.orders : selectedTickets.length;
  const paidSales = isNetworkView && dashboardReport ? dashboardReport.salesTotal : salesTotal(selectedTickets);
  const paymentCount = isNetworkView && dashboardReport ? dashboardReport.payments : selectedTickets.filter((ticket) => ticket.status === "Paid").length;
  const branchBars = selectedBranches.map((branch) => ({
    branch,
    sales: salesTotal(tickets.filter((ticket) => ticket.branchId === branch.id)),
    orders: tickets.filter((ticket) => ticket.branchId === branch.id).length
  }));
  const maxBranchValue = Math.max(...branchBars.map((item) => item.sales), 0);

  useEffect(() => {
    if (selectedBranchId !== "all" && !branches.some((branch) => branch.id === selectedBranchId)) {
      setSelectedBranchId("all");
    }
  }, [branches, selectedBranchId]);

  return <section className="page-grid">
    <PageTitle eyebrow="Strategic Control" title="HQ Executive Suite" status="All branches online" />
    <div className="table-selector"><span className="eyebrow">Data scope</span><button className={selectedBranchId === "all" ? "selected" : ""} type="button" onClick={() => setSelectedBranchId("all")}><strong>All</strong><span>Network</span></button>{branches.map((branch) => <button className={selectedBranchId === branch.id ? "selected" : ""} key={branch.id} type="button" onClick={() => setSelectedBranchId(branch.id)}><strong>{branch.city}</strong><span>{branch.name}</span></button>)}</div>
    <div className="metric-grid"><Metric icon={WalletCards} label="Paid Sales" value={formatCurrency(paidSales)} /><Metric icon={Building2} label={isNetworkView ? "Branches" : "Tables"} value={String(isNetworkView && dashboardReport ? dashboardReport.branches : selectedTables.length)} /><Metric icon={Flame} label="Orders" value={String(orderCount)} /><Metric icon={BarChart3} label="Payments" value={String(paymentCount)} /></div>
    <div className="chart-panel"><h2>{isNetworkView ? "Multi-branch Performance" : `${selectedBranches[0]?.name ?? "Branch"} Performance`}</h2><div className="bar-chart">{branchBars.length ? branchBars.map((item) => <span className="chart-bar" key={item.branch.id} title={`${item.branch.name}: ${formatCurrency(item.sales)}, ${item.orders} orders`}><i style={{ height: chartHeight(item.sales, maxBranchValue) }} /><small>{item.branch.city}</small><strong>{formatCurrency(item.sales)}</strong></span>) : <span className="chart-bar"><i style={{ height: "8%" }} /><small>No data</small><strong>{formatCurrency(0)}</strong></span>}</div></div>
    <div className="branch-grid">{selectedBranches.map((branch) => <BranchCard branch={branch} key={branch.id} />)}</div>
    <div className="table-panel"><div className="section-header"><div><h2>{isNetworkView ? "Network Orders" : `${selectedBranches[0]?.city ?? "Branch"} Orders`}</h2><p>Live orders are filtered by the selected data scope.</p></div></div><table><thead><tr><th>Order</th><th>Branch</th><th>Table</th><th>Status</th><th>Total</th></tr></thead><tbody>{selectedTickets.length ? selectedTickets.map((ticket) => <tr key={ticket.id}><td>#{ticket.id}</td><td>{branchName(ticket.branchId, branches)}</td><td>{ticket.table}</td><td>{ticket.status}</td><td>{formatCurrency(ticket.total)}</td></tr>) : <tr><td colSpan={5}>No orders in this scope.</td></tr>}</tbody></table></div>
  </section>;
}

function BranchView({ setNotice, tickets, branches, tables }: { setNotice: (notice: string) => void; tickets: Ticket[]; branches: Branch[]; tables: DiningTable[] }) {
  const { user } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<number | "all">(user?.branchId ?? "all");
  const effectiveBranchId = user?.branchId ?? (selectedBranchId === "all" ? null : selectedBranchId);
  const isNetworkScope = effectiveBranchId === null;
  const branch = branchById(effectiveBranchId, branches);
  const branchTickets = isNetworkScope ? tickets : tickets.filter((ticket) => ticket.branchId === effectiveBranchId);
  const branchTables = isNetworkScope ? tables : tables.filter((table) => table.branchId === effectiveBranchId);
  const pageEyebrow = isNetworkScope ? "Network" : branch?.city ?? "Branch";
  const pageStatus = isNetworkScope ? "All Branches" : branch?.name ?? "Selected Branch";
  const activeTableIds = new Set(branchTickets.filter((ticket) => ticket.status !== "Paid").map((ticket) => ticket.tableId));
  const totalSeats = branchTables.reduce((sum, table) => sum + table.seats, 0);
  const occupiedSeats = branchTables.filter((table) => activeTableIds.has(table.id)).reduce((sum, table) => sum + table.seats, 0);
  const occupancy = totalSeats ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
  const branchChartValues = ["Confirmed", "Preparing", "Ready", "Paid"].map((status) => ({ status, count: branchTickets.filter((ticket) => ticket.status === status).length }));
  const maxBranchChartValue = Math.max(...branchChartValues.map((item) => item.count), 0);
  const [reportRows, setReportRows] = useState<SalesReportRow[] | null>(null);

  useEffect(() => {
    if (user?.branchId !== null && user?.branchId !== undefined) {
      setSelectedBranchId(user.branchId);
      return;
    }
    if (selectedBranchId !== "all" && branches.length && !branches.some((candidate) => candidate.id === selectedBranchId)) {
      setSelectedBranchId("all");
    }
  }, [branches, selectedBranchId, user?.branchId]);

  async function exportDailyReport(): Promise<void> {
    try {
      const endpoint = user?.branchId === null ? "/headquarters/reports/sales" : "/branch-manager/reports/daily-sales";
      const response = await api.get<{ success: true; data: SalesReportRow[] }>(endpoint, { params: effectiveBranchId === null ? {} : { branchId: effectiveBranchId } });
      setReportRows(response.data.data);
      setNotice("Daily sales report loaded.");
    } catch {
      setNotice("Daily sales report could not be loaded from the API.");
    }
  }

  return <section className="page-grid">
    <PageTitle eyebrow={pageEyebrow} title="Branch Operations" status={pageStatus} />
    {user?.branchId === null ? <div className="table-selector"><span className="eyebrow">Selected branch</span><button className={selectedBranchId === "all" ? "selected" : ""} type="button" onClick={() => {
      setSelectedBranchId("all");
      setReportRows(null);
    }}><strong>All</strong><span>Network</span></button>{branches.map((candidate) => <button className={selectedBranchId === candidate.id ? "selected" : ""} key={candidate.id} type="button" onClick={() => {
      setSelectedBranchId(candidate.id);
      setReportRows(null);
    }}><strong>{candidate.city}</strong><span>{candidate.name}</span></button>)}</div> : null}
    <div className="ops-grid"><article className="occupancy-card"><span className="eyebrow">Live Occupancy</span><div className="occupancy-ring"><strong>{occupancy}%</strong><span>{occupiedSeats} / {totalSeats} seats</span></div></article><Metric icon={Flame} label="Kitchen Queue" value={String(kitchenCount(branchTickets))} /><Metric icon={WalletCards} label="Paid Sales" value={formatCurrency(salesTotal(branchTickets))} /><Metric icon={UserRound} label="Tables" value={String(branchTables.length)} /><article className="chart-panel"><h2>Order Status Mix</h2><div className="bar-chart">{branchChartValues.map((item) => <span className="chart-bar" key={item.status} title={`${item.status}: ${item.count}`}><i style={{ height: chartHeight(item.count, maxBranchChartValue) }} /><small>{item.status}</small><strong>{item.count}</strong></span>)}</div></article></div>
    <button className="primary-button" type="button" onClick={() => void exportDailyReport()}>Show Daily Report</button>
    {reportRows ? <div className="table-panel"><div className="section-header"><div><h2>Daily Sales Report</h2><p>Loaded from the API.</p></div><button className="secondary-button compact" type="button" onClick={() => setReportRows(null)}>Close Report</button></div><table><thead><tr><th>Branch ID</th><th>Branch</th><th>Orders</th><th>Sales Total</th></tr></thead><tbody>{reportRows.map((row) => <tr key={row.branchId}><td>{row.branchId}</td><td>{row.branchName}</td><td>{row.orders}</td><td>{formatCurrency(row.salesTotal)}</td></tr>)}</tbody></table></div> : null}
    <div className="table-panel"><div className="section-header"><div><h2>{isNetworkScope ? "All Branch Orders" : `${branch?.name ?? "Selected Branch"} Orders`}</h2><p>{isNetworkScope ? "Orders from every branch are shown." : "Only orders from the selected branch are shown."}</p></div></div><table><thead><tr><th>Order</th><th>Branch</th><th>Table</th><th>Status</th><th>Customer</th><th>Total</th></tr></thead><tbody>{branchTickets.length ? branchTickets.map((ticket) => <tr key={ticket.id}><td>#{ticket.id}</td><td>{branchName(ticket.branchId, branches)}</td><td>{ticket.table}</td><td>{ticket.status}</td><td>{ticket.customer}</td><td>{formatCurrency(ticket.total)}</td></tr>) : <tr><td colSpan={6}>No orders for this scope.</td></tr>}</tbody></table></div>
    <div className="table-panel"><div className="section-header"><div><h2>{isNetworkScope ? "All Branch Tables" : `${branch?.name ?? "Selected Branch"} Tables`}</h2><p>Table data follows the selected branch scope.</p></div></div><table><thead><tr><th>Branch</th><th>Table</th><th>Zone</th><th>Seats</th><th>Status</th></tr></thead><tbody>{branchTables.length ? branchTables.map((table) => <tr key={table.id}><td>{branchName(table.branchId, branches)}</td><td>{table.number}</td><td>{table.zone}</td><td>{table.seats}</td><td>{activeTableIds.has(table.id) ? "Active" : "Empty"}</td></tr>) : <tr><td colSpan={5}>No tables for this scope.</td></tr>}</tbody></table></div>
  </section>;
}

function OrdersView({ role, tickets, setTickets, setNotice, tables, branches, menuItems }: { role: Role; tickets: Ticket[]; setTickets: (tickets: Ticket[]) => void; setNotice: (notice: string) => void; tables: DiningTable[]; branches: Branch[]; menuItems: CartItem[] }) {
  if (role === "WAITER") return <WaiterView tickets={tickets} setTickets={setTickets} setNotice={setNotice} tables={tables} menuItems={menuItems} />;
  return <CustomerView tickets={tickets} setTickets={setTickets} setNotice={setNotice} tables={tables} branches={branches} menuItems={menuItems} />;
}

function CustomerView({ tickets, setTickets, setNotice, tables, branches, menuItems }: { tickets: Ticket[]; setTickets: (tickets: Ticket[]) => void; setNotice: (notice: string) => void; tables: DiningTable[]; branches: Branch[]; menuItems: CartItem[] }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState(tables[0]?.branchId ?? branches[0]?.id ?? 0);
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id ?? 0);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const menuGroups = useMemo(() => groupMenuItems(menuItems), [menuItems]);
  const branchTables = useMemo(() => tables.filter((table) => table.branchId === selectedBranchId), [selectedBranchId, tables]);
  const selectedTable = branchTables.find((table) => table.id === selectedTableId) ?? branchTables[0] ?? null;

  useEffect(() => {
    if (tables.length && !tables.some((table) => table.branchId === selectedBranchId)) {
      setSelectedBranchId(tables[0].branchId);
    }
  }, [selectedBranchId, tables]);

  useEffect(() => {
    if (branchTables.length && !branchTables.some((table) => table.id === selectedTableId)) {
      setSelectedTableId(branchTables[0].id);
    }
  }, [branchTables, selectedTableId]);

  function addItem(item: CartItem): void {
    setCart([...cart, item]);
    setNotice(`${item.name} added.`);
  }

  async function placeOrder(): Promise<void> {
    if (!selectedTable) {
      setNotice("No table is available for guest ordering.");
      return;
    }

    let backendOrderId = Date.now();
    try {
      const response = await api.post<{ success: true; data: { id: number } }>("/customer/orders", { branchId: selectedTable.branchId, tableId: selectedTable.id, items: orderPayloadItems(cart) });
      backendOrderId = response.data.data.id;
      setNotice(`Order for table ${selectedTable.number} sent to waiter.`);
      setCart([]);
    } catch {
      setNotice(`Order for table ${selectedTable.number} could not be sent to the API.`);
      return;
    }
    setTickets([{
      id: Math.max(...tickets.map((ticket) => ticket.id), 44) + 1,
      backendOrderId,
      branchId: selectedTable.branchId,
      tableId: selectedTable.id,
      table: selectedTable.number,
      status: "Confirmed",
      items: cart.map((item) => item.name),
      time: "0m",
      customer: user?.name ?? user?.email ?? "Guest",
      total
    }, ...tickets]);
  }

  return <section className="page-grid"><PageTitle eyebrow="Guest Experience" title="Order & Pay" status={selectedTable ? `${branchName(selectedBranchId, branches)} table ${selectedTable.number}` : "No table"} /><div className="customer-grid"><article className="hero-food"><span className="eyebrow">Tonight's menu</span><h2>Build your order from the Steakz grill</h2><p>Select a branch and table, add the dishes you want, then send the order to the waiter.</p><strong>{cart.length ? formatCurrency(total) : "No items selected"}</strong></article><div className="menu-list"><div className="table-selector"><span className="eyebrow">Branch</span>{branches.filter((branch) => tables.some((table) => table.branchId === branch.id)).map((branch) => <button className={selectedBranchId === branch.id ? "selected" : ""} key={branch.id} type="button" onClick={() => setSelectedBranchId(branch.id)}><strong>{branch.city}</strong><span>{branch.name}</span></button>)}</div><div className="table-selector"><span className="eyebrow">Your table</span>{branchTables.length ? branchTables.map((table) => <button className={selectedTableId === table.id ? "selected" : ""} key={table.id} type="button" onClick={() => setSelectedTableId(table.id)}><strong>{table.number}</strong><span>{table.seats} seats</span></button>) : <div className="modal-line">No tables available for this branch.</div>}</div>{menuGroups.map((group) => <section className="menu-category" key={group.categoryId}><div className="menu-category-title"><span>{group.categoryName}</span><small>{group.items.length} items</small></div>{group.items.map((item) => <article className="menu-row" key={item.id}><div><h3>{item.name}</h3><p>{item.meta}</p></div><strong>{formatCurrency(item.price)}</strong><button type="button" onClick={() => addItem(item)}><Plus size={18} /></button></article>)}</section>)}</div><aside className="order-drawer"><h2>Current Order</h2><div className="receipt-line"><span>Branch</span><strong>{branchName(selectedBranchId, branches)}</strong></div><div className="receipt-line"><span>Table</span><strong>{selectedTable?.number ?? "None"}</strong></div>{cart.length ? cart.map((item, index) => <div className="receipt-line" key={`${item.id}-${index}`}><span>{item.name}</span><strong>{formatCurrency(item.price)}</strong></div>) : <div className="modal-line">No items selected yet.</div>}<div className="receipt-total"><span>Total</span><strong>{formatCurrency(total)}</strong></div><button className="primary-button" type="button" onClick={() => void placeOrder()} disabled={cart.length === 0 || !selectedTable}>Place Order</button></aside></div></section>;
}

function WaiterView({ tickets, setTickets, setNotice, tables, menuItems }: { tickets: Ticket[]; setTickets: (tickets: Ticket[]) => void; setNotice: (notice: string) => void; tables: DiningTable[]; menuItems: CartItem[] }) {
  const { user } = useAuth();
  const waiterBranchId = user?.role === "WAITER" && typeof user.branchId === "number" ? user.branchId : null;
  const branchTables = useMemo(() => tables.filter((table) => table.branchId === waiterBranchId), [tables, waiterBranchId]);
  const [selectedTableId, setSelectedTableId] = useState(tables[0]?.id ?? 0);
  const [tableOrders, setTableOrders] = useState<Record<number, CartItem[]>>({});
  const [selectedMenuItemId, setSelectedMenuItemId] = useState(menuItems[0]?.id ?? 0);
  const visibleTickets = tickets.filter((ticket) => ticket.branchId === waiterBranchId);
  const selectedTable = branchTables.find((table) => table.id === selectedTableId) ?? branchTables[0] ?? null;
  const items = selectedTable ? tableOrders[selectedTable.id] ?? [] : [];
  const pendingGuestTickets = selectedTable ? visibleTickets.filter((ticket) => ticket.branchId === selectedTable.branchId && ticket.tableId === selectedTable.id && ticket.status === "Confirmed") : [];
  const localTotal = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);
  const pendingTotal = useMemo(() => pendingGuestTickets.reduce((sum, ticket) => sum + ticket.total, 0), [pendingGuestTickets]);
  const total = localTotal + pendingTotal;
  const hasOrderWork = items.length > 0 || pendingGuestTickets.length > 0;
  const menuGroups = useMemo(() => groupMenuItems(menuItems), [menuItems]);
  const selectedMenuItem = menuItems.find((item) => item.id === selectedMenuItemId) ?? menuItems[0] ?? null;

  useEffect(() => {
    if (branchTables.length && !branchTables.some((table) => table.id === selectedTableId)) {
      setSelectedTableId(branchTables[0].id);
    }
  }, [branchTables, selectedTableId]);

  useEffect(() => {
    if (menuItems.length && !menuItems.some((item) => item.id === selectedMenuItemId)) {
      setSelectedMenuItemId(menuItems[0].id);
    }
  }, [menuItems, selectedMenuItemId]);

  function addSelectedItem(): void {
    if (!selectedTable) {
      setNotice("No table is assigned to this waiter branch.");
      return;
    }
    if (!selectedMenuItem) {
      setNotice("No menu items are available to add.");
      return;
    }

    setTableOrders({
      ...tableOrders,
      [selectedTable.id]: [...items, selectedMenuItem]
    });
    setNotice(`${selectedMenuItem.name} added to ${selectedTable.number}.`);
  }

  async function sendToKitchen(): Promise<void> {
    if (!selectedTable) {
      setNotice("No table is assigned to this waiter branch.");
      return;
    }

    if (!hasOrderWork) {
      setNotice(`${selectedTable.number} has no items to send.`);
      return;
    }

    if (pendingGuestTickets.length) {
      try {
        await Promise.all(pendingGuestTickets.map((ticket) => api.patch(`/waiter/orders/${ticket.backendOrderId}/status`, { status: "PREPARING" })));
      } catch {
        setNotice("Guest orders could not be sent to the kitchen by the API.");
        return;
      }
    }

    let backendOrderId = pendingGuestTickets[0]?.backendOrderId ?? Date.now();
    if (items.length) {
      try {
        if (!pendingGuestTickets.length) {
          const response = await api.post<{ success: true; data: { id: number } }>("/waiter/orders", { tableId: selectedTable.id, items: orderPayloadItems(items) });
          backendOrderId = response.data.data.id;
          await api.patch(`/waiter/orders/${response.data.data.id}/status`, { status: "PREPARING" });
        }
      } catch {
        setNotice(`${selectedTable.number} waiter-added items could not be sent to the API.`);
        return;
      }
    }

    const primaryPendingTicket = pendingGuestTickets[0];
    const mergedGuestTicket = primaryPendingTicket ? {
      ...primaryPendingTicket,
      status: "Preparing" as const,
      items: [...pendingGuestTickets.flatMap((ticket) => ticket.items), ...items.map((item) => item.name)],
      total
    } : null;
    const ticketsWithoutSelectedPending = tickets.filter((ticket) => !pendingGuestTickets.some((pending) => pending.id === ticket.id));
    const nextTickets = mergedGuestTicket ? [mergedGuestTicket, ...ticketsWithoutSelectedPending] : [{
      id: Math.max(...tickets.map((ticket) => ticket.id), 44) + 1,
      backendOrderId,
      branchId: selectedTable.branchId,
      tableId: selectedTable.id,
      table: selectedTable.number,
      status: "Preparing" as const,
      items: items.map((item) => item.name),
      time: "0m",
      customer: user?.name ?? user?.email ?? "Waiter order",
      total: localTotal
    }, ...tickets];
    setTickets(nextTickets);
    setTableOrders({ ...tableOrders, [selectedTable.id]: [] });
    setNotice(`${selectedTable.number} sent to kitchen.`);
  }

  if (!selectedTable) {
    return <section className="page-grid"><PageTitle eyebrow="Live Shift" title="Waiter Console" status="No branch tables" /><article className="ticket-card"><span className="eyebrow">Branch scope</span><h2>No tables assigned</h2><div className="modal-line">This waiter account is not linked to a branch with tables, so no orders are visible.</div></article></section>;
  }

  return <section className="page-grid"><PageTitle eyebrow="Live Shift" title="Waiter Console" status="Floor map" /><div className="waiter-grid"><article className="floor-map"><h2>Main Dining Hall</h2><div className="table-map">{branchTables.map((table) => {
    const tableItems = tableOrders[table.id] ?? [];
    const tableGuestTickets = visibleTickets.filter((ticket) => ticket.branchId === table.branchId && ticket.tableId === table.id && ticket.status === "Confirmed");
    const tableItemCount = tableItems.length + tableGuestTickets.reduce((sum, ticket) => sum + ticket.items.length, 0);
    return <button className={selectedTable.id === table.id ? "table-tile selected" : "table-tile"} key={table.id} type="button" onClick={() => setSelectedTableId(table.id)}><strong>{table.number}</strong><span>{table.seats} seats</span><small>{tableItemCount ? `${tableItemCount} items` : "Empty"}</small><small>{table.zone}</small></button>;
  })}</div></article><aside className="order-panel"><h2>Table {selectedTable.number}</h2><div className="receipt-line"><span>Zone</span><strong>{selectedTable.zone}</strong></div><div className="receipt-line"><span>Capacity</span><strong>{selectedTable.seats} seats</strong></div><div className="receipt-line"><span>Status</span><strong>{hasOrderWork ? pendingGuestTickets.length ? "Guest order pending" : "Active waiter order" : "Empty"}</strong></div>{pendingGuestTickets.map((ticket) => <div className="modal-line" key={ticket.id}>Guest order #{ticket.id}: {ticket.items.join(", ")}</div>)}{items.length ? items.map((item, index) => <div className="receipt-line" key={`${item.id}-${index}`}><span>{item.name}</span><strong>{formatCurrency(item.price)}</strong></div>) : pendingGuestTickets.length ? null : <div className="modal-line">No items on this table yet.</div>}<div className="menu-picker"><span className="eyebrow">Add item</span>{menuGroups.map((group) => <div className="menu-picker-category" key={group.categoryId}><div className="menu-category-title"><span>{group.categoryName}</span><small>{group.items.length}</small></div>{group.items.map((item) => <button className={selectedMenuItemId === item.id ? "selected" : ""} key={item.id} type="button" onClick={() => setSelectedMenuItemId(item.id)}><span>{item.name}</span><strong>{formatCurrency(item.price)}</strong></button>)}</div>)}</div><button className="secondary-button" type="button" onClick={addSelectedItem}><Plus size={18} /> Add Selected Item</button><div className="receipt-total"><span>Total</span><strong>{formatCurrency(total)}</strong></div><button className="primary-button" type="button" onClick={() => void sendToKitchen()} disabled={!hasOrderWork}>Send to Kitchen</button></aside></div></section>;
}

function KitchenView({ tickets, setTickets, setNotice, branches }: { tickets: Ticket[]; setTickets: (tickets: Ticket[]) => void; setNotice: (notice: string) => void; branches: Branch[] }) {
  const { user } = useAuth();
  async function markReady(ticket: Ticket): Promise<void> {
    try {
      await api.patch(`/chef/kitchen-orders/${ticket.backendOrderId}/status`, { status: "READY" });
    } catch {
      setNotice("Kitchen status could not be updated by the API.");
      return;
    }
    setTickets(tickets.map((candidate) => candidate.id === ticket.id ? { ...candidate, status: "Ready" } : candidate));
    setNotice(`Ticket #${ticket.id} marked ready.`);
  }

  const kitchenTickets = tickets.filter((ticket) => (user?.branchId === null || ticket.branchId === user?.branchId) && (ticket.status === "Preparing" || ticket.status === "Ready"));

  return <section className="page-grid"><PageTitle eyebrow="Kitchen Display" title="Kitchen Orders" status="Fire line active" /><div className="ticket-grid">{kitchenTickets.length ? kitchenTickets.map((ticket) => <article className="ticket-card" key={ticket.id}><div className="tag-row"><span className="tag">#{ticket.id}</span><span>{ticket.time}</span></div><h2>{ticket.table}</h2><span className="eyebrow">{ticket.status}</span>{ticket.items.map((item) => <div className="modal-line" key={item}>{item}</div>)}<button className="primary-button" type="button" onClick={() => void markReady(ticket)} disabled={ticket.status === "Ready"}>Mark Ready</button></article>) : <article className="ticket-card"><span className="eyebrow">Queue clear</span><h2>No kitchen orders</h2><div className="modal-line">Waiter-sent orders for {branchName(user?.branchId, branches)} will appear here.</div></article>}</div></section>;
}

function PaymentsView({ tickets, setTickets, setNotice, menuItems }: { tickets: Ticket[]; setTickets: (tickets: Ticket[]) => void; setNotice: (notice: string) => void; menuItems: CartItem[] }) {
  const { user } = useAuth();
  const payableTickets = tickets.filter((ticket) => (user?.branchId === null || ticket.branchId === user?.branchId) && ticket.status === "Ready");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(payableTickets[0]?.id ?? null);
  const selectedTicket = payableTickets.find((ticket) => ticket.id === selectedTicketId) ?? payableTickets[0] ?? null;
  const subtotal = selectedTicket?.total ?? 0;
  const service = subtotal * 0.15;
  const [amount, setAmount] = useState(selectedTicket ? (selectedTicket.total * 1.15).toFixed(2) : "0");
  const [method, setMethod] = useState("Credit/Debit");
  const [printedReceipt, setPrintedReceipt] = useState<{ ticket: Ticket; subtotal: number; service: number; amount: string; method: string } | null>(null);

  useEffect(() => {
    if (!selectedTicket && payableTickets[0]) {
      setSelectedTicketId(payableTickets[0].id);
      setAmount((payableTickets[0].total * 1.15).toFixed(2));
    } else if (!selectedTicket && !payableTickets.length) {
      setSelectedTicketId(null);
      setAmount("0");
    }
  }, [payableTickets, selectedTicket]);

  useEffect(() => {
    if (selectedTicket) {
      setAmount((selectedTicket.total * 1.15).toFixed(2));
    }
    setPrintedReceipt(null);
  }, [selectedTicket?.id]);

  function keyPress(key: string): void {
    if (key === "back") setAmount(amount.slice(0, -1) || "0");
    else if (key === "." && amount.includes(".")) return;
    else setAmount(amount === "0" ? key : `${amount}${key}`);
  }

  async function complete(): Promise<void> {
    if (!selectedTicket) {
      setNotice("No ready order selected for payment.");
      return;
    }

    try {
      await api.post("/cashier/payments", { orderId: selectedTicket.backendOrderId, method: method === "Cash" ? "CASH" : method === "Steakz App" ? "ONLINE" : "CARD", amount: Number(amount || "0") });
      setNotice(`${method} payment completed for table ${selectedTicket.table}.`);
    } catch {
      setNotice(`${method} payment could not be recorded by the API.`);
      return;
    }

    setTickets(tickets.map((ticket) => ticket.id === selectedTicket.id ? { ...ticket, status: "Paid" } : ticket));
  }

  function printReceipt(): void {
    if (!selectedTicket) {
      setNotice("No receipt to print.");
      return;
    }

    setPrintedReceipt({ ticket: selectedTicket, subtotal, service, amount, method });
    setNotice(`Receipt preview shown for table ${selectedTicket.table}.`);
  }

  return <section className="page-grid"><PageTitle eyebrow="Cashier Terminal" title="Checkout System" status={selectedTicket ? `Table ${selectedTicket.table} active` : "No ready orders"} /><div className="cashier-grid"><article className="bill-panel"><h2>{selectedTicket ? `Table ${selectedTicket.table}` : "Ready Orders"}</h2><div className="payment-methods">{payableTickets.length ? payableTickets.map((ticket) => <button className={selectedTicket?.id === ticket.id ? "selected" : ""} key={ticket.id} type="button" onClick={() => setSelectedTicketId(ticket.id)}>{ticket.table} #{ticket.id}</button>) : <button type="button" disabled>No ready orders</button>}</div>{selectedTicket ? <><div className="receipt-line"><span>Customer</span><strong>{selectedTicket.customer}</strong></div>{selectedTicket.items.map((item, index) => <div className="receipt-line" key={`${item}-${index}`}><span>{item}</span><strong>{formatCurrency(priceForTicketItem(item, selectedTicket, menuItems))}</strong></div>)}<div className="receipt-line"><span>Service Charge</span><strong>{formatCurrency(service)}</strong></div><div className="receipt-total"><span>Total</span><strong>{formatCurrency(subtotal + service)}</strong></div></> : <div className="modal-line">Mark an order ready in the chef page first.</div>}</article><article className="keypad-panel"><span className="eyebrow">Payment Amount</span><div className="amount-display">{formatCurrency(Number(amount || "0"))}</div><div className="keypad">{["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((key) => <button key={key} type="button" onClick={() => keyPress(key)}>{key}</button>)}<button type="button" onClick={() => keyPress("back")}><Minus size={18} /></button></div><div className="payment-methods">{["Steakz App", "Credit/Debit", "Cash"].map((item) => <button className={method === item ? "selected" : ""} key={item} type="button" onClick={() => setMethod(item)}>{item}</button>)}</div></article><aside className="paper-receipt"><h2>STEAKZ</h2><p>{selectedTicket ? `${selectedTicket.table} | ${selectedTicket.customer}` : "No active bill"}</p><div className="receipt-total"><span>Total Due</span><strong>{formatCurrency(Number(amount || "0"))}</strong></div><button className="secondary-button" type="button" onClick={printReceipt} disabled={!selectedTicket}><Printer size={18} /> Print</button><button className="primary-button" type="button" onClick={() => void complete()} disabled={!selectedTicket}>Complete</button></aside></div>{printedReceipt ? <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Printed receipt preview"><article className="modal-card paper-receipt"><h2>PRINTED RECEIPT</h2><p>{printedReceipt.ticket.table} | {printedReceipt.ticket.customer}</p><div className="receipt-line"><span>Order</span><strong>#{printedReceipt.ticket.id}</strong></div><div className="receipt-line"><span>Payment</span><strong>{printedReceipt.method}</strong></div>{printedReceipt.ticket.items.map((item, index) => <div className="receipt-line" key={`printed-${item}-${index}`}><span>{item}</span><strong>{formatCurrency(priceForTicketItem(item, printedReceipt.ticket, menuItems))}</strong></div>)}<div className="receipt-line"><span>Subtotal</span><strong>{formatCurrency(printedReceipt.subtotal)}</strong></div><div className="receipt-line"><span>Service Charge</span><strong>{formatCurrency(printedReceipt.service)}</strong></div><div className="receipt-total"><span>Printed Total</span><strong>{formatCurrency(Number(printedReceipt.amount || "0"))}</strong></div><button className="secondary-button compact" type="button" onClick={() => setPrintedReceipt(null)}>Close Receipt</button></article></div> : null}</section>;
}

export function App() {
  const { user } = useAuth();
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<View>(user ? roleHome[user.role] : "dashboard");
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [tables, setTables] = useState<DiningTable[]>(initialDiningTables);
  const [adminUsers, setAdminUsers] = useState<AdminPerson[]>(initialAdminPeople);
  const [dashboardReport, setDashboardReport] = useState<DashboardReport | null>(null);
  const [menuItems, setMenuItems] = useState<CartItem[]>(fallbackMenuItems);

  useEffect(() => {
    if (user) setView(roleHome[user.role]);
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const activeUser = user;

    async function loadRoleData(): Promise<void> {
      try {
        if (activeUser.role === "ADMIN") {
          const [branchResponse, userResponse, dashboardResponse, tableResponse, orderResponse, menuResponse, categoryResponse] = await Promise.all([
            api.get<ApiResponse<BackendBranch[]>>("/admin/branches"),
            api.get<ApiResponse<ApiUser[]>>("/admin/users"),
            api.get<ApiResponse<DashboardReport>>("/headquarters/dashboard"),
            api.get<ApiResponse<BackendTable[]>>("/headquarters/tables"),
            api.get<ApiResponse<BackendOrder[]>>("/headquarters/orders"),
            api.get<ApiResponse<BackendMenuItem[]>>("/headquarters/menu-items"),
            api.get<ApiResponse<BackendMenuCategory[]>>("/headquarters/menu-categories")
          ]);
          if (cancelled) return;
          const nextBranches = branchResponse.data.success ? branchResponse.data.data.map(mapBranch) : initialBranches;
          const nextTables = tableResponse.data.success ? tableResponse.data.data.map(mapTable) : initialDiningTables;
          const nextCategories = categoryResponse.data.success ? categoryResponse.data.data : [];
          const nextMenuItems = menuResponse.data.success ? menuResponse.data.data.filter((item) => item.isActive).map((item) => mapMenuItem(item, nextCategories)) : fallbackMenuItems;
          setBranches(nextBranches);
          setTables(nextTables);
          setMenuItems(nextMenuItems);
          if (dashboardResponse.data.success) setDashboardReport(dashboardResponse.data.data);
          if (orderResponse.data.success) setTickets(orderResponse.data.data.map((order) => mapTicket(order, nextTables, nextMenuItems)).filter((ticket): ticket is Ticket => ticket !== null));
          if (userResponse.data.success) {
            setAdminUsers(userResponse.data.data.filter((candidate) => candidate.role !== "CUSTOMER").map((candidate) => mapAdminPerson(candidate, nextBranches)));
          }
          return;
        }

        if (activeUser.role === "HEADQUARTERS_MANAGER") {
          const [branchResponse, dashboardResponse, tableResponse, orderResponse, menuResponse, categoryResponse] = await Promise.all([
            api.get<ApiResponse<BackendBranch[]>>("/headquarters/branches"),
            api.get<ApiResponse<DashboardReport>>("/headquarters/dashboard"),
            api.get<ApiResponse<BackendTable[]>>("/headquarters/tables"),
            api.get<ApiResponse<BackendOrder[]>>("/headquarters/orders"),
            api.get<ApiResponse<BackendMenuItem[]>>("/headquarters/menu-items"),
            api.get<ApiResponse<BackendMenuCategory[]>>("/headquarters/menu-categories")
          ]);
          if (cancelled) return;
          const nextTables = tableResponse.data.success ? tableResponse.data.data.map(mapTable) : initialDiningTables;
          const nextCategories = categoryResponse.data.success ? categoryResponse.data.data : [];
          const nextMenuItems = menuResponse.data.success ? menuResponse.data.data.filter((item) => item.isActive).map((item) => mapMenuItem(item, nextCategories)) : fallbackMenuItems;
          if (branchResponse.data.success) setBranches(branchResponse.data.data.map(mapBranch));
          setTables(nextTables);
          setMenuItems(nextMenuItems);
          if (dashboardResponse.data.success) setDashboardReport(dashboardResponse.data.data);
          if (orderResponse.data.success) setTickets(orderResponse.data.data.map((order) => mapTicket(order, nextTables, nextMenuItems)).filter((ticket): ticket is Ticket => ticket !== null));
          return;
        }

        if (activeUser.role === "BRANCH_MANAGER") {
          const [tableResponse, orderResponse, dashboardResponse] = await Promise.all([
            api.get<ApiResponse<BackendTable[]>>("/branch-manager/tables"),
            api.get<ApiResponse<BackendOrder[]>>("/branch-manager/orders"),
            api.get<ApiResponse<DashboardReport>>("/branch-manager/dashboard")
          ]);
          if (cancelled) return;
          const nextTables = tableResponse.data.success ? tableResponse.data.data.map(mapTable) : [];
          setTables(nextTables);
          if (dashboardResponse.data.success) setDashboardReport(dashboardResponse.data.data);
          if (orderResponse.data.success) setTickets(orderResponse.data.data.map((order) => mapTicket(order, nextTables, menuItems)).filter((ticket): ticket is Ticket => ticket !== null));
          return;
        }

        if (activeUser.role === "WAITER") {
          const [tableResponse, orderResponse, menuResponse, categoryResponse] = await Promise.all([
            api.get<ApiResponse<BackendTable[]>>("/waiter/tables"),
            api.get<ApiResponse<BackendOrder[]>>("/waiter/orders"),
            api.get<ApiResponse<BackendMenuItem[]>>("/waiter/menu"),
            api.get<ApiResponse<BackendMenuCategory[]>>("/waiter/menu-categories")
          ]);
          if (cancelled) return;
          const nextTables = tableResponse.data.success ? tableResponse.data.data.map(mapTable) : [];
          const nextCategories = categoryResponse.data.success ? categoryResponse.data.data : [];
          const nextMenuItems = menuResponse.data.success ? menuResponse.data.data.map((item) => mapMenuItem(item, nextCategories)) : fallbackMenuItems;
          setTables(nextTables);
          setMenuItems(nextMenuItems);
          if (orderResponse.data.success) setTickets(orderResponse.data.data.map((order) => mapTicket(order, nextTables, nextMenuItems)).filter((ticket): ticket is Ticket => ticket !== null));
          return;
        }

        if (activeUser.role === "CHEF") {
          const [tableResponse, orderResponse] = await Promise.all([
            api.get<ApiResponse<BackendTable[]>>("/chef/tables"),
            api.get<ApiResponse<BackendOrder[]>>("/chef/kitchen-orders")
          ]);
          if (cancelled) return;
          const nextTables = tableResponse.data.success ? tableResponse.data.data.map(mapTable) : [];
          setTables(nextTables);
          if (orderResponse.data.success) setTickets(orderResponse.data.data.map((order) => mapTicket(order, nextTables, menuItems)).filter((ticket): ticket is Ticket => ticket !== null));
          return;
        }

        if (activeUser.role === "CASHIER") {
          const [tableResponse, orderResponse, dashboardResponse] = await Promise.all([
            api.get<ApiResponse<BackendTable[]>>("/cashier/tables"),
            api.get<ApiResponse<BackendOrder[]>>("/cashier/orders/ready-to-pay"),
            api.get<ApiResponse<{ count: number; total: number }>>("/cashier/reports/payment-summary")
          ]);
          if (cancelled) return;
          const nextTables = tableResponse.data.success ? tableResponse.data.data.map(mapTable) : [];
          setTables(nextTables);
          if (dashboardResponse.data.success) setDashboardReport({ branches: 1, users: 1, orders: orderResponse.data.success ? orderResponse.data.data.length : 0, payments: dashboardResponse.data.data.count, salesTotal: dashboardResponse.data.data.total });
          if (orderResponse.data.success) setTickets(orderResponse.data.data.map((order) => mapTicket(order, nextTables, menuItems)).filter((ticket): ticket is Ticket => ticket !== null));
          return;
        }

        if (activeUser.role === "CUSTOMER") {
          const [tableResponse, orderResponse, menuResponse, categoryResponse] = await Promise.all([
            api.get<ApiResponse<BackendTable[]>>("/customer/tables"),
            api.get<ApiResponse<BackendOrder[]>>("/customer/orders"),
            api.get<ApiResponse<BackendMenuItem[]>>("/customer/menu"),
            api.get<ApiResponse<BackendMenuCategory[]>>("/customer/menu-categories")
          ]);
          if (cancelled) return;
          const nextTables = tableResponse.data.success ? tableResponse.data.data.map(mapTable) : [];
          const nextCategories = categoryResponse.data.success ? categoryResponse.data.data : [];
          const nextMenuItems = menuResponse.data.success ? menuResponse.data.data.map((item) => mapMenuItem(item, nextCategories)) : fallbackMenuItems;
          setTables(nextTables);
          setMenuItems(nextMenuItems);
          if (orderResponse.data.success) setTickets(orderResponse.data.data.map((order) => mapTicket(order, nextTables, nextMenuItems)).filter((ticket): ticket is Ticket => ticket !== null));
        }
      } catch {
        if (!cancelled) setNotice("Could not load live data for this role.");
      }
    }

    void loadRoleData();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, user?.branchId]);

  if (!user) return <LoginScreen />;

  const role = user.role;
  const actualView = navItems.some((item) => item.view === view && item.roles.includes(role)) ? view : roleHome[role];

  return <Shell view={actualView} setView={setView} notice={notice} branches={branches} tables={tables} tickets={tickets}>
    {actualView === "dashboard" ? <DashboardView setView={setView} tickets={tickets} branches={branches} dashboardReport={dashboardReport} /> : null}
    {actualView === "admin" ? <AdminView branches={branches} setBranches={setBranches} tables={tables} setTables={setTables} users={adminUsers} setUsers={setAdminUsers} setNotice={setNotice} /> : null}
    {actualView === "hq" ? <HqView tickets={tickets} branches={branches} tables={tables} dashboardReport={dashboardReport} /> : null}
    {actualView === "branch" ? <BranchView setNotice={setNotice} tickets={tickets} branches={branches} tables={tables} /> : null}
    {actualView === "orders" ? <OrdersView role={role} tickets={tickets} setTickets={setTickets} setNotice={setNotice} tables={tables} branches={branches} menuItems={menuItems} /> : null}
    {actualView === "kitchen" ? <KitchenView tickets={tickets} setTickets={setTickets} setNotice={setNotice} branches={branches} /> : null}
    {actualView === "payments" ? <PaymentsView tickets={tickets} setTickets={setTickets} setNotice={setNotice} menuItems={menuItems} /> : null}
  </Shell>;
}
