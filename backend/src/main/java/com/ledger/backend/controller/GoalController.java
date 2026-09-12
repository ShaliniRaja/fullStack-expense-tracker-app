package com.ledger.backend.controller;

import com.ledger.backend.dto.ContributionRequest;
import com.ledger.backend.dto.GoalRequest;
import com.ledger.backend.model.Goal;
import com.ledger.backend.security.RoleUtil;
import com.ledger.backend.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Matches src/api/savingsApi.js on the frontend:
//   GET    /goals                  (all roles — VISITOR gets masked amounts)
//   POST   /goals                  (HUSBAND/WIFE)
//   PUT    /goals/:id              (HUSBAND/WIFE)
//   PATCH  /goals/:id/contribute   (HUSBAND/WIFE)
//   DELETE /goals/:id              (HUSBAND/WIFE)
@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService service;

    public GoalController(GoalService service) {
        this.service = service;
    }

    @GetMapping
    public List<Goal> getAll(Authentication authentication) {
        List<Goal> goals = service.getAll();
        if (RoleUtil.isVisitor(authentication)) {
            goals.forEach(g -> { g.setTarget(null); g.setSaved(null); });
        }
        return goals;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public ResponseEntity<Goal> create(@Valid @RequestBody GoalRequest request) {
        Goal created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public Goal update(@PathVariable String id, @Valid @RequestBody GoalRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/contribute")
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public Goal contribute(@PathVariable String id, @Valid @RequestBody ContributionRequest request) {
        return service.contribute(id, request.getAmount());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('HUSBAND', 'WIFE')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
