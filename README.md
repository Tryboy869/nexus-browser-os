# 🚀 NEXUS Browser OS

Un système d'exploitation complet qui tourne entièrement dans votre navigateur. Zéro serveur, zéro installation, 100% offline-capable.

![NEXUS OS](https://img.shields.io/badge/NEXUS-OS-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

## ✨ Caractéristiques

- 🖥️ **Desktop complet** avec taskbar, start menu, et window management
- ⚡ **CPU virtuel** avec WebWorkers pour calcul parallèle
- 💾 **Système de fichiers** persistant (IndexedDB)
- 📱 **PWA installable** - fonctionne comme une vraie app
- 🔒 **100% offline** après première visite
- 🎨 **Design moderne** avec glassmorphism et animations fluides
- 🔧 **7 applications** intégrées

## 📦 Applications Incluses

1. **Calculatrice** - Scientifique avec historique
2. **Bloc-notes** - Éditeur de texte simple
3. **Terminal** - CLI virtuel avec commandes système
4. **Gestionnaire de fichiers** - Navigation hiérarchique complète
5. **Éditeur de code** - Syntax highlighting multi-langages
6. **Gestionnaire de tâches** - Monitoring CPU/RAM en temps réel
7. **Paramètres** - Configuration système

## 🏗️ Architecture

```
nexus-browser-os/
├── index.html              # Point d'entrée (Desktop)
├── manifest.json           # Configuration PWA
├── sw.js                  # Service Worker (offline)
├── system/                # Noyau OS
│   ├── kernel.js          # Orchestrateur principal
│   ├── cpu-manager.js     # Gestion WebWorkers
│   ├── filesystem.js      # FS virtuel (IndexedDB)
│   ├── storage.js         # Key-value store
│   ├── window-manager.js  # Gestion fenêtres
│   ├── ipc.js            # Communication inter-apps
│   ├── router.js         # Routing client-side
│   ├── state.js          # State management
│   └── notifications.js   # Système notifications
└── apps/                  # Applications
    ├── calculator/
    ├── notepad/
    ├── terminal/
    ├── file-manager/
    ├── code-editor/
    ├── task-manager/
    └── settings/
```

## 🚀 Installation

### Option 1 : Déploiement GitHub Pages (Recommandé)

```bash
# 1. Clone le repository
git clone https://github.com/votre-username/nexus-browser-os.git
cd nexus-browser-os

# 2. Push vers GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 3. Activer GitHub Pages
# Settings → Pages → Source: main branch → Save
```

Votre OS sera accessible à : `https://votre-username.github.io/nexus-browser-os/`

### Option 2 : Local

```bash
# Serveur HTTP simple
python3 -m http.server 8000
# ou
npx serve .

# Ouvrir http://localhost:8000
```

### Option 3 : Netlify/Vercel (1-click)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

## 💻 Utilisation

### Démarrage

1. Ouvrir l'URL dans Chrome/Edge/Firefox
2. L'OS démarre automatiquement (boot ~1 seconde)
3. Double-cliquer sur les icônes pour lancer les apps
4. Utiliser le start menu (bouton en bas à gauche)

### Raccourcis Clavier

- `Ctrl+Alt+T` - Ouvrir Terminal
- `Ctrl+Alt+Delete` - Gestionnaire de tâches
- `Win/Cmd` - Start Menu
- Clic droit sur Desktop - Menu contextuel

### Installation PWA

1. Chrome : Icône ⊕ dans barre d'adresse → "Installer NEXUS OS"
2. L'OS s'installe comme une vraie application
3. Fonctionne offline après installation

## 🔧 Développement

### Prérequis

- Navigateur moderne (Chrome 90+, Firefox 88+, Edge 90+)
- Serveur HTTP (pour développement local)

### Structure d'une Application

```javascript
// apps/mon-app/manifest.json
{
  "id": "mon-app",
  "name": "Mon Application",
  "icon": "window",
  "singleton": false
}

// apps/mon-app/app.html
<!DOCTYPE html>
<html>
<head>
  <title>Mon App</title>
</head>
<body>
  <h1>Mon Application</h1>
  <script>
    // Communication avec le système
    window.parent.postMessage({
      type: 'app:ready',
      appId: 'mon-app'
    }, '*');
  </script>
</body>
</html>
```

### Enregistrer une Nouvelle App

```javascript
// Dans system/kernel.js
this.apps.push({
  id: 'mon-app',
  name: 'Mon Application',
  icon: 'window',
  path: 'apps/mon-app/app.html',
  singleton: false
});
```

## 🌐 API Système

### IPC (Inter-Process Communication)

```javascript
// Émettre un événement
window.BrowserOS.ipc.emit('mon-event', { data: 'value' });

// Écouter un événement
window.BrowserOS.ipc.on('mon-event', (data) => {
  console.log('Reçu:', data);
});
```

### FileSystem

```javascript
const fs = window.BrowserOS.filesystem;

// Écrire un fichier
await fs.writeFile('/Documents/test.txt', 'Contenu');

// Lire un fichier
const content = await fs.readFile('/Documents/test.txt');

// Lister un dossier
const files = await fs.readdir('/Documents');

// Créer un dossier
await fs.mkdir('/Documents/nouveau-dossier');
```

### CPU Manager

```javascript
const cpu = window.BrowserOS.cpuManager;

// Exécuter un calcul parallèle
const result = await cpu.execute('fibonacci', 40);

// Statistiques
const stats = cpu.getStats();
console.log('Tasks completed:', stats.tasksCompleted);
```

### Notifications

```javascript
const notif = window.BrowserOS.notifications;

// Afficher une notification
notif.success('Opération réussie !');
notif.error('Une erreur est survenue');
notif.warning('Attention !');
notif.info('Information');
```

## 📊 Performance

### Bundle Size (Gzippé)

- **Core système** : ~110 KB
- **Shoelace components** : ~50 KB (lazy-loaded)
- **Apps** : ~30 KB par app (lazy-loaded)
- **Total initial** : ~160 KB

### Benchmarks

- **Boot time** : < 1 seconde
- **Window creation** : < 100ms
- **File operations** : < 50ms
- **CPU tasks** : Parallel (nombre de cores)

## 🔐 Sécurité

- **Sandbox apps** : Chaque app dans iframe isolée
- **No eval()** : Pas de code dynamique
- **CSP** : Content Security Policy stricte
- **Local-only** : Données jamais envoyées à un serveur

## 🌍 Compatibilité

| Navigateur | Version | Support |
|------------|---------|---------|
| Chrome     | 90+     | ✅ Complet |
| Edge       | 90+     | ✅ Complet |
| Firefox    | 88+     | ✅ Complet |
| Safari     | 14+     | ⚠️ Partiel (pas OPFS) |

## 🤝 Contribution

Les contributions sont les bienvenues !

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Ajout de ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

## 📝 TODO

- [ ] Support mobile complet (touch gestures)
- [ ] App marketplace
- [ ] Sync cloud (Google Drive, Dropbox)
- [ ] Plus d'apps (Music Player, Image Editor, Browser)
- [ ] Thèmes personnalisables
- [ ] Multi-user support

## 📄 License

MIT License - voir [LICENSE](LICENSE)

## 🙏 Remerciements

- [Shoelace](https://shoelace.style/) - UI Components
- [Lucide](https://lucide.dev/) - Icons
- WebWorkers API - Calcul parallèle
- IndexedDB - Stockage persistant

## 📧 Contact

Créé par [Votre Nom](https://github.com/votre-username)

---

**NEXUS Browser OS** - L'ordinateur dans votre navigateur 🚀