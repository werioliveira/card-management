import { run } from "./db"

export async function initDb() {
  await run(`CREATE TABLE IF NOT EXISTS people (id TEXT PRIMARY KEY, name TEXT, email TEXT, color TEXT)`)
  await run(`CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, name TEXT, lastDigits TEXT, brand TEXT, "limit" REAL, closingDay INTEGER, dueDay INTEGER, color TEXT, active INTEGER DEFAULT 1)`)
  await run(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT, icon TEXT, color TEXT)`)
  await run(`CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, description TEXT, amount REAL, date TEXT, cardId TEXT, personId TEXT, categoryId TEXT, installments INTEGER, currentInstallment INTEGER)`)
  await run(`CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, cardId TEXT, month INTEGER, year INTEGER, totalAmount REAL, dueDate TEXT, status TEXT)`)

  // Trigger para INSERT
  await run(`
    CREATE TRIGGER IF NOT EXISTS update_invoice_on_insert
    AFTER INSERT ON transactions
    BEGIN
        INSERT OR IGNORE INTO invoices (id, cardId, month, year, totalAmount, dueDate, status)
        VALUES (
            'inv-' || NEW.cardId || '-' || strftime('%Y-%m', NEW.date),
            NEW.cardId,
            CAST(strftime('%m', NEW.date) AS INTEGER),
            CAST(strftime('%Y', NEW.date) AS INTEGER),
            0,
            strftime('%Y-%m-10', NEW.date),
            'open'
        );
        UPDATE invoices 
        SET totalAmount = totalAmount + NEW.amount
        WHERE cardId = NEW.cardId 
          AND month = CAST(strftime('%m', NEW.date) AS INTEGER)
          AND year = CAST(strftime('%Y', NEW.date) AS INTEGER);
    END;
  `)

  // Trigger para DELETE
  await run(`
    CREATE TRIGGER IF NOT EXISTS update_invoice_on_delete
    AFTER DELETE ON transactions
    BEGIN
        UPDATE invoices 
        SET totalAmount = totalAmount - OLD.amount
        WHERE cardId = OLD.cardId 
          AND month = CAST(strftime('%m', OLD.date) AS INTEGER)
          AND year = CAST(strftime('%Y', OLD.date) AS INTEGER);
    END;
  `)
}

export default initDb