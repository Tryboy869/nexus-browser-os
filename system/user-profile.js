// system/user-profile.js - User Profile Management

export class UserProfile {
  constructor(ldssManager) {
    this.ldss = ldssManager;
    this.profile = null;
    this.defaultProfile = {
      username: 'nexus-user',
      fullName: '',
      avatar: null,
      theme: 'dark',
      wallpaper: 'default',
      createdAt: Date.now(),
      firstBoot: true
    };
  }

  async load() {
    this.profile = await this.ldss.loadUserProfile();
    
    if (!this.profile) {
      this.profile = { ...this.defaultProfile };
      await this.save();
    }
    
    console.log('[UserProfile] Loaded:', this.profile.username);
    return this.profile;
  }

  async save() {
    if (this.profile) {
      await this.ldss.saveUserProfile(this.profile);
      console.log('[UserProfile] Saved');
    }
  }

  async showFirstBootSetup() {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        z-index: 999998;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s;
      `;

      modal.innerHTML = `
        <style>
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .setup-container {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .setup-title {
            font-size: 32px;
            font-weight: bold;
            color: #fff;
            margin-bottom: 10px;
            text-align: center;
          }
          
          .setup-subtitle {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 30px;
            text-align: center;
          }
          
          .setup-field {
            margin-bottom: 20px;
          }
          
          .setup-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 8px;
          }
          
          .setup-input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
            outline: none;
            transition: all 0.2s;
          }
          
          .setup-input:focus {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.4);
          }
          
          .setup-button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 10px;
          }
          
          .setup-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
          }
          
          .avatar-picker {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin-top: 10px;
          }
          
          .avatar-option {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            cursor: pointer;
            border: 3px solid transparent;
            transition: all 0.2s;
          }
          
          .avatar-option:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          
          .avatar-option.selected {
            border-color: #667eea;
            background: rgba(102, 126, 234, 0.3);
          }
        </style>
        
        <div class="setup-container">
          <div class="setup-title">Bienvenue sur NEXUS OS</div>
          <div class="setup-subtitle">Configurez votre profil utilisateur</div>
          
          <div class="setup-field">
            <label class="setup-label">Nom d'utilisateur</label>
            <input 
              type="text" 
              id="username" 
              class="setup-input" 
              placeholder="Entrez votre nom d'utilisateur"
              value="${this.profile.username}"
            >
          </div>
          
          <div class="setup-field">
            <label class="setup-label">Nom complet (optionnel)</label>
            <input 
              type="text" 
              id="fullname" 
              class="setup-input" 
              placeholder="Votre nom complet"
            >
          </div>
          
          <div class="setup-field">
            <label class="setup-label">Choisissez un avatar</label>
            <div class="avatar-picker">
              <div class="avatar-option selected" data-avatar="👤">👤</div>
              <div class="avatar-option" data-avatar="👨‍💻">👨‍💻</div>
              <div class="avatar-option" data-avatar="👩‍💻">👩‍💻</div>
              <div class="avatar-option" data-avatar="🦸">🦸</div>
              <div class="avatar-option" data-avatar="🤖">🤖</div>
            </div>
          </div>
          
          <button class="setup-button" id="complete-setup">
            Commencer
          </button>
        </div>
      `;

      document.body.appendChild(modal);

      let selectedAvatar = '👤';

      // Avatar selection
      modal.querySelectorAll('.avatar-option').forEach(option => {
        option.addEventListener('click', () => {
          modal.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
          selectedAvatar = option.dataset.avatar;
        });
      });

      // Complete setup
      document.getElementById('complete-setup').addEventListener('click', async () => {
        const username = document.getElementById('username').value.trim() || 'nexus-user';
        const fullName = document.getElementById('fullname').value.trim();

        this.profile = {
          ...this.profile,
          username,
          fullName,
          avatar: selectedAvatar,
          firstBoot: false,
          setupCompletedAt: Date.now()
        };

        await this.save();

        modal.style.animation = 'fadeIn 0.3s reverse';
        setTimeout(() => {
          modal.remove();
          resolve(this.profile);
        }, 300);
      });
    });
  }

  async updateUsername(newUsername) {
    if (this.profile) {
      this.profile.username = newUsername;
      await this.save();
      return true;
    }
    return false;
  }

  async updateAvatar(newAvatar) {
    if (this.profile) {
      this.profile.avatar = newAvatar;
      await this.save();
      return true;
    }
    return false;
  }

  async updateTheme(theme) {
    if (this.profile) {
      this.profile.theme = theme;
      await this.save();
      return true;
    }
    return false;
  }

  async updateWallpaper(wallpaper) {
    if (this.profile) {
      this.profile.wallpaper = wallpaper;
      await this.save();
      return true;
    }
    return false;
  }

  getUsername() {
    return this.profile ? this.profile.username : 'nexus-user';
  }

  getAvatar() {
    return this.profile ? this.profile.avatar : '👤';
  }

  getTheme() {
    return this.profile ? this.profile.theme : 'dark';
  }

  isFirstBoot() {
    return this.profile ? this.profile.firstBoot : true;
  }
}