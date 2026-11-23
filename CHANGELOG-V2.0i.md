# V2.0i — Évolutions

## Factures, devis et bons de livraison
- Les lignes issues des recettes et les lignes libres se saisissent en prix unitaire **TTC** ; le taux de TVA se choisit entre **5,5 % et 10 %**.
- Le HT et la TVA sont recalculés au centime à partir du TTC. Les prix TTC des recettes sont préremplis.
- Compatibilité douce : les documents plus anciens restent stockés en HT et leur TTC est reconstruit à l’affichage/calcul sans migration destructive.
- Les liens devis/BL/facture, l’annulation restaurable du BL, le stock des recettes, les lignes libres sans stock, les encaissements à la date de paiement et la protection contre les doublons sont conservés.

## Opérations
- La vue « Mois » choisit un mois (janvier à décembre) et une année, indépendamment d’une date journalière.
- Nouvelle vue « Personnalisé », avec début/fin, graphiques découpés en mois dans la période et vérification début ≤ fin.

## Bilan simplifié et Journal
- Refonte du bilan réel en deux colonnes : actif (immobilisations, stocks, créances, trésorerie) et passif (capital/résultat, comptes courants, emprunts, fournisseurs, fiscal/social).
- Rubriques dépliables avec explication, sources disponibles et ajustement manuel de session ; indicateur d’équilibre sans forçage artificiel.
- Les factures clients non payées composent les créances. Les achats du Journal possèdent le statut « Payée / À payer » ; les anciens enregistrements sans statut sont affichés Payés. Une facture « À payer » produit une dette fournisseur, tandis que son passage à Payée constitue un décaissement estimé.
- Ajout d’un panneau Tiers clients/fournisseurs/associés/banque avec mouvements disponibles.
- Les soldes de banque, comptes courants et dettes fiscales/sociales peuvent nécessiter des ajustements : ce bilan demeure une estimation, non un logiciel comptable certifié.

## Vérification
- Tests Node couvrant conversion TTC→HT, compatibilité des lignes historiques, périodes calendrier/personnalisées, créances/dettes et équilibration.
- Exécution `node --test tests/*.test.mjs` : 60 tests réussis.
- Typecheck et compilation non vérifiés dans l’environnement de travail : `npm` ne démarre pas (installation globale incomplète).
