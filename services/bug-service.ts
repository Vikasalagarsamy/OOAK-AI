// Universal bug service stub that handles any method call
export const bugService = new Proxy({}, {
  get(target, prop) {
    return async (...args: any[]) => {
      console.log(`Bug service method ${String(prop)} called with args:`, args)
      
      // Return appropriate default values based on method name
      if (String(prop).includes('get') && String(prop).includes('s')) {
        return [] // For methods that return arrays (getBugs, getComments, etc.)
      }
      if (String(prop).includes('get')) {
        return null // For methods that return single items (getBugById, etc.)
      }
      if (String(prop).includes('create') || String(prop).includes('update') || String(prop).includes('assign')) {
        return { id: 1, success: true, ...args[1] } // For create/update operations
      }
      if (String(prop).includes('delete')) {
        return true // For delete operations
      }
      if (String(prop).includes('Stats')) {
        return { total: 0, open: 0, closed: 0, inProgress: 0 } // For stats
      }
      
      return { success: true } // Default return
    }
  }
})
