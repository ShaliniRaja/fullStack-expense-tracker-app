import {
  ShoppingCart, Car, FileText, Gift, Pill, ShoppingBag, Wallet, Send, MoreHorizontal,
} from "lucide-react";

export const CATEGORIES = {
  Food: { color: "#f59e0b", icon: ShoppingCart, bg: "#3a2a12" },
  Transport: { color: "#3b82f6", icon: Car, bg: "#132038" },
  Shopping: { color: "#a855f7", icon: ShoppingBag, bg: "#241338" },
  Bills: { color: "#f4485f", icon: FileText, bg: "#3a1420" },
  Health: { color: "#22d67c", icon: Pill, bg: "#0f2a1e" },
  Entertainment: { color: "#22d3ee", icon: Gift, bg: "#0f2a30" },
  Misc: { color: "#94a3b8", icon: MoreHorizontal, bg: "#1e2735" },
  Income: { color: "#22d67c", icon: Wallet, bg: "#0f2a1e" },
  "Send Money": { color: "#f472b6", icon: Send, bg: "#3a1a2e" },
};

export const EXPENSE_CATEGORY_NAMES = ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Misc", "Send Money"];

export const SEND_MONEY_CATEGORY = "Send Money";
