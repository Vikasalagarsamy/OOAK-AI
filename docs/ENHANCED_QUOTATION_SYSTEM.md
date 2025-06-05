# Enhanced Quotation System Documentation

## 🎯 **Overview**

The Enhanced Quotation System is a comprehensive, package-based solution for event service quotations with dynamic pricing, workflow deliverables, and modular architecture. This system transforms static service listings into dynamic, package-driven quotations with locked pricing and comprehensive post-production workflow tracking.

---

## 🏗️ **System Architecture**

### **1. Package-Based Services**
- **Three Tier System**: Basic, Premium, Elite packages
- **Dynamic Pricing**: Each service has package-specific pricing
- **Package Inclusion**: Services can be included/excluded from packages
- **Price Locking**: Prices are locked when quotes are generated

### **2. Deliverables Workflow System**
- **Workflow Tracking**: Complete post-production process management
- **Stakeholder Management**: Customer, Employee, QC, Vendor involvement
- **Timeline Management**: TAT (Turnaround Time) with different units
- **Package-Specific Deliverables**: Different deliverables per package tier

### **3. Quote Snapshot System**
- **Price Locking**: Historical pricing preservation
- **Component Tracking**: Services, deliverables, add-ons tracked separately
- **Audit Trail**: Complete quote history and changes

---

## 📊 **Database Schema**

### **Enhanced Services Table**
```sql
ALTER TABLE services ADD COLUMN basic_price DECIMAL(10,2);
ALTER TABLE services ADD COLUMN premium_price DECIMAL(10,2);
ALTER TABLE services ADD COLUMN elite_price DECIMAL(10,2);
ALTER TABLE services ADD COLUMN package_included JSONB DEFAULT '{"basic": false, "premium": false, "elite": false}';
```

**Example Package Pricing:**
| Service | Basic | Premium | Elite | Packages |
|---------|-------|---------|-------|----------|
| Candid Photography | ₹15,000 | ₹25,000 | ₹35,000 | All |
| Candid Videography | ₹18,000 | ₹28,000 | ₹40,000 | All |
| Drone Coverage | - | ₹12,000 | ₹18,000 | Premium+ |

### **Deliverables System**
```sql
CREATE TABLE deliverables (
    id SERIAL PRIMARY KEY,
    deliverable_cat VARCHAR(50) NOT NULL, -- Main, Optional
    deliverable_type VARCHAR(50) NOT NULL, -- Photo, Video
    deliverable_name VARCHAR(255) NOT NULL,
    process_name VARCHAR(255) NOT NULL,
    
    -- Stakeholder Involvement
    has_customer BOOLEAN DEFAULT false,
    has_employee BOOLEAN DEFAULT false,
    has_qc BOOLEAN DEFAULT false,
    has_vendor BOOLEAN DEFAULT false,
    
    -- Timing Configuration
    tat INTEGER, -- Turnaround time
    timing_type VARCHAR(20) DEFAULT 'days', -- days, hr, min
    sort_order INTEGER DEFAULT 0,
    
    -- Workflow Features
    skippable BOOLEAN DEFAULT false,
    has_download_option BOOLEAN DEFAULT false,
    has_task_process BOOLEAN DEFAULT true,
    
    -- Templates
    on_start_template VARCHAR(255),
    on_complete_template VARCHAR(255),
    on_correction_template VARCHAR(255),
    
    -- Package Inclusion
    package_included JSONB DEFAULT '{"basic": false, "premium": false, "elite": false}',
    
    -- Process Flow
    stream VARCHAR(10), -- UP, DOWN
    stage VARCHAR(10) -- e.g., "0/6", "1/9"
);
```

### **Quote Snapshot Tables**
```sql
-- Lock service prices at quote time
CREATE TABLE quote_services_snapshot (
    quote_id INTEGER,
    service_id INTEGER,
    service_name VARCHAR(255),
    package_type VARCHAR(20), -- basic, premium, elite
    locked_price DECIMAL(10,2),
    quantity INTEGER DEFAULT 1,
    subtotal DECIMAL(10,2)
);

-- Lock deliverables at quote time
CREATE TABLE quote_deliverables_snapshot (
    quote_id INTEGER,
    deliverable_id INTEGER,
    deliverable_name VARCHAR(255),
    process_name VARCHAR(255),
    package_type VARCHAR(20),
    tat INTEGER,
    timing_type VARCHAR(20),
    sort_order INTEGER
);
```

---

## 🎛️ **Package Management**

### **Package Definitions**
```typescript
interface ServicePackage {
  package_name: 'basic' | 'premium' | 'elite'
  package_display_name: string
  description: string
  is_active: boolean
  sort_order: number
}
```

### **Package Examples**

#### **Basic Package (₹45,000)**
- ✅ Candid Photography
- ✅ Conventional Photography  
- ✅ Basic Video Editing
- ✅ Standard Album (20 pages)
- ⏱️ 7-day delivery

#### **Premium Package (₹75,000)**
- ✅ All Basic features
- ✅ Candid Videography
- ✅ Enhanced Editing
- ✅ Premium Album (30 pages)
- ✅ Same Day Highlights
- ⏱️ 5-day delivery

#### **Elite Package (₹1,25,000)**
- ✅ All Premium features
- ✅ Drone Coverage
- ✅ Live Streaming
- ✅ Elite Album (50 pages)
- ✅ Instant Social Media
- ✅ 4K Video Production
- ⏱️ 3-day delivery

---

## 🔄 **Deliverables Workflow**

### **Workflow Process Types**

#### **Main Deliverables** (Core package items)
- **Album Creation Process**
  1. Sorting and Color Correction (Employee + QC)
  2. Client Selection (Customer) 
  3. Album Designing (Employee + QC)
  4. Client Confirmation (Customer)
  5. Revision (Employee + QC)
  6. Printer Confirmation (Customer)

#### **Optional Deliverables** (Package-specific)
- **Premium+ Only**: OG Pictures, Enhanced Editing
- **Elite Only**: Same-day highlights, Social media packages

### **Stakeholder Roles**
- 👤 **Customer**: Selection, Approval, Confirmation
- 👥 **Employee**: Execution, Editing, Processing
- ✅ **QC**: Quality Control, Review, Validation
- 🏢 **Vendor**: External services, Printing, Equipment

### **Timeline Management**
```typescript
interface ProcessTiming {
  tat: number // Time value
  timing_type: 'days' | 'hr' | 'min'
  buffer?: number // Additional buffer time
  skippable: boolean // Can be skipped if needed
}
```

---

## 💼 **Quote Generation Process**

### **Step-by-Step Workflow**

1. **Package Selection**
   ```typescript
   // Admin selects package level
   const selectedPackage = 'premium'
   
   // Services auto-populate based on package
   const includedServices = await getPackageServices(selectedPackage)
   const includedDeliverables = await getPackageDeliverables(selectedPackage)
   ```

2. **Price Calculation**
   ```typescript
   // Calculate package total
   const packageTotal = includedServices.reduce((total, service) => 
     total + service.package_price, 0
   )
   ```

3. **Customization**
   - ✅ Add additional services
   - ✅ Remove optional services  
   - ✅ Apply discounts/promotions
   - ✅ Add custom line items

4. **Quote Lock & Snapshot**
   ```typescript
   // Lock prices and deliverables
   await createQuoteSnapshot(quoteId, {
     services: includedServices,
     deliverables: includedDeliverables,
     package_type: selectedPackage,
     locked_at: new Date()
   })
   ```

---

## 🔧 **API Endpoints**

### **Services Management**
```typescript
// Get services with package pricing
GET /api/services/packages
Response: ServiceWithPackages[]

// Update package pricing
PUT /api/services/:id/packages
Body: { basic_price, premium_price, elite_price }

// Get package services
GET /api/packages/:packageName/services
Response: PackageServiceView[]
```

### **Deliverables Management**
```typescript
// Get deliverables with filters
GET /api/deliverables?category=Main&type=Photo&package=premium
Response: Deliverable[]

// Create deliverable
POST /api/deliverables
Body: DeliverableFormData

// Get package deliverables
GET /api/packages/:packageName/deliverables
Response: PackageDeliverableView[]
```

### **Quote Generation**
```typescript
// Generate package quote
POST /api/quotes/generate
Body: {
  package_type: 'premium',
  custom_services?: number[],
  discounts?: DiscountData[],
  additional_items?: CustomItem[]
}

// Get quote with locked prices
GET /api/quotes/:id/snapshot
Response: QuoteSnapshot
```

---

## 🎨 **User Interface Features**

### **Services Management Page**
- 📊 **Package Pricing Grid**: Visual pricing matrix
- 🎯 **Package Inclusion Toggle**: Easy enable/disable per package
- 💰 **Bulk Price Updates**: Update multiple services at once
- 📈 **Price History**: Track pricing changes over time

### **Deliverables Management Page**
- 🔄 **Workflow Visualization**: Process flow diagrams
- 👥 **Stakeholder Assignment**: Visual stakeholder mapping
- ⏱️ **Timeline Management**: TAT configuration and tracking
- 📦 **Package Association**: Easy package inclusion management

### **Quote Generation Interface**
- 🎛️ **Package Selector**: Visual package comparison
- ✅ **Service Checklist**: Auto-populated with manual overrides
- 💯 **Real-time Pricing**: Dynamic total calculation
- 📄 **Quote Preview**: Professional quote generation

---

## 🚀 **Future Extensions**

### **Phase 2 Enhancements**
- **Add-on Services**: Drone, extra photographer, etc.
- **Promotional Codes**: Discount management system
- **Seasonal Pricing**: Dynamic pricing based on dates
- **Client Packages**: Custom packages for repeat clients

### **Phase 3 Features**
- **Workflow Automation**: Auto-advance processes
- **Client Portal**: Self-service selection and approval
- **Mobile App**: Field team workflow management
- **Analytics Dashboard**: Performance and profitability tracking

### **Integration Possibilities**
```typescript
interface QuoteComponent {
  component_type: 'service' | 'deliverable' | 'addon' | 'discount' | 'custom'
  component_name: string
  unit_price?: number
  quantity: number
  subtotal: number
  metadata?: Record<string, any> // Flexible for future use
}
```

---

## 📋 **Implementation Checklist**

### **Database Setup**
- [x] Run enhanced quotation system SQL migration
- [x] Update services table with package pricing
- [x] Create deliverables table with workflow fields
- [x] Set up quote snapshot tables
- [x] Create package definition table

### **Backend Implementation**
- [x] Enhanced services actions with package support
- [x] Deliverables CRUD operations
- [x] Package management functions
- [x] Quote snapshot functionality
- [x] Bulk import/export features

### **Frontend Development**
- [x] Enhanced services management page
- [x] Deliverables workflow interface
- [x] Package pricing matrix
- [ ] Quote generation wizard
- [ ] Package comparison interface

### **Testing & Validation**
- [ ] Package pricing calculations
- [ ] Workflow process testing
- [ ] Quote generation validation
- [ ] Price locking verification
- [ ] Deliverables timeline testing

---

## 🔐 **Security & Permissions**

### **Access Control**
- **Admin**: Full access to all features
- **Manager**: Package management, pricing updates
- **Employee**: Workflow execution, process updates
- **Client**: Quote viewing, selection confirmation

### **Audit Logging**
- Price change tracking
- Quote modification history
- Workflow progress logging
- Package update auditing

---

## 📈 **Performance Optimization**

### **Database Optimization**
- Indexes on package_included JSONB fields
- Materialized views for package summaries
- Partitioning for quote history
- Caching for frequently accessed packages

### **API Performance**
- Package data caching
- Bulk operations for quote generation
- Async processing for complex calculations
- Rate limiting for quote generation

---

## 🧪 **Sample Data**

### **Services with Package Pricing**
```sql
-- Sample service with package pricing
INSERT INTO services (servicename, category, basic_price, premium_price, elite_price, package_included) VALUES
('CANDID PHOTOGRAPHY', 'Photography', 15000, 25000, 35000, '{"basic": true, "premium": true, "elite": true}'),
('DRONE COVERAGE', 'Technology', NULL, 12000, 18000, '{"basic": false, "premium": true, "elite": true}'),
('LIVE STREAMING', 'Technology', NULL, NULL, 15000, '{"basic": false, "premium": false, "elite": true}');
```

### **Deliverables with Workflow**
```sql
-- Sample deliverable with workflow
INSERT INTO deliverables (deliverable_name, process_name, deliverable_cat, deliverable_type, has_customer, has_employee, tat, timing_type, package_included) VALUES
('Conventional Album', 'CLIENT SELECTION', 'Main', 'Photo', true, false, 1, 'days', '{"basic": true, "premium": true, "elite": true}'),
('Same Day Highlights', 'RAPID EDITING', 'Optional', 'Video', false, true, 2, 'hr', '{"basic": false, "premium": true, "elite": true}');
```

This enhanced quotation system provides a robust, scalable foundation for package-based event service quotations with comprehensive workflow management and future extensibility. 