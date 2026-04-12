# Contrat infra / Traefik → analysis-store-service (v1 réel)

Objectif: intégrer le service derrière une gateway (Traefik) en s’alignant sur le comportement réellement codé.

## 1) Exposition réseau

- Service HTTP NestJS exposé sur `PORT` (défaut `3000`).
- Préfixe global API: `/api`.
- Endpoint de santé applicative: `GET /api/health`.
- Réponse health attendue:
  - `status: "ok"`
  - `service: "analysis-store-service"`
  - `env: <node_env>`
  - `timestamp: <iso>`

## 2) Hypothèse de sécurité (trust boundary)

- Le JWT est validé en bordure (gateway/Traefik + middleware auth externe).
- Le service **ne valide pas** le JWT localement.
- Le service consomme un contexte d’identité interne transmis par headers:
  - `x-auth-user-id` (obligatoire sur routes protégées)
  - `x-auth-club-ids` (optionnel, CSV ou JSON array stringifié)
  - `x-auth-roles` (optionnel, CSV ou JSON array stringifié)
- Si `x-auth-user-id` absent sur route protégée: `401 Unauthorized`.

Conséquence infra: ces headers doivent être injectés/forwardés uniquement via le chemin interne de confiance; ne pas exposer ce mécanisme aux appels clients directs.

## 3) Routes à protéger côté gateway

Routes sans identity guard:
- `GET /api/health`
- `POST /api/imports/timelines/validate`
- `POST /api/imports/panels/validate`

Routes avec identity guard (`x-auth-user-id` requis):
- `/api/security/*`
- `/api/timelines/*`
- `/api/panels/*`

## 4) Variables d’environnement utiles à l’infra

Variables validées au boot:
- `NODE_ENV`: `development | test | production` (défaut `development`)
- `PORT`: entier `1..65535` (défaut `3000`)
- `DATABASE_URL`: obligatoire hors `test`
- `DB_NAME`: défaut `analysis_store`
- `MASTER_KEY`: obligatoire hors `test`
- `CRYPTO_KEY_VERSION`: obligatoire hors `test`

Si variable critique absente/invalide: l’app échoue au démarrage (fail-fast).

## 5) Dépendance PostgreSQL

- Dépendance dure à PostgreSQL (Drizzle ORM).
- `DATABASE_URL` doit pointer vers une DB accessible au démarrage.
- Schéma principal utilisé par l’API v1:
  - `timelines`
  - `panels`
  - `outbox_events`
- Contrainte DB importante: `visibility='club'` nécessite `club_id` non null (timelines + panels).

## 6) Docker / Compose / reverse proxy: points d’attention

- `Dockerfile` runtime expose `3000`.
- `compose.yaml` local mappe `3000:3000` pour l’API et `5432:5432` pour Postgres.
- En environnement proxifié:
  - router Traefik vers le port applicatif interne (`3000` par défaut)
  - préserver les headers `x-auth-*` internes
  - éviter que des clients externes puissent surcharger ces headers

## 7) Intégration CI/CD (minimum utile)

Pour un wiring infra fiable:
1. Build image (`npm run build` dans le Docker build stage).
2. Injecter env requises (au moins `DATABASE_URL`, `MASTER_KEY`, `CRYPTO_KEY_VERSION`, `NODE_ENV=production`).
3. Lancer migration DB avant/au déploiement (`npm run db:migrate`).
4. Vérifier disponibilité via `GET /api/health`.
5. Tester au moins un endpoint protégé avec headers injectés par la gateway (`/api/security/context`).
