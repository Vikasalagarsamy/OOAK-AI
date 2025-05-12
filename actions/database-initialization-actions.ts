"use server"

import { initializeDatabase } from "@/lib/init-database"

export async function verifyDatabaseTables() {
  return await initializeDatabase()
}
