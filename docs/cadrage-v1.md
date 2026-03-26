# Cadrage v1

## Périmètre de cette étape

Cette étape initialise le socle technique de `analysis-store-service` avec NestJS.

## Rappels d'architecture

- Service dans une architecture microservices avec `front-service`, `auth-service` et `infra`.
- Validation JWT réalisée à la bordure par Traefik.
- Le service consommera plus tard des headers internes injectés par le gateway (`x-auth-user-id`, `x-auth-club-ids`, `x-auth-roles`).

## Règles métier rappelées

- Les timelines sont privées.
- Les panels supportent `private | club | public`, avec `private` par défaut.
- Les imports JSON ne sauvegardent jamais automatiquement.

## Hors scope actuel

- Implémentation complète PostgreSQL/Drizzle.
- Vérification JWT locale complète.
- Crypto applicative, outbox, logique métier complète.
