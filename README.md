# NEXUS Browser OS

> **Version 0.1.0** - Système d'exploitation complet fonctionnant à 100% dans votre navigateur

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Beta](https://img.shields.io/badge/Status-Beta-yellow.svg)]()
[![Powered by Nexus Studio](https://img.shields.io/badge/Powered%20by-Nexus%20Studio-blue)]()

Un véritable système d'exploitation qui tourne entièrement dans votre navigateur. Aucune installation, aucun serveur, 100% client-side.

**Powered by Nexus Studio**

## 🌟 Pourquoi NEXUS OS ?

- **100% Browser** : Tout fonctionne dans le navigateur, zéro installation
- **Offline First** : Service Worker pour fonctionnement hors ligne
- **Puissant** : 4 cœurs CPU via WebWorkers pour calculs parallèles
- **Persistant** : Vos données sauvegardées automatiquement
- **Gratuit** : Open source sous licence MIT

## 🚀 Démarrage Rapide

### En ligne (recommandé)

Ouvrez simplement : [nexus-os.vercel.app](https://nexus-browser-os.vercel.app/) (remplacer par votre URL)

### En local

```bash
# Cloner le repo
git clone https://github.com/Tryboy869/nexus-browser-os.git
cd nexus-browser-os

# Lancer un serveur HTTP
python -m http.server 3000
# ou
npx http-server -p 3000

# Ouvrir dans votre navigateur
http://localhost:3000
```

## 📱 Applications Incluses

### Applications

- **Calculatrice** - Opérations mathématiques de base et avancées
- **Terminal** - 50+ commandes Unix-like (ls, cd, grep, etc.)
- **Bloc-notes** - Éditeur de texte simple avec sauvegarde automatique
- **Gestionnaire de fichiers** - Navigation dans le système de fichiers virtuel
- **Éditeur de code** - Multi-tabs avec support de plusieurs langages
- **JavaScript REPL** - Console interactive, chargement CDN, appels API AI
- **Documentation** - Guide complet du système

### Système

- **Gestionnaire de tâches** - Surveillance des processus en temps réel
- **Paramètres** - Configuration complète (profil, thème, fond d'écran)

## ✨ Fonctionnalités

### Système d'exploitation complet
- Gestionnaire de fenêtres (drag, resize, minimize, maximize)
- Gestionnaire de processus (PIDs, lifecycle)
- Communication inter-processus (IPC)
- Système de fichiers virtuel
- CPU Manager (4 cœurs WebWorker)
- Stockage persistant (LDSS + localStorage)

### Terminal Avancé
Plus de 50 commandes disponibles :
- **Fichiers** : ls, cd, pwd, mkdir, touch, rm, cp, mv, cat, grep, find, tree
- **Système** : ps, kill, top, sysinfo, uptime, df, free
- **Réseau** : ping, curl, wget, ifconfig
- **Performance** : stress, benchmark

### JavaScript REPL
- Exécution de code JavaScript en temps réel
- Chargement de bibliothèques via CDN
- Templates pour démarrage rapide
- Support API AI (OpenAI, Anthropic Claude)

### Personnalisation
- Nom d'utilisateur personnalisable
- Upload de fond d'écran (max 2MB)
- 3 thèmes (Sombre, Clair, Violet)
- 4 langues (Français, English, Español, Deutsch)

## 🛠️ Technologies

- **Frontend** : HTML5, CSS3, JavaScript (vanilla)
- **Workers** : 4 WebWorkers pour CPU parallèle
- **Storage** : LDSS (6 workers distribués) + localStorage fallback
- **PWA** : Service Worker pour support offline
- **UI** : Composants Web personnalisés

## 📊 Performance

- Boot : < 2 secondes
- Launch app : < 500ms
- IPC latency : < 10ms
- Memory : ~50MB (4 apps ouvertes)

## 🧪 Tests & Debug

Un système de diagnostic complet est disponible :

```
http://localhost:3000/logs.html
```

- 10 tests automatiques
- Logs en temps réel
- Mode debug avec iframe
- Export des logs en JSON

## 🗺️ Roadmap v0.2.0

- [ ] Plus de commandes Terminal (pipes, redirections)
- [ ] Syntax highlighting dans Code Editor
- [ ] Drag & drop dans File Manager
- [ ] Thèmes personnalisés
- [ ] Plugin system pour extensions
- [ ] Multi-user support

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voici comment :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

## 📝 Développement

### Structure du projet

```
nexus-browser-os/
├── index.html              # Point d'entrée avec OS Gateway
├── logs.html              # Dashboard de diagnostics
├── manifest.json          # Configuration PWA
├── sw.js                  # Service Worker
├── apps/                  # Applications
│   ├── calculator/
│   ├── terminal/
│   ├── notepad/
│   ├── file-manager/
│   ├── code-editor/
│   ├── repl/
│   ├── docs/
│   ├── task-manager/
│   └── settings/
└── README.md
```

### Créer une nouvelle app

Voir la [Documentation](http://localhost:3000/index.html) > Développement > Créer une application

## 📄 License

MIT License - voir [LICENSE](LICENSE) pour plus de détails

## 👨‍💻 Auteur

**Daouda Abdoul Anzize**  
Fondateur de Nexus Studio

- GitHub: [@Tryboy869](https://github.com/Tryboy869)
- Email: nexusstudio100@gmail.com

## 🏢 Nexus Studio

NEXUS OS est développé et maintenu par **Nexus Studio**, un studio de développement innovant spécialisé dans les technologies web avancées.

## 🙏 Remerciements

- Inspiré par les concepts du kernel Linux
- LDSS pour le système de stockage distribué
- Communauté open source

## 📞 Support

- 📧 Email: nexusstudio100@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/Tryboy869/nexus-browser-os/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Tryboy869/nexus-browser-os/discussions)

---

**NEXUS Browser OS** - Votre ordinateur, partout. 🚀

**Powered by Nexus Studio**  
Made with ❤️ by Daouda Abdoul Anzize