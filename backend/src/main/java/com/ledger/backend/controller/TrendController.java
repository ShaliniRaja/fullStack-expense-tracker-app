package com.ledger.backend.controller;

import com.ledger.backend.dto.TrendsResponse;
import com.ledger.backend.service.TrendService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// GET /api/trends — real per-category monthly spend history, computed
// from the Transactions collection. Same real values for every role —
// unlike Budgets/Goals/Transactions, the chart's *shape* isn't treated
// as sensitive here, only the numeric labels drawn on top of it are.
// VISITOR masking for this page happens entirely on the frontend (the
// chart renders the real curve; every text label next to it shows
// "••••" instead — see Trends.jsx / TrendAreaChart.jsx).
@RestController
@RequestMapping("/api/trends")
public class TrendController {

    private final TrendService trendService;

    public TrendController(TrendService trendService) {
        this.trendService = trendService;
    }

    @GetMapping
    public TrendsResponse getTrends(@RequestParam(defaultValue = "12") int months) {
        int clamped = Math.max(1, Math.min(months, 24)); // sane bounds, not client-trusted blindly
        return trendService.getTrends(clamped);
    }
}
