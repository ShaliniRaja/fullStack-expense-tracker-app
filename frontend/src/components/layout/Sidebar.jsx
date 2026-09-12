import React from "react";
import { LayoutDashboard, ArrowLeftRight, PieChart, PiggyBank, TrendingUp, Send, Plus, Share2, LogOut, Menu } from "lucide-react";
import { THEME } from "../../constants/theme";
import EyeToggle from "../common/EyeToggle";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "transactions", label: "Transactions", icon: ArrowLeftRight },
  { key: "budgets", label: "Budgets", icon: PieChart },
  { key: "savings", label: "Savings", icon: PiggyBank },
  { key: "trends", label: "Trends", icon: TrendingUp },
  { key: "sendmoney", label: "Send Money", icon: Send },
];

// Every role sees every page now — VISITOR's restriction is amounts
// being masked (enforced server-side), not which pages exist in the
// nav. Kept as a function (not just NAV_ITEMS directly) in case a
// role-based nav difference is ever needed again.
function visibleItems() {
  return NAV_ITEMS;
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
      style={{ background: active ? THEME.greenDim : "transparent", color: active ? THEME.green : THEME.sub }}
    >
      <Icon size={17} strokeWidth={2} />
      {label}
    </button>
  );
}

export default function Sidebar({ view, setView, onAdd, onExport, userEmail, isVisitor, onLogout }) {
  const items = visibleItems();

  return (
    <div
      className="sidebar-width shrink-0 flex flex-col justify-between px-4 py-6"
      style={{ background: THEME.bg, borderRight: `1px solid ${THEME.cardBorder}` }}
    >
      <div>
        <div className="flex items-center justify-between px-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: THEME.green, color: "#06280f" }}>
              $
            </div>
            <span className="font-bold text-15" style={{ color: THEME.text }}>Ledger</span>
          </div>
          <EyeToggle />
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <NavItem key={item.key} icon={item.icon} label={item.label} active={view === item.key} onClick={() => setView(item.key)} />
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        {!isVisitor && (
          <>
            <button
              onClick={onAdd}
              className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-opacity hover-opacity"
              style={{ background: THEME.green, color: "#06280f" }}
            >
              <Plus size={16} strokeWidth={2.5} /> Add Transaction
            </button>
            <button
              onClick={onExport}
              className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-opacity hover-opacity"
              style={{ background: THEME.inputBg, color: THEME.text, border: `1px solid ${THEME.cardBorder}` }}
            >
              <Share2 size={15} /> Export &amp; Share
            </button>
          </>
        )}
        <div className="flex items-center justify-between gap-2.5 pt-3 mt-1" style={{ borderTop: `1px solid ${THEME.cardBorder}` }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: THEME.greenDim, color: THEME.green }}>
              {(userEmail || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: THEME.text }}>{userEmail || "Signed in"}</div>
            </div>
          </div>
          <button onClick={onLogout} title="Log out" style={{ color: THEME.faint }} className="shrink-0">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Top bar shown only on mobile: hamburger (opens a lightweight menu for
// Export/Logout), the logo, the eye toggle (Husband/Wife only — VISITOR
// has nothing to toggle, it's permanently masked), and a persistent "+"
// for Add Transaction so it's reachable from every page on small screens
// without needing the desktop sidebar.
export function MobileTopBar({ onOpenMenu, onAdd, isVisitor }) {
  return (
    <div className="mobile-topbar" style={{ background: THEME.bg, borderBottom: `1px solid ${THEME.cardBorder}` }}>
      <button onClick={onOpenMenu} style={{ color: THEME.text }}>
        <Menu size={22} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: THEME.green, color: "#06280f" }}>
          $
        </div>
        <span className="font-bold text-15" style={{ color: THEME.text }}>Ledger</span>
      </div>
      <div className="flex items-center gap-3">
        {!isVisitor && <EyeToggle size={18} />}
        {isVisitor ? (
          <div style={{ width: 18 }} />
        ) : (
          <button
            onClick={onAdd}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: THEME.green, color: "#06280f" }}
            title="Add Transaction"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  );
}

// Bottom horizontal nav shown only on mobile — the primary way to move
// between pages on a small screen, replacing the old off-canvas drawer.
export function BottomNav({ view, setView, isVisitor }) {
  const items = visibleItems();

  return (
    <div className="bottom-nav" style={{ background: THEME.bg, borderTop: `1px solid ${THEME.cardBorder}` }}>
      {items.map((item) => {
        const active = view === item.key;
        return (
          <button
            key={item.key}
            onClick={() => setView(item.key)}
            className="bottom-nav-item"
            style={{ color: active ? THEME.green : THEME.faint }}
          >
            <item.icon size={18} strokeWidth={2} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Lightweight slide-down menu for Export & Share / Logout on mobile —
// the things that used to live at the bottom of the full sidebar drawer.
export function MobileMenu({ open, onClose, onExport, onLogout, userEmail, isVisitor }) {
  if (!open) return null;
  return (
    <>
      <div className="mobile-menu-backdrop" onClick={onClose} />
      <div className="mobile-menu-sheet" style={{ background: THEME.card, border: `1px solid ${THEME.cardBorder}` }}>
        <div className="flex items-center gap-2.5 mb-4 pb-4" style={{ borderBottom: `1px solid ${THEME.cardBorder}` }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: THEME.greenDim, color: THEME.green }}>
            {(userEmail || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="text-sm font-semibold truncate" style={{ color: THEME.text }}>{userEmail || "Signed in"}</div>
        </div>
        {!isVisitor && (
          <button
            onClick={() => { onExport(); onClose(); }}
            className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 mb-2"
            style={{ background: THEME.inputBg, color: THEME.text, border: `1px solid ${THEME.cardBorder}` }}
          >
            <Share2 size={15} /> Export &amp; Share
          </button>
        )}
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5"
          style={{ background: THEME.inputBg, color: THEME.red, border: `1px solid ${THEME.cardBorder}` }}
        >
          <LogOut size={15} /> Log out
        </button>
      </div>
    </>
  );
}
