package com.ledger.backend.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

// Both fields optional — send just the one you're correcting.
@Data
public class BudgetEditRequest {

    @Positive
    private Double limit;

    @PositiveOrZero
    private Double spent;
}
