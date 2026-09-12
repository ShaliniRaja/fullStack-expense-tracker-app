import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { THEME } from "../constants/theme";
import Label from "../components/common/Label";
import TextInput from "../components/common/TextInput";

export default function Login() {
  const { login, register, error, pending, clearError } = useAuth();
  const [mode, setMode] = useState("signin"); // "signin" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("HUSBAND");
  const [formError, setFormError] = useState("");

  const switchMode = (next) => {
    setMode(next);
    setFormError("");
    clearError();
    setPassword("");
    setConfirmPassword("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (mode === "register") {
      if (password.length < 8) {
        setFormError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Passwords don't match.");
        return;
      }
      await register(email.trim(), password, role);
    } else {
      await login(email.trim(), password);
    }
  };

  const isRegister = mode === "register";
  const shownError = formError || error;

  return (
    <div className="w-full flex items-center justify-center" style={{ minHeight: "100vh", background: THEME.bg }}>
      <form
        onSubmit={submit}
        className="rounded-2xl p-6"
        style={{ background: THEME.card, border: `1px solid ${THEME.cardBorder}`, width: "min(92vw, 360px)" }}
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: THEME.green, color: "#06280f" }}>
            $
          </div>
          <span className="font-bold text-15" style={{ color: THEME.text }}>Ledger</span>
        </div>

        <h1 className="text-2xl font-bold mb-1" style={{ color: THEME.text }}>
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm mb-6" style={{ color: THEME.sub }}>
          {isRegister ? "Sign up with your email and a password." : "Sign in to your Ledger account."}
        </p>

        <div className="mb-4">
          <Label>EMAIL</Label>
          <TextInput
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-2">
          <Label>PASSWORD</Label>
          <TextInput
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {isRegister && (
          <div className="mb-2">
            <Label>CONFIRM PASSWORD</Label>
            <TextInput
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
        )}

        {isRegister && (
          <div className="mb-2">
            <Label>ROLE</Label>
            <div className="flex rounded-xl overflow-hidden" style={{ border: `1px solid ${THEME.cardBorder}` }}>
              {["HUSBAND", "WIFE", "VISITOR"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="flex-1 py-2.5 text-xs font-semibold"
                  style={{ background: role === r ? THEME.inputBg : "transparent", color: role === r ? THEME.text : THEME.sub }}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            {role === "VISITOR" && (
              <div className="text-xs mt-1.5" style={{ color: THEME.faint }}>
                Visitor accounts can view every page, but every amount is always hidden and nothing can be edited.
              </div>
            )}
          </div>
        )}

        {shownError && (
          <div className="text-xs font-medium mt-2" style={{ color: THEME.red }}>{shownError}</div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 rounded-xl font-semibold text-sm mt-5"
          style={{ background: THEME.green, color: "#06280f", opacity: pending ? 0.7 : 1 }}
        >
          {pending ? (isRegister ? "Creating account…" : "Signing in…") : (isRegister ? "Create account" : "Sign in")}
        </button>

      </form>
    </div>
  );
}
