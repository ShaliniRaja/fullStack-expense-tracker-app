package com.ledger.backend.dto;

import java.util.List;

// Deliberately simple compared to Spring Data's own Page<T> serialization
// (which includes a lot of internal pageable/sort noise) — just what the
// frontend actually needs to render a pager. totalAmount is the sum of
// every matching record's amount (not just the current page) — e.g. "how
// much was spent on Food in August," computed server-side against the
// full filtered set, not just whatever happens to be on screen.
public record PagedResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages, Double totalAmount) {
}
