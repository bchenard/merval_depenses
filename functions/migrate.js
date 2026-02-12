const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'merval-depenses',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting database migration...');

    // Créer le type ENUM pour les catégories
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE expense_category AS ENUM ('sorties', 'courses', 'essences', 'achats exceptionnels');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Enum type "expense_category" created or already exists');

    // Créer la table expenses
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(10, 2) NOT NULL,
        place VARCHAR(500) NOT NULL,
        expense_date DATE NOT NULL,
        category expense_category NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "expenses" created or already exists');

    // Créer les index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date DESC);
    `);
    console.log('✅ Index on expense_date created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    `);
    console.log('✅ Index on category created');

    // Créer la fonction pour updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('✅ Function update_updated_at_column created');

    // Créer le trigger
    await client.query(`
      DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
    `);
    await client.query(`
      CREATE TRIGGER update_expenses_updated_at
        BEFORE UPDATE ON expenses
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Trigger update_expenses_updated_at created');

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter la migration
runMigration()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

