package com.ledger.backend.dto;

import java.util.List;

// months[i] corresponds to values[i] in every CategoryTrend — e.g.
// months = ["Sep","Oct",...,"Aug"], and each category's values align
// 1:1 with that list, oldest first.
public record TrendsResponse(List<String> months, List<CategoryTrend> categories) {
}
