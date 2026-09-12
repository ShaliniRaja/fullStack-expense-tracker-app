package com.ledger.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "transactions")
public class Transaction {

    @Id
    private String id;

    private String description;
    private String category;
    private LocalDate date;
    private Double amount; // negative = expense, positive = income

    // Only meaningful when category == "Send Money" — which bucket the
    // sent amount belongs to (Cash in Hand / Investment / House Expenses).
    // Null for every other category.
    private String allocation;

    // Also only for "Send Money" — the AED->INR rate for THIS transfer
    // specifically, not a shared app-wide setting. Different transfers
    // genuinely happen at different real rates.
    private Double conversionRate;

    // Set once, server-side, from the creating user's role — never from
    // client input. This is what lets the Transactions page show
    // "Added by: Husband/Wife" without trusting the client to say so.
    private String createdByRole;
}
