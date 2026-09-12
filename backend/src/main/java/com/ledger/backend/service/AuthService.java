package com.ledger.backend.service;

import com.ledger.backend.dto.AuthRequest;
import com.ledger.backend.dto.AuthResponse;
import com.ledger.backend.exception.InvalidCredentialsException;
import com.ledger.backend.model.User;
import com.ledger.backend.repository.UserRepository;
import com.ledger.backend.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// Login only — see AuthController for why there's no register().
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(AuthRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Deliberately generic on both the exception message AND the
            // log line — never reveal (to the caller, or in logs) whether
            // the email or the password was wrong, and never log the
            // email/password themselves.
            log.warn("Login failed: invalid credentials");
            throw new InvalidCredentialsException();
        }

        log.info("Login succeeded for role={}", user.getRole());
        return issueToken(user);
    }

    private AuthResponse issueToken(User user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, "Bearer", user.getEmail(), user.getRole().name(), jwtService.getExpirationSeconds());
    }
}
