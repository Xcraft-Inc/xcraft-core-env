# 📘 xcraft-core-env

## Aperçu

Le module `xcraft-core-env` est une librairie utilitaire du framework Xcraft dédiée à la gestion de l'environnement d'exécution Node.js. Il centralise la configuration du `PATH` système, l'injection de variables d'environnement dépendantes de la plateforme, ainsi que la mise en place de flags de compilation et d'outils de toolchain (SDK, compilateurs C/C++, ccache). Le module est conçu pour être reconfiguré dynamiquement à chaque changement de « distribution » (contexte de build/déploiement Xcraft), sans nécessiter de redémarrage du processus.

## Sommaire

- [Structure du module](#structure-du-module)
- [Fonctionnement global](#fonctionnement-global)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Interactions avec d'autres modules](#interactions-avec-dautres-modules)
- [Variables d'environnement](#variables-denvironnement)
- [Détails des sources](#détails-des-sources)
- [Licence](#licence)

## Structure du module

Le module est organisé en quatre parties :

- **Point d'entrée** (`index.js`) : découvre et charge dynamiquement, par ordre alphabétique, tous les modules situés dans `lib/env/`, puis les expose via `exports.var`.
- **Helpers** (`lib/helpers.js`) : classe statique `Helpers` fournissant l'injection de placeholders (`{OS.xxx}`) dans les chaînes de configuration, en s'appuyant sur `xcraft-core-placeholder`.
- **Variables critiques** (`lib/vars.js`) : liste des variables d'environnement sensibles (`SDKROOT`, `CFLAGS`, `CXXFLAGS`, `LDFLAGS`) qui doivent être réinitialisées à chaque reconfiguration.
- **Modules d'environnement** (`lib/env/*.js`) : quatre scripts, préfixés numériquement pour garantir leur ordre d'exécution, qui composent la séquence de configuration complète.

## Fonctionnement global

Le chargement se fait en deux temps. Au démarrage (`init()` dans `index.js`), tous les fichiers `.js` de `lib/env/` sont listés et triés, puis chaque fichier est chargé et exposé sous une clé dérivée de son nom (le préfixe numérique est retiré). Ensuite, l'appel à `exports.devrootUpdate(distribution)` parcourt chacun de ces modules et invoque leur fonction `devrootUpdate`, si elle existe.

La séquence d'exécution, garantie par le préfixe numérique des fichiers, est la suivante :

1. **`0.preinit.js`** — Supprime du `process.env` toutes les variables listées dans `lib/vars.js`, afin de repartir sur une base propre avant toute reconfiguration.
2. **`1.path.js`** — Reconstruit intégralement le `PATH` système à partir de deux listes : `xcraft` (chemins fixes du framework, `node_modules/.bin`, `usr/bin`, `bin`, plus les chemins additionnels de la configuration `xcraftRoot`) et `devroot` (chemins spécifiques à la distribution active, lus depuis `etc/env/path`). Le `PATH` recalculé est aussi copié dans `XCRAFT_CCACHE_PATH` pour que ccache retrouve le compilateur hôte.
3. **`2.other.js`** — Lit les fichiers JSON de `etc/env/other` (pour la distribution active), injecte les placeholders dans chaque valeur via `Helpers.injectPh`, puis positionne les variables correspondantes dans `process.env`. Les variables qui ne sont plus référencées par rapport à un précédent passage (suivi via `XCRAFT_ENV`) sont supprimées.
4. **`9.postinit.js`** — Termine la configuration : positionne `npm_config_cache`, `TMP`/`TEMP` sous `tempRoot`, complète `HOME` depuis `USERPROFILE` sous Windows, détecte `SDKROOT` via `xcrun` sur macOS, et fournit des valeurs par défaut pour `CFLAGS`/`CXXFLAGS`/`LDFLAGS` si elles ne sont pas déjà définies.

En complément, `index.js` expose la fonction `pp(env)`, un préprocesseur qui filtre un objet de variables clé/valeur selon des clés préfixées par `os-arch/` (par exemple `win32-x64/MY_VAR`), ne conservant que les entrées pertinentes pour la plateforme courante (déterminée via `xcraft-core-platform`).

## Exemples d'utilisation

### Reconfiguration de l'environnement pour une distribution

```javascript
const xEnv = require('xcraft-core-env');

// Recharge l'environnement (PATH, variables, flags) pour une distribution donnée
xEnv.devrootUpdate('myDistribution');
```

### Manipulation du PATH Xcraft

```javascript
const pathModule = xEnv.var.path;

// Ajoute un répertoire prioritaire en tête du PATH
pathModule.unshift('/usr/local/custom/bin');

// Ajoute un répertoire en fin de PATH
pathModule.push('/opt/tools/bin');

// Recherche un exécutable dans le PATH
const found = pathModule.isIn('gcc');
if (found) {
  console.log(`gcc trouvé à : ${found.location}`);
}

// Récupère la liste complète des répertoires actifs
const allPaths = pathModule.getList();
```

### Filtrage de variables selon la plateforme

```javascript
const processedEnv = xEnv.pp({
  'linux-x64/MY_VAR': 'valeur_linux_x64',
  'win32-x64/MY_VAR': 'valeur_windows_x64',
  'COMMON_VAR': 'valeur_commune',
});
```

## Interactions avec d'autres modules

- **[xcraft-core-etc]** : charge la configuration globale `xcraft` (racines `xcraftRoot`, `pkgTargetRoot`, `tempRoot`, chemins additionnels).
- **[xcraft-core-fs]** : liste les fichiers des dossiers `lib/env/`, `etc/env/path` et `etc/env/other`.
- **[xcraft-core-platform]** : détermine l'OS, l'architecture et l'architecture de la toolchain courante.
- **[xcraft-core-placeholder]** : moteur d'injection de placeholders utilisé par `Helpers.injectPh`.
- **xcraft-contrib-pacman** : fournit la racine cible (`getTargetRoot`) pour une distribution donnée (dépendance chargée à la demande, non déclarée dans `package.json`).

## Variables d'environnement

| Variable                                   | Description                                                                                          | Exemple                                                     | Valeur par défaut                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| `PATH`                                     | Chemin d'exécution système, recomposé à partir des chemins Xcraft et devroot.                        | `/usr/bin:/bin`                                             | Recalculé dynamiquement                   |
| `XCRAFT_CCACHE_PATH`                       | Copie du `PATH` utilisée pour que ccache retrouve le compilateur hôte.                               | `/usr/bin:/bin`                                             | Copie du `PATH` au moment de l'init       |
| `CCACHE_PATH`                              | PATH de secours pour ccache si non déjà défini.                                                      | `/usr/bin:/bin`                                             | Valeur de `XCRAFT_CCACHE_PATH`            |
| `XCRAFT_ENV`                               | Registre JSON des variables injectées par `2.other.js`, utilisé pour nettoyer les entrées obsolètes. | `{"MY_VAR":"other.json"}`                                   | `{}`                                      |
| `npm_config_cache`                         | Emplacement du cache npm.                                                                            | `/tmp/xcraft/npm-cache`                                     | `<tempRoot>/npm-cache`                    |
| `TMP`, `TEMP`                              | Répertoires temporaires système.                                                                     | `/tmp/xcraft/system`                                        | `<tempRoot>/system`                       |
| `HOME`                                     | Répertoire utilisateur, complété sous Windows.                                                       | `/home/user`                                                | Copie de `USERPROFILE` si absent          |
| `SDKROOT`                                  | SDK macOS détecté via `xcrun`.                                                                       | `/Applications/Xcode.app/Contents/Developer/.../MacOSX.sdk` | Détecté automatiquement, sinon non défini |
| `CFLAGS`                                   | Flags de compilation C par défaut.                                                                   | `-O2 -g0 -fPIC`                                             | `-O2 -g0 -fPIC`                           |
| `CXXFLAGS`                                 | Flags de compilation C++ par défaut.                                                                 | `-O2 -g0 -fPIC`                                             | `-O2 -g0 -fPIC`                           |
| `LDFLAGS`                                  | Flags de linkage, définis si GCC est détecté.                                                        | `-static-libgcc -static-libstdc++`                          | Selon la présence de GCC                  |
| `SDKROOT`, `CFLAGS`, `CXXFLAGS`, `LDFLAGS` | Variables réinitialisées (supprimées) à chaque `devrootUpdate` avant reconfiguration.                | —                                                           | —                                         |

## Détails des sources

### `index.js`

Point d'entrée du module. Découvre dynamiquement les fichiers `.js` de `lib/env/`, les charge et les expose sous `exports.var`, avec une clé dérivée du nom de fichier (préfixe numérique retiré, par exemple `1.path.js` devient `path`).

#### Méthodes publiques

- **`devrootUpdate(distribution)`** — Parcourt tous les modules d'environnement chargés et invoque leur méthode `devrootUpdate(distribution)` si elle est définie, appliquant ainsi la reconfiguration complète pour la distribution donnée.
- **`var`** — Objet exposant chaque module d'environnement chargé (`path`, `other`, etc.), chacun avec ses propres méthodes publiques.
- **`pp(env)`** — Préprocesseur qui filtre un objet de variables selon des clés préfixées par `os-arch/`, ne conservant que les entrées correspondant à la plateforme courante et retirant le préfixe des clés retenues.

### `lib/helpers.js`

Classe utilitaire statique dédiée à l'injection de placeholders système dans des chaînes de configuration, en s'appuyant sur `xcraft-core-placeholder`.

#### Méthodes publiques

- **`injectPh(data, distribution)`** — Injecte dans `data` des placeholders tels que `{OS.ROOTDIR}`, `{OS.POSIX.ROOTDIR}`, `{OS.PROD.ROOTDIR}`, `{OS.ARCH}`, `{OS.WPKG.ARCH}`, `{OS.ENV.*}`, `{OS.ROOTTEMP}`, `{OS.ROOTDRIVE}` ou encore `{OS.PROGRAMFILES.32/64}`. Les chemins peuvent être normalisés au format POSIX ou laissés au format natif de la plateforme.

### `lib/vars.js`

Liste statique des variables d'environnement sensibles au build (`SDKROOT`, `CFLAGS`, `CXXFLAGS`, `LDFLAGS`) que le module réinitialise systématiquement avant chaque reconfiguration, afin d'éviter qu'une valeur héritée d'une distribution précédente ne pollue la nouvelle.

### `lib/env/0.preinit.js`

Module de pré-initialisation, exécuté en premier grâce à son préfixe `0`.

#### Méthodes publiques

- **`devrootUpdate()`** — Supprime du `process.env` chacune des variables listées dans `lib/vars.js`, garantissant un état propre avant l'exécution des étapes suivantes.

### `lib/env/1.path.js`

Gestionnaire du `PATH` système. Maintient deux listes internes : `xcraft` (chemins fixes du framework) et `devroot` (chemins spécifiques à la distribution active, lus depuis `etc/env/path`). Au chargement du module (`init()`), le `PATH` initial est construit à partir de `xcraftRoot` (racine, `node_modules/.bin`, `usr/bin`, `bin`) et des chemins additionnels de la configuration.

#### Méthodes publiques

- **`unshift(location)`** — Ajoute un répertoire en tête de la liste `xcraft` (s'il n'y est pas déjà) et recalcule le `PATH`.
- **`push(location)`** — Ajoute un répertoire en fin de la liste `xcraft` (s'il n'y est pas déjà) et recalcule le `PATH`.
- **`isIn(bin)`** — Recherche un exécutable (nom complet, extension incluse sur Windows) dans `devroot` puis `xcraft`, et retourne son index (dans `xcraft` uniquement) et son chemin complet, ou `null` si introuvable.
- **`strip(index)`** — Retire l'entrée à l'index donné de la liste `xcraft` et recalcule le `PATH`.
- **`insert(index, location)`** — Insère un répertoire à une position donnée dans la liste `xcraft` et recalcule le `PATH`.
- **`getList()`** — Retourne la concaténation des listes `devroot` et `xcraft`, représentant l'état actuel complet du `PATH`.
- **`devrootUpdate(distribution)`** — Reconstruit la liste `devroot` : ajoute `bin`, `usr/bin` et `usr/local/bin` de la racine cible de la toolchain, puis lit les fichiers JSON de `etc/env/path` (après injection de placeholders) pour ajouter des chemins additionnels. Si `distribution` vaut `'bootstrap'`, seule la mise à jour du `PATH` global est effectuée, sans chemins `devroot`.

### `lib/env/2.other.js`

Gestionnaire des variables d'environnement autres que le `PATH`, provenant des fichiers de configuration `etc/env/other` propres à chaque package de la distribution.

#### Méthodes publiques

- **`devrootUpdate(distribution)`** — Lit chaque fichier JSON de `etc/env/other` (sauf si `distribution` vaut `'bootstrap'`), injecte les placeholders dans chaque valeur, puis positionne les variables correspondantes dans `process.env`. Conserve une trace des variables gérées dans `XCRAFT_ENV` et supprime celles qui ne sont plus référencées par rapport au passage précédent. Positionne également `CCACHE_PATH` à partir de `XCRAFT_CCACHE_PATH` si non déjà défini.

### `lib/env/9.postinit.js`

Module de post-initialisation, exécuté en dernier grâce à son préfixe `9`.

#### Méthodes publiques

- **`devrootUpdate()`** — Positionne `npm_config_cache`, `TMP` et `TEMP` sous le répertoire temporaire de la configuration. Complète `HOME` depuis `USERPROFILE` si absent. Détecte `SDKROOT` via la commande `xcrun --show-sdk-path` si `xcrun` est disponible (macOS). Définit des valeurs par défaut pour `CFLAGS` et `CXXFLAGS` (`-O2 -g0 -fPIC`) si non déjà définies. Définit `LDFLAGS` (`-static-libgcc -static-libstdc++`) si un GCC est détecté sur le système.

## Licence

Ce module est distribué sous licence MIT.

_Ce contenu a été généré par IA_

---

[xcraft-core-etc]: https://github.com/Xcraft-Inc/xcraft-core-etc
[xcraft-core-fs]: https://github.com/Xcraft-Inc/xcraft-core-fs
[xcraft-core-platform]: https://github.com/Xcraft-Inc/xcraft-core-platform
[xcraft-core-placeholder]: https://github.com/Xcraft-Inc/xcraft-core-placeholder
