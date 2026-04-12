# analysis-store-service

Backend NestJS responsable du stockage des résultats d'analyse, avec une base technique prête pour timelines, panels et imports.

## Rôle du service

`analysis-store-service` expose des APIs backend pour persister et restituer des données d'analyse (timelines/panels/imports) dans une architecture microservices.

Contexte d'architecture:
- `front-service` envoie un JWT au gateway.
- Traefik valide le JWT en bordure.
- `analysis-store-service` consommera ensuite des headers internes de confiance (claims utiles), sans validation JWT locale complète à cette étape.

## Documentation existante

- [README](./README.md)
- [Cadrage v1](./docs/cadrage-v1.md)
- [Contracts README](./docs/contracts/README.md)
- [Interservice contracts](./docs/contracts/interservice-contracts.md)
- [Engineering guidelines](./docs/guides/engineering-guidelines.md)

## Prérequis

- Node.js 22 LTS
- npm 10+
- Docker + Docker Compose

## Installation

```bash
npm install
```

## Quickstart (local + PostgreSQL)

1. Copier l'environnement:

```bash
cp .env.example .env
```

2. Démarrer PostgreSQL:

```bash
docker compose up -d postgres
```

3. Appliquer les migrations:

```bash
npm run db:migrate
```

4. Vérifier la connexion DB:

```bash
npm run db:check
```

5. Démarrer l'API en développement:

```bash
npm run start:dev
```

6. Vérifier l'endpoint:

```bash
curl http://localhost:3001/api/health
```

## Quickstart (Docker)

```bash
docker compose up --build
```

Puis:

```bash
curl http://localhost:3001/api/health
```

## Variables d'environnement

Exemple fourni dans `.env.example`:

- `NODE_ENV` (`development` | `test` | `production`, défaut: `development`)
- `PORT` (défaut: `3001`)
- `DATABASE_URL` (obligatoire sauf en `test`)
- `DB_NAME` (défaut: `analysis_store`)
- `MASTER_KEY` (obligatoire sauf en `test`)
- `CRYPTO_KEY_VERSION` (obligatoire sauf en `test`)

La configuration est validée au démarrage. Si une variable critique est absente ou invalide, l'application s'arrête immédiatement avec un message explicite.

## Scripts npm utiles

- `npm run start`
- `npm run start:dev`
- `npm run build`
- `npm run lint`
- `npm test`
- `npm run test:e2e`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:studio`
- `npm run db:check`

## Schéma de base de données (étape actuelle)

Tables implémentées:
- `timelines`
- `panels`
- `outbox_events`

Points clés:
- `visibility` est un enum PostgreSQL (`private | club | public`).
- `club_id` est nullable.
- contrainte `CHECK` sur `timelines` et `panels` pour empêcher `visibility = 'club'` avec `club_id IS NULL`.
- stockage hybride avec colonnes relationnelles + `jsonb` (`content_json`, `payload_json`).

## Vérification PostgreSQL locale (fiable)

1. Vérifier les variables réellement utilisées par le service PostgreSQL:

```bash
docker compose config | sed -n '/postgres:/,/volumes:/p'
```

2. Se connecter avec **les vrais identifiants du compose** (et non `postgres/postgres`):

```bash
docker compose exec postgres psql -U analysis_store -d analysis_store
```

3. Lister les tables attendues:

```sql
\dt
```

Tu dois voir au minimum: `timelines`, `panels`, `outbox_events`, et `__drizzle_migrations` après exécution des migrations.

## Endpoints disponibles à cette étape

- `GET /api/health`
- `GET /api/security/context` (requiert `x-auth-user-id`)
- `POST /api/security/access-check/timeline` (hook minimal d'autorisation locale)
- `POST /api/security/access-check/panel` (hook minimal d'autorisation locale)
- `POST /api/imports/timelines/validate` (validation stricte + preview, sans persistance)
- `POST /api/imports/panels/validate` (validation stricte + preview, sans persistance)
- `POST /api/timelines` (owner = appelant, visibilité forcée `private`)
- `GET /api/timelines` (owner only)
- `GET /api/timelines/:id` (owner only, vue complète)
- `GET /api/timelines/:id/export` (owner only, JSON backend v1 complet)
- `PATCH /api/timelines/:id` (owner only)
- `DELETE /api/timelines/:id` (owner only, hard delete)
- `POST /api/panels` (visibilité par défaut `private`)
- `GET /api/panels` (filtré selon règles de lecture)
- `GET /api/panels/:id` (règles private/public/club, redaction pour lecteur non-owner si contenu anonymisé)
- `GET /api/panels/:id/export` (mêmes règles que la lecture; owner = complet, non-owner autorisé = redacted)
- `PATCH /api/panels/:id` (owner only)
- `DELETE /api/panels/:id` (owner only, hard delete)
- `POST /api/panels/:id/copy` (lecture autorisée + copie privée)

## Volontairement non implémenté à ce stade

- CRUD complet (create/list/get) timeline/panel
- Vérification JWT locale complète
- Autorisation avancée basée claims
- Crypto applicative
- Consumer outbox
- Healthcheck DB avancé


## Imports JSON (preview uniquement)

- `analysis-store-service` est la **source de vérité** des formats JSON backend; le front s'aligne ensuite sur ces formats.
- Les imports JSON ne sauvegardent **jamais** automatiquement en base.
- Les formats backend v1 sont distincts et non interchangeables: `analysis-timeline` et `sequencer-panel`.
- `schemaVersion` et `type` sont obligatoires pour les deux formats.
- Les endpoints `POST /api/imports/timelines/validate` et `POST /api/imports/panels/validate` renvoient une preview exploitable (`valid`, `errors`, `summary`, `normalizedPayload`) sans side effect.


## Vues métier: complète vs redacted

- Le backend produit deux vues d'une ressource:
  - **vue complète** pour le propriétaire.
  - **vue redacted** pour un lecteur autorisé non propriétaire.
- La redaction est pilotée côté backend sur le contenu métier marqué anonymisé (`hasAnonymizedContent` + flags objets type `isAnonymized`/`anonymized`/`anonymizedFlag`).
- La structure JSON backend v1 est conservée (pas d'objet cassé), seules certaines valeurs sensibles sont masquées.
- Pour les timelines, la logique de redaction est préparée mais non exposée aux non-propriétaires à ce stade (timeline strictement owner-only).
- Les routes de lecture et d'export réutilisent la même politique de vue/redaction pour éviter toute divergence.

## Workflow Postman

- Le dossier `postman/` est versionné, fait partie du workflow de test local, et constitue une convention du repo.
- Fichiers de référence:
  - `postman/analysis-store-service.postman_collection.json`
  - `postman/analysis-store-service.local.postman_environment.json`
- Toute nouvelle route testable doit mettre à jour ce dossier.

## Autorisation métier (règles locales)

- **Timeline**
  - lecture: owner only.
  - update/delete: owner only.
- **Panel**
  - lecture:
    - `private`: owner only.
    - `club`: `x-auth-club-ids` contient `club_id`.
    - `public`: tout utilisateur authentifié.
  - update/delete: owner only, quelle que soit la visibilité.
- La visibilité ne donne **jamais** le droit de modifier/supprimer.
- `POST /api/panels/:id/copy` permet l’appropriation:
  - source lisible selon les règles de lecture panel.
  - copie avec nouvel id + owner courant.
  - copie créée en `private` par défaut.
  - `club_id` est conservé si présent.

## Cohérence visibilité / clubId

- Si `visibility = club`, alors `clubId` est obligatoire.
- Si `visibility != club`, `clubId` peut être présent ou `null`.
- Le backend ne force pas `clubId` à `null` pour `private/public`.

## Notes de sécurité (étape actuelle)

- La sécurité JWT est traitée en bordure par Traefik.
- Ne pas faire confiance à des headers envoyés directement par le client.
- Le service lit un contexte d'identité interne depuis `x-auth-user-id`, `x-auth-club-ids`, `x-auth-roles` (CSV ou JSON array pour les listes).
- Le JWT n'est pas validé localement ici: la validation reste en bordure gateway/Traefik.
- Si `x-auth-user-id` est absent sur une route protégée, la réponse est `401 Unauthorized`.
- Règles locales minimales déjà en place: timeline owner-only; panel `private` owner-only; panel `public` pour tout utilisateur authentifié; panel `club` si `clubId` ressource ∈ `x-auth-club-ids`.
