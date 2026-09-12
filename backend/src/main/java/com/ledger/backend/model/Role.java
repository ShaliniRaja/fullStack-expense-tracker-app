package com.ledger.backend.model;

// HUSBAND and WIFE can see real figures everywhere. VISITOR is
// deliberately the odd one out — enforced both here and in
// SecurityConfig/@PreAuthorize, not just hidden in the UI: a VISITOR
// token can only ever reach the transaction list, and even there every
// amount is masked to null server-side (see TransactionController).
public enum Role {
    HUSBAND, WIFE, VISITOR
}
