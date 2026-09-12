package com.ledger.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@EnableMongoRepositories(basePackages = "com.ledger.backend.repository")
@SpringBootApplication
public class LedgerBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(LedgerBackendApplication.class, args);
    }
}
