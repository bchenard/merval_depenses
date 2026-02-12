-- Script d'initialisation de la base de données merval_depenses

-- Créer un type ENUM pour les catégories de dépenses
DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM ('sorties', 'courses', 'essences', 'achats exceptionnels');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Créer la table des dépenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(10, 2) NOT NULL,
    place VARCHAR(500) NOT NULL,  -- Lieu complet (ex: "restaurant du 12 rue des Prunes 44200 Nantes")
    expense_date DATE NOT NULL,    -- Date de la dépense saisie par l'utilisateur
    category expense_category NOT NULL,  -- Catégorie: sorties/courses/essences/achats exceptionnels
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer un index sur expense_date pour optimiser les requêtes par date
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date DESC);

-- Créer un index sur category
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer quelques données de test (optionnel)
INSERT INTO expenses (amount, place, expense_date, category) VALUES
    (17.20, 'restaurant du 12 rue des Prunes 44200 Nantes', '2026-02-04', 'sorties'),
    (45.50, 'Carrefour du 5 avenue de la Liberté 44000 Nantes', '2026-02-05', 'courses'),
    (60.00, 'Station Total du 18 boulevard Victor Hugo 44200 Nantes', '2026-02-06', 'essences'),
    (125.00, 'FNAC du centre commercial Beaulieu 44200 Nantes', '2026-02-07', 'achats exceptionnels')
ON CONFLICT DO NOTHING;

-- Afficher les données
SELECT * FROM expenses;




