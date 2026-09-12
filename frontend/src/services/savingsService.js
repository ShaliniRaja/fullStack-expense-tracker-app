import * as savingsApi from "../api/savingsApi";
import { MOCK_GOALS } from "../constants/mockData";

let localCache = null;

export async function listGoals() {
  try {
    const data = await savingsApi.getGoals();
    localCache = data;
    return data;
  } catch {
    if (!localCache) localCache = [...MOCK_GOALS];
    return localCache;
  }
}

export async function addGoal(payload) {
  try {
    return await savingsApi.createGoal(payload);
  } catch {
    const created = { id: Date.now(), ...payload };
    localCache = [...(localCache || MOCK_GOALS), created];
    return created;
  }
}

export async function contributeToGoal(id, amount) {
  try {
    const updated = await savingsApi.contributeToGoal(id, amount);
    localCache = (localCache || []).map((g) => (g.id === id ? updated : g));
    return updated;
  } catch {
    localCache = (localCache || []).map((g) =>
      g.id === id ? { ...g, saved: g.saved + amount } : g
    );
    return localCache.find((g) => g.id === id);
  }
}

export async function updateGoal(id, payload) {
  let updated;
  try {
    updated = await savingsApi.updateGoal(id, payload);
  } catch {
    updated = { id, ...payload };
  }
  localCache = (localCache || []).map((g) => (g.id === id ? updated : g));
  return updated;
}

export async function removeGoal(id) {
  try {
    await savingsApi.deleteGoal(id);
  } catch {
    // no-op fallback — nothing persisted server-side yet
  }
  localCache = (localCache || []).filter((g) => g.id !== id);
}
