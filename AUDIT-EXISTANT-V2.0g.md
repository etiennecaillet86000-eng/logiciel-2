# Audit de l’existant — préparation V2.0g

Base examinée : archive V2.0f3 fournie dans `/mnt/user-data/outputs`. Audit des fichiers `src/core`, `src/modules`, `src/hooks`, `src/lib`, `src/utils`, tests, ainsi que les types et l’implémentation de persistance.

| Sujet | État avant V2.0g | Constat et réutilisation |
|---|---|---|
| Statuts juridiques | Fait, partiel | `ParametresJuridiques.tsx` proposait EI/EIRL/EURL/SARL/SAS/SASU/SA; sauvegarde locale dans `parametresJuridiques`. Suggestions automatiques de régime éditables. Pacte/gouvernance associés pas modélisés comme clauses juridiques. |
| Régime fiscal IR/IS | Partiel | Choix IR/IS persisté. Les calculs des projections utilisaient jusque-là surtout l’IS par défaut (`calculateIS`), sans branchement général sur le choix. V2.0g ajoute une lecture non destructive du choix au stockage historique et la sélection du calcul d’impôt des projections. L’IR est estimé au barème par part, sans quotient familial. |
| TVA | Partiel | TVA portée par les fiches recette (`tauxTVA`), défaut historique 10%; pas de paramètres fiscaux centralisés de taux réglables. V2.0g ajoute paramètres indicatifs modifiables pour taux normal/intermédiaire/réduit, sans remplacer les taux des recettes existantes. |
| Cotisations paramétrables | Partiel | `taxRates.ts` comportait taux TNS, assimilé salarié, parts salariale/patronale, IS, IR et PFU, stockés sous une clé auxiliaire propre; réglages modifiables et réinitialisables déjà présents. Plusieurs calculs utilisaient ces taux, mais le calcul dirigeant était réparti dans les onglets. V2.0g ajoute un helper partagé pour les charges dirigeants et le relie aux projections. |
| Associés investisseurs et pacte social | Fait, partiel | `AssociesGerants.tsx` gère plusieurs associés, `typeAssocie=investisseur`, parts/apports, rémunération, statut TNS/assimilé; investisseurs exclus de la rémunération. `businessPlanParams.pacteSocialActive` active les cotisations dans les projections. Pas de calcul complet de dividendes, répartition juridique personnalisée des bénéfices ni de charges complexes. |
| Amortissements/emprunts | Fait | Formules partagées en `core/utils/finance.ts`, prorata temporis, échéanciers et capital restant, tests existants. Réutilisés pour les bilans. |
| Comptabilité | Fait, partiel | Écran Compte de résultat utilise ventes, recettes, frais fixes, salaires, amortissements, intérêts et factures; journal des achats/ventes et stock liés. Pas de tenue complète en partie double, comptes de trésorerie, règlements clients/fournisseurs ou dettes sociales/fiscales. |
| Projections financières | Fait | Business initial, Business plan réel, Rentabilité mix produit, CAF; projections intégrées au magasin local persisté, mix, paramètres, associés, frais, prêts et immobilisations. V2.0g relie le régime d’impôt au calcul et réutilise la source du bilan prévisionnel. |
| Bilan | Partiel, déjà présent | La page `BilanComptable.tsx` existait déjà en V2.0f3 avec sous-vues réelle/prévisionnelle, sélecteur Business plan/mix, montants dynamiques et écart visible. Données inconnues assimilées à zéro et signalées; estimations de trésorerie/dettes limitées. V2.0g conserve, documente, améliore l’aide et ajoute impression. |
| Données locales et lancement | Fait, conservé | `gestion-resto-local-v1` est la clé maître dans `backend.ts`; paramètres juridiques préexistants. `Lancer-Gestion-Resto.bat` et Vite restent liés à 127.0.0.1. Les nouveaux réglages de TVA étendent le store des taux sans migrer la clé maître. |
| Bundle | Fait avant V2.0g | V2.0f3 utilise `React.lazy`/`Suspense` et des chunks manuels. Les nouvelles fonctions ne changent pas les imports de routage. La compilation mesurant le résultat V2.0g n’a pu être lancée ici, donc aucune garantie de taille après modification. |

## Changements apportés pour V2.0g
- Réutilisation/extension du bilan déjà existant (pas d’onglet dupliqué), sélecteur annuel et source prévisionnelle conservés, contrôle d’écart explicite, conseils de lecture et impression navigateur.
- Fonctions de taxe selon régime et charges sociales estimatives partagées; projections fiscales choisissent IR ou IS depuis paramètres juridiques stockés. Statuts des associés et investisseurs influencent les cotisations projetées.
- Champs estimatifs TVA centralisés ajoutés, éditables et avec bouton de retour aux valeurs indicatives existant.
- Tests dédiés ajoutés pour l’équilibre/l’écart, les charges TNS/assimilé, exclusion investisseur, désactivation du pacte et calcul IR/IS.
- Pas de modification de la clé de données principale. Pas de migration destructive prévue.

## Limites / hypothèses de calcul
- Le bilan réel est une analyse de gestion et non un bilan conforme certifié : immobilisations nettes estimées d’après amortissements; stocks = quantité issue du stock initial et des mouvements valorisée au prix unitaire HT courant; capital = apports déclarés; dette = capital restant selon calendrier de prêt. Les créances, trésorerie, réserves, dettes fiscales/sociales/fournisseurs non suivies restent nulles/indisponibles, et l’écart n’est pas artificiellement compensé.
- Résultat réel estimé à partir des ventes recette, matières, frais fixes, salaires, rémunérations, amortissements et intérêts disponibles; fenêtres de date de ventes/comptabilité incomplètes et charges comptables omises possibles.
- Bilan prévisionnel suppose résultats conservés dans l’entreprise et trésorerie approximée par apports + résultats cumulés + dette − immobilisations. Aucun stock circulant ni délai de paiement/dette déclarative n’est projeté. Hypothèses d’exploitation actuelles et horizon de cinq ans.
- L’IR projeté au barème progressif par part est une simplification, pas l’impôt dû d’un foyer ou d’une société. Statuts, assiettes, dividendes, TVA et cotisations varient avec la réglementation et les situations individuelles. Tous taux sont indicatifs, à contrôler par un expert-comptable/conseil.

## Vérification disponible
- Suite Node des tests : 36/36 réussis sur la version corrigée du dossier.
- `npm` ne s’exécute pas dans le sandbox (`/usr/local/bin/npm` ne trouve pas `../lib/cli.js`); dépendances `node_modules` absentes. `tsc --noEmit`, `vite build`, preview local, rendu navigateur et `npm audit` n’ont donc pas pu être vérifiés. La compilation finale et la taille du bundle restent à valider dans un environnement npm fonctionnel.
