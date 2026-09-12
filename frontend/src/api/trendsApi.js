import { httpClient } from "./httpClient";
import { ENDPOINTS } from "./endpoints";

// GET /trends?months=N — real per-category monthly totals, computed
// by the backend directly from the transactions collection.
export const getTrends = (months = 12) => httpClient.get(`${ENDPOINTS.trends}?months=${months}`);
