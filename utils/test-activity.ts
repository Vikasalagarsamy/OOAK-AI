"use server"

import { logActivity } from "@/services/activity-service"
import { v4 as uuidv4 } from "uuid"

export async function createTestActivity() {
  const entityTypes = [
    "company",
    "branch",
    "employee",
    "client",
    "vendor",
    "supplier",
    "department",
    "designation",
    "role",
  ]

  const actionTypes = ["create", "update", "delete", "status_change", "assignment"]

  const randomEntityType = entityTypes[Math.floor(Math.random() * entityTypes.length)] as any
  const randomActionType = actionTypes[Math.floor(Math.random() * actionTypes.length)] as any

  const entityNames = {
    company: ["Acme Inc", "TechCorp", "Global Industries", "Startup Labs", "Enterprise Solutions"],
    branch: ["New York Office", "London HQ", "Tokyo Branch", "Sydney Office", "Berlin Division"],
    employee: ["John Smith", "Sarah Johnson", "Michael Wong", "Emma Davis", "Robert Chen"],
    client: [
      "Retail Solutions",
      "Healthcare Group",
      "Financial Services Ltd",
      "Education Systems",
      "Government Agency",
    ],
    vendor: ["Office Supplies Co", "IT Services Inc", "Cleaning Solutions", "Security Systems", "Catering Company"],
    supplier: [
      "Raw Materials Inc",
      "Component Suppliers",
      "Packaging Solutions",
      "Chemical Products",
      "Electronic Parts",
    ],
    department: ["Engineering", "Marketing", "Sales", "Finance", "Human Resources"],
    designation: ["Manager", "Director", "Supervisor", "Coordinator", "Specialist"],
    role: ["Administrator", "Editor", "Viewer", "Analyst", "Approver"],
  }

  const randomEntityName = entityNames[randomEntityType][Math.floor(Math.random() * 5)]

  const descriptions = {
    create: `New ${randomEntityName} was added to the system`,
    update: `${randomEntityName}'s information was updated`,
    delete: `${randomEntityName} was removed from the system`,
    status_change: `${randomEntityName}'s status was changed to Active`,
    assignment: `${randomEntityName} was assigned to a new group`,
  }

  const users = ["Admin User", "John Doe", "Jane Smith", "System Administrator", "Support Team"]
  const randomUser = users[Math.floor(Math.random() * users.length)]

  await logActivity({
    actionType: randomActionType,
    entityType: randomEntityType,
    entityId: uuidv4(),
    entityName: randomEntityName,
    description: descriptions[randomActionType],
    userName: randomUser,
  })

  return {
    success: true,
    message: `Test activity created: ${randomActionType} ${randomEntityType} - ${randomEntityName}`,
  }
}
