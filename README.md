# 🌌 Modern Dynamic Portfolio - Frontend

Ce dépôt contient la partie client (Frontend) d'un portfolio dynamique, hautement personnalisable et doté d'un mode administration intégré.

## ✨ Fonctionnalités

- **Navigation Dynamique** : Système d'onglets et sous-onglets géré via JSON.
- **Mode Administration** (`Alt + K`) : Éditeur visuel pour modifier le contenu en direct.
- **Design Premium** : Mode sombre avec animations d'étoiles scintillantes et filantes.
- **Glisser-Déposer** : Réorganisation intuitive des éléments via SortableJS.

## 🛠️ Stack Technique

- **Langages** : HTML5, CSS3, JavaScript (Vanilla).
- **Bibliothèques** : [SortableJS](https://sortablejs.github.io/Sortable/).

## 🚀 Installation rapide

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/sun-ethan/portfolio-frontend.git
   ```
2. **Configurer l'URL de l'API** :
   Dans `script.js`, modifiez la constante `BACKEND_URL` :
   ```javascript
   const BACKEND_URL = 'https://votre-backend.com/api';
   ```
3. **Lancement** :
   Ouvrez `index.html` dans votre navigateur.

## ⚙️ Structure des données

Le contenu du portfolio est chargé depuis une API backend qui renvoie un objet JSON. Vous pouvez trouver un exemple de structure dans le fichier `data.sample.json`.

---
*Made by Ethan*
