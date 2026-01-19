import { run } from "./db"

export async function initDb() {
  await run(
    `CREATE TABLE IF NOT EXISTS people (
      id TEXT PRIMARY KEY, 
      name TEXT, 
      email TEXT, 
      color TEXT, 
      userId TEXT
    )`
  );
    await run(
    `CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY, 
      name TEXT, 
      lastDigits TEXT, 
      brand TEXT, 
      "limit" REAL, 
      closingDay INTEGER, 
      dueDay INTEGER, 
      color TEXT, 
      active INTEGER DEFAULT 1, 
      userId TEXT
    )`
  );
  await run(
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, 
      name TEXT, 
      icon TEXT, 
      color TEXT, 
      userId TEXT
    )`
  );
 await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      createdAt TEXT
    )
  `);
  await run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      description TEXT,
      amount REAL,
      date TEXT,
      cardId TEXT,
      personId TEXT,
      categoryId TEXT,
      installments INTEGER,
      currentInstallment INTEGER,
      userId TEXT
    )
  `)
  await run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      cardId TEXT,
      month INTEGER,
      year INTEGER,
      totalAmount REAL,
      status TEXT,
      dueDate TEXT,
      userId TEXT
    )
  `)
  await run(`DROP TRIGGER IF EXISTS update_invoice_on_insert`)
  await run(`DROP TRIGGER IF EXISTS update_invoice_on_delete`)
}

export default initDb