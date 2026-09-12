package com.ledger.backend.dto;

public record AuthResponse(String token, String tokenType, String email, String role, long expiresInSeconds) {
}
