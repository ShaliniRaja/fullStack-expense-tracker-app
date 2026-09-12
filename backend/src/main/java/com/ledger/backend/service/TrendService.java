package com.ledger.backend.service;

import com.ledger.backend.dto.CategoryTrend;
import com.ledger.backend.dto.TrendsResponse;
import com.ledger.backend.model.Transaction;
import com.ledger.backend.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

// Computes real monthly spend-per-category history directly from the
// Transactions collection — this is the actual source of truth, not a
// mock series. Deliberately kept as an in-memory group-by rather than
// a MongoDB aggregation pipeline: at personal-finance scale (thousands
// of rows, not millions) this is simpler to read, test, and secure than
// a hand-written pipeline, with no meaningful performance cost.
@Service
public class TrendService {

    private static final Logger log = LoggerFactory.getLogger(TrendService.class);

    // The fixed set of spending categories the app tracks — mirrors
    // src/constants/categories.js on the frontend (Income excluded;
    // trends are about spending, not income).
    private static final List<String> CATEGORIES = List.of(
            "Food", "Transport", "Shopping", "Bills", "Health", "Entertainment"
    );

    private final TransactionRepository transactionRepository;

    public TrendService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public TrendsResponse getTrends(int monthsBack) {
        log.debug("Computing trends for {} month(s)", monthsBack);
        YearMonth currentMonth = YearMonth.now();
        List<YearMonth> months = new ArrayList<>();
        for (int i = monthsBack - 1; i >= 0; i--) {
            months.add(currentMonth.minusMonths(i));
        }

        List<Transaction> transactions = transactionRepository.findAll();

        // category -> yearMonth -> total spent (positive number)
        Map<String, Map<YearMonth, Double>> totals = transactions.stream()
                .filter(t -> t.getAmount() < 0) // expenses only
                .filter(t -> CATEGORIES.contains(t.getCategory()))
                .collect(Collectors.groupingBy(
                        Transaction::getCategory,
                        Collectors.groupingBy(
                                t -> YearMonth.from(t.getDate()),
                                Collectors.summingDouble(t -> Math.abs(t.getAmount()))
                        )
                ));

        DateTimeFormatter monthLabelFmt = DateTimeFormatter.ofPattern("MMM", Locale.US);
        List<String> monthLabels = months.stream().map(m -> m.format(monthLabelFmt)).toList();

        List<CategoryTrend> categoryTrends = CATEGORIES.stream()
                .map(category -> {
                    Map<YearMonth, Double> byMonth = totals.getOrDefault(category, Map.of());
                    List<Double> values = months.stream()
                            .map(m -> Math.round(byMonth.getOrDefault(m, 0.0) * 100) / 100.0)
                            .toList();
                    return new CategoryTrend(category, values);
                })
                .toList();

        log.debug("Trends computed for {} categories", categoryTrends.size());
        return new TrendsResponse(monthLabels, categoryTrends);
    }
}
