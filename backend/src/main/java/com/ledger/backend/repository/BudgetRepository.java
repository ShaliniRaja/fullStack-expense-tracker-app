package com.ledger.backend.repository;

import com.ledger.backend.model.Budget;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends MongoRepository<Budget, String> {
    Optional<Budget> findByCategoryAndMonth(String category, String month);
    List<Budget> findByMonth(String month);

    // Most recent record for a category regardless of month — the basis
    // for deciding whether/how to carry a category forward into a new month.
    Optional<Budget> findFirstByCategoryOrderByMonthDesc(String category);
}
