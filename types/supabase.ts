export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string | null
          user_id: string | null
          user_name: string | null
        }
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          company_id: number
          created_at: string | null
          email: string | null
          id: number
          is_remote: boolean | null
          name: string
          phone: string | null
          postal_code: string | null
          state: string | null
          status: string | null
          updated_at: string | null
        }
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          company_code: string | null
          country: string | null
          created_at: string | null
          email: string | null
          founded_date: string | null
          id: number
          name: string
          phone: string | null
          postal_code: string | null
          registration_number: string | null
          state: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          status: string | null
          updated_at: string | null
        }
      }
      designations: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          status: string | null
          updated_at: string | null
        }
      }
      employees: {
        Row: {
          address: string | null
          city: string | null
          company_id: number | null
          country: string | null
          created_at: string | null
          department_id: number | null
          designation_id: number | null
          email: string | null
          employee_id: string | null
          first_name: string | null
          home_branch_id: number | null
          hire_date: string | null
          id: number
          job_title: string | null
          last_name: string | null
          location: string | null
          notes: string | null
          phone: string | null
          primary_company_id: number | null
          role: string | null
          state: string | null
          status: string | null
          termination_date: string | null
          updated_at: string | null
          zip_code: string | null
        }
      }
      employee_companies: {
        Row: {
          allocation_percentage: number
          branch_id: number
          company_id: number
          created_at: string | null
          employee_id: number
          end_date: string | null
          id: number
          is_primary: boolean
          project_id: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
      }
      lead_followups: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          followup_type: string
          id: number
          lead_id: number
          notes: string | null
          outcome: string | null
          scheduled_at: string
          status: string
        }
      }
      lead_messages: {
        Row: {
          created_at: string
          error_message: string | null
          id: number
          lead_id: number
          message_body: string
          message_type: string
          sent_at: string
          sent_by: string
          status: string
          subject: string | null
        }
      }
      lead_notes: {
        Row: {
          created_at: string
          created_by: string
          id: number
          lead_id: number
          note: string
          note_type: string
        }
      }
      lead_sources: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          name: string
          updated_at: string | null
        }
      }
      leads: {
        Row: {
          assigned_to: number | null
          branch_id: number | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_whatsapp: string | null
          company_id: number
          country_code: string | null
          created_at: string | null
          email: string | null
          has_separate_whatsapp: boolean | null
          id: number
          is_rejected: boolean | null
          is_whatsapp: boolean | null
          lead_number: string
          lead_source: string | null
          lead_source_id: number | null
          location: string | null
          notes: string | null
          phone: string | null
          reassigned_at: string | null
          reassigned_by: number | null
          reassigned_from_company_id: number | null
          reassigned_from_branch_id: number | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
          updated_at: string | null
          whatsapp_country_code: string | null
          whatsapp_number: string | null
        }
      }
      menu_items: {
        Row: {
          created_at: string
          description: string | null
          id: number
          icon: string | null
          is_visible: boolean
          name: string
          parent_id: number | null
          path: string | null
          sort_order: number
          updated_at: string
        }
      }
      menu_items_tracking: {
        Row: {
          id: number
          last_known_state: string
          last_updated: string
          menu_item_id: number
        }
      }
      projects: {
        Row: {
          code: string
          company_id: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: number
          name: string
          start_date: string | null
          status: string
          updated_at: string
        }
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          updated_at: string | null
        }
      }
      role_menu_permissions: {
        Row: {
          can_add: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          description: string | null
          id: number
          menu_item_id: number
          role_id: number
          updated_at: string
        }
      }
      user_accounts: {
        Row: {
          created_at: string
          employee_id: number
          email: string
          id: number
          is_active: boolean
          last_login: string | null
          password_hash: string
          role_id: number
          updated_at: string
          username: string
        }
      }
    }
    Views: {
      employee_allocations_view: {
        Row: {
          allocation_percentage: number | null
          branch_name: string | null
          company_id: number | null
          company_name: string | null
          department_id: number | null
          department_name: string | null
          employee_code: string | null
          employee_id: number
          first_name: string | null
          is_primary: boolean | null
          job_title: string | null
          last_name: string | null
          status: string | null
        }
      }
      user_menu_permissions: {
        Row: {
          can_add: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          icon: string | null
          is_visible: boolean | null
          menu_item_id: number
          menu_name: string | null
          menu_path: string | null
          parent_id: number | null
          role_id: number
          role_title: string | null
          user_id: number
          username: string | null
        }
      }
    }
    RpcProcedures: {
      add_lead_source_column: {
        args: undefined
        result: { success: boolean; message: string }
      }
      add_lead_sources_default_constraint: {
        args: undefined
        result: { success: boolean; message: string }
      }
      alter_table_add_unique_constraint: {
        args: {
          column_names: string[]
          constraint_name: string
          table_name: string
        }
        result: boolean
      }
      alter_table_drop_constraint: {
        args: { constraint_name: string; table_name: string }
        result: boolean
      }
      api_get_users_by_role: {
        args: { p_role_id: number }
        result: {
          id: number
          username: string
          email: string
          first_name: string
          last_name: string
          role_id: number
          role_name: string
        }[]
      }
      check_function_exists: {
        args: { function_name: string }
        result: { exists: boolean }
      }
      check_foreign_key_constraints: {
        args: { record_id: string; table_name: string }
        result: {
          table: string
          record_id: string
          message: string
        }[]
      }
      check_if_table_exists: {
        args: { table_name: string }
        result: boolean
      }
      column_exists: {
        args: { column_name: string; table_name: string }
        result: boolean
      }
      create_clients_table: {
        args: undefined
        result: undefined
      }
      create_vendors_table: {
        args: undefined
        result: undefined
      }
      create_user_accounts_table_if_not_exists: {
        args: undefined
        result: undefined
      }
      execute_sql: {
        args: { sql_query: string }
        result: boolean
      }
      exec_sql: {
        args: { sql: string }
        result: boolean
      }
      get_column_info: {
        args: { table_name: string }
        result: {
          character_maximum_length: number | null
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
      get_complete_menu_hierarchy: {
        args: { p_role_id: number }
        result: {
          can_add: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          id: number
          icon: string | null
          is_visible: boolean
          name: string
          parent_id: number | null
          path: string | null
          sort_order: number
        }[]
      }
      get_employee_data_v2: {
        args: undefined
        result: {
          address: string | null
          city: string | null
          companies: string | null
          created_at: string
          department: string | null
          department_id: number | null
          designation: string | null
          designation_id: number | null
          email: string | null
          employee_id: string
          first_name: string
          home_branch: string | null
          home_branch_id: number | null
          hire_date: string | null
          id: number
          job_title: string | null
          last_name: string
          location: string | null
          phone: string | null
          primary_company: string | null
          primary_company_id: number | null
          status: string
          termination_date: string | null
          updated_at: string
        }[]
      }
      get_lead_trends_by_date: {
        args: {
          employee_ids: number[]
          end_date: string | null
          source_ids: number[]
          start_date: string | null
          status_list: string[]
        }
        result: {
          date_group: string
          lead_count: number
          lead_source_id: number
          lead_source_name: string
          status: string
        }[]
      }
      get_simple_employee_data: {
        args: undefined
        result: {
          address: string | null
          city: string | null
          company_id: number | null
          country: string | null
          created_at: string
          department: string | null
          department_id: number | null
          designation: string | null
          designation_id: number | null
          email: string | null
          employee_id: string
          first_name: string
          home_branch: string | null
          home_branch_id: number | null
          hire_date: string | null
          id: number
          job_title: string | null
          last_name: string
          location: string | null
          phone: string | null
          primary_company: string | null
          primary_company_id: number | null
          status: string
          termination_date: string | null
          updated_at: string
        }[]
      }
      get_users_by_role: {
        args: { p_role_id: number }
        result: {
          email: string
          first_name: string
          id: number
          last_name: string
          role_id: number
          role_name: string
          username: string
        }[]
      }
      table_exists: {
        args: { table_name: string }
        result: boolean
      }
    }
  }
}
