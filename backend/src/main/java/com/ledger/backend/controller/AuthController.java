package com.ledger.backend.controller;

import com.ledger.backend.dto.AuthRequest;
import com.ledger.backend.dto.AuthResponse;
import com.ledger.backend.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Public — no token required (see SecurityConfig). Login only: there is
// deliberately no self-registration endpoint. Accounts for this app are
// provisioned once via DataSeeder, from operator-supplied environment
// variables — never through a publicly reachable API. A family-scoped
// finance tool has no legitimate reason to accept open sign-ups.
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody AuthRequest request) {
        // Never log the email or password here — only that an attempt
        // happened. AuthService logs the outcome (success/failure) the
        // same way, also without the credential itself.
        log.info("Login attempt received");
        AuthResponse response = authService.login(request);
        log.info("Login attempt completed");
        return response;
    }
}
