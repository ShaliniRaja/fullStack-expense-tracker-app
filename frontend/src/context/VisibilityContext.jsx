import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const VisibilityContext = createContext(null);
const STORAGE_KEY = "ledger_amounts_hidden";

// Purely a display preference for HUSBAND/WIFE — the backend always
// sends them real numbers regardless of this toggle; hiding them here
// is a convenience (e.g. glancing at the app in public), not a security
// boundary. For VISITOR, hidden is permanently true and can't be
// toggled — but that's belt-and-suspenders: the real enforcement is
// server-side (VISITOR's transaction amounts come back as null no
// matter what this context does — see TransactionController).
export function VisibilityProvider({ children }) {
  const { isVisitor } = useAuth();
  const [hidden, setHidden] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");

  useEffect(() => {
    if (!isVisitor) {
      localStorage.setItem(STORAGE_KEY, String(hidden));
    }
  }, [hidden, isVisitor]);

  const toggle = () => {
    if (isVisitor) return; // no-op — visitors can't reveal amounts
    setHidden((h) => !h);
  };

  return (
    <VisibilityContext.Provider value={{ hidden: isVisitor ? true : hidden, toggle, locked: isVisitor }}>
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibility() {
  const ctx = useContext(VisibilityContext);
  if (!ctx) throw new Error("useVisibility must be used within a VisibilityProvider");
  return ctx;
}

// Small helper used throughout the pages: mask(fmt(value)) instead of fmt(value).
export function maskValue(hidden, formatted) {
  return hidden ? "••••" : formatted;
}
