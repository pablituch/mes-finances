# Mes Finances

Petite application Windows pour suivre ses dépenses mois par mois, avec un résumé annuel.

**Télécharger :** onglet [Releases](../../releases/latest) → `MesFinances-Installation.exe`.

- Saisie rapide des dépenses par catégorie, budgets mensuels, objectifs
- Aperçu annuel : épargne cumulée, répartition des dépenses, tableau mois par mois
- Affichage en € ou en $ CA
- Import d'un fichier Excel / CSV (budget maison ou export bancaire)
- Mises à jour automatiques

Les données restent sur l'ordinateur de chacun (`%APPDATA%\Mes Finances`), elles ne sont jamais envoyées sur GitHub.

## Publier une nouvelle version
1. Modifier le code, puis augmenter `"version"` dans `package.json` (ex. 1.1.0 → 1.2.0).
2. Envoyer les fichiers sur la branche `main`.
3. GitHub construit l'installateur tout seul (onglet **Actions**, ~5 min) et crée la Release.
4. Les apps installées détectent la nouvelle version au prochain lancement et proposent de redémarrer.
