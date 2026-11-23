# Gestion Resto Local — V2.0h2

## Factures & devis
- Refondue la page en deux sous-onglets : « Devis / Bons de livraison » et « Factures », avec édition, lignes libres ou recette, TVA, totaux HT/TVA/TTC et impression navigateur conservée.
- Statuts des devis : Envoyé, Refusé, Accepté, Bon de livraison. Le passage en bon de livraison crée une facture unique automatiquement, copie client/lignes/TVA et établit les liens devis↔facture. Les documents liés ne sont pas supprimables par mégarde.
- Statuts de facture : Envoyé devient immédiatement En cours de paiement avec date d’envoi modifiable; Payé enregistre une date et un moyen (espèces, carte, virement, chèque).
- Le paiement ajoute une entrée idempotente dans Journal > Encaissements clients contenant client, facture, date, mode et HT/TVA/TTC. Elle est distincte des tickets, ventes catalogue, achats et mouvements de stock pour éviter le double compte. Annuler le paiement retire l’entrée liée et restitue le statut En cours de paiement.
- Migration tolérante des anciens statuts/types et liste documents par défaut à la lecture et à l’import des sauvegardes anciennes; clé `gestion-resto-local-v1` inchangée.

## Tests et validation
- Tests ajoutés pour transitions, création unique de facture liée, date d’envoi, écriture d’encaissement unique, annulation, migration et calcul de lignes libres sans stock.
- `node --test tests/*.test.mjs` : 48 tests réussis.
- `npm run typecheck` et `npm run build` tentés, non exécutables dans l’environnement : l’installation npm échoue avec `Cannot find module '../lib/cli.js'`. Aucun build Vite ni contrôle TypeScript n’est donc confirmé.
- La validation navigateur, l’impression physique et l’intégration en comptabilité générale n’ont pas été testées. L’encaissement apparaît dans la section dédiée du Journal et n’est volontairement pas assimilé aux ventes caisse.
