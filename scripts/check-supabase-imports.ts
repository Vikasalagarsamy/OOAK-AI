// This is a utility script to help identify any direct imports of @supabase/supabase-js
// You can run this manually to find files that might be creating multiple clients

import * as fs from "fs"
import * as path from "path"

const rootDir = path.resolve(__dirname, "..")
const ignoreDirs = ["node_modules", ".next", "out", "public", "scripts"]

function checkFile(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf8")

  // Check for direct imports of createClient from supabase-js
  if (content.includes("from '@supabase/supabase-js'") || content.includes('from "@supabase/supabase-js"')) {
    if (content.includes("createClient")) {
      console.log(`⚠️ Direct import of createClient found in: ${filePath}`)
      console.log("   Consider using the singleton pattern from lib/supabase.ts instead")
    }
  }
}

function walkDir(dir: string): void {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    if (ignoreDirs.includes(file)) continue

    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      walkDir(filePath)
    } else if (stat.isFile() && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
      checkFile(filePath)
    }
  }
}

console.log("Checking for direct imports of @supabase/supabase-js...")
walkDir(rootDir)
console.log("Done!")
