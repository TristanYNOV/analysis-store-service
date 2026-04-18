# Infra contract — `analysis-store-service` → repo `infra`

Ce document est **copiable tel quel** dans `infra` pour intégrer l’image du service.

## 1) Image GHCR à consommer

- **Image**: `ghcr.io/<org-or-user>/analysis-store-service`
- Dans ce repo, la publication est faite via `${{ github.repository }}` donc la forme effective est:
  - `ghcr.io/<owner>/analysis-store-service`

## 2) Stratégie de tags publiée

Publication sur push de tag SemVer Git (`vX.Y.Z`) :

- `X.Y.Z` (version complète)
- `X.Y` (mineure)
- `X` (majeure)
- `sha-<commit>` (traçabilité build)

Exemple pour `v1.4.2` :
- `ghcr.io/<owner>/analysis-store-service:1.4.2`
- `ghcr.io/<owner>/analysis-store-service:1.4`
- `ghcr.io/<owner>/analysis-store-service:1`
- `ghcr.io/<owner>/analysis-store-service:sha-abc1234...`

## 3) Runtime contract pour `infra`

- **Port interne service**: `3001`
- **Healthcheck applicatif interne**: `GET /api/health`
- **Healthcheck infra attendu**: `GET /health` (via routage/rewrite gateway si utilisé)
- **Dépendance**: PostgreSQL (obligatoire au démarrage)
- **Exposition**: derrière Traefik
- **Auth**: JWT validé en gateway; le service lit ensuite le contexte transmis en interne

### Variables d’environnement minimales

- `NODE_ENV=production`
- `PORT=3001`
- `DATABASE_URL=postgres://...`
- `MASTER_KEY=...`
- `CRYPTO_KEY_VERSION=v1`
- `DB_NAME=analysis_store` (optionnel, défaut interne)

## 4) Contexte d’identité interne attendu

Headers consommés par le service (injectés en interne, jamais depuis Internet):

- `x-auth-user-id` (obligatoire sur routes protégées)
- `x-auth-club-ids` (optionnel; CSV ou JSON array)
- `x-auth-roles` (optionnel; CSV ou JSON array)

Points Traefik/gateway:

- ne pas laisser le client forger/surcharger ces headers
- injecter/forwarder ces headers uniquement après validation JWT en bordure

## 5) Exemple d’intégration Docker Compose (repo `infra`)

```yaml
services:
  analysis-store-service:
    image: ghcr.io/<owner>/analysis-store-service:1.4.2
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: postgres://analysis_store:${ANALYSIS_STORE_DB_PASSWORD}@postgres:5432/analysis_store
      MASTER_KEY: ${ANALYSIS_STORE_MASTER_KEY}
      CRYPTO_KEY_VERSION: v1
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:3001/api/health"]
      interval: 10s
      timeout: 3s
      retries: 10
    labels:
      - traefik.enable=true
      - traefik.http.routers.analysis-store.rule=PathPrefix(`/analysis-store`)
      - traefik.http.routers.analysis-store.entrypoints=websecure
      - traefik.http.services.analysis-store.loadbalancer.server.port=3001
      # Si exposition en /analysis-store, prévoir un rewrite/strip-prefix
      # pour présenter /health côté gateway si nécessaire.
```

## 6) Pull GHCR privé (si package non public)

Deux options standard:

1. **GitHub Actions (`infra`)**: utiliser `GITHUB_TOKEN` avec permissions `packages: read`.
2. **Runtime hors GitHub**: utiliser un PAT/robot token avec scope `read:packages`.

Commande de login manuelle:

```bash
docker login ghcr.io -u <github-user> -p <token-read-packages>
```
