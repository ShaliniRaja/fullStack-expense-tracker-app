package com.ledger.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "budgets")
public class Budget {

    @Id
    private String id;

    private String category;

    // "yyyy-MM" (YearMonth's own toString format) — each (category, month)
    // pair is its own immutable snapshot. Past months are never edited,
    // only ever created fresh by the monthly rollover.
    private String month;

    private Double limit;
    private Double spent;

    // Soft-delete flag. Deleting a budget marks the *current* month's
    // record inactive rather than removing anything — history for past
    // months is never destroyed, and rollover stops carrying an inactive
    // category forward into future months.
    private boolean active;
}
