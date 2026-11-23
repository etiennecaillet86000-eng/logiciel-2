# Gestion Resto Local — V2.0h3

## Changements
- Prix unitaire HT issu d’une recette arrondi à deux décimales; totaux HT/TVA/TTC cohérents.
- Sorties de stock au bon de livraison; annulation avec restitution du stock et suppression de la facture liée.
- Encaissements de factures intégrés au chiffre d’affaires, sans doublon avec les tickets et sans sortie de stock au paiement.
- Suppression contrôlée des factures/documents, avec traitement des paiements et liens; recherche par client, numéro et date.

## Tests et limites
- `node --test tests/*.test.mjs` : 56 tests réussis, 0 échec.
- Tests automatisés Node uniquement; validation manuelle dans un navigateur, impression et intégration comptable non effectuées. Build et typecheck non confirmés pour cette livraison.
