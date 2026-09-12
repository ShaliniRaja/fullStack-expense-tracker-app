package com.ledger.backend.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Not found: {}", ex.getMessage());
        return build(HttpStatus.NOT_FOUND, "Not Found", List.of(ex.getMessage()));
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiError> handleDuplicate(DuplicateResourceException ex) {
        log.warn("Conflict: {}", ex.getMessage());
        return build(HttpStatus.CONFLICT, "Conflict", List.of(ex.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiError> handleInvalidCredentials(InvalidCredentialsException ex) {
        // No message logged here beyond the fact it happened — AuthService
        // already logs the failed-login event itself, without the
        // credentials. Logging the exception message again here would risk
        // future duplication if that message ever changed to include more.
        log.warn("Authentication failed");
        return build(HttpStatus.UNAUTHORIZED, "Unauthorized", List.of(ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, "Bad Request", List.of(ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        // Thrown by @PreAuthorize when a role (e.g. VISITOR) tries to reach
        // something it isn't allowed to. Response is deliberately generic —
        // doesn't hint at what the required role actually is — but this
        // is still worth a log line: repeated hits here are a signal worth
        // noticing (a client bug, or someone probing what's reachable).
        log.warn("Access denied on {}", ex.getClass().getSimpleName());
        return build(HttpStatus.FORBIDDEN, "Forbidden", List.of("You don't have permission to do that."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .toList();
        log.warn("Validation failed: {} field error(s)", details.size());
        return build(HttpStatus.BAD_REQUEST, "Validation Failed", details);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex) {
        // The response body is intentionally generic — real details go to
        // the server log only, never to the client. This log line is what
        // actually makes that true: without it, an unexpected failure was
        // previously invisible even to the operator, not just the caller.
        log.error("Unhandled exception: {}", ex.toString(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                List.of("An unexpected error occurred."));
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String error, List<String> details) {
        ApiError body = new ApiError(Instant.now(), status.value(), error, details);
        return ResponseEntity.status(status).body(body);
    }
}
