import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'

// Open the database
// We use a singleton pattern to reuse the promise, but for Next.js in dev mode, 
// re-opening might be necessary. However, `open` returns a promise.

let dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>> | null = null

export async function getDb() {
    if (!dbPromise) {
        dbPromise = open({
            filename: path.join(process.cwd(), 'dev.db'),
            driver: sqlite3.Database
        })
    }
    return dbPromise
}
