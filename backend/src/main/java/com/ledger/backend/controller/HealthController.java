package com.ledger.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// Public, unauthenticated — this is what Render (or any host) pings
// to confirm the container is actually serving requests, not just
// that the process started. No app data, no auth required.
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
