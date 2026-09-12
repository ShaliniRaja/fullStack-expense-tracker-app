package com.ledger.backend.exception;

import java.time.Instant;
import java.util.List;

// Deliberately minimal — no stack traces or internal details are ever
// serialized back to the client.
public record ApiError(Instant timestamp, int status, String error, List<String> details) {
}
