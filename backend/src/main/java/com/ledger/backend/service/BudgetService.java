package com.ledger.backend.service;

import com.ledger.backend.dto.BudgetRequest;
import com.ledger.backend.exception.DuplicateResourceException;
import com.ledger.backend.exception.ResourceNotFoundException;
import com.ledger.backend.model.Budget;
import com.ledger.backend.model.Transaction;
import com.ledger.backend.repository.BudgetRepository;
import com.ledger.backend.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// Budgets are monthly snapshots, not a single mutable running total.
// Each (category, month) pair is its own document; past months are
// never edited after the fact — only the current month can be created,
// updated, or soft-deleted. This is what makes "budget history" real
// instead of a single number that silently keeps accumulating forever.
//
// "spent" is never trusted as a manually-tracked running total on read
// — see reconcileSpent() below. It's recomputed from the actual
// Transactions collection every time budgets are fetched, so it's
// *provably* equal to the real sum, not just usually close to it.
@Service
public class BudgetService {

    private static final Logger log = LoggerFactory.getLogger(BudgetService.class);

    private final BudgetRepository repository;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository repository, TransactionRepository transactionRepository) {
        this.repository = repository;
        this.transactionRepository = transactionRepository;
    }

    private String currentMonth() {
        return YearMonth.now().toString(); // "yyyy-MM"
    }

    // Called whenever the current month is read. For every category that
    // was active as of its most recent record, ensures a current-month
    // row exists — carrying the same limit forward with spent reset to 0.
    // A category whose latest record was soft-deleted (active=false) is
    // never carried forward.
    private void ensureCurrentMonthBudgets() {
        String thisMonth = currentMonth();

        Set<String> categories = repository.findAll().stream()
                .map(Budget::getCategory)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        for (String category : categories) {
            boolean alreadyExists = repository.findByCategoryAndMonth(category, thisMonth).isPresent();
            if (alreadyExists) continue;

            repository.findFirstByCategoryOrderByMonthDesc(category).ifPresent(latest -> {
                if (latest.isActive() && !latest.getMonth().equals(thisMonth)) {
                    repository.save(new Budget(null, category, thisMonth, latest.getLimit(), 0.0, true));
                }
            });
        }
    }

    // Overwrites each budget's `spent` (in the returned object only —
    // never persisted) with the real sum of that category's expense
    // transactions dated within that month. If there are genuinely no
    // matching transactions (e.g. a historical budget backfilled as a
    // single number without transaction-level detail), the stored value
    // is left alone instead of being zeroed out — but the moment even
    // one real transaction exists for that category/month, the computed
    // sum takes over and the two can never silently disagree again.
    private void reconcileSpent(List<Budget> budgets, String month) {
        YearMonth ym = YearMonth.parse(month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Transaction> monthTransactions = transactionRepository.findAllByOrderByDateDesc().stream()
                .filter(t -> !t.getDate().isBefore(start) && !t.getDate().isAfter(end))
                .filter(t -> t.getAmount() < 0)
                .toList();

        for (Budget budget : budgets) {
            List<Transaction> matching = monthTransactions.stream()
                    .filter(t -> budget.getCategory().equals(t.getCategory()))
                    .toList();
            if (!matching.isEmpty()) {
                double sum = matching.stream().mapToDouble(t -> Math.abs(t.getAmount())).sum();
                budget.setSpent(sum);
            }
        }
    }

    public List<Budget> getForMonth(String month) {
        String targetMonth = (month == null || month.isBlank()) ? currentMonth() : month;

        if (targetMonth.equals(currentMonth())) {
            ensureCurrentMonthBudgets();
        }

        List<Budget> budgets = repository.findByMonth(targetMonth).stream()
                .sorted(Comparator.comparing(Budget::getCategory))
                .collect(Collectors.toList());

        reconcileSpent(budgets, targetMonth);
        return budgets;
    }

    // Every budget record ever created, across every month — used for
    // the full-history export (see ExcelExport on the frontend), not
    // for any page's normal display.
    public List<Budget> getAllHistory() {
        ensureCurrentMonthBudgets();

        List<Budget> all = repository.findAll().stream()
                .sorted(Comparator.comparing(Budget::getMonth, Comparator.reverseOrder())
                        .thenComparing(Budget::getCategory))
                .collect(Collectors.toList());

        // Reconcile per-month so each record's spent matches that
        // specific month's real transactions, not a blended total.
        all.stream()
                .map(Budget::getMonth)
                .distinct()
                .forEach(m -> reconcileSpent(all.stream().filter(b -> b.getMonth().equals(m)).toList(), m));

        return all;
    }

    public List<String> getAvailableMonths() {
        ensureCurrentMonthBudgets(); // so the current month always appears, even before its first edit

        return repository.findAll().stream()
                .map(Budget::getMonth)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();
    }

    public Budget create(BudgetRequest request) {
        log.info("Creating budget (category={})", request.getCategory());
        String targetMonth = (request.getMonth() == null || request.getMonth().isBlank())
                ? currentMonth()
                : request.getMonth();

        YearMonth parsed;
        try {
            parsed = YearMonth.parse(targetMonth);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("month must be a real yyyy-MM date");
        }
        if (parsed.isAfter(YearMonth.parse(currentMonth()))) {
            throw new IllegalArgumentException("Can't create a budget for a future month");
        }

        if (repository.findByCategoryAndMonth(request.getCategory(), targetMonth).isPresent()) {
            throw new DuplicateResourceException(
                    "A budget for category '" + request.getCategory() + "' already exists for " + targetMonth + ".");
        }

        double spent = request.getSpent() != null ? request.getSpent() : 0.0;
        Budget budget = new Budget(null, request.getCategory(), targetMonth, request.getLimit(), spent, true);
        Budget saved = repository.save(budget);
        log.info("Budget created (category={}, month={})", saved.getCategory(), saved.getMonth());
        return saved;
    }

    public Budget updateSpent(String category, Double spent) {
        log.info("Updating budget spent (category={})", category);
        String thisMonth = currentMonth();
        ensureCurrentMonthBudgets();

        Budget budget = repository.findByCategoryAndMonth(category, thisMonth)
                .orElseThrow(() -> new ResourceNotFoundException("No current-month budget for category: " + category));

        budget.setSpent(spent);
        return repository.save(budget);
    }

    // Lets the user correct a budget's limit (and/or spent) for the
    // current month only — same "past months are locked" rule as everything
    // else here.
    public Budget update(String category, Double limit, Double spent) {
        log.info("Updating budget (category={})", category);
        String thisMonth = currentMonth();
        ensureCurrentMonthBudgets();

        Budget budget = repository.findByCategoryAndMonth(category, thisMonth)
                .orElseThrow(() -> new ResourceNotFoundException("No current-month budget for category: " + category));

        if (limit != null) budget.setLimit(limit);
        if (spent != null) budget.setSpent(spent);
        Budget saved = repository.save(budget);
        log.info("Budget updated (category={})", category);
        return saved;
    }

    // Current month: soft-delete (marks inactive) so the rollover logic
    // correctly stops carrying this category into future months. A past
    // month has no such concern — it's genuinely removed, since "history
    // can be deleted" means actually gone, not soft-deleted-but-still-listed.
    public void deleteForMonth(String category, String month) {
        log.info("Deleting budget (category={}, month={})", category, month == null ? "current" : month);
        String targetMonth = (month == null || month.isBlank()) ? currentMonth() : month;

        Budget budget = repository.findByCategoryAndMonth(category, targetMonth)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No budget for category '" + category + "' in " + targetMonth));

        if (targetMonth.equals(currentMonth())) {
            budget.setActive(false);
            repository.save(budget);
        } else {
            repository.delete(budget);
        }
        log.info("Budget deleted (category={})", category);
    }
}
