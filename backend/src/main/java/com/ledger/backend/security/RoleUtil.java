package com.ledger.backend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

public final class RoleUtil {

    private RoleUtil() {}

    public static boolean isVisitor(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_VISITOR"::equals);
    }

    // "Husband" / "Wife" — matches Role enum names, title-cased for display.
    public static String displayRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .findFirst()
                .map(a -> a.substring(5))
                .map(r -> r.substring(0, 1).toUpperCase() + r.substring(1).toLowerCase())
                .orElse("Unknown");
    }
}
