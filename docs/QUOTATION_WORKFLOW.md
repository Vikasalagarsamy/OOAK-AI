# 📦 Quotation Workflow Design

## 🎯 **OVERVIEW**
Multi-stage workflow: Quotation → Follow-up → Approval → Payment → Post-Sale Confirmation

## 🗄️ **DATA MODEL DESIGN**

### 1. **Enhanced Quotations Table**
```sql
-- Add new columns to existing quotations table
ALTER TABLE quotations ADD COLUMN workflow_status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE quotations ADD COLUMN client_verbal_confirmation_date TIMESTAMP;
ALTER TABLE quotations ADD COLUMN payment_received_date TIMESTAMP;
ALTER TABLE quotations ADD COLUMN payment_amount DECIMAL(12,2);
ALTER TABLE quotations ADD COLUMN payment_reference VARCHAR(100);
ALTER TABLE quotations ADD COLUMN confirmation_required BOOLEAN DEFAULT true;
```

**Workflow Statuses:**
- `draft` - Initial creation
- `pending_client_confirmation` - Shared with client
- `pending_approval` - Client showed interest, awaiting Sales Head approval
- `approved` - Sales Head approved, ready for payment
- `payment_received` - Payment completed
- `confirmed` - Post-sale verbal confirmation completed
- `rejected` - Rejected at any stage
- `cancelled` - Cancelled by client/company

### 2. **New: Quotation Approvals Table**
```sql
CREATE TABLE quotation_approvals (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id),
  approver_user_id INTEGER REFERENCES users(id),
  approval_status VARCHAR(20) NOT NULL, -- 'pending', 'approved', 'rejected'
  approval_date TIMESTAMP,
  comments TEXT,
  price_adjustments JSONB, -- Track any price changes made during approval
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. **New: Post-Sale Confirmations Table**
```sql
CREATE TABLE post_sale_confirmations (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER REFERENCES quotations(id),
  confirmed_by_user_id INTEGER REFERENCES users(id),
  client_contact_person VARCHAR(100),
  confirmation_date TIMESTAMP,
  deliverables_confirmed JSONB, -- What client confirmed they expect
  event_details_confirmed JSONB, -- Event date, venue, etc.
  client_expectations TEXT, -- Free text for any special notes
  confirmation_method VARCHAR(50), -- 'phone', 'video_call', 'in_person'
  confirmation_document_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. **Enhanced Follow-ups for Workflow Integration**
```sql
-- Add workflow context to follow-ups
ALTER TABLE lead_followups ADD COLUMN workflow_stage VARCHAR(50);
ALTER TABLE lead_followups ADD COLUMN quotation_id INTEGER REFERENCES quotations(id);
```

## 🔄 **WORKFLOW STATE MACHINE**

### State Transitions:
```
draft → pending_client_confirmation → pending_approval → approved → payment_received → confirmed
  ↓                    ↓                      ↓           ↓              ↓
rejected            rejected              rejected    cancelled      cancelled
```

### Validation Rules:
- Only Sales Head can approve quotations
- Payment cannot be processed without approval
- Confirmation call is mandatory after payment
- Each stage requires specific role permissions

## 👥 **TEAM RESPONSIBILITIES**

### **Sales Resource:**
- Create quotations
- Follow up with clients
- Mark client verbal interest
- Cannot approve own quotations

### **Sales Head:**
- Review and approve/reject quotations
- Add approval comments
- Adjust pricing if needed
- Dashboard for pending approvals

### **Confirmation Team:**
- Handle post-sale confirmation calls
- Log confirmation details
- Send confirmation documents
- Dashboard for pending confirmations

### **Finance Team:**
- Process payments
- Update payment status
- Generate payment reports

## 🎨 **UI/UX DESIGN REQUIREMENTS**

### **Sales Dashboard Enhancements:**
- Quotation pipeline view (kanban-style)
- Quick status update buttons
- Approval request notifications
- Payment status tracking

### **Sales Head Approval Dashboard:**
- Pending approvals queue
- Quotation review interface
- Price adjustment tools
- Approval history tracking

### **Confirmation Team Dashboard:**
- Post-sale confirmation queue
- Client contact information
- Confirmation form interface
- Document generation tools

## 🤖 **AUTOMATION OPPORTUNITIES**

### **Notifications:**
- Email/SMS to Sales Head when approval needed
- Alert Confirmation Team when payment received
- Remind team of pending confirmations after 24h
- Weekly digest of pipeline status

### **Document Generation:**
- Auto-generate payment instructions after approval
- Auto-send confirmation document after verbal confirmation
- Generate delivery timeline document

### **Integration Points:**
- Payment gateway integration
- SMS/Email service integration
- Calendar integration for confirmation calls
- Reporting and analytics integration

## 📊 **REPORTING & ANALYTICS**

### **Key Metrics:**
- Average time in each workflow stage
- Approval conversion rates
- Payment collection efficiency
- Post-sale confirmation completion rates

### **Dashboard Views:**
- Real-time pipeline status
- Team performance metrics
- Revenue tracking by stage
- Bottleneck identification

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Core Workflow**
- Database schema updates
- Basic status management
- Simple approval flow

### **Phase 2: Enhanced UI**
- Kanban pipeline view
- Approval dashboard
- Confirmation interface

### **Phase 3: Automation**
- Notification system
- Document generation
- Integration setup

### **Phase 4: Analytics**
- Reporting dashboard
- Performance metrics
- Advanced analytics 