# Merval Depenses

Application de suivi des dépenses avec Angular (frontend) et Firebase Functions (backend) connectée à PostgreSQL sur Google Cloud SQL.

## 📁 Structure du projet

```
merval_depenses/
├── frontend/                   # Application Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   └── services/
│   │   │   │       └── expense.service.ts    # Service API
│   │   │   ├── features/
│   │   │   │   └── expenses/
│   │   │   │       ├── expenses.component.ts # Composant principal
│   │   │   │       ├── expenses.component.html
│   │   │   │       ├── expenses.component.css
│   │   │   │       └── services/
│   │   │   │           └── expense-sort.service.ts
│   │   │   └── shared/
│   │   │       └── models/
│   │   │           └── expense.model.ts      # Modèles TypeScript
│   │   └── ...
│   ├── public/                 # Assets statiques
│   └── package.json
├── functions/                  # Firebase Functions (Backend API)
│   ├── src/
│   │   ├── api/
│   │   │   └── expenses/
│   │   │       ├── index.js           # Export des handlers
│   │   │       └── handlers/
│   │   │           ├── get.js         # GET /getExpenses, /getMonthlyEstimate
│   │   │           ├── create.js      # POST /createExpense
│   │   │           ├── update.js      # PUT /updateExpense
│   │   │           └── delete.js      # DELETE /deleteExpense
│   │   ├── config/
│   │   │   └── database.js            # Configuration pool PostgreSQL
│   │   └── utils/
│   │       └── response.js            # Helpers pour réponses HTTP
│   ├── db.js                   # Client DB pour tests locaux
│   ├── index.js                # Point d'entrée Firebase Functions
│   ├── migrate.js              # Script de migration DB
│   ├── test-connection.js      # Script de test de connexion
│   └── package.json
├── database/                   # Scripts SQL
│   └── init.sql               # Schéma de la base de données
├── firebase.json              # Configuration Firebase
├── .firebaserc                # Projet Firebase
└── apphosting.yaml            # Configuration App Hosting
```

## 🚀 Quick Start

### Prérequis

- Node.js 20+ installé
- Firebase CLI : `npm install -g firebase-tools`
- Google Cloud SDK : `gcloud` installé
- Compte Google Cloud avec projet créé
- Instance PostgreSQL Cloud SQL créée

### 1. Installation des dépendances

```bash
# Frontend
cd frontend
npm install

# Functions (Backend)
cd ../functions
npm install
```

### 2. Configuration de la base de données Cloud SQL

#### 2.1 Créer l'instance Cloud SQL (si pas déjà fait)

```bash
gcloud sql instances create merval-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=europe-west9 \
  --root-password=YOUR_PASSWORD
```

#### 2.2 Créer la base de données

```bash
gcloud sql databases create merval_depenses --instance=merval-db
```

#### 2.3 Configurer le fichier .env local

Créez `functions/.env` :

```env
INSTANCE_CONNECTION_NAME=PROJECT_ID:REGION:INSTANCE_NAME
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=merval_depenses
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=development
```

Exemple :
```env
INSTANCE_CONNECTION_NAME=merval-depenses-app:europe-west9:merval-db
DB_USER=postgres
DB_PASSWORD=MonMotDePasse123
DB_NAME=merval_depenses
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=development
```

#### 2.4 Installer Cloud SQL Proxy

```powershell
# Télécharger Cloud SQL Proxy
gcloud components install cloud-sql-proxy

# Ou télécharger manuellement
Invoke-WebRequest -Uri https://dl.google.com/cloudsql/cloud_sql_proxy_x64.exe -OutFile cloud_sql_proxy.exe
```

#### 2.5 Démarrer Cloud SQL Proxy (dans un terminal séparé)

```powershell
cloud-sql-proxy PROJECT_ID:REGION:INSTANCE_NAME
```

Exemple :
```powershell
cloud-sql-proxy merval-depenses-app:europe-west9:merval-db
```

#### 2.6 Exécuter la migration de la base de données

```bash
cd functions
npm run migrate
```

### 3. Développement local

Ouvrez **4 terminaux** :

**Terminal 1** - Cloud SQL Proxy :
```powershell
cloud-sql-proxy merval-depenses-app:europe-west9:merval-db
```

**Terminal 2** - Tester la connexion DB :
```bash
cd functions
npm run db:test
```

**Terminal 3** - Frontend Angular :
```bash
cd frontend
npm start
```

**Terminal 4** - Firebase Functions (Émulateur) :
```bash
firebase emulators:start --only functions
```

L'application sera accessible sur `http://localhost:4200`

### 4. Déploiement en production

#### 4.1 Configurer le VPC Connector (une seule fois)

```bash
gcloud compute networks vpc-access connectors create merval-connector \
  --region=europe-west9 \
  --range=10.8.0.0/28
```

#### 4.2 Configurer le secret DB_PASSWORD dans Secret Manager

```bash
# Créer le secret
echo -n "YOUR_PASSWORD" | gcloud secrets create DB_PASSWORD --data-file=-

# Donner accès à App Engine
gcloud secrets add-iam-policy-binding DB_PASSWORD \
  --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### 4.3 Builder le frontend

```bash
cd frontend
npm run build
```

#### 4.4 Déployer

```bash
# Retourner à la racine
cd ..

# Déployer tout
firebase deploy
```

Ou déployer séparément :
```bash
# Déployer seulement les functions
firebase deploy --only functions

# Déployer seulement le hosting
firebase deploy --only hosting
```

## 📊 Schéma de la base de données

### Table `expenses`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Identifiant unique auto-incrémenté |
| `amount` | DECIMAL(10, 2) | NOT NULL | Montant de la dépense |
| `place` | VARCHAR(500) | NOT NULL | Lieu complet de la dépense |
| `expense_date` | DATE | NOT NULL | Date de la dépense |
| `category` | expense_category | NOT NULL | Catégorie (ENUM) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Date de création |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Date de modification |

### Type ENUM `expense_category`

- `sorties` - Restaurants, cinémas, loisirs
- `courses` - Supermarchés, alimentation
- `essences` - Carburant, stations-service
- `achats exceptionnels` - Achats ponctuels importants

### Index

- `idx_expenses_expense_date` : Index sur `expense_date` (DESC)
- `idx_expenses_category` : Index sur `category`
- `expenses_pkey` : Clé primaire sur `id`

## 🔌 API Endpoints

Toutes les fonctions sont déployées sur `https://REGION-PROJECT_ID.cloudfunctions.net/`

### GET /getExpenses
Récupère toutes les dépenses, triées par date décroissante.

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "amount": "17.20",
      "place": "restaurant du 12 rue des Prunes 44200 Nantes",
      "expense_date": "2026-02-04",
      "category": "sorties",
      "created_at": "2026-02-13T10:00:00.000Z",
      "updated_at": "2026-02-13T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

### GET /getMonthlyEstimate
Calcule l'estimation des dépenses pour le mois en cours basée sur les dépenses actuelles.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalSoFar": 245.67,
    "daysElapsed": 13,
    "daysInMonth": 28,
    "estimatedTotal": 529.48
  }
}
```

### POST /createExpense
Crée une nouvelle dépense.

**Body :**
```json
{
  "amount": 17.20,
  "place": "restaurant du 12 rue des Prunes 44200 Nantes",
  "expense_date": "2026-02-04",
  "category": "sorties"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "amount": "17.20",
    "place": "restaurant du 12 rue des Prunes 44200 Nantes",
    "expense_date": "2026-02-04",
    "category": "sorties",
    "created_at": "2026-02-13T10:00:00.000Z",
    "updated_at": "2026-02-13T10:00:00.000Z"
  },
  "message": "Expense added successfully"
}
```

### PUT /updateExpense
Met à jour une dépense existante.

**Body :**
```json
{
  "id": 1,
  "amount": 25.50,
  "place": "restaurant du 12 rue des Prunes 44200 Nantes",
  "expense_date": "2026-02-04",
  "category": "sorties"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "amount": "25.50",
    "place": "restaurant du 12 rue des Prunes 44200 Nantes",
    "expense_date": "2026-02-04",
    "category": "sorties",
    "created_at": "2026-02-13T10:00:00.000Z",
    "updated_at": "2026-02-13T10:30:00.000Z"
  },
  "message": "Expense updated successfully"
}
```

### DELETE /deleteExpense?id=1
Supprime une dépense.

**Query params :** `id` (obligatoire)

**Réponse :**
```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "data": {
    "id": 1,
    "amount": "17.20",
    "place": "restaurant du 12 rue des Prunes 44200 Nantes",
    "expense_date": "2026-02-04",
    "category": "sorties",
    "created_at": "2026-02-13T10:00:00.000Z",
    "updated_at": "2026-02-13T10:00:00.000Z"
  }
}
```

### GET /testDb
Teste la connexion à la base de données.

**Réponse :**
```json
{
  "success": true,
  "message": "Database connection successful"
}
```

## 🛠️ Scripts disponibles

### Frontend (dans `frontend/`)

```bash
npm start          # Démarrer en mode dev (port 4200)
npm run build      # Builder pour production
npm test           # Lancer les tests
```

### Functions (dans `functions/`)

```bash
npm run migrate    # Exécuter la migration DB
npm run db:test    # Tester la connexion DB
```

## 🔧 Configuration Firebase

### firebase.json (racine)

```json
{
  "hosting": {
    "public": "frontend/dist/frontend/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{
      "source": "**",
      "destination": "/index.html"
    }]
  },
  "functions": [{
    "source": "functions",
    "codebase": "default",
    "ignore": ["node_modules", ".git"]
  }]
}
```

## ⚠️ Difficultés rencontrées pour le déploiement

### Erreur de connexion à Cloud SQL

1. Vérifier que Cloud SQL Proxy est démarré
2. Vérifier les credentials dans `functions/.env`
3. Vérifier que l'instance Cloud SQL est démarrée dans Google Cloud Console

### Erreur CORS

Les headers CORS sont déjà configurés dans `functions/index.js` pour accepter toutes les origines (`*`).

### Erreur de déploiement des functions

1. Vérifier que le VPC Connector existe et est dans la bonne région
2. Vérifier que le secret `DB_PASSWORD` existe dans Secret Manager
3. Vérifier que les permissions IAM sont correctes

## 📝 Technologies utilisées

- **Frontend** : Angular 19, Angular Material
- **Backend** : Firebase Functions (Node.js), Express
- **Base de données** : PostgreSQL (Google Cloud SQL)
- **Hosting** : Firebase Hosting
- **Infrastructure** : Google Cloud Platform

## 🔐 Sécurité

- Les mots de passe sont stockés dans Secret Manager (production) et `.env` (local)
- Les connections à Cloud SQL utilisent SSL
- Le VPC Connector assure une connexion privée entre Functions et Cloud SQL
- CORS configuré pour les requêtes cross-origin


## 👤 Auteur

Benoît Chénard

