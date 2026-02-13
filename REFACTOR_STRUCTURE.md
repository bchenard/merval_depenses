# Refactoring Structure - Feature-Based Architecture

## 🎯 Objectif
Restructurer le code source pour respecter les conventions Angular (feature-based) et Node.js (modular) sans changer le comportement.

---

## 📁 Structure Frontend (Angular)

### Avant (Monolithique)
```
frontend/src/app/
├── app.ts
├── app.html
├── app.css
├── expense.service.ts
└── app.config.ts
```

### Après (Feature-Based)
```
frontend/src/app/
├── core/
│   └── services/
│       └── expense.service.ts          (API communication)
├── features/
│   └── expenses/
│       ├── components/                 (pour futures sub-composants)
│       ├── services/
│       │   └── expense-sort.service.ts (logique de tri)
│       ├── expenses.component.ts       (composant principal)
│       ├── expenses.component.html     (template)
│       └── expenses.component.css      (styles)
├── shared/
│   └── models/
│       └── expense.model.ts            (interfaces & types)
├── app.ts                               (root simplifiée)
└── app.config.ts
```

### Bénéfices
✅ **Core** : Services métier réutilisables  
✅ **Features** : Fonctionnalités isolées et scalables  
✅ **Shared** : Modèles & types centralisés  
✅ **Standalone** : Components Angular 19 sans NgModule  

---

## 🔧 Structure Backend (Node.js/Firebase)

### Avant (Monolithique)
```
functions/
├── index.js          (tous les endpoints)
├── db.js
├── package.json
└── ...
```

### Après (Modular)
```
functions/
├── src/
│   ├── config/
│   │   └── database.js                 (pool PostgreSQL)
│   ├── api/
│   │   └── expenses/
│   │       ├── handlers/
│   │       │   ├── get.js              (getExpenses, getMonthlyEstimate)
│   │       │   ├── create.js           (createExpense)
│   │       │   ├── update.js           (updateExpense)
│   │       │   └── delete.js           (deleteExpense)
│   │       └── index.js                (exports collectifs)
│   ├── utils/
│   │   └── response.js                 (helpers CORS + réponses JSON)
│   └── index.js                        (point d'entrée, ré-exports)
├── index.js                            (wrapper => src/index.js)
├── package.json
└── ...
```

### Bénéfices
✅ **config/** : Configuration centralisée (DB, env)  
✅ **api/** : Endpoints organisés par feature  
✅ **utils/** : Helpers réutilisables (CORS, response)  
✅ **Séparation des concerns** : Chaque handler a une responsabilité unique  

---

## 🔄 Migration des Imports

### Frontend
```typescript
// Avant
import { Expense, ExpenseService } from './expense.service';

// Après
import { Expense } from './shared/models/expense.model';
import { ExpenseService } from './core/services/expense.service';
import { ExpenseSortService } from './features/expenses/services/expense-sort.service';
```

### Backend
```javascript
// Avant
const pool = new Pool(dbConfig);  // défini dans index.js

// Après
const pool = require('./config/database');
const { sendResponse } = require('./utils/response');
const { getExpenses } = require('./api/expenses');
```

---

## ✅ Checklist de Vérification

- [x] Modèles extraits dans `shared/models/`
- [x] Service métier dans `core/services/`
- [x] Composant feature dans `features/expenses/`
- [x] Service de tri isolé dans `features/expenses/services/`
- [x] Root component simplifiée (`app.ts`)
- [x] Database config centralisée
- [x] Utilities (CORS, response) extraites
- [x] Handlers d'API organisés par feature
- [x] Ré-exports via index.js pour compatibilité Firebase
- [x] Aucun changement de comportement

---

## 🚀 Utilisation

### Frontend (inchangé)
```bash
cd frontend
npm install
npm start     # http://localhost:4200
npm run build
```

### Backend (inchangé)
```bash
cd functions
npm install
firebase emulators:start --only functions
```

### Déploiement (inchangé)
```bash
firebase deploy
```

---

## 📝 Notes Importantes

1. **Firebase Functions** : Le fichier `functions/index.js` ré-exporte simplement depuis `src/index.js`. Firebase CLI cherche automatiquement les exports à la racine.

2. **Imports Relatifs** : Les chemins relatifs (`../../`) sont utilisés pour les imports internes. Ils restent stables même après refactor.

3. **Aucun Breaking Change** : L'API reste inchangée, les URLs des endpoints sont identiques.

4. **Scalabilité** : Structure prête pour ajouter des features (ex: `features/users/`, `features/reports/`).

---

## 🔍 Fichiers Modifiés

### Frontend
- ✅ `app.ts` → Root simplifiée (imports depuis feature)
- ✅ `expense.service.ts` → `core/services/expense.service.ts`
- ✅ Modèles → `shared/models/expense.model.ts`
- ✅ `app.html` → `features/expenses/expenses.component.html`
- ✅ `app.css` → `features/expenses/expenses.component.css`
- ✨ **NEW** `features/expenses/expenses.component.ts` (logique métier)
- ✨ **NEW** `features/expenses/services/expense-sort.service.ts` (tri)

### Backend
- ✅ `index.js` → Ré-export depuis `src/`
- ✨ **NEW** `src/config/database.js` (pool DB)
- ✨ **NEW** `src/utils/response.js` (helpers)
- ✨ **NEW** `src/api/expenses/handlers/get.js`
- ✨ **NEW** `src/api/expenses/handlers/create.js`
- ✨ **NEW** `src/api/expenses/handlers/update.js`
- ✨ **NEW** `src/api/expenses/handlers/delete.js`
- ✨ **NEW** `src/api/expenses/index.js` (ré-exports)
- ✨ **NEW** `src/index.js` (point d'entrée)

---

## 🎓 Prochaines Étapes (Futures)

1. **Ajouter des tests unitaires** par feature
2. **Créer des sous-composants** Angular (ex: `ExpenseFormComponent`, `ExpenseListComponent`)
3. **Ajouter un guard/interceptor** HTTP pour auth
4. **Documenter via JSDoc** chaque handler
5. **Créer une suite d'intégration** pour l'API


