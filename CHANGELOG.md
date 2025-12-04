# Changelog

Toutes les modifications notables de NEXUS Browser OS seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publié]

### Prévu pour v0.2.0
- Pipes et redirections dans Terminal (`ls | grep .txt`)
- Syntax highlighting complet dans Code Editor
- Drag & drop dans File Manager
- Création de thèmes personnalisés
- System de plugins pour extensions

---

## [0.1.0] - 2025-12-03

### 🎉 Version initiale publique

**Première release publique de NEXUS Browser OS par Nexus Studio**

Développé par **Daouda Abdoul Anzize**, fondateur de Nexus Studio.

### Ajouté

#### Applications
- **Calculatrice** - Opérations mathématiques basiques et avancées
- **Terminal** - 50+ commandes Unix-like
  - Fichiers: ls, cd, pwd, mkdir, touch, rm, cp, mv, cat, grep, find, tree
  - Système: ps, kill, top, sysinfo, uptime, df, free, env
  - Réseau: ping, curl, wget, ifconfig (simulé)
  - Performance: stress (test CPU), benchmark
  - Packages: pkg, apt, npm (simulés)
- **Bloc-notes** - Éditeur de texte avec auto-save (30s)
- **Gestionnaire de fichiers** - Navigation filesystem virtuel
- **Éditeur de code** - Multi-tabs, support JS/HTML/CSS/Python/JSON/Markdown
- **JavaScript REPL** - Console interactive
  - Exécution code JavaScript asynchrone
  - Chargement bibliothèques via CDN
  - Templates (Hello World, Fetch API, AI APIs)
  - Support OpenAI et Anthropic Claude
- **Documentation** - Guide complet interactif du système
- **Gestionnaire de tâches** - Monitoring processus temps réel
- **Paramètres** - Configuration système complète
  - Profil utilisateur (nom personnalisable)
  - Upload fond d'écran (max 2MB)
  - Thèmes (Sombre, Clair, Violet)
  - Langues (FR, EN, ES, DE)
  - Notifications et sons
  - Performance (nombre de cœurs CPU)
  - Raccourcis clavier

#### Système
- **OS Gateway** - Orchestrateur central
  - Window Manager (drag, resize, minimize, maximize, close)
  - CPU Manager (4 WebWorker cores)
  - Storage Manager (LDSS + localStorage fallback)
  - IPC Router (communication < 10ms)
  - System Logger (logs complets)
- **Boot Sequence** - Démarrage avec logs visuels (BIOS → Kernel → Desktop)
- **Desktop Environment** - Interface graphique complète
  - Taskbar avec apps actives
  - Start Menu avec liste applications
  - Fond d'écran personnalisable
- **PWA Support** - Service Worker pour fonctionnement offline
- **Diagnostic System** - logs.html avec:
  - 10 tests automatiques
  - Logs temps réel
  - Mode debug (iframe)
  - Export logs JSON

#### Performance
- Boot en < 2 secondes
- Launch app en < 500ms
- IPC latency < 10ms
- Mémoire ~50MB (4 apps ouvertes)

### Technique

#### Architecture
- 100% client-side (zéro backend)
- Vanilla JavaScript (pas de framework)
- HTML5 + CSS3
- WebWorkers pour CPU parallèle
- Service Worker pour PWA
- LDSS pour stockage distribué

#### Compatibilité
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### Documentation
- README.md complet
- Guide de démarrage rapide
- Documentation API pour développeurs
- Guide de contribution
- Guide de debugging (logs.html)

---

## Comment lire ce changelog

### Types de changements
- **Ajouté** pour les nouvelles fonctionnalités
- **Modifié** pour les changements dans les fonctionnalités existantes
- **Déprécié** pour les fonctionnalités bientôt supprimées
- **Supprimé** pour les fonctionnalités maintenant supprimées
- **Corrigé** pour les corrections de bugs
- **Sécurité** pour les vulnérabilités corrigées

### Versioning
Le projet suit le [Semantic Versioning](https://semver.org/lang/fr/) :
- **MAJOR** (X.0.0) : Changements incompatibles avec les versions précédentes
- **MINOR** (0.X.0) : Nouvelles fonctionnalités rétrocompatibles
- **PATCH** (0.0.X) : Corrections de bugs rétrocompatibles

### Exemples futurs

#### [0.1.1] - YYYY-MM-DD - Corrections
- Corrigé : Bug dans Terminal avec commande `grep`
- Corrigé : Window Manager resize sur Safari
- Corrigé : Auto-save dans Bloc-notes

#### [0.2.0] - YYYY-MM-DD - Nouvelles fonctionnalités
- Ajouté : Pipes dans Terminal (`ls | grep`)
- Ajouté : Syntax highlighting Code Editor
- Ajouté : Drag & drop File Manager
- Modifié : Performance CPU Manager (6 cores)

#### [1.0.0] - YYYY-MM-DD - Version stable
- Ajouté : Plugin system
- Ajouté : Multi-user support
- Ajouté : Network simulation complète
- Sécurité : Isolation processus renforcée

---

**Note** : Les dates sont au format ISO 8601 (YYYY-MM-DD)