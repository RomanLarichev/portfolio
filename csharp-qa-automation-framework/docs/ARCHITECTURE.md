# Architecture

The public edition keeps one focused slice from a larger private automation framework.

```text
Tests
  │
  ├── unit tests ──────────────┐
  │                            │
  └── Playwright integration   │
               │               │
               ▼               │
        RankingLocator         │
          │       │             │
          │       └────► SelectorHealthMonitor ─► SelectorHealthStore
          │
          └────► DynamicIdDetector
```

## Design goals

- prefer stable selectors (`data-testid`, stable ids, accessible labels);
- avoid persisting dynamic framework-generated ids;
- record selector success/failure and resolution latency;
- keep tests deterministic and independent from private environments;
- separate selector resolution from test business logic.

## Private framework scope

The private development framework contains additional modules for metadata discovery, semantic form models, XML↔UI synchronization, schema validation, visual regression, spreadsheet-like forms, resilience/security/load scenarios, selector healing, telemetry dashboards, and domain-specific form automation. Those modules are intentionally not included in this portfolio repository.
