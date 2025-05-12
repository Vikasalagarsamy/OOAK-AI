export interface Event {
  event_id: string // varchar(20) in the database
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at?: string
  created_by?: string
}
