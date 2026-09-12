# Ledger Backend

A REST API for a family expense-tracking app. Spring Boot + MongoDB.

## What it does

- Tracks income, expenses, and transfers, organized by category
- Monthly budgets that stay honest — spending totals are always
  computed from real transaction history, never a number that can
  quietly drift out of sync
- Savings goals with contribution tracking
- Spending trend history by category
- Role-based access: two full accounts and a read-only, amount-masked
  view for a third party

## Tech stack

Java 21 · Spring Boot 4 · Spring Security (JWT) · MongoDB · Gradle

## Getting started

See [`../DEPLOYMENT.md`](../DEPLOYMENT.md) for the full setup and
deployment walkthrough (local development, environment configuration,
and hosting).

## Project layout

```
src/main/java/com/ledger/backend/
  config/       application setup
  controller/   REST endpoints
  service/      business logic
  repository/   data access
  model/        domain entities
  dto/          request/response shapes
  security/     authentication
  exception/    error handling
```
