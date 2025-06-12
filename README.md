# 📘 Documentation du module xcraft-core-env

## Aperçu

Le module `xcraft-core-env` est une librairie utilitaire du framework Xcraft qui gère l'environnement d'exécution et les variables d'environnement système. Il fournit des outils pour configurer dynamiquement le PATH, injecter des variables d'environnement spécifiques aux plateformes, et gérer les configurations de développement selon les distributions.

## Sommaire

- [Structure du module](#structure-du-module)
- [Fonctionnement global](#fonctionnement-global)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Interactions avec d'autres modules](#interactions-avec-dautres-modules)
- [Variables d'environnement](#variables-denvironnement)
- [Détails des sources](#détails-des-sources)

## Structure du module

Le module s'organise autour de plusieurs composants :

- **Point d'entrée principal** (`index.js`) : Charge dynamiquement tous les modules d'environnement
- **Helpers** (`lib/helpers.js`) : Utilitaires pour l'injection de placeholders
- **Variables** (`lib/vars.js`) : Définition des variables d'environnement gérées
- **Modules d'environnement** (`lib/env/`) : Scripts de configuration exécutés séquentiellement

## Fonctionnement global

Le module fonctionne selon un système de chargement séquentiel des modules d'environnement :

1. **Chargement automatique** : Tous les fichiers `.js` du dossier `lib/env/` sont chargés par ordre alphabétique
2. **Préfixage numérique** : Les fichiers sont préfixés par des numéros pour contrôler l'ordre d'exécution
3. **Mise à jour dynamique** : La fonction `devrootUpdate()` permet de reconfigurer l'environnement selon la distribution

### Séquence d'initialisation

1. **Preinit** (0.preinit.js) : Nettoyage des variables d'environnement
2. **Path** (1.path.js) : Configuration du PATH système
3. **Other** (2.other.js) : Injection des autres variables d'environnement
4. **Postinit** (9.postinit.js) : Configuration finale et optimisations

## Exemples d'utilisation

### Utilisation basique

```javascript
const xEnv = require('xcraft-core-env');

// Accès aux modules d'environnement
const pathModule = xEnv.var.path;
const otherModule = xEnv.var.other;

// Mise à jour de l'environnement pour une distribution
xEnv.devrootUpdate('myDistribution');
```

### Gestion du PATH

```javascript
const pathModule = xEnv.var.path;

// Ajouter un répertoire au début du PATH
pathModule.unshift('/usr/local/custom/bin');

// Ajouter un répertoire à la fin du PATH
pathModule.push('/opt/tools/bin');

// Vérifier si un exécutable existe dans le PATH
const result = pathModule.isIn('gcc');
if (result) {
  console.log(`gcc trouvé à : ${result.location}`);
}

// Obtenir la liste complète du PATH
const pathList = pathModule.getList();
```

### Préprocessing des variables d'environnement

```javascript
// Filtrer les variables selon la plateforme
const processedEnv = xEnv.pp({
  'linux-x64/MY_VAR': 'value_for_linux_x64',
  'win32-x64/MY_VAR': 'value_for_windows_x64',
  'COMMON_VAR': 'common_value',
});
```

## Interactions avec d'autres modules

Le module `xcraft-core-env` interagit étroitement avec :

- **[xcraft-core-etc]** : Pour charger les configurations Xcraft
- **[xcraft-core-fs]** : Pour lister et lire les fichiers d'environnement
- **[xcraft-core-platform]** : Pour détecter l'OS et l'architecture
- **[xcraft-core-placeholder]** : Pour l'injection de variables dans les chaînes
- **[xcraft-contrib-pacman]** : Pour obtenir les chemins de distribution

### Variables d'environnement

| Variable             | Description                 | Exemple                            | Valeur par défaut         |
| -------------------- | --------------------------- | ---------------------------------- | ------------------------- |
| `PATH`               | Chemin d'exécution système  | `/usr/bin:/bin`                    | Configuré dynamiquement   |
| `XCRAFT_CCACHE_PATH` | PATH pour ccache            | `/usr/bin:/bin`                    | Copie du PATH initial     |
| `CCACHE_PATH`        | PATH pour ccache (fallback) | `/usr/bin:/bin`                    | `XCRAFT_CCACHE_PATH`      |
| `XCRAFT_ENV`         | Variables gérées par Xcraft | `{"VAR":"file.json"}`              | `{}`                      |
| `npm_config_cache`   | Cache npm                   | `/tmp/xcraft/npm-cache`            | Basé sur `tempRoot`       |
| `TMP`, `TEMP`        | Répertoires temporaires     | `/tmp/xcraft/system`               | Basé sur `tempRoot`       |
| `HOME`               | Répertoire utilisateur      | `/home/user`                       | `USERPROFILE` sur Windows |
| `SDKROOT`            | SDK macOS                   | `/Applications/Xcode.app/...`      | Détecté automatiquement   |
| `CFLAGS`             | Flags de compilation C      | `-O2 -g0 -fPIC`                    | Optimisation par défaut   |
| `CXXFLAGS`           | Flags de compilation C++    | `-O2 -g0 -fPIC`                    | Optimisation par défaut   |
| `LDFLAGS`            | Flags de linkage            | `-static-libgcc -static-libstdc++` | Selon le compilateur      |

## Détails des sources

### `index.js`

Point d'entrée principal qui charge dynamiquement tous les modules d'environnement du dossier `lib/env/`. Expose trois fonctions principales :

- **`devrootUpdate(distribution)`** : Met à jour l'environnement pour une distribution donnée
- **`var`** : Objet contenant tous les modules d'environnement chargés
- **`pp(env)`** : Préprocesseur pour filtrer les variables selon la plateforme

### `lib/helpers.js`

Classe utilitaire pour l'injection de placeholders dans les chaînes de configuration. Cette classe configure automatiquement des placeholders pour l'architecture, les chemins système, et les variables d'environnement.

#### Méthodes publiques

- **`injectPh(data, distribution)`** — Injecte les placeholders système dans une chaîne de données, en remplaçant les variables comme `{OS.ROOTDIR}`, `{OS.ARCH}`, `{OS.ENV.VAR}`, etc. Supporte les chemins POSIX et Windows avec normalisation automatique.

### `lib/vars.js`

Définit les variables d'environnement critiques gérées par le module. Ces variables peuvent être réinitialisées lors des mises à jour d'environnement pour éviter les conflits entre distributions.

### `lib/env/0.preinit.js`

Module de pré-initialisation qui nettoie les variables d'environnement définies dans `vars.js` avant la reconfiguration.

#### Méthodes publiques

- **`devrootUpdate()`** — Supprime toutes les variables d'environnement critiques pour permettre une reconfiguration propre.

### `lib/env/1.path.js`

Gestionnaire principal du PATH système avec support pour les environnements de développement et de production. Maintient deux listes séparées : une pour les chemins Xcraft et une pour les chemins de distribution.

#### Méthodes publiques

- **`unshift(location)`** — Ajoute un répertoire au début du PATH Xcraft.
- **`push(location)`** — Ajoute un répertoire à la fin du PATH Xcraft.
- **`isIn(bin)`** — Recherche un exécutable dans le PATH et retourne sa position et son chemin complet.
- **`strip(index)`** — Supprime une entrée du PATH Xcraft à l'index spécifié.
- **`insert(index, location)`** — Insère un répertoire à une position spécifique dans le PATH Xcraft.
- **`getList()`** — Retourne la liste complète des répertoires dans le PATH.
- **`devrootUpdate(distribution)`** — Met à jour le PATH selon la distribution, en chargeant les configurations depuis `etc/env/path`.

### `lib/env/2.other.js`

Gestionnaire des variables d'environnement autres que le PATH, chargées depuis les fichiers de configuration des packages. Maintient un registre des variables gérées dans `XCRAFT_ENV`.

#### Méthodes publiques

- **`devrootUpdate(distribution)`** — Charge et injecte les variables d'environnement depuis `etc/env/other`, avec support des placeholders et nettoyage automatique des variables obsolètes.

### `lib/env/9.postinit.js`

Module de post-initialisation qui configure les variables d'environnement finales et les optimisations par défaut. Détecte automatiquement les outils système disponibles.

#### Méthodes publiques

- **`devrootUpdate()`** — Configure les variables finales comme les répertoires temporaires, les flags de compilation, et détecte automatiquement le SDKROOT sur macOS et les flags de linkage selon le compilateur GCC.

---

_Ce document a été mis à jour pour refléter la structure et le fonctionnement actuels du module._

[xcraft-core-etc]: https://github.com/Xcraft-Inc/xcraft-core-etc
[xcraft-core-fs]: https://github.com/Xcraft-Inc/xcraft-core-fs
[xcraft-core-platform]: https://github.com/Xcraft-Inc/xcraft-core-platform
[xcraft-core-placeholder]: https://github.com/Xcraft-Inc/xcraft-core-placeholder
[xcraft-contrib-pacman]: https://github.com/Xcraft-Inc/xcraft-contrib-pacman