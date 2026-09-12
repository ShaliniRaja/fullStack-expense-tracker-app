package com.ledger.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

// Client input is only ever bound to this DTO — never directly to the
// Transaction entity — so a caller can't smuggle in an "id" or any
// other field that shouldn't be client-controlled (mass-assignment).
@Data
public class TransactionRequest {

    @NotBlank
    @Size(max = 140)
    private String description;

    @NotBlank
    @Size(max = 40)
    private String category;

    @NotNull
    private LocalDate date;

    @NotNull
    private Double amount;

    // Required only when category is "Send Money" — validated in
    // TransactionService, not here, since the rule depends on another field.
    @Size(max = 40)
    private String allocation;

    // Optional, only meaningful for "Send Money" — the actual AED->INR
    // rate for THIS transfer. Not a shared/global setting.
    @Positive
    private Double conversionRate;
}
