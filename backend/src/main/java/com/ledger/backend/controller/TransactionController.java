package com.ledger.backend.controller;

import com.ledger.backend.dto.PagedResponse;
import com.ledger.backend.dto.TransactionRequest;
import com.ledger.backend.model.Transaction;
import com.ledger.backend.security.RoleUtil;
import com.ledger.backend.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

// Matches src/api/transactionsApi.js on the frontend:
//   GET    /transactions?search=&fromDate=&toDate=&minAmount=&category=&allocation=&page=&size=
//          (every param optional; omitting page/size returns effectively
//          everything in one page — see TransactionService.DEFAULT_SIZE)
//   POST   /transactions          (HUSBAND/WIFE only)
//   PUT    /transactions/:id      (HUSBAND/WIFE only)
//   DELETE /transactions/:id      (HUSBAND/WIFE only)
//
// GET is open to every role, including VISITOR — but every amount is
// masked to null before the response leaves this method when the
// caller is VISITOR. That's enforced here, not just hidden in the UI.
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(TransactionService service) {
        this.service = service;
    }

    @GetMapping
    public PagedResponse<Transaction> getAll(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) Double minAmount,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String allocation,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        PagedResponse<Transaction> result = service.search(search, fromDate, toDate, minAmount, category, allocation, type, page, size);

        if (RoleUtil.isVisitor(authentication)) {
            result.content().forEach(t -> t.setAmount(null));
            return new PagedResponse<>(result.content(), result.page(), result.size(), result.totalElements(), result.totalPages(), null);
        }
        return result;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public ResponseEntity<Transaction> create(Authentication authentication, @Valid @RequestBody TransactionRequest request) {
        Transaction created = service.create(request, RoleUtil.displayRole(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public Transaction update(@PathVariable String id, @Valid @RequestBody TransactionRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
