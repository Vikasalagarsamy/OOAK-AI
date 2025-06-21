-- Create quotation_edit_approvals table for tracking edit approval requests
CREATE TABLE IF NOT EXISTS quotation_edit_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL,
    requested_by UUID NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_status VARCHAR(20) DEFAULT 'pending',
    edit_reason TEXT NOT NULL,
    approval_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotation_edit_approvals_quotation_id ON quotation_edit_approvals(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_edit_approvals_requested_by ON quotation_edit_approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_quotation_edit_approvals_approval_status ON quotation_edit_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_quotation_edit_approvals_created_at ON quotation_edit_approvals(created_at);

-- Add RLS policies
ALTER TABLE quotation_edit_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests and approvers can view all pending requests
CREATE POLICY "Users can view own edit requests" ON quotation_edit_approvals
    FOR SELECT USING (
        requested_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_accounts ua
            JOIN employees e ON ua.employee_id = e.id
            JOIN roles r ON ua.role_id = r.id
            WHERE ua.id::text = auth.uid()::text
            AND r.title IN ('Sales Head', 'Administrator')
        )
    );

-- Policy: Users can create their own requests
CREATE POLICY "Users can create own edit requests" ON quotation_edit_approvals
    FOR INSERT WITH CHECK (
        requested_by = auth.uid()
    );

-- Policy: Only approvers can update requests
CREATE POLICY "Only approvers can update requests" ON quotation_edit_approvals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_accounts ua
            JOIN employees e ON ua.employee_id = e.id
            JOIN roles r ON ua.role_id = r.id
            WHERE ua.id::text = auth.uid()::text
            AND r.title IN ('Sales Head', 'Administrator')
        )
    );

-- Policy: Only approvers can delete requests
CREATE POLICY "Only approvers can delete requests" ON quotation_edit_approvals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_accounts ua
            JOIN employees e ON ua.employee_id = e.id
            JOIN roles r ON ua.role_id = r.id
            WHERE ua.id::text = auth.uid()::text
            AND r.title IN ('Sales Head', 'Administrator')
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotation_edit_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quotation_edit_approvals_updated_at
    BEFORE UPDATE ON quotation_edit_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_quotation_edit_approvals_updated_at();

-- Add comment to the table
COMMENT ON TABLE quotation_edit_approvals IS 'Tracks approval requests for quotation edits to ensure strict control over modifications'; 