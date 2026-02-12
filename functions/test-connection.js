/**
 * Script de test pour vérifier la connexion à la base de données
 * Usage: node test-connection.js
 */

const { query, pool } = require('./db');

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test 1: Connexion basique
    console.log('Test 1: Basic connection...');
    const timeResult = await query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Connected successfully!');
    console.log('   Current time:', timeResult.rows[0].current_time);
    console.log('   PostgreSQL version:', timeResult.rows[0].version.split(' ')[0], timeResult.rows[0].version.split(' ')[1]);
    console.log('');

    // Test 2: Vérifier si la table expenses existe
    console.log('Test 2: Checking if expenses table exists...');
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'expenses'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Table "expenses" exists');

      // Compter les enregistrements
      const countResult = await query('SELECT COUNT(*) as count FROM expenses');
      console.log(`   Found ${countResult.rows[0].count} expense(s) in the table`);

      // Afficher quelques exemples
      if (countResult.rows[0].count > 0) {
        const sampleResult = await query('SELECT * FROM expenses ORDER BY created_at DESC LIMIT 3');
        console.log('   Sample expenses:');
        sampleResult.rows.forEach((expense, idx) => {
          console.log(`   ${idx + 1}. ${expense.description} - $${expense.amount} (${expense.category || 'No category'})`);
        });
      }
    } else {
      console.log('⚠️  Table "expenses" does not exist');
      console.log('   Run "npm run migrate" to create the table');
    }
    console.log('');

    // Test 3: Vérifier les index
    console.log('Test 3: Checking indexes...');
    const indexResult = await query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'expenses'
      ORDER BY indexname;
    `);

    if (indexResult.rows.length > 0) {
      console.log(`✅ Found ${indexResult.rows.length} index(es):`);
      indexResult.rows.forEach(idx => {
        console.log(`   - ${idx.indexname}`);
      });
    } else {
      console.log('⚠️  No indexes found');
    }
    console.log('');

    // Informations sur la connexion
    console.log('📊 Connection info:');
    console.log('   Database:', process.env.DB_NAME || 'merval_depenses');
    console.log('   User:', process.env.DB_USER || 'postgres');
    console.log('   Host:', process.env.DB_HOST || '/cloudsql/' + process.env.INSTANCE_CONNECTION_NAME);
    console.log('   Environment:', process.env.NODE_ENV || 'development');
    console.log('');

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Connection test failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure Cloud SQL Proxy is running (for local development)');
    console.error('2. Check your .env file configuration');
    console.error('3. Verify your database credentials');
    console.error('4. Ensure the database exists');
    console.error('');
    process.exit(1);
  } finally {
    await pool.end();
    console.log('👋 Connection closed');
  }
}

// Exécuter le test
testConnection();

