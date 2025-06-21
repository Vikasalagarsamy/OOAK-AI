export async function createDeliverable(
  formData: DeliverableFormData
): Promise<{ success: boolean; message: string; id?: number }> {
  try {
    console.log("➕ [DELIVERABLES] Creating deliverable via PostgreSQL...")

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "Authentication required" }
    }

    const result = await query(`
      INSERT INTO deliverables (
        deliverable_cat, deliverable_type, deliverable_id, deliverable_name, process_name,
        has_customer, has_employee, has_qc, has_vendor, link, sort_order,
        timing_type, tat, tat_value, buffer, skippable, employee,
        has_download_option, has_task_process, has_upload_folder_path, process_starts_from, status,
        basic_price, premium_price, elite_price,
        on_start_template, on_complete_template, on_correction_template,
        input_names, stream, stage, package_included, created_date, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
      ) RETURNING id
    `, [
      formData.deliverable_cat,
      formData.deliverable_type,
      formData.deliverable_id,
      formData.deliverable_name.trim(),
      formData.process_name.trim(),
      formData.has_customer,
      formData.has_employee,
      formData.has_qc,
      formData.has_vendor,
      formData.link?.trim() || null,
      formData.sort_order,
      formData.timing_type,
      formData.tat,
      formData.tat_value,
      formData.buffer,
      formData.skippable,
      formData.employee || null,
      formData.has_download_option,
      formData.has_task_process,
      formData.has_upload_folder_path,
      formData.process_starts_from,
      formData.status,
      formData.basic_price || 0.00,
      formData.premium_price || 0.00,
      formData.elite_price || 0.00,
      formData.on_start_template?.trim() || null,
      formData.on_complete_template?.trim() || null,
      formData.on_correction_template?.trim() || null,
      formData.input_names || null,
      formData.stream || null,
      formData.stage?.trim() || null,
      formData.package_included,
      new Date().toISOString(),
      parseInt(currentUser.id)
    ])

    const newId = result.rows[0]?.id
    revalidatePath("/post-production/deliverables")
    
    console.log(`✅ [DELIVERABLES] Created deliverable with ID ${newId}`)
    return {
      success: true,
      message: "Deliverable created successfully",
      id: newId,
    }
  } catch (error: any) {
    console.error("❌ [DELIVERABLES] Error creating deliverable:", error)
    return {
      success: false,
      message: `Failed to create deliverable: ${error.message}`,
    }
  }
} 