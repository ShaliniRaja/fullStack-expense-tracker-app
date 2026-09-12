package com.ledger.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ContributionRequest {

    @NotNull
    @Positive
    private Double amount;
}
