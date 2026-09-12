import React, { useState } from "react";
import { Plus, Trash2, PlusCircle, Pencil } from "lucide-react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import ContributeModal from "../components/modals/ContributeModal";
import NewGoalModal from "../components/modals/NewGoalModal";
import { THEME } from "../constants/theme";
import { GOAL_ICONS } from "../constants/goalIcons";
import { fmt } from "../utils/formatters";
import { useVisibility } from "../context/VisibilityContext";

export default function Savings({ goals, onNewGoal, onUpdateGoal, onContribute, onDeleteGoal, isVisitor }) {
  const { hidden } = useVisibility();
  const mask = (text) => (hidden ? "••••" : text);
  const [contributingTo, setContributingTo] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const overallPct = totalTarget ? (totalSaved / totalTarget) * 100 : 0;

  const handleDelete = (goal) => {
    if (window.confirm(`Remove "${goal.name}"? This can't be undone.`)) {
      onDeleteGoal(goal.id);
    }
  };

  return (
    <div>
      <PageHeader
        title="Savings"
        subtitle="Track your goals and milestones"
        right={
          <button
            onClick={onNewGoal}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-1.5"
            style={{ background: THEME.green, color: "#06280f", display: isVisitor ? "none" : "flex" }}
          >
            <Plus size={15} strokeWidth={2.5} /> New Goal
          </button>
        }
      />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-11 font-semibold tracking-wider" style={{ color: THEME.faint }}>TOTAL SAVED</div>
          <div className="text-2xl font-bold mt-2" style={{ color: THEME.text }}>{mask(fmt(totalSaved))}</div>
          <div className="text-xs mt-1.5 font-medium" style={{ color: THEME.green }}>Across all goals</div>
        </Card>
        <Card className="p-5">
          <div className="text-11 font-semibold tracking-wider" style={{ color: THEME.faint }}>TOTAL TARGET</div>
          <div className="text-2xl font-bold mt-2" style={{ color: THEME.text }}>{mask(fmt(totalTarget))}</div>
          <div className="text-xs mt-1.5" style={{ color: THEME.faint }}>{goals.length} active goals</div>
        </Card>
        <Card className="p-5">
          <div className="text-11 font-semibold tracking-wider" style={{ color: THEME.faint }}>OVERALL PROGRESS</div>
          <div className="text-2xl font-bold mt-2" style={{ color: THEME.text }}>{overallPct.toFixed(1)}%</div>
          <div className="text-xs mt-1.5 font-medium" style={{ color: THEME.red }}>{mask(fmt(totalTarget - totalSaved))} remaining</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {goals.map((g) => {
          const Icon = GOAL_ICONS[g.icon] || GOAL_ICONS.shield;
          const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
          const remaining = g.target - g.saved;
          const perMonth = g.days > 0 ? remaining / (g.days / 30.44) : remaining;
          return (
            <Card key={g.id} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: THEME.inputBg }}>
                    <Icon size={16} style={{ color: THEME.text }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: THEME.text }}>{g.name}</div>
                    <div className="text-xs" style={{ color: THEME.faint }}>{g.days}d left</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-lg font-bold" style={{ color: THEME.text }}>{mask(fmt(g.saved))}</div>
                    <div className="text-xs" style={{ color: THEME.faint }}>of {mask(fmt(g.target))}</div>
                  </div>
                  {!isVisitor && (
                    <button onClick={() => setEditingGoal(g)} title="Edit goal" style={{ color: THEME.faint }}>
                      <Pencil size={15} />
                    </button>
                  )}
                  {!isVisitor && (
                    <button onClick={() => handleDelete(g)} title="Remove goal" style={{ color: THEME.faint }}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: THEME.inputBg }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#22d3ee" }} />
              </div>
              <div className="flex items-center justify-between text-xs mt-2" style={{ color: THEME.faint }}>
                <span>{pct}% complete</span>
                <span>{mask(fmt(perMonth))}/mo needed</span>
              </div>
              {!isVisitor && (
                <button
                  onClick={() => setContributingTo(g)}
                  className="w-full mt-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                  style={{ background: THEME.inputBg, color: THEME.text, border: `1px solid ${THEME.cardBorder}` }}
                >
                  <PlusCircle size={13} /> Add Funds
                </button>
              )}
            </Card>
          );
        })}
      </div>

      {contributingTo && (
        <ContributeModal
          goal={contributingTo}
          onClose={() => setContributingTo(null)}
          onContribute={onContribute}
        />
      )}

      {editingGoal && (
        <NewGoalModal
          editingGoal={editingGoal}
          onClose={() => setEditingGoal(null)}
          onUpdate={onUpdateGoal}
        />
      )}
    </div>
  );
}
