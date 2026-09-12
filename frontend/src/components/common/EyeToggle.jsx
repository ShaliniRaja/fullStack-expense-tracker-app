import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useVisibility } from "../../context/VisibilityContext";
import { THEME } from "../../constants/theme";

export default function EyeToggle({ size = 16 }) {
  const { hidden, toggle, locked } = useVisibility();

  return (
    <button
      onClick={toggle}
      disabled={locked}
      title={locked ? "Visitor accounts can't reveal amounts" : hidden ? "Show amounts" : "Hide amounts"}
      style={{ color: THEME.faint, opacity: locked ? 0.5 : 1, cursor: locked ? "not-allowed" : "pointer" }}
    >
      {hidden ? <EyeOff size={size} /> : <Eye size={size} />}
    </button>
  );
}
