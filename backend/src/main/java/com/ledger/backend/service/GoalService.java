package com.ledger.backend.service;

import com.ledger.backend.dto.GoalRequest;
import com.ledger.backend.exception.ResourceNotFoundException;
import com.ledger.backend.model.Goal;
import com.ledger.backend.repository.GoalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GoalService {

    private static final Logger log = LoggerFactory.getLogger(GoalService.class);

    private final GoalRepository repository;

    public GoalService(GoalRepository repository) {
        this.repository = repository;
    }

    public List<Goal> getAll() {
        return repository.findAll();
    }

    public Goal create(GoalRequest request) {
        log.info("Creating goal");
        Goal goal = new Goal(
                null,
                request.getIcon(),
                request.getName(),
                request.getTarget(),
                request.getSaved(),
                request.getDays()
        );
        Goal saved = repository.save(goal);
        log.info("Goal created (id={})", saved.getId());
        return saved;
    }

    public Goal update(String id, GoalRequest request) {
        log.info("Updating goal (id={})", id);
        Goal existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + id));

        existing.setIcon(request.getIcon());
        existing.setName(request.getName());
        existing.setTarget(request.getTarget());
        existing.setSaved(request.getSaved());
        existing.setDays(request.getDays());

        return repository.save(existing);
    }

    // Adds to the goal's saved amount server-side — the client sends how
    // much was contributed, never the new total, so there's no way to
    // desync or replay an old total over a newer one.
    public Goal contribute(String id, Double amount) {
        log.info("Adding contribution to goal (id={})", id);
        Goal existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + id));

        existing.setSaved(existing.getSaved() + amount);
        return repository.save(existing);
    }

    public void delete(String id) {
        log.info("Deleting goal (id={})", id);
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Goal not found: " + id);
        }
        repository.deleteById(id);
        log.info("Goal deleted (id={})", id);
    }
}
