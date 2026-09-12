package com.ledger.backend.controller;

import com.ledger.backend.dto.BudgetEditRequest;
import com.ledger.backend.dto.BudgetRequest;
import com.ledger.backend.dto.BudgetUpdateRequest;
import com.ledger.backend.model.Budget;
import com.ledger.backend.security.RoleUtil;
import com.ledger.backend.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

// Matches src/api/budgetsApi.js on the frontend:
//   GET    /budgets?month=yyyy-MM   (month optional, defaults to the
//                                     server's current month)
//   GET    /budgets/months          (list of months that have data)
//   POST   /budgets                 (current month only, HUSBAND/WIFE)
//   PUT    /budgets/:category       (HUSBAND/WIFE)
//   PATCH  /budgets/:category       (HUSBAND/WIFE)
//   DELETE /budgets/:category?month=yyyy-MM  (HUSBAND/WIFE — month optional;
//          the current month is soft-deleted, a past month is actually removed)
//
// GET is open to every role, including VISITOR — but `limit` and
// `spent` are masked to null for VISITOR before the response leaves
// this controller. Category/month stay visible (not sensitive); only
// the money is hidden, enforced here rather than left to the frontend.
@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService service;

    public BudgetController(BudgetService service) {
        this.service = service;
    }

    @GetMapping
    public List<Budget> getAll(Authentication authentication, @RequestParam(required = false) String month) {
        if (month != null && !month.isBlank()) {
            validateMonthFormat(month);
        }
        List<Budget> budgets = service.getForMonth(month);
        if (RoleUtil.isVisitor(authentication)) {
            budgets.forEach(b -> { b.setLimit(null); b.setSpent(null); });
        }
        return budgets;
    }

    @GetMapping("/months")
    public List<String> getAvailableMonths() {
        return service.getAvailableMonths();
    }

    // Every budget record ever created, every month — used specifically
    // for the full-history Excel export, not for any page's normal view.
    @GetMapping("/all")
    public List<Budget> getAllHistory(Authentication authentication) {
        List<Budget> all = service.getAllHistory();
        if (RoleUtil.isVisitor(authentication)) {
            all.forEach(b -> { b.setLimit(null); b.setSpent(null); });
        }
        return all;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public ResponseEntity<Budget> create(@Valid @RequestBody BudgetRequest request) {
        Budget created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{category}")
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public Budget update(@PathVariable String category, @Valid @RequestBody BudgetEditRequest request) {
        return service.update(category, request.getLimit(), request.getSpent());
    }

    @PatchMapping("/{category}")
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public Budget updateSpent(@PathVariable String category, @Valid @RequestBody BudgetUpdateRequest request) {
        return service.updateSpent(category, request.getSpent());
    }

    @DeleteMapping("/{category}")
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public ResponseEntity<Void> delete(@PathVariable String category, @RequestParam(required = false) String month) {
        if (month != null && !month.isBlank()) {
            validateMonthFormat(month);
        }
        service.deleteForMonth(category, month);
        return ResponseEntity.noContent().build();
    }

    // Rejects anything that isn't a real "yyyy-MM" before it reaches the
    // service/database — never trust a query param's shape blindly.
    private void validateMonthFormat(String month) {
        try {
            YearMonth.parse(month);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("month must be in yyyy-MM format");
        }
    }
}
