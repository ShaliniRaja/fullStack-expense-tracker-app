package com.ledger.backend.dto;

import java.util.List;

public record CategoryTrend(String category, List<Double> values) {
}
