package com.ledger.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class BudgetUpdateRequest {

    @NotNull
    @PositiveOrZero
    private Double spent;
}
