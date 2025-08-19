import pkg from "pg"
const { Client } = pkg
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

async function main() {
  try {
    console.log("🔌 Connecting to Supabase database...")
    await client.connect()
    console.log("✅ Connected successfully!")

    // 1. Schemas
    console.log("\n🗂️  Fetching schemas...")
    const schemas = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
      ORDER BY schema_name;
    `)

    // 2. Tables
    console.log("📋 Fetching tables...")
    const tables = await client.query(`
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `)

    // 3. Columns
    console.log("📝 Fetching columns...")
    const columns = await client.query(`
      SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name, ordinal_position;
    `)

    // 4. Row counts for main tables
    console.log("🔢 Fetching row counts...")
    const rowCounts = await client.query(`
      SELECT schemaname, relname AS table_name, n_live_tup AS estimated_count
      FROM pg_stat_user_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY n_live_tup DESC;
    `)

    // 5. Roles (users)
    console.log("👥 Fetching roles...")
    const users = await client.query(`
      SELECT rolname, rolsuper, rolcreatedb, rolcanlogin, rolreplication
      FROM pg_roles
      WHERE rolname NOT LIKE 'pg_%'
      ORDER BY rolname;
    `)

    // 6. Indexes
    console.log("🔍 Fetching indexes...")
    const indexes = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename, indexname;
    `)

    // 7. Foreign Keys
    console.log("🔗 Fetching foreign keys...")
    const foreignKeys = await client.query(`
      SELECT
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY tc.table_schema, tc.table_name;
    `)

    // Display results
    console.log("\n" + "=".repeat(50))
    console.log("📊 DATABASE INSPECTION RESULTS")
    console.log("=".repeat(50))

    console.log("\n🗂️  SCHEMAS:")
    console.table(schemas.rows)

    console.log("\n📋 TABLES:")
    console.table(tables.rows)

    console.log("\n📝 COLUMNS:")
    // Group columns by table for better readability
    const columnsByTable = {}
    columns.rows.forEach(col => {
      const key = `${col.table_schema}.${col.table_name}`
      if (!columnsByTable[key]) {
        columnsByTable[key] = []
      }
      columnsByTable[key].push({
        column: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable,
        default: col.column_default
      })
    })
    
    Object.entries(columnsByTable).forEach(([table, cols]) => {
      console.log(`\n📋 ${table}:`)
      console.table(cols)
    })

    console.log("\n🔢 ROW COUNTS:")
    console.table(rowCounts.rows)

    console.log("\n👥 ROLES/USERS:")
    console.table(users.rows)

    console.log("\n🔍 INDEXES:")
    console.table(indexes.rows)

    console.log("\n🔗 FOREIGN KEYS:")
    console.table(foreignKeys.rows)

    // 8. Sample data from key tables
    console.log("\n📊 SAMPLE DATA FROM KEY TABLES:")
    
    const keyTables = ['public.products', 'public.users', 'public.categories', 'public.suppliers']
    
    for (const table of keyTables) {
      try {
        const [schema, tableName] = table.split('.')
        const sampleData = await client.query(`
          SELECT * FROM ${schema}.${tableName} 
          LIMIT 3;
        `)
        
        if (sampleData.rows.length > 0) {
          console.log(`\n📋 Sample from ${table}:`)
          console.table(sampleData.rows)
        } else {
          console.log(`\n📋 ${table}: No data found`)
        }
      } catch (error) {
        console.log(`\n❌ ${table}: Table not found or access denied`)
      }
    }

    console.log("\n✅ Database inspection completed!")

  } catch (error) {
    console.error("❌ Database Inspection Error:", error.message)
    console.error("Stack:", error.stack)
  } finally {
    await client.end()
    console.log("🔌 Database connection closed.")
  }
}

main().catch((err) => {
  console.error("❌ Script Error:", err)
  process.exit(1)
})