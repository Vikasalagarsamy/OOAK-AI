# 🔄 Post-Approval Quotation Workflow

## 📋 **Overview**

This document outlines the complete workflow that occurs after a quotation is approved by the Sales Head, including task management, client communication, and price negotiations.

## 🎯 **Workflow Stages**

### **Stage 1: Quotation Approval**
```
Task Completed → Quotation Created → Auto-Submit for Approval → Sales Head Review
```

**When Sales Head Approves:**
1. ✅ **Complete Approval Task** - Mark all pending approval tasks as completed
2. 📱 **Send WhatsApp to Client** - Automatic quotation delivery via WhatsApp
3. 🔔 **Notify Sales Resource** - Alert the original sales person
4. 📋 **Create Follow-up Task** - High-priority task for sales resource

**When Sales Head Rejects:**
1. ✅ **Complete Approval Task** - Mark approval tasks as completed
2. 📧 **Notify Sales Resource** - Send rejection notification with reason
3. 📋 **Create Revision Task** - Task for sales resource to revise quotation

### **Stage 2: Post-Approval Follow-up**

**Sales Resource Responsibilities:**
- 📞 **Call client within 24 hours** to discuss the quotation
- ❓ **Answer client questions** and provide clarifications
- 💰 **Negotiate pricing** if client requests changes
- 📝 **Update quotation amount** if needed
- 🎯 **Guide booking process** if client agrees

**Possible Outcomes:**
1. **Client Agrees** → Guide to advance payment
2. **Client Wants Changes** → Update quotation and resubmit for approval
3. **Client Declines** → Mark task as completed with reason

### **Stage 3: Price Negotiation & Revision**

**When Client Negotiates:**
1. Sales resource updates quotation amount
2. System calculates discount percentage
3. Quotation status reset to "pending_approval"
4. New approval task created for Sales Head
5. Revision history tracked

**Revision Process:**
- Original amount vs revised amount comparison
- Discount/increase percentage calculation
- Negotiation notes and client feedback capture
- Automatic resubmission to approval workflow

## 🛠️ **Technical Implementation**

### **API Endpoints**

#### **1. Quotation Approval**
```
POST /api/quotation-approval
```
**Payload:**
```json
{
  "quotationId": 123,
  "action": "approve|reject",
  "comments": "Optional approval/rejection comments"
}
```

**Approval Actions:**
- Complete all approval tasks
- Send WhatsApp notification to client
- Create follow-up task for sales resource
- Initialize business lifecycle tracking

**Rejection Actions:**
- Complete all approval tasks
- Send rejection notification to sales resource
- Create revision task
- Trigger rejection workflow

#### **2. Quotation Revision**
```
POST /api/quotation-revision
```
**Payload:**
```json
{
  "quotationId": 123,
  "newAmount": 200000,
  "revisionReason": "Client requested 10% discount",
  "clientFeedback": "Budget constraints",
  "negotiationNotes": "Agreed to reduce scope slightly"
}
```

**Revision Actions:**
- Update quotation amount
- Calculate discount percentage
- Reset status to pending approval
- Create new approval record
- Complete current revision task
- Create new approval task for Sales Head
- Track revision history

### **Database Schema Updates**

#### **Quotations Table Enhancements**
```sql
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_feedback TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS negotiation_history JSONB;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;
```

#### **Task Types**
- `quotation_approval` - Sales Head approval tasks
- `client_followup` - Post-approval follow-up tasks
- `quotation_revision` - Revision tasks for sales resources

### **Notification System**

#### **Sales Resource Notifications**
- **Approval**: "Quotation approved! Follow up with client within 24 hours"
- **Rejection**: "Quotation rejected - revision required"
- **Task Assignment**: High-priority follow-up task notifications

#### **Sales Head Notifications**
- **Revision Approval**: "Revised quotation needs approval"
- **Team Task Updates**: Notifications about tasks assigned to team members

## 📊 **Business Intelligence**

### **Tracking Metrics**
- Approval to follow-up time
- Client response rates
- Negotiation success rates
- Discount percentages
- Revision frequency
- Conversion rates

### **Lifecycle Stages**
1. `quotation_sent` - Initial quotation created
2. `follow_up_active` - Post-approval follow-up phase
3. `negotiation_phase` - Price negotiation in progress
4. `payment_pending` - Client agreed, awaiting payment
5. `confirmed` - Deal closed successfully

## 🎯 **Key Features**

### **1. Automatic Task Completion**
- All approval tasks marked as completed when decision is made
- Prevents duplicate approvals and confusion
- Clear audit trail of decisions

### **2. Intelligent Task Assignment**
- Original sales resource gets follow-up tasks
- Sales Head gets all approval tasks
- Department-based assignment fallbacks

### **3. Comprehensive Follow-up Tasks**
```
📞 Follow up with [Client] - Quote Approved

The quotation [Number] for ₹[Amount] has been approved and sent to the client via WhatsApp.

Your Action Required:
1. Call the client within 24 hours to discuss the quotation
2. Answer any questions they may have
3. Negotiate pricing if needed
4. Update the quotation amount if client requests changes
5. Guide them through the booking process

Client Details:
- Name: [Client Name]
- Phone: [Phone Number]
- Amount: ₹[Amount]
- Package: [Package Type]

Next Steps:
- If client agrees: Guide them to make advance payment
- If client wants changes: Update quotation and resubmit for approval
- If client declines: Mark task as completed with reason
```

### **4. Price Negotiation Tracking**
- Complete negotiation history
- Discount percentage calculations
- Client feedback capture
- Revision count tracking

### **5. WhatsApp Integration**
- Automatic quotation delivery upon approval
- Template-based messaging
- Delivery confirmation tracking

## 🔧 **Configuration**

### **Business Rules**
- Maximum discount allowed: 10% (configurable)
- Follow-up task due time: 24 hours
- Approval task due time: 24 hours
- Maximum revisions allowed: 3 (configurable)

### **Permissions**
- **Sales Head**: Approve/reject quotations, view all tasks
- **Sales Resource**: Create/revise quotations, follow up with clients
- **Admin**: Full access to all workflow stages

## 📈 **Success Metrics**

### **Efficiency Metrics**
- Average approval time: < 4 hours
- Follow-up response time: < 24 hours
- Client response rate: > 70%
- Conversion rate: > 40%

### **Quality Metrics**
- Revision rate: < 30%
- Client satisfaction: > 4.5/5
- Deal closure time: < 7 days
- Payment collection: > 90%

## 🚀 **Future Enhancements**

1. **AI-Powered Pricing Suggestions**
   - Market analysis integration
   - Competitor pricing data
   - Dynamic pricing recommendations

2. **Advanced Client Communication**
   - Multi-channel communication (Email, SMS, WhatsApp)
   - Automated follow-up sequences
   - Client portal integration

3. **Enhanced Analytics**
   - Predictive conversion scoring
   - Sales performance dashboards
   - Revenue forecasting

4. **Integration Capabilities**
   - CRM system integration
   - Payment gateway integration
   - Calendar scheduling integration

---

## 📞 **Support**

For technical support or workflow questions, contact the development team or refer to the API documentation.

**Last Updated:** January 2025
**Version:** 1.0 