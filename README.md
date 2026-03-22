# 🛒 Site Vitrine JAMstack - Commerce d'Alimentation

Site vitrine ultra-rapide pour commerce d'alimentation avec système de pré-commande via WhatsApp.

---

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Installation locale](#installation-locale)
4. [Configuration Airtable](#configuration-airtable)
5. [Déploiement sur Vercel](#déploiement-sur-vercel)
6. [Utilisation sur Linux](#utilisation-sur-linux)
7. [Utilisation sur Android](#utilisation-sur-android)
8. [Structure des fichiers](#structure-des-fichiers)

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Navigateur    │────▶│  Vercel (Hugo)  │────▶│   Airtable DB   │
│   (Client)      │◄────│  + Functions    │◄────│   (Produits)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         │ (Commande)
         ▼
┌─────────────────┐
│    WhatsApp     │
│   (Finalisation)│
└─────────────────┘
```

**Stack Technique :**
- **Hugo** : Générateur de site statique
- **Vercel** : Hébergement + fonctions serverless
- **Airtable** : Base de données (produits + commandes)
- **WhatsApp** : Finalisation des commandes

---

## 📦 Prérequis

### Sur Linux
```bash
# Installer Hugo
sudo apt-get install hugo

# OU télécharger la dernière version
wget https://github.com/gohugoio/hugo/releases/download/v0.92.2/hugo_0.92.2_Linux-64bit.deb
sudo dpkg -i hugo_0.92.2_Linux-64bit.deb

# Vérifier l'installation
hugo version

# Installer Node.js (pour les fonctions API)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier Node.js
node --version
npm --version
```

### Sur Android (Termux)
```bash
# Installer Termux depuis F-Droid ou Play Store
# Puis dans Termux :

# Mettre à jour les paquets
pkg update && pkg upgrade

# Installer Hugo
pkg install hugo

# Vérifier
hugo version

# Installer Node.js
pkg install nodejs

# Vérifier
node --version
```

---

## 💻 Installation locale

### 1. Extraire l'archive
```bash
# Sur Linux
unzip alimentation-jamstack.zip
cd alimentation-jamstack

# Sur Android (Termux)
unzip alimentation-jamstack.zip
cd alimentation-jamstack
```

### 2. Installer les dépendances Node.js
```bash
npm install
```

### 3. Lancer le serveur de développement
```bash
# Mode développement (avec rechargement automatique)
npm run dev

# OU directement avec Hugo
hugo server -D
```

Le site sera accessible sur : `http://localhost:1313`

### 4. Générer le site (production)
```bash
npm run build
# OU
hugo
```

Le site généré se trouve dans le dossier `public/`.

---

## 🗄️ Configuration Airtable

### Étape 1 : Créer un compte Airtable
- Rendez-vous sur [airtable.com](https://airtable.com)
- Créez un compte gratuit

### Étape 2 : Créer la base de données

Créez une nouvelle base avec **2 tables** :

#### Table 1 : `Produits`

| Nom du Champ | Type de Champ | Description |
|-------------|---------------|-------------|
| **Nom** | Texte court | Nom du produit (ex: Pommes Gala) |
| **Prix** | Nombre (Décimal) | Prix unitaire en euros |
| **Description** | Texte long | Description détaillée |
| **Image** | Pièce jointe | Photo du produit |
| **Categorie** | Sélection unique | Fruits, Légumes, Épicerie... |
| **Stock** | Nombre (Entier) | Quantité disponible |

#### Table 2 : `Commandes`

| Nom du Champ | Type de Champ | Description |
|-------------|---------------|-------------|
| **Contenu** | Texte long | Détails du panier (JSON) |
| **Total** | Nombre (Décimal) | Montant total |
| **Statut** | Sélection unique | En attente, Validée, Annulée |
| **Date** | Date | Date et heure |
| **Reference** | Formule | ID unique (optionnel) |

### Étape 3 : Récupérer les identifiants

1. **API Key** :
   - Allez dans votre [compte Airtable](https://airtable.com/create/tokens)
   - Créez un token avec les scopes : `data.records:read`, `data.records:write`
   - Copiez la clé

2. **Base ID** :
   - Ouvrez votre base Airtable
   - L'ID est dans l'URL : `https://airtable.com/appXXXXXXXXXXXXXX/...`
   - Copiez `appXXXXXXXXXXXXXX`

---

## 🚀 Déploiement sur Vercel

### Étape 1 : Créer un dépôt Git
```bash
# Initialiser Git
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit: JAMstack food store"
```

### Étape 2 : Créer un dépôt sur GitHub/GitLab
```bash
# Créer un repo sur GitHub, puis :
git remote add origin https://github.com/VOTRE_USER/nom-du-repo.git
git branch -M main
git push -u origin main
```

### Étape 3 : Déployer sur Vercel
1. Connectez-vous sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Importez votre dépôt Git
4. Vercel détecte automatiquement Hugo
5. Cliquez sur **"Deploy"**

### Étape 4 : Configurer les variables d'environnement
Dans les paramètres du projet Vercel :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `AIRTABLE_API_KEY` | `patXXXXXXXX` | Votre clé API Airtable |
| `AIRTABLE_BASE_ID` | `appXXXXXXXX` | ID de votre base |
| `WHATSAPP_NUMBER` | `33612345678` | Votre numéro (sans +) |

Redéployez après avoir ajouté les variables.

---

## 🐧 Utilisation sur Linux

### Lancer en local
```bash
cd alimentation-jamstack

# Mode développement
hugo server -D --bind 0.0.0.0

# Le site est accessible sur :
# - Local : http://localhost:1313
# - Réseau local : http://VOTRE_IP:1313
```

### Générer pour hébergement statique
```bash
# Générer le site
hugo

# Les fichiers sont dans public/
# Vous pouvez les copier sur n'importe quel serveur web

# Exemple avec Nginx
sudo cp -r public/* /var/www/html/

# Exemple avec Apache
sudo cp -r public/* /var/www/html/
```

### Utiliser avec Docker
```bash
# Créer un Dockerfile
cat > Dockerfile << 'EOF'
FROM nginx:alpine
COPY public /usr/share/nginx/html
EXPOSE 80
EOF

# Construire et lancer
docker build -t alimentation-site .
docker run -p 8080:80 alimentation-site
```

---

## 📱 Utilisation sur Android

### Avec Termux (Recommandé)

1. **Installer Termux** depuis F-Droid

2. **Préparer l'environnement**
```bash
pkg update
pkg install hugo nodejs git
```

3. **Copier le projet**
```bash
# Depuis le stockage interne
cd /sdcard/Download
cp alimentation-jamstack.zip $HOME/
cd $HOME
unzip alimentation-jamstack.zip
cd alimentation-jamstack
```

4. **Lancer le site**
```bash
# Mode développement
hugo server -D --bind 0.0.0.0

# Le site sera accessible sur http://localhost:1313
# Vous pouvez aussi l'ouvrir dans le navigateur Android
```

5. **Générer le site**
```bash
hugo
# Le site généré est dans public/
```

### Partager le site en local (Android)
```bash
# Installer simple-http-server
npm install -g simple-http-server

# Lancer un serveur dans le dossier public
cd public
simple-http-server -p 8080

# Partagez l'IP de votre téléphone sur le réseau WiFi
# Ex: http://192.168.1.XX:8080
```

---

## 📁 Structure des fichiers

```
alimentation-jamstack/
│
├── api/                          # Fonctions serverless Vercel
│   ├── order.js                  # API : création de commande
│   └── products.js               # API : récupération des produits
│
├── content/                      # Contenu du site (Hugo)
│   └── _index.md                 # Page d'accueil
│
├── layouts/                      # Templates HTML (Hugo)
│   ├── _default/
│   │   ├── baseof.html           # Template de base
│   │   └── list.html             # Template page d'accueil
│   └── partials/
│       ├── footer.html           # Pied de page
│       └── header.html           # En-tête
│
├── static/                       # Fichiers statiques
│   ├── css/
│   │   └── style.css             # Styles CSS
│   └── js/
│       └── main.js               # Logique JavaScript (panier)
│
├── config.toml                   # Configuration Hugo
├── package.json                  # Dépendances Node.js
├── vercel.json                   # Configuration Vercel
└── README.md                     # Ce fichier
```

---

## 🔧 Personnalisation

### Modifier les couleurs
Éditez `static/css/style.css` :
```css
:root {
    --primary: #0070f3;    /* Changer cette couleur */
    --success: #25d366;    /* Couleur WhatsApp */
    --text: #333;          /* Couleur du texte */
}
```

### Modifier le numéro WhatsApp
Éditez `config.toml` :
```toml
[params]
  whatsapp_number = "33612345678"  # Votre numéro
```

### Ajouter des pages
```bash
# Créer une nouvelle page
hugo new content/contact.md
```

---

## 🐛 Dépannage

### Erreur "hugo: command not found"
```bash
# Réinstaller Hugo
sudo apt-get install hugo  # Linux
pkg install hugo           # Android/Termux
```

### Erreur "Cannot find module 'node-fetch'"
```bash
# Réinstaller les dépendances
npm install
```

### Les produits ne s'affichent pas
- Vérifiez les variables d'environnement sur Vercel
- Vérifiez que la table "Produits" existe dans Airtable
- Consultez les logs sur Vercel (Deployments > Logs)

---

## 📄 Licence

Ce projet est fourni tel quel pour usage personnel et commercial.

---

## 🆘 Support

Pour toute question ou problème :
1. Vérifiez les logs de déploiement sur Vercel
2. Consultez la console du navigateur (F12)
3. Vérifiez la configuration Airtable

---

**Bon courage avec votre site vitrine ! 🎉**
