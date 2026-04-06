# Contracts

Contrats interservices de référence pour `analysis-store-service`.

- Source de vérité: `docs/contracts/interservice-contracts.md`.
- Les DTO TypeScript de `src/contracts/` seront alignés ultérieurement.

## État d'implémentation (fondations locales)

Les premiers contrats DTO locaux sont disponibles dans `src/contracts/` pour aligner les futures implémentations NestJS sur les contrats documentaires:
- création timeline/panel
- réponse timeline/panel
- import preview timeline/panel (validation stricte distincte `timeline.json` vs `panel.json`, avec `schemaVersion`)

La source de vérité métier interservice reste `docs/contracts/interservice-contracts.md`.
