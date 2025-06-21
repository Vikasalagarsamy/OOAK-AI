"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/services/activity-service"

export interface Client {
  id: number
  name: string
  client_code: string
  email?: string
  phone?: string
  company_id: number
  created_at: string
  updated_at?: string
}

export async function deleteClient(clientId: number): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🗑️ [CLIENTS] Deleting client ${clientId} via PostgreSQL...`)

    // First get client info for logging
    const clientResult = await query(`
      SELECT id, name, client_code
      FROM clients 
      WHERE id = $1
    `, [clientId])

    if (clientResult.rows.length === 0) {
      return {
        success: false,
        message: "Client not found"
      }
    }

    const client = clientResult.rows[0]

    // Delete the client
    await query(`DELETE FROM clients WHERE id = $1`, [clientId])

    // Log the activity
    await logActivity({
      type: 'client_deleted',
      description: `Client ${client.name} (${client.client_code}) was deleted`,
      entity_type: 'client',
      entity_id: clientId
    })

    revalidatePath('/clients')
    console.log(`✅ [CLIENTS] Client ${client.name} deleted successfully`)

    return {
      success: true,
      message: "Client deleted successfully"
    }
  } catch (error: any) {
    console.error(`❌ [CLIENTS] Error deleting client ${clientId}:`, error)
    return {
      success: false,
      message: `Failed to delete client: ${error.message}`
    }
  }
}

export async function getClients(): Promise<Client[]> {
  try {
    console.log('📋 [CLIENTS] Fetching clients via PostgreSQL...')

    const result = await query(`
      SELECT 
        c.id, c.name, c.client_code, c.email, c.phone, c.company_id,
        c.created_at, c.updated_at,
        co.name as company_name
      FROM clients c
      LEFT JOIN companies co ON c.company_id = co.id
      ORDER BY c.name
    `)

    console.log(`✅ [CLIENTS] Fetched ${result.rows.length} clients successfully`)
    return result.rows
  } catch (error: any) {
    console.error('❌ [CLIENTS] Error fetching clients:', error)
    return []
  }
}

export async function createClient(clientData: {
  name: string
  client_code: string
  email?: string
  phone?: string
  company_id: number
}): Promise<{ success: boolean; data?: Client; message: string }> {
  try {
    console.log('📝 [CLIENTS] Creating new client via PostgreSQL...')

    const result = await query(`
      INSERT INTO clients (name, client_code, email, phone, company_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      clientData.name,
      clientData.client_code,
      clientData.email || null,
      clientData.phone || null,
      clientData.company_id,
      new Date().toISOString()
    ])

    const newClient = result.rows[0]

    // Log activity
    await logActivity({
      type: 'client_created',
      description: `New client ${clientData.name} (${clientData.client_code}) created`,
      entity_type: 'client',
      entity_id: newClient.id
    })

    revalidatePath('/clients')
    console.log(`✅ [CLIENTS] Client ${clientData.name} created successfully`)

    return {
      success: true,
      data: newClient,
      message: "Client created successfully"
    }
  } catch (error: any) {
    console.error('❌ [CLIENTS] Error creating client:', error)
    return {
      success: false,
      message: `Failed to create client: ${error.message}`
    }
  }
}

export async function updateClient(
  clientId: number, 
  clientData: Partial<Pick<Client, 'name' | 'client_code' | 'email' | 'phone' | 'company_id'>>
): Promise<{ success: boolean; data?: Client; message: string }> {
  try {
    console.log(`📝 [CLIENTS] Updating client ${clientId} via PostgreSQL...`)

    const result = await query(`
      UPDATE clients 
      SET 
        name = COALESCE($1, name),
        client_code = COALESCE($2, client_code),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        company_id = COALESCE($5, company_id),
        updated_at = $6
      WHERE id = $7
      RETURNING *
    `, [
      clientData.name || null,
      clientData.client_code || null,
      clientData.email || null,
      clientData.phone || null,
      clientData.company_id || null,
      new Date().toISOString(),
      clientId
    ])

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Client not found"
      }
    }

    const updatedClient = result.rows[0]

    // Log activity
    await logActivity({
      type: 'client_updated',
      description: `Client ${updatedClient.name} (${updatedClient.client_code}) updated`,
      entity_type: 'client',
      entity_id: clientId
    })

    revalidatePath('/clients')
    console.log(`✅ [CLIENTS] Client ${clientId} updated successfully`)

    return {
      success: true,
      data: updatedClient,
      message: "Client updated successfully"
    }
  } catch (error: any) {
    console.error(`❌ [CLIENTS] Error updating client ${clientId}:`, error)
    return {
      success: false,
      message: `Failed to update client: ${error.message}`
    }
  }
} 