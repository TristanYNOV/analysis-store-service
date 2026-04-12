# Contrat front → analysis-store-service (v1 réel)

Ce document résume **ce qu’un front (ou Codex) doit implémenter** pour consommer l’API sans relire tout le repo.

## 1) Préconditions d’appel

- Base URL locale par défaut: `http://localhost:3001`
- Préfixe global API: `/api`
- Toutes les routes métier (`/timelines`, `/panels`, `/security/*`) sont protégées par le contexte d’identité.
- Header minimal requis sur routes protégées: `x-auth-user-id` (sinon `401`).
- Headers d’identité supportés:
  - `x-auth-user-id: <string>`
  - `x-auth-club-ids: <csv>` ou `x-auth-club-ids: ["clubA","clubB"]`
  - `x-auth-roles: <csv>` ou `x-auth-roles: ["roleA"]`

> Le front public ne doit pas forger ces headers en prod: ils viennent de la gateway interne.

## 2) Routes utiles front

## 2.1 Imports (validation only, sans persistance)

### `POST /api/imports/timelines/validate`
- Auth: non requis côté service.
- Body: JSON `analysis-timeline` v1.
- Réponse:
  - `type: "analysis-timeline"`
  - `schemaVersion: "1.0.0"`
  - `valid: boolean`
  - `detectedType: "analysis-timeline" | "sequencer-panel" | null`
  - `summary: { timelineName, eventDefCount, labelDefCount, occurrenceCount }`
  - `normalizedPayload: payload normalisé | null`
  - `errors: { code, path, message }[]`

### `POST /api/imports/panels/validate`
- Auth: non requis côté service.
- Body: JSON `sequencer-panel` v1.
- Réponse:
  - `type: "sequencer-panel"`
  - `schemaVersion: "1.0.0"`
  - `valid: boolean`
  - `detectedType: "analysis-timeline" | "sequencer-panel" | null`
  - `summary: { panelName, buttonCount, eventButtonCount, labelButtonCount, statButtonCount }`
  - `normalizedPayload: payload normalisé | null`
  - `errors: { code, path, message }[]`

## 2.2 Timelines (owner only)

### `POST /api/timelines`
- Auth: `x-auth-user-id` requis.
- Body:
  - `title: string` (required)
  - `description?: string | null`
  - `contentJson: object` (required)
  - `hasAnonymizedContent?: boolean`
- Règles:
  - `visibility` est refusée en input (toujours forcée à `private`).
  - `clubId` est refusé en input.
- Retourne `TimelineResourceResponse`.

### `GET /api/timelines`
- Retourne uniquement les timelines du owner courant.

### `GET /api/timelines/:id`
- Owner uniquement.
- Retourne `TimelineResourceResponse`.

### `GET /api/timelines/:id/export`
- Owner uniquement.
- Retourne **uniquement** le JSON métier (`contentJson`) au format backend v1 (pas de wrapper metadata).

### `PATCH /api/timelines/:id`
- Owner uniquement.
- Body:
  - `contentJson: object` (required)
  - `title?: string`
  - `description?: string | null`
  - `hasAnonymizedContent?: boolean`
- Champs immuables rejetés s’ils sont fournis (`id`, `ownerUserId`, `createdAt`, variantes snake_case).

### `DELETE /api/timelines/:id`
- Owner uniquement.
- Retour: `204`.

## 2.3 Panels (lecture élargie + édition owner)

### `POST /api/panels`
- Auth: `x-auth-user-id` requis.
- Body:
  - `title: string` (required)
  - `description?: string | null`
  - `contentJson: object` (required)
  - `visibility?: "private" | "club" | "public"` (défaut `private`)
  - `clubId?: string | null`
  - `hasAnonymizedContent?: boolean`
- Règle de cohérence: si `visibility = "club"`, `clubId` obligatoire.

### `GET /api/panels`
- Retourne les panels lisibles par l’utilisateur:
  - owner: oui
  - `public`: oui
  - `club`: si `clubId` du panel ∈ `x-auth-club-ids`
  - `private`: non si non-owner

### `GET /api/panels/:id`
- Même règle d’accès que la liste.
- Retourne `PanelResourceResponse`.

### `GET /api/panels/:id/export`
- Même règle d’accès que lecture panel.
- Retourne **uniquement** le JSON métier (`contentJson`) au format backend v1.

### `PATCH /api/panels/:id`
- Owner uniquement.
- Body:
  - `contentJson: object` (required)
  - `title?: string`
  - `description?: string | null`
  - `visibility?: "private" | "club" | "public"`
  - `clubId?: string | null`
  - `hasAnonymizedContent?: boolean`
- Règle: si la visibilité résolue est `club`, `clubId` résolu doit être non-null.

### `DELETE /api/panels/:id`
- Owner uniquement.
- Retour: `204`.

### `POST /api/panels/:id/copy`
- Précondition: panel source lisible selon règles ci-dessus.
- Effet:
  - crée un nouveau panel avec owner courant
  - visibilité forcée à `private`
  - `clubId` de la source conservé
  - `title` suffixé par `" (copy)"`
- Retourne `PanelResourceResponse` du panel copié.

## 3) Types conceptuels à respecter côté front

## 3.1 Ressource stockée (`TimelineResourceResponse` / `PanelResourceResponse`)

```ts
interface ResourceResponse {
  id: string;
  ownerUserId: string;
  title: string;
  description: string | null;
  visibility: 'private' | 'club' | 'public';
  clubId: string | null;
  contentJson: Record<string, unknown>;
  hasAnonymizedContent: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
```

## 3.2 Format import/export timeline (`analysis-timeline`)

```ts
interface AnalysisTimelineV1 {
  schemaVersion: '1.0.0';
  type: 'analysis-timeline';
  timelineName: string;
  meta: {
    createdAtIso: string;
    updatedAtIso: string;
    exportedAtIso: string;
    sourceUserId: string | null;
    sourceApp: string;
    sourceAppVersion: string;
  };
  eventDefs: Array<{ id: string; name: string; colorHex: string | null }>;
  labelDefs: Array<{ id: string; name: string; colorHex: string | null }>;
  occurrences: Array<{
    id: string;
    eventDefId: string | null;
    labelDefId: string | null;
    occurredAtIso: string;
    durationMs: number;
    note: string | null;
  }>;
  ui: { zoom: number; showLabels: boolean; selectedOccurrenceId: string | null };
}
```

## 3.3 Format import/export panel (`sequencer-panel`)

```ts
interface SequencerPanelV1 {
  schemaVersion: '1.0.0';
  type: 'sequencer-panel';
  panelName: string;
  meta: {
    createdAtIso: string;
    updatedAtIso: string;
    exportedAtIso: string;
    sourceUserId: string | null;
    sourceApp: string;
    sourceAppVersion: string;
  };
  btnList: Array<
    | {
        type: 'event';
        id: string;
        name: string;
        layout: { x: number; y: number; w: number; h: number; z: number };
        hotkeyNormalized: string | null;
        deactivateIds: string[];
        activateIds: string[];
        eventProps: { eventName: string; colorHex: string | null };
      }
    | {
        type: 'label';
        id: string;
        name: string;
        layout: { x: number; y: number; w: number; h: number; z: number };
        hotkeyNormalized: string | null;
        deactivateIds: string[];
        activateIds: string[];
        labelProps: { label: string; colorHex: string | null };
      }
    | {
        type: 'stat';
        id: string;
        name: string;
        layout: { x: number; y: number; w: number; h: number; z: number };
        hotkeyNormalized: string | null;
        deactivateIds: string[];
        activateIds: string[];
        stat: { statName: string; value: number; colorHex: string | null };
      }
  >;
}
```

## 4) Règles métier critiques (à ne pas rater)

- Timeline: toujours privée + owner-only (create/read/export/update/delete).
- Panel: `private | club | public`.
- `visibility` ne donne jamais le droit de modifier/supprimer: patch/delete restent owner-only.
- Vue owner vs redacted:
  - owner: `contentJson` complet
  - non-owner autorisé (panel): redaction appliquée **si** `hasAnonymizedContent = true`
  - timeline non-owner: non exposée à ce stade
- Imports: validation + preview uniquement, **aucune persistance**.

## 5) Pièges front fréquents

- `PATCH /timelines/:id` et `PATCH /panels/:id` exigent `contentJson`.
- Les routes `.../export` renvoient directement le document métier, pas un DTO enveloppé.
- `POST /api/panels/:id/copy` conserve `clubId` source mais force la copie en `private`.
- Les listes d’identité (`x-auth-club-ids`, `x-auth-roles`) acceptent CSV **ou** JSON array stringifié.
