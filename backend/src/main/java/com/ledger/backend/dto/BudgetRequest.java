package com.ledger.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BudgetRequest {

    @NotBlank
    @Size(max = 40)
    private String category;

    @Positive
    private Double limit;

    // Optional — omit to create for the server's current month. When
    // provided, must be "yyyy-MM" and no later than the current month
    // (you can backfill history, not create a budget for the future).
    @Pattern(regexp = "\\d{4}-\\d{2}", message = "must be in yyyy-MM format")
    private String month;

    // Optional — lets a backfilled historical record start with a real
    // spent amount instead of always 0. Defaults to 0 if omitted.
    @PositiveOrZero
    private Double spent;
}
