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
- Docker + Docker Compose (optionnel)

## Installation

```bash
npm install
```

## Quickstart (npm)

1. Copier l'environnement:

```bash
cp .env.example .env
```

2. Démarrer en développement:

```bash
npm run start:dev
```

3. Vérifier l'endpoint:

```bash
curl http://localhost:3000/api/health
```

## Quickstart (Docker)

```bash
docker compose up --build
```

Puis:

```bash
curl http://localhost:3000/api/health
```

## Variables d'environnement

Exemple fourni dans `.env.example`:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `DB_NAME`
- `MASTER_KEY`
- `CRYPTO_KEY_VERSION`

## Scripts npm utiles

- `npm run start`
- `npm run start:dev`
- `npm run build`
- `npm run lint`
- `npm run format`
- `npm test`
- `npm run test:e2e`


## Maintenance des dépendances

- Le projet limite les dépendances de scaffolding (pas de dépendance runtime sur `@nestjs/cli` / `@nestjs/schematics`).
- Des `overrides` npm sont définis dans `package.json` pour forcer des versions corrigées de dépendances transitives sensibles (`ajv`, `picomatch`).

## Endpoint disponible à cette étape

- `GET /api/health`

## Volontairement non implémenté à ce stade

- Implémentation complète PostgreSQL/Drizzle
- Logique métier timeline/panel/import
- Vérification JWT locale complète
- Autorisation avancée
- Crypto applicative
- Outbox
- Postman complet

## Notes de sécurité (étape actuelle)

- La sécurité JWT est traitée en bordure par Traefik.
- Ne pas faire confiance à des headers envoyés directement par le client.
- Les headers internes (`x-auth-user-id`, `x-auth-club-ids`, `x-auth-roles`) seront exploités dans une étape ultérieure.
