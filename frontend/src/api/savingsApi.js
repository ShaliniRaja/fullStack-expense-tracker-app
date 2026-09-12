import { httpClient } from "./httpClient";
import { ENDPOINTS } from "./endpoints";

// GET /goals
export const getGoals = () => httpClient.get(ENDPOINTS.goals);

// POST /goals
export const createGoal = (payload) => httpClient.post(ENDPOINTS.goals, payload);

// PUT /goals/:id
export const updateGoal = (id, payload) => httpClient.put(ENDPOINTS.goalById(id), payload);

// PATCH /goals/:id/contribute — body: { amount }
export const contributeToGoal = (id, amount) => httpClient.patch(`${ENDPOINTS.goalById(id)}/contribute`, { amount });

// DELETE /goals/:id
export const deleteGoal = (id) => httpClient.delete(ENDPOINTS.goalById(id));
