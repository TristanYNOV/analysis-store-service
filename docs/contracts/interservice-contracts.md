# Interservice contracts

## Sécurité (étape actuelle)

`analysis-store-service` ne vérifie pas le JWT complet dans cette étape.

Le contexte d'identité sera consommé plus tard via des headers internes fournis par le gateway (après validation Traefik):

- `x-auth-user-id`
- `x-auth-club-ids`
- `x-auth-roles`

## Événements futurs

- Événement interservice prévu: `UserDeleted`.
- Gestion future d'anonymisation ciblée.
