# Engineering guidelines

## Stack

- Node.js 22 LTS
- NestJS 11
- TypeScript 5
- npm
- Jest
- ESLint + Prettier
- Docker + Compose

## Principes

- Garder le socle simple et maintenable.
- Ne pas sur-implémenter la logique métier tant que les contrats ne sont pas figés.
- Préparer les dossiers (`db`, `contracts`, `modules`) pour les étapes suivantes.
- Les formats JSON backend d'import sont définis par `analysis-store-service` (source de vérité) et le front doit s'y aligner ensuite.
- `schemaVersion` et `type` sont obligatoires pour chaque format d'import backend v1 (`analysis-timeline`, `sequencer-panel`).
- Les imports JSON doivent rester en mode validation/preview (aucune sauvegarde automatique) tant que la persistance dédiée n'est pas explicitement implémentée.
- Maintenir le dossier `postman/` à jour à chaque ajout/modification d'endpoint testable.
- Séparer strictement droits de lecture et droits d'écriture:
  - visibilité = accessibilité de lecture uniquement.
  - update/delete = owner only.
- Timeline = ressource toujours privée (pas de `public`/`club`).
- Panel = `private | club | public`, défaut création `private`.
- En update panel/timeline, pas de patch granulaire de `content_json`: remplacer le bloc métier fourni.
- `clubId` peut exister même quand `visibility` n'est pas `club`; seule contrainte: `visibility = club` impose `clubId`.
