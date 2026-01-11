import fs from "fs"
import path from "path"
import sqlite3 from "sqlite3"

const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
const dbFile = path.join(dataDir, "database.sqlite")

const sqlite = sqlite3.verbose()

function openDb() {
  if (!(global as any).__sqliteDb) {
    (global as any).__sqliteDb = new sqlite.Database(dbFile)
  }
  return (global as any).__sqliteDb as sqlite3.Database
}

export function run(sql: string, params: any[] = []) {
  const db = openDb()
  return new Promise<void>((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err)
      resolve()
    })
  })
}

export function get<T = any>(sql: string, params: any[] = []) {
  const db = openDb()
  return new Promise<T | undefined>((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err)
      resolve(row)
    })
  })
}

export function all<T = any>(sql: string, params: any[] = []) {
  const db = openDb()
  return new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

export default {
  run,
  get,
  all,
}
