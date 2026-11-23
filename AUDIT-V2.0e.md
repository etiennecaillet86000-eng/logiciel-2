# Audit de synchronisation — Gestion Resto Local V2.0e1

## Cartographie des flux

- `src/backend.ts` conserve les entités opérationnelles dans `gestion-resto-local-v1` (ingrédients, recettes, mouvements, ventes, emprunts, associés, amortissements, journal). `localActor` lit/écrit ce stockage via les hooks React Query.
- `Journal` crée des tickets et matérialise ventes + sorties de stock; factures ingrédients enregistrent entrée de stock/prix; pertes créent mouvements de sortie. `Historique`, `Stock`, `Dashboard`, `Opérations` et Comptabilité lisent les entités vente/mouvement.
- `projectionStore` (Zustand) et la configuration juridique/familiale sont d’autres domaines locaux distincts, justifiés par leurs réglages indépendants.
- La comptabilité agrège ventes, paramètres et charges disponibles. Le bilan dynamique calcule actif/passif depuis ventes, stocks, immobilisations, emprunts et associés. Ce n’est pas une comptabilité certifiée.

## Liste des constats priorisés et statut

| Priorité | Point d’audit / constat | Statut |
|---|---|---|
| P1 | Les lignes de vente ne conservaient pas le prix/TVA/coût au jour de vente; les rapports pouvaient changer après modification des recettes/prix d’ingrédients. | Corrigé — ticket enregistre prix TTC/HT, taux TVA et coût matière; sélecteurs partagés en lecture. Les anciennes ventes restent lisibles, mais leurs valeurs historiques exactes ne peuvent pas être reconstruites. |
| P1 | Journal et hooks étaient sur le même stockage mais pas les mises à jour d’autres onglets/fenêtres; invalidations essentiellement ponctuelles. | Corrigé — signal de changement à chaque écriture locale et invalidation React Query, complété par l’événement `storage` inter-onglets. |
| P1 | Comptabilité ajoutait toutes les factures aux coûts matière déjà associés aux ventes, ce qui pouvait compter en double les achats d’ingrédients; les achats hors stock sont distingués. | Corrigé — achats liés à un ingrédient exclus de la charge facture additionnelle; charges hors stock maintenues. |
| P1 | Tableau de bord, Opérations, Comptabilité et bilan utilisaient les prix courants pour estimer des ventes historiques. | Corrigé — emploi des sélecteurs de vente capturés, avec repli sur les fiches existantes pour le legacy. |
| P1 | Supprimer un ingrédient laissait des références actives en recettes, produisant un coût incomplet. | Corrigé — références d’ingrédient retirées des recettes à la suppression; les mouvements/historiques déjà liés sont conservés. |
| P2 | Coûts matière de recette recalculés à l’affichage dans Recettes, mais le coût stocké n’était pas recalculé comme donnée lors d’un changement de prix. | Corrigé partiellement — coût courant est dérivé des ingrédients; les tickets nouveaux stockent le coût du moment. Pas de champ redondant « coût courant » persisté, pour éviter une seconde vérité. |
| P2 | Le Journal est la source d’entrée principale pour les événements, les mouvements et les historiques sont produits automatiquement; ventes rapides antérieures restent des ventes legacy sans ticket. | Corrigé — journal conserve les données et effets liés; historique consomme automatiquement ventes/mouvements. Les ventes legacy ne sont pas converties rétroactivement en tickets. |
| P2 | Les suppressions/modifications de ticket/facture/perte annulent les effets liés; l’historique de prix facture est conservé pour reconstituer le dernier prix. | Corrigé — mécanismes existants conservés; tests couvrent les effets de ticket et snapshots. Cas de suppression d’ingrédient après transactions historique conservé, référence recette nettoyée. |
| P2 | Bilan et comptabilité sont des dérivations distinctes et certains postes (trésorerie, créances, dettes, TVA déclarée) indisponibles. | Non corrigé — signalés comme estimations/postes manquants dans les écrans; le modèle ne contient pas d’écritures doubles ni de trésorerie réelle, impossible d’assurer un bilan équilibré certifié. |
| P2 | TVA de vente historisée seulement pour tickets Journal; anciennes ventes restent dépendantes du taux actuel. | Corrigé pour nouveaux tickets / Non corrigé pour données antérieures sans snapshot. |
| P3 | Navigation, retours utilisateur, erreurs et textes pédagogiques du Journal sont présents, avec confirmation pour suppression de ticket et notifications toast; raccourcis entre pages et UX uniforme non exhaustivement normalisés. | Non corrigé (amélioration générale limitée à cette intervention). |
| P3 | Validations des champs de Journal incomplètes (ex. lignes de facture quantité/prix/TVA négatifs ou valeurs extrêmes; suppression facture/perte sans confirmation uniforme). | Non corrigé — les contrôles minimums existants sont conservés, mais validations complètes non développées. |

## Corrections incluses

- Source persistée opérationnelle inchangée pour préserver les données existantes; signal de synchronisation local multi-composants/multi-onglets.
- Snapshots de ventes et fonctions de dérivation partagées dans `journalMath.ts` pour CA HT/TTC et coût matière.
- Suppression de la double comptabilisation des achats d’ingrédients en Comptabilité.
- Nettoyage des dépendances de recette lors de suppression d’ingrédient.
- Tests ajoutés dans `tests/journal.test.mjs` pour snapshot historique et compatibilité legacy.

## Validation

- `node --test tests/*.test.mjs`: 30 tests réussis.
- Typecheck/build non exécutés avec succès: le paquet fourni n’inclut pas `node_modules`; `npm` global est cassé dans l’environnement (`Cannot find module ../lib/cli.js`) et `typescript/bin/tsc` absent. Aucun échec de compilation n’est donc affirmé, compilation non vérifiée.
- Les données réelles du navigateur n’étaient pas disponibles; migration valide par conservation de la clé/structure existantes et lecture legacy, non testée sur un export utilisateur réel.


## Incident de gel de navigation — correctif V2.0e2

- Cause racine identifiée dans `src/backend.ts` : le proxy de `localActor` appelait `write(s)` après **tous** les appels d’acteur, y compris les getters `getIngredients`, `getRecettes`, etc. `write` réécrivait la clé localStorage et émettait `gestion-resto:data-changed`; `src/App.tsx` écoutait cet événement et invalidait toutes les requêtes React Query. Les refetchs relançaient les getters, qui réémettaient le signal : boucle d’invalidation/refetch pouvant monopoliser le rendu.
- Correctif : ne persister/notifier que les méthodes absentes de la table des getters (`gets`). Les opérations d’écriture conservent le même stockage, sauvegarde automatique et événement; clé `gestion-resto-local-v1` et structure des données inchangées. Un changement inter-onglets demeure couvert par `storage`.
- Tests de contrat ajoutés dans `tests/local-store-sync.test.mjs`; suite Node : 32 réussis. Ce n’est pas un test de montage React/jsdom.
- `npm install`, build et `tsc --noEmit` non exécutables dans le sandbox : le lanceur npm est cassé (`Cannot find module ../lib/cli.js`), aucun `node_modules` fourni. Compilation et typecheck non validés.
