# User deletion events

`analysis-store-service` consomme les demandes de suppression utilisateur et publie une confirmation lorsque ses donnees sont nettoyees.

## Topologie

- Exchange: `domain.events`
- Type: `topic`
- Durable: oui
- Queue consommatrice: `analysis-store-service.user-deletion`
- Binding consomme: `user.deletion.requested`
- Event publie: `user.data.anonymized`

La DLQ n'est pas activee dans cette V1. En cas d'erreur de traitement, le message est `nack` avec requeue; en cas d'evenement invalide, le message est `ack` avec log d'erreur pour eviter une boucle infinie.

## Envelope commun

```json
{
  "eventId": "uuid",
  "eventType": "user.deletion.requested",
  "version": 1,
  "occurredAt": "2026-05-04T15:00:00.000Z",
  "producer": "auth-service",
  "correlationId": "uuid",
  "data": {}
}
```

## user.deletion.requested

Producteur: `auth-service`

```json
{
  "eventId": "uuid",
  "eventType": "user.deletion.requested",
  "version": 1,
  "occurredAt": "2026-05-04T15:00:00.000Z",
  "producer": "auth-service",
  "correlationId": "uuid",
  "data": {
    "userId": "user-uuid",
    "requestedBy": "self",
    "reason": "user_request"
  }
}
```

## Cleanup V1

- Les timelines de l'utilisateur sont supprimees.
- Les panels prives de l'utilisateur sont supprimes.
- Les panels non-prives de l'utilisateur sont conserves mais anonymises autant que le modele actuel le permet: `ownerUserId = "deleted-user"`, titre generique, description et payload chiffre supprimes, `hasAnonymizedContent = true`.

Le compteur `publicPanels` couvre les panels partages anonymises par cette V1.

## user.data.anonymized

Producteur: `analysis-store-service`

```json
{
  "eventId": "uuid",
  "eventType": "user.data.anonymized",
  "version": 1,
  "occurredAt": "2026-05-04T15:01:00.000Z",
  "producer": "analysis-store-service",
  "correlationId": "uuid",
  "data": {
    "userId": "user-uuid",
    "service": "analysis-store-service",
    "deletedResources": {
      "timelines": 0,
      "privatePanels": 0
    },
    "anonymizedResources": {
      "publicPanels": 0
    }
  }
}
```

## Idempotence

La table `processed_events` stocke `eventId`, `eventType` et `processedAt`. Si un `eventId` est deja present, le service ne relance pas le cleanup et ack le message.

Le cleanup reste tolerant aux rejouements avant enregistrement: supprimer une ressource deja supprimee ou anonymiser un panel deja detache donne simplement des compteurs a zero au prochain passage.

## Variables

- `RABBITMQ_URL`
- `RABBITMQ_EXCHANGE`
- `RABBITMQ_QUEUE_ANALYSIS_STORE`
