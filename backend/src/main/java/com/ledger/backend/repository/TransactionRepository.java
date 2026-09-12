package com.ledger.backend.repository;

import com.ledger.backend.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TransactionRepository extends MongoRepository<Transaction, String> {
    List<Transaction> findAllByOrderByDateDesc();
}
