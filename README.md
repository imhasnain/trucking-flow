# 🚛 TruckFlow - User & Feature Guide

Welcome to **TruckFlow**, an all-in-one management web application built for a small trucking company (1-2 power units, 2 drivers). 

This guide explains **every feature in simple, clear English**, showing both the **Owner** and **Assistant** how to use the system day to day.

---

## ⚡ Quick Start: How to Open the App

1. Open your terminal / PowerShell.
2. Go to the project folder and start the server:
   ```bash
   cd "C:\Users\laptops galaxy\Desktop\FULL SYSTEM\trucking-app"
   npm run dev
   ```
3. Open your internet browser and visit: **[http://localhost:3000](http://localhost:3000)**
4. Log in with one of the pre-configured accounts:

| Role | Name | Email | Password | What They Can Do |
|------|------|-------|----------|------------------|
| **Owner** | Sam | `sam@truckflow.com` | `owner123` | **Full Access**: Can add/edit everything, approve driver settlements, mark payments, and delete records. |
| **Assistant** | DH | `dh@truckflow.com` | `assistant123` | **Operational Access**: Can add loads, expenses, notes, and upload files. **CANNOT** approve payments or mark anything paid. |

---

## 🧭 Feature-by-Feature Guide

### 1. 📊 Dashboard (`/dashboard`)
The command center of your company. It gives you a birds-eye view of your business health in real-time.
* **Top Cards:**
  * **Total Revenue (This Month):** Money earned from delivered, invoiced, and paid loads.
  * **Est. Net Profit:** Revenue minus expenses, driver pay, and dispatch commissions.
  * **Unpaid Driver Pay:** Total money currently owed to drivers.
  * **Outstanding Invoices:** Number of broker invoices waiting for payment.
* **Secondary Cards:** Shows unpaid dispatcher commissions, overdue invoices count, upcoming compliance deadlines (next 30 days), and missing documents.
* **Alerts Box:** Colored warning boxes flag expiring truck insurance, overdue invoices, and missing paperwork.
* **Quick Actions:** One-click shortcuts to Add a Load, Add an Expense, Upload a Document, or View Reports.
* **Recent Loads Table:** Displays the 5 newest loads with broker name, driver name, gross pay, and status. Click any load to view its details.

---

### 2. 🚚 Load Register (`/loads`)
The complete registry of all freight booked by your company.
* **Search & Filter:** Search by load number, broker name, or city. Filter by status (`BOOKED`, `IN_TRANSIT`, `DELIVERED`, `INVOICED`, `PAID`) or by driver.
* **Summary Table:** Shows pickup location/date, delivery location/date, assigned driver, status badge, gross rate, and calculated rate per mile.
* **Open Load Details:** Click anywhere on a row or click **View** to open that load's dedicated workspace.

---

### 3. ➕ Add New Load (`/loads/new`)
Quickly record a newly booked freight load.
1. Click **Add Load** from the Dashboard or Loads page.
2. Fill in the **Basic Details**: Load #, Broker name, phone, email, and contact person.
3. Fill in **Route Details**: Pickup facility/city/state/date and Delivery facility/city/state/date.
4. Select the **Assigned Driver** and **Assigned Vehicle** from the dropdowns.
5. Enter the **Gross Rate ($)** and **Loaded Miles**. (The system automatically calculates the rate per mile).
6. Enter optional accessorials, fuel costs, tolls, or lumper fees.
7. Click **Save Load**.
> **Automatic Automation:** When you save a load with an assigned driver, TruckFlow automatically creates the **Driver Settlement** (at 30%), the **Dispatch Commission** for Michael (at 10%), and sets up required **Document Folders** (Rate Con, BOL, POD).

---

### 4. 📋 Load Details Workspace (`/loads/[id]`)
Manage a specific load from pickup to final payment.
* **Status Progression Buttons:** Easily advance the load lifecycle:
  * Click **Mark In Transit** when the truck arrives at pickup.
  * Click **Mark Delivered** when freight is dropped off.
  * Click **Mark Invoiced** after sending the invoice to the broker/factoring company.
  * Click **Mark Paid** (Owner only) once broker funds are received.
* **Route & Schedule:** Visual cards for pickup and delivery addresses and timestamps.
* **Financial Summary:** Clear breakdown showing Gross Rate, Driver Pay deduction, Dispatch Commission deduction, fuel/tolls, and **Estimated Company Net**.
* **Attached Documents:** View all files tied to this load (BOL, POD, Rate Confirmation).
* **Direct File Upload:** Select document type, choose a file from your computer, and attach it directly to this load.
* **Delete Load:** Owner can safely delete a cancelled load (auto-cleans attached records).

---

### 5. 💰 Driver Settlements (`/settlements`)
Track driver earnings without giving remote staff access to bank accounts.
* **How Pay is Calculated:** Defaults to **30% of gross rate** (customizable per driver).
* **Summary Cards:** Total Owed, Pending Approval, and Paid This Month.
* **Filter:** View all drivers or filter by an individual driver.
* **Approval Workflow (Strict Security):**
  1. Loads are completed and appear as `PENDING`.
  2. The **Owner** reviews the load numbers and deductions, then clicks **Approve**.
  3. Once the Owner transfers funds outside the app, the Owner clicks **Mark Paid**.
  4. Assistants can see the numbers but have no permission to approve or mark paid.

---

### 6. 🎧 Dispatch Commission (`/commissions`)
Manage commissions owed to your dispatcher (Michael).
* **Automatic 10%:** Every load auto-generates a 10% commission record.
* **Table View:** Shows Load #, Dispatcher Name, Gross Rate, Commission Rate (10%), Amount Due, and Status.
* **Owner Action:** The Owner can approve commissions and mark them as paid after settling up with the dispatcher.

---

### 7. 📥 Accounts Receivable (`/receivables`)
Make sure brokers pay you on time and prevent unpaid freight bills from slipping away.
* **Summary Row:** Total Outstanding, Overdue Amount, Paid This Month.
* **Aging Report:** Automatically categorizes all unpaid invoices into buckets:
  * `Current` (not due yet)
  * `1-30 Days Overdue`
  * `31-60 Days Overdue`
  * `61-90 Days Overdue`
  * `90+ Days Overdue` (Critical)
* **Highlighting:** Overdue rows are highlighted in red with an exact day counter.
* **Record Payment:** When a check or ACH arrives from a broker, click **Mark Paid**, confirm the amount received, and the invoice is closed.

---

### 8. 🛡️ Compliance Calendar (`/compliance`)
Prevent costly DOT fines, expired medical cards, and grounded trucks.
* **Summary Badges:** Red for Overdue, Yellow for Due in 7 Days, Blue for Due in 30 Days.
* **Two View Modes:**
  * **Table View:** Full list of all compliance items with status badges and due dates.
  * **Calendar View:** Neatly groups deadlines by month so you can plan inspections and filings in advance.
* **Tracked Items:** MCS-150 biennial updates, annual vehicle inspections, DOT medical cards, CDL renewals, IFTA quarterly fuel taxes, IRP registration, and UCR filings.
* **Add Item Modal:** Click **Add Item**, choose the compliance type, set the due date, and save.
* **Mark Complete:** Click **Mark Complete** when a filing or inspection is finished.

---

### 9. 📁 Document Management (`/documents`)
A central digital filing cabinet for all company paperwork.
* **Summary Stats:** Total Documents, Missing, Uploaded, and Verified.
* **Missing Documents Watchdog:** When a load is booked or delivered, TruckFlow checks for Rate Con, BOL, and POD. If missing, it flags them in red.
* **Upload Document Modal:** Click **Upload Document**, pick a type (BOL, POD, Insurance, Registration), select an optional load, and choose your file (PDF, PNG, JPG).
* **View & Verify:** Click the **Eye icon** to open/download the file. Staff can click **Verify** to confirm the paperwork is signed and complete.

---

### 10. 👤 Drivers (`/drivers`)
Manage your drivers and monitor license expirations.
* **Driver Cards:** Each driver card shows their phone number, email, CDL number, and pay rate (e.g. 30%).
* **Color-Coded Expiry Badges:**
  * 🟢 Green: Expiration date is more than 90 days away.
  * 🟡 Yellow: Expires within 90 days.
  * 🔴 Red: Expired or expires within 30 days.
* **Add Driver:** Click **Add Driver** to enter a new driver, their CDL number, expiration dates, and custom pay percentage.
* **Edit Driver:** Update contact info, change status to `INACTIVE`, or adjust pay rates anytime.

---

### 11. 🚛 Vehicles & Equipment (`/vehicles`)
Track power units (trucks) and trailers.
* **Vehicle Cards:** Shows Unit #, Year, Make, Model, VIN, License Plate, and Odometer Mileage.
* **Expiration Badges:** Color-coded badges for **Insurance Policy Expiration** and **Annual Registration Expiration**.
* **Add Vehicle:** Click **Add Vehicle** to register a new power unit with plate, VIN, and policy dates.
* **Edit Unit:** Update mileage readings or set status to `MAINTENANCE` or `INACTIVE`.

---

### 12. 💳 Expenses (`/expenses` & `/expenses/new`)
Track every dollar leaving the business to know your true net profit.
* **Categories:** Fuel, Maintenance, Insurance, Overhead, Tolls, and Other.
* **Summary Row:** See your current month's fuel spend, maintenance bills, and insurance costs at a glance.
* **Add Expense (`/expenses/new`):** Fill out description, amount ($), date, vendor (e.g. Pilot, Love's, Speedco), category, and save.

---

### 13. 📝 Research & Operations Notes (`/notes`)
A built-in digital notepad for company operations, industry research, and freight strategies.
* **Category Filters:** Filter by `FMCSA / DOT`, `Software & Tools`, `Box Truck Specs`, `Freight Sources`, `Website & IT`, or `Other`.
* **Note Cards:** Shows title, priority, status (Open / In Progress / Resolved), notes preview, and clickable external links.
* **Add / Edit Note:** Click **Add Note** to document new regulations, broker phone numbers, or software links.

---

### 14. 📈 Reports & Analytics (`/reports`)
Understand your business numbers and export data for your accountant.
* **Date Range Selector:** Switch between **This Month**, **Last Month**, **This Week**, or **Last Week**.
* **Key Metrics:** Total Gross Revenue, Total Expenses (including fuel, maintenance, driver pay, and commissions), and **Net Profit**.
* **Revenue by Driver:** Shows which driver produced what revenue and load count.
* **Export to CSV:** Click **Export** to instantly download a comprehensive CSV spreadsheet with all load routes, dates, broker rates, driver shares, and fuel costs.
* **Print Button:** Formats the page cleanly for printing or saving to PDF.

---

### 15. ⚙️ Settings & System Audit Log (`/settings`)
* **Company Profile:** Displays company legal entity name, USDOT number, MC number, and fleet size.
* **Users & Permissions:** Explains active accounts and confirms role restrictions.
* **System Audit Log:** An immutable history log tracking who created loads, approved settlements, uploaded files, or made edits—with timestamps and user names.

---

## 🔒 Security & Role Summary

TruckFlow is designed so an owner can work smoothly with a remote assistant without worrying about security:

| Feature | Owner (Sam) | Remote Assistant (DH) |
|---------|:-----------:|:---------------------:|
| Book & Create Loads | ✅ | ✅ |
| Upload BOLs & Documents | ✅ | ✅ |
| Add Expenses & Notes | ✅ | ✅ |
| View Financial Numbers | ✅ | ✅ |
| **Approve Driver Settlements** | ✅ | ❌ *(Forbidden)* |
| **Mark Settlements as Paid** | ✅ | ❌ *(Forbidden)* |
| **Approve Commissions** | ✅ | ❌ *(Forbidden)* |
| **Delete Loads / Vehicles** | ✅ | ❌ *(Forbidden)* |
| **Bank Account Access** | ❌ *(No bank connection)* | ❌ *(No bank connection)* |

---

## 💡 5-Minute Testing Checklist for First-Time Users

1. **Log in as Owner:** Use `sam@truckflow.com` / `owner123`.
2. **Review the Dashboard:** Notice the live revenue (\$8,500), expenses (\$2,955), and alerts.
3. **Open a Load:** Click on `LD-2024-001` in the Recent Loads table. Notice the route, financial breakdown, and document section. Click **Mark Invoiced**.
4. **Create a New Load:** Go to `/loads/new`. Enter load number `LD-999`, broker `CH Robinson`, pickup `Dallas, TX`, delivery `Atlanta, GA`, gross rate `3200`, assign driver `Khadir`, and click **Save Load**.
5. **Check Settlements:** Go to `/settlements`. Notice how Khadir's 30% pay (\$960) was automatically calculated. Click **Approve**.
6. **Check Commissions:** Go to `/commissions`. Notice Michael's 10% commission (\$320) was automatically generated.
7. **Test Receivables:** Go to `/receivables`. Review the aging report, find an unpaid invoice, and click **Mark Paid**.
8. **Export Reports:** Go to `/reports` and click **Export** to get your CSV spreadsheet.
9. **Log in as Assistant:** Log out and sign in with `dh@truckflow.com` / `assistant123`. Notice that the Assistant can add records, but financial approval buttons are disabled or restricted.
