# Livre d'or du restaurant — guide de déploiement

## 1. Créer le projet Supabase (base de données + authentification)

1. Allez sur [supabase.com](https://supabase.com) → **New project** (gratuit).
2. Une fois le projet créé, ouvrez **SQL Editor** → **New query**.
3. Collez le contenu du fichier `supabase-setup.sql` et cliquez **Run**.
4. Allez dans **Authentication → Users → Add user**, créez UN compte
   (email + mot de passe) : ce sera le compte du propriétaire du restaurant.
5. Allez dans **Project Settings → API** : notez votre **Project URL**
   et votre clé **anon public**.

## 2. Configurer le projet en local (optionnel, pour tester)

```bash
npm install
cp .env.example .env
# Éditez .env avec votre URL et clé Supabase
npm run dev
```

## 3. Déployer sur Vercel

1. Créez un compte sur [vercel.com](https://vercel.com) (gratuit).
2. Poussez ce dossier vers un dépôt GitHub (ou importez le dossier
   directement via l'interface Vercel : **Add New → Project → Upload**).
3. Dans les réglages du projet Vercel, ajoutez deux variables
   d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Cliquez **Deploy**. Vercel vous donne une URL publique
   (ex. `avis-restaurant.vercel.app`) accessible par tout le monde.
5. Optionnel : reliez un nom de domaine personnalisé dans
   **Project → Settings → Domains**.

## Utilisation

- Les clients déposent un avis depuis la page publique.
- Le propriétaire clique sur **Espace propriétaire**, se connecte avec
  le compte créé à l'étape 1.4, puis approuve ou refuse chaque avis.
- Pour changer le mot de passe du propriétaire : Supabase Dashboard →
  Authentication → Users → sélectionner le compte → reset password.
