import { httpClient } from "./httpClient";
import { ENDPOINTS } from "./endpoints";

// GET /transactions?search=&fromDate=&toDate=&minAmount=&category=&allocation=&type=&page=&size=
// Every param optional. Response shape: { content, page, size, totalElements, totalPages }.
export const getTransactions = (params = {}) => {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.minAmount) query.set("minAmount", params.minAmount);
  if (params.category) query.set("category", params.category);
  if (params.allocation) query.set("allocation", params.allocation);
  if (params.type) query.set("type", params.type);
  if (params.page != null) query.set("page", params.page);
  if (params.size != null) query.set("size", params.size);
  const qs = query.toString();
  return httpClient.get(qs ? `${ENDPOINTS.transactions}?${qs}` : ENDPOINTS.transactions);
};

// POST /transactions
export const createTransaction = (payload) => httpClient.post(ENDPOINTS.transactions, payload);

// PUT /transactions/:id
export const updateTransaction = (id, payload) => httpClient.put(ENDPOINTS.transactionById(id), payload);

// DELETE /transactions/:id
export const deleteTransaction = (id) => httpClient.delete(ENDPOINTS.transactionById(id));
