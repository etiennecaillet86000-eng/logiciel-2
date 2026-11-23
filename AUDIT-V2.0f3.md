# Audit V2.0f3 — Gestion Resto Local

## Synthèse
Audit et nettoyage de l’application locale, sans changement de la clé de stockage `gestion-resto-local-v1`. Le build produit à présent plusieurs chunks, avec chargement différé des pages. La validation porte sur compilation, types et tests automatisés, pas sur un audit comptable indépendant.

## Constats et corrections
- **Performance :** le build de référence V2.0f2 produisait un bundle JS unique de 1 133,51 kB minifié (318,65 kB gzip) et affichait l’avertissement Vite >500 kB. V2.0f3 a des pages chargées avec `React.lazy`/`Suspense` et des lots manuels React, UI, graphiques et requêtes. Le JS d’entrée est de 93,95 kB (30,01 kB gzip); chunk le plus gros, graphiques, 397,14 kB (108,56 kB gzip). Pas d’avertissement de taille. Le cumul JS initial/téléchargeable n’est pas directement comparable au seul bundle V2.0f2 : les pages et dépendances sont réparties en nombreux fichiers.
- **Nettoyage :** suppression de `frontend/` (53 fichiers sous artefacts de publication), `AGENTS.md`, `DESIGN.md`, `ui-summary.json`, `project.json`, `components.json`, `biome.json`. Retrait des dépendances manifestement inutilisées : @react-three/cannon, @react-three/drei, @react-three/fiber, @tanstack/react-router, @types/react-router-dom, date-fns, motion, react-icons, react-quill-new, react-router-dom, react-use, three, @types/three et @biomejs/biome. Les fichiers UI, stores et types utilisés ont été conservés après vérification des imports. Le lanceur `.bat` reste présent et inchangé.
- **Sécurité des imports :** validation de la présence et du type des principales listes et de l’objet Journal avant import. Limite d’import JSON de 25 Mo. La lecture de localStorage dans `readStore` est protégée par `try/catch`; migration amortissements garde la clé existante. Une sauvegarde automatique existe dans le stockage local, et l’export JSON peut inclure les données annexes.
- **CSP / réseau :** ajout d’une CSP restrictive dans `index.html`, autorisant les styles inline nécessaires. Config Vite déjà liée à `127.0.0.1` pour serveur et preview; confirmée en exécution. Aucune modification de cette adresse.
- **XSS :** aucune injection de saisie applicative détectée. `dangerouslySetInnerHTML` existe dans le composant chart shadcn pour injecter des règles CSS statiques contrôlées, et non du contenu utilisateur.
- **Données :** aucune authentification/mot de passe ou secret en dur trouvé. LocalStorage n’est pas chiffré et reste accessible au profil navigateur local.

## Audit des calculs / recommandations
Les tests couvrent des cas TVA, coût recette/ticket, commission titres-restaurant, factures HT, amortissements, emprunts, bilan et cotisations/dividendes. Les 32 tests passent. Le calcul des indicateurs Journal/Opérations reste cohérent selon ces tests. Aucune correction de formule comptable ou fiscale supplémentaire n’a été faite faute de preuve d’un défaut sûr à faible risque.

**À traiter en priorité avant usage comptable :**
1. Faire valider les règles TVA (taux selon ventes à consommer sur place/à emporter, boissons alcoolisées), charges sociales, impôts, frais variables et bilan par un expert-comptable; les paramètres et sorties restent des estimations.
2. Renforcer la validation métier des valeurs numériques et des objets importés (bornes, dates, IDs liés et schémas par entité). Le contrôle ajouté vérifie la structure de premier niveau, pas chaque ligne en profondeur.
3. Ajouter des tests dédiés aux conflits entre onglets ouverts simultanément et aux imports malformés; la synchronisation existante via événement `storage`/événement local n’est pas une transaction multi-onglets.
4. Une CSP HTTP via en-têtes serveur est préférable en déploiement; la balise meta n’offre pas toutes les directives. La sécurité locale ne protège pas des extensions de navigateur ou d’un accès au profil utilisateur.
5. Vérifier séparément npm audit après installation réseau avec npm fonctionnel, puis traiter les vulnérabilités selon compatibilité.

## Validation et limites
- `tsc --noEmit` : réussi.
- Tests Node : 32/32 réussis.
- `vite build` : réussi, aucun avertissement de chunk >500 kB.
- Preview Vite lié à `127.0.0.1:4173`; requête HTTP locale a retourné la page HTML.
- Taille bundle avant : 1 133,51 kB JS. Après : chunk d’entrée 93,95 kB; plus gros chunk 397,14 kB. Tailles brutes minifiées.
- **Non vérifié :** npm audit n’a pas pu être exécuté (commande `npm` fournie dans le sandbox défaillante : module npm `../lib/cli.js` absent). Pas de tests visuels navigateur ni validation exhaustive d’écritures comptables avec professionnels. Le lockfile a été ajusté aux dépendances déclarées; l’installation propre n’a pas pu être relancée dans cet environnement.
