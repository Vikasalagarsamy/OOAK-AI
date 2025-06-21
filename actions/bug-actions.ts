export async function getBugs() { return { success: true, data: [] } }
export async function getBugById() { return { success: true, data: null } }
export async function createBug() { return { success: true, data: { id: 1 } } }
export async function updateBugStatus() { return { success: true, data: { id: 1 } } }
export async function assignBug() { return { success: true, data: { id: 1 } } }
export async function getBugStats() { return { success: true, data: {} } }
export async function addBugComment() { return { success: true } }
export async function handleAttachmentUpload() { return { success: true } }
