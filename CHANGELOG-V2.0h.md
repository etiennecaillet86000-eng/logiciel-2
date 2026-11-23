# Rapport court — Gestion Resto Local V2.0h

## Changements
- Audit rapide: un onglet de frais variables existait déjà, avec seulement deux paramètres globaux (% du CA HT et € par ticket), déjà consommés par certaines projections et la comptabilité. Le simulateur Carte existait avec tableaux de performance et marges. Le Journal gérait des tickets et factures d’achat; aucun module de documents commerciaux client n’existait.
- Les hypothèses de frais variables deviennent des lignes réglables (commissions, emballages, énergie variable, consommables, maintenance/extras, carburant désactivé par défaut), avec modes % CA, par ticket, couvert, unité d’usage, forfait, et forfait + variable. Valeurs indicatives éditables, explications et activation par charge.
- Les nouvelles lignes alimentent Business initial, Business plan réel, Rentabilité mix produit et Compte de résultat. Les anciens paramètres globaux continuent d’être lus. Migration des réglages historiques: si des paramètres globaux antérieurs non nuls existent mais aucun détail n’a jamais été configuré, les lignes par défaut sont désactivées pour empêcher un double compte.
- Simulateur Carte: panneaux de performance et marge empilés verticalement.
- Nouveau module Factures & devis, numérotation annuelle, client, lignes, TVA, statut, impression via la fenêtre du navigateur. Une facture entièrement constituée de recettes du catalogue peut créer une entrée de Journal de manière idempotente; la facture liée est verrouillée. Les lignes libres ne sont pas convertibles, pour éviter de fausser les totaux/TVA.
- Le magasin `gestion-resto-local-v1` et le schéma des ventes restent les mêmes; champ documents ajouté avec tableau par défaut à la lecture/importation des anciennes sauvegardes.

## Tests et limites de vérification
- Suite Node: 42 tests réussis, dont les nouveaux calculs des frais variables et scénario de migration sans double compte.
- `npm test` n’a pas fonctionné car la commande npm installée est incomplète (`Cannot find module ../lib/cli.js`); exécution équivalente par `node --test tests/*.test.mjs` réussie.
- Aucun `node_modules`, `tsc` ou binaire Vite disponible; typecheck, build Vite, test navigateur et export réel imprimable n’ont pas été validés.
- Valeurs types et calculs restent indicatifs; vérifier les hypothèses (surtout frais par couvert/ticket, énergie, carburant, TVA et commissions) selon la situation réelle.
