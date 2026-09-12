package com.ledger.backend.service;

import com.ledger.backend.dto.PagedResponse;
import com.ledger.backend.dto.TransactionRequest;
import com.ledger.backend.exception.ResourceNotFoundException;
import com.ledger.backend.model.Transaction;
import com.ledger.backend.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Service
public class TransactionService {

    private static final Logger log = LoggerFactory.getLogger(TransactionService.class);

    private static final String SEND_MONEY_CATEGORY = "Send Money";
    private static final Set<String> VALID_ALLOCATIONS = Set.of("Cash in Hand", "Investment", "House Expenses");

    // Default page size is deliberately large: callers that just want
    // "all transactions" (Dashboard totals, Trends, exports) omit page/size
    // entirely and get effectively everything in one response, while the
    // Transactions and Send Money pages pass their own page/size for real
    // pagination. One endpoint, one contract, no separate "bulk" route.
    private static final int DEFAULT_SIZE = 1000;
    private static final int MAX_SIZE = 1000;

    private final TransactionRepository repository;

    public TransactionService(TransactionRepository repository) {
        this.repository = repository;
    }

    // search/fromDate/toDate/minAmount/category/allocation/type are all
    // optional filters, applied in memory after the (already date-sorted)
    // fetch — fine at personal-finance scale, simpler to audit than a
    // hand-built dynamic Mongo query. Search matches description OR
    // category, case-insensitive, against every matching record — not
    // just the current page — before pagination is applied. `type` is
    // "income" or "expense" — filtering it here (not in the frontend)
    // is what keeps totalPages/totalElements accurate for that filter.
    public PagedResponse<Transaction> search(
            String search, LocalDate fromDate, LocalDate toDate, Double minAmount,
            String category, String allocation, String type, Integer page, Integer size
    ) {
        log.debug("Transaction search started (filters applied: dateRange={}, minAmount={}, category={}, type={})",
                (fromDate != null || toDate != null), (minAmount != null), (category != null), (type != null));

        String q = (search == null) ? null : search.trim().toLowerCase();
        String normalizedType = (type == null) ? null : type.trim().toLowerCase();

        List<Transaction> filtered = repository.findAllByOrderByDateDesc().stream()
                .filter(t -> fromDate == null || !t.getDate().isBefore(fromDate))
                .filter(t -> toDate == null || !t.getDate().isAfter(toDate))
                .filter(t -> minAmount == null || Math.abs(t.getAmount()) >= minAmount)
                .filter(t -> category == null || category.isBlank() || category.equalsIgnoreCase(t.getCategory()))
                .filter(t -> allocation == null || allocation.isBlank() || allocation.equalsIgnoreCase(t.getAllocation()))
                .filter(t -> normalizedType == null || normalizedType.isBlank() || normalizedType.equals("all")
                        || ("income".equals(normalizedType) && t.getAmount() > 0)
                        || ("expense".equals(normalizedType) && t.getAmount() < 0))
                .filter(t -> q == null || q.isBlank()
                        || t.getDescription().toLowerCase().contains(q)
                        || t.getCategory().toLowerCase().contains(q))
                .toList();

        int safeSize = clamp(size == null ? DEFAULT_SIZE : size, 1, MAX_SIZE);
        int totalElements = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil(totalElements / (double) safeSize));
        int safePage = clamp(page == null ? 0 : page, 0, Math.max(0, totalPages - 1));

        int from = Math.min(safePage * safeSize, totalElements);
        int to = Math.min(from + safeSize, totalElements);

        // Sum over the FULL filtered set, not just the current page —
        // this is what lets the Transactions page show "Total: AED X for
        // Food this month" and have it actually match what's in Budgets.
        double totalAmount = filtered.stream().mapToDouble(Transaction::getAmount).sum();

        log.debug("Transaction search completed: {} match(es), page {}/{}", totalElements, safePage + 1, totalPages);

        return new PagedResponse<>(filtered.subList(from, to), safePage, safeSize, totalElements, totalPages, totalAmount);
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(value, max));
    }

    public Transaction create(TransactionRequest request, String createdByRole) {
        log.info("Creating transaction (category={}, by={})", request.getCategory(), createdByRole);
        validateAllocation(request);
        Transaction transaction = new Transaction(
                null,
                request.getDescription(),
                request.getCategory(),
                request.getDate(),
                request.getAmount(),
                normalizedAllocation(request),
                normalizedConversionRate(request),
                createdByRole
        );
        Transaction saved = repository.save(transaction);
        log.info("Transaction created (id={})", saved.getId());
        return saved;
    }

    public Transaction update(String id, TransactionRequest request) {
        log.info("Updating transaction (id={})", id);
        validateAllocation(request);
        Transaction existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + id));

        existing.setDescription(request.getDescription());
        existing.setCategory(request.getCategory());
        existing.setDate(request.getDate());
        existing.setAmount(request.getAmount());
        existing.setAllocation(normalizedAllocation(request));
        existing.setConversionRate(normalizedConversionRate(request));
        // createdByRole is deliberately left untouched — editing a
        // transaction doesn't change who originally logged it.

        Transaction saved = repository.save(existing);
        log.info("Transaction updated (id={})", id);
        return saved;
    }

    public void delete(String id) {
        log.info("Deleting transaction (id={})", id);
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Transaction not found: " + id);
        }
        repository.deleteById(id);
        log.info("Transaction deleted (id={})", id);
    }

    // "Send Money" transactions must carry one of the three known buckets —
    // anything else (including a made-up string) is rejected here rather
    // than silently stored, since the Send Money page trusts this value
    // completely when grouping totals.
    private void validateAllocation(TransactionRequest request) {
        boolean isSendMoney = SEND_MONEY_CATEGORY.equals(request.getCategory());
        String allocation = request.getAllocation();

        if (isSendMoney && (allocation == null || allocation.isBlank())) {
            throw new IllegalArgumentException("allocation is required for Send Money transactions");
        }
        if (allocation != null && !allocation.isBlank() && !VALID_ALLOCATIONS.contains(allocation)) {
            throw new IllegalArgumentException("allocation must be one of " + VALID_ALLOCATIONS);
        }
    }

    private String normalizedAllocation(TransactionRequest request) {
        boolean isSendMoney = SEND_MONEY_CATEGORY.equals(request.getCategory());
        return isSendMoney ? request.getAllocation() : null;
    }

    private Double normalizedConversionRate(TransactionRequest request) {
        boolean isSendMoney = SEND_MONEY_CATEGORY.equals(request.getCategory());
        return isSendMoney ? request.getConversionRate() : null;
    }
}
