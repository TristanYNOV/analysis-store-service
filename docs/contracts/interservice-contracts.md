# Interservice contracts

## Evenements RabbitMQ V1

- Contrat de suppression utilisateur: [events/user-deletion.md](events/user-deletion.md)
- Exchange: `domain.events`
- Routing keys V1: `user.deletion.requested`, `user.data.anonymized`, `user.deleted`
- Queue locale: `analysis-store-service.user-deletion`

## Sécurité (étape actuelle)

`analysis-store-service` ne vérifie pas le JWT complet dans cette étape.

Le contexte d'identité sera consommé plus tard via des headers internes fournis par le gateway (après validation Traefik):

- `x-auth-user-id`
- `x-auth-club-ids`
- `x-auth-roles`

## Événements futurs

- Événement interservice prévu: `UserDeleted`.
- Gestion future d'anonymisation ciblée.
