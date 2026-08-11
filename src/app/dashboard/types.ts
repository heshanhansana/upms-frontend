
/** The 9 roles in the procurement system */
export type Role =
  | "ADM"   // System Administrator
  | "HOD"   // Head of Department
  | "BUR"   // Bursar (Main)
  | "FBUR"  // Faculty Bursar
  | "SDC"   // Supplies Division Clerk
  | "TEC"   // TEC Member
  | "TB"    // Tender Board Member
  | "STK"   // Storekeeper
  | "SUP"   // Supplier / Bidder
  | "FIN";  // Finance Division

/** Human-readable role metadata */
export const ROLE_META: Record<Role, { label: string; description: string }> = {
  ADM: { label: "System Administrator", description: "Approve user access requests and manage system access" },
  HOD: { label: "Head of Department",    description: "Create requisitions, approve <500k, submit quality reports" },
  BUR: { label: "Bursar (Main)",         description: "Verify fund availability centrally across all faculties" },
  FBUR: { label: "Faculty Bursar",       description: "Verify fund availability for requisitions from their faculty" },
  SDC: { label: "Supplies Division Clerk", description: "Select method, manage suppliers, coordinate bid opening" },
  TEC: { label: "TEC Member",            description: "Preliminary, technical & financial evaluation (>500k)" },
  TB:  { label: "Tender Board Member",   description: "Approve BES reports and authorise purchase orders" },
  STK: { label: "Storekeeper",           description: "Generate GRN upon goods receipt" },
  SUP: { label: "Supplier / Bidder",     description: "Submit sealed bids with bid bond & VAT declaration" },
  FIN: { label: "Finance Division",      description: "Process payments after quality report approval" },
};

/** A single navigation tab rendered in the top bar */
export interface NavTab {
  key: string;
  label: string;
}

/** Nav tabs available per role */
export const ROLE_NAV_TABS: Record<Role, NavTab[]> = {
  ADM: [
    { key: "dashboard", label: "Pending Approvals" },
    { key: "all-users", label: "All Users" },
  ],
  HOD: [
    { key: "dashboard",        label: "Dashboard" },
    { key: "new-requisition",  label: "New Requisition" },
    { key: "stock-inquiry",    label: "Stock Inquiry" },
    { key: "procurements",     label: "All Procurements" },
    { key: "rejected",         label: "Rejected" },
  ],
  BUR: [
    { key: "dashboard",        label: "Dashboard" },
    { key: "fund-verification", label: "Fund Verification" },
    { key: "procurements",     label: "All Procurements" },
  ],
  FBUR: [
    { key: "dashboard",        label: "Dashboard" },
    { key: "fund-verification", label: "Fund Verification" },
    { key: "procurements",     label: "All Procurements" },
  ],
  SDC: [
    { key: "dashboard",       label: "Dashboard" },
    { key: "method",          label: "Method Selection" },
    { key: "suppliers",       label: "Suppliers" },
    { key: "bidding",         label: "Bidding" },
    { key: "procurements",    label: "All Procurements" },
  ],
  TEC: [
    { key: "dashboard",    label: "Dashboard" },
    { key: "evaluations",  label: "Evaluations" },
    { key: "procurements", label: "All Procurements" },
  ],
  TB: [
    { key: "dashboard",    label: "Dashboard" },
    { key: "approvals",    label: "Approvals" },
    { key: "procurements", label: "All Procurements" },
  ],
  STK: [
    { key: "dashboard",    label: "Dashboard" },
    { key: "grn",          label: "GRN" },
    { key: "procurements", label: "All Procurements" },
  ],
  SUP: [
    { key: "dashboard", label: "Dashboard" },
    { key: "my-bids",   label: "My Bids" },
    { key: "submit-bid", label: "Submit Bid" },
  ],
  FIN: [
    { key: "dashboard",    label: "Dashboard" },
    { key: "budget-allocation", label: "Manage Faculty Budgets" },
    { key: "payments",     label: "Payments" },
    { key: "procurements", label: "All Procurements" },
  ],
};

/** Procurement status values */
export type ProcurementStatus =
  | "Pending Fund Verification"
  | "Funds Verified"
  | "Bidding Prep"
  | "Bidding Open"
  | "Technical Evaluation"
  | "Authority Approval"
  | "Purchase Order Issued"
  | "Awaiting Delivery"
  | "Quality Report Required"
  | "Payment Pending"
  | "Completed"
  | "Rejected";

/** Procurement method */
export type ProcurementMethod = "Shopping" | "NCB" | "ICB" | "—";

/** A submitted bid entry from a supplier */
export interface BidEntry {
  bidderName: string;
  bidderContact?: string;
  amount: number;         // LKR
  submittedAt: string;    // ISO date string
  technicalScore?: number; // 0–100, filled after evaluation
  financialScore?: number; // 0–100, filled after evaluation
  isWinner?: boolean;
  notes?: string;
}

/** A single audit-log entry for the activity timeline */
export interface ProcurementActivityLog {
  id: string;
  stepIndex: number;      // 0-based step number (matches WORKFLOW_STEPS)
  actor: string;          // name of the person
  role: Role;
  action: string;         // e.g. "Verified funds — Budget Code: BUDGET-2026-FAS"
  timestamp: string;      // ISO date string
  notes?: string;
}

/** One step in the procurement workflow */
export interface WorkflowStep {
  index: number;
  label: string;
  shortLabel: string;
  role: Role;
  roleLabel: string;
  description: string;    // explanation shown in the stage card
  waitingMessage: string; // "Waiting for [X] to [do Y]"
  mapToStatuses: ProcurementStatus[]; // which status values map to this step being ACTIVE
  completedByStatuses: ProcurementStatus[]; // status values that mean this step is DONE
}

/** The 10-step procurement workflow */
export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    index: 0,
    label: "Requisition Created",
    shortLabel: "Requisition",
    role: "HOD",
    roleLabel: "Head of Department",
    description: "The Head of Department has verified stock availability with the Supply Division and raised an official Purchase Requisition specifying item details, quantities, and whether goods are consumables or capital items.",
    waitingMessage: "Waiting for HOD to submit purchase requisition",
    mapToStatuses: ["Pending Fund Verification"],
    completedByStatuses: ["Funds Verified", "Bidding Prep", "Bidding Open", "Technical Evaluation", "Authority Approval", "Purchase Order Issued", "Awaiting Delivery", "Quality Report Required", "Payment Pending", "Completed"],
  },
  {
    index: 1,
    label: "Fund Verification",
    shortLabel: "Fund Check",
    role: "BUR",
    roleLabel: "Bursar",
    description: "The Faculty Bursar or Main Bursar verifies that sufficient funds are allocated within the procurement plan for this requisition. A budget code is assigned and fund availability is confirmed before the process continues.",
    waitingMessage: "Waiting for Bursar to verify and confirm budget allocation",
    mapToStatuses: ["Pending Fund Verification"],
    completedByStatuses: ["Funds Verified", "Bidding Prep", "Bidding Open", "Technical Evaluation", "Authority Approval", "Purchase Order Issued", "Awaiting Delivery", "Quality Report Required", "Payment Pending", "Completed"],
  },
  {
    index: 2,
    label: "Bidding Document Prep",
    shortLabel: "Doc Prep",
    role: "SDC",
    roleLabel: "Supplies Division Clerk",
    description: "The Supplies Division Clerk prepares the official bidding documentation. These documents must be formally reviewed and approved by the TEC, Procurement Committee, or Vice Chancellor before being shared externally.",
    waitingMessage: "Waiting for SDC to prepare and obtain approval for bidding documents",
    mapToStatuses: ["Funds Verified", "Bidding Prep"],
    completedByStatuses: ["Bidding Open", "Technical Evaluation", "Authority Approval", "Purchase Order Issued", "Awaiting Delivery", "Quality Report Required", "Payment Pending", "Completed"],
  },
  {
    index: 3,
    label: "Bidding Open",
    shortLabel: "Bidding",
    role: "SDC",
    roleLabel: "Supplies Division Clerk",
    description: "The bidding process is officially open. External suppliers are invited to submit their sealed bids and quotations within the specified deadline. The Supplies Division Clerk coordinates this process.",
    waitingMessage: "Waiting for suppliers to submit sealed bids before deadline",
    mapToStatuses: ["Bidding Open"],
    completedByStatuses: ["Technical Evaluation", "Authority Approval", "Purchase Order Issued", "Awaiting Delivery", "Quality Report Required", "Payment Pending", "Completed"],
  },
  {
    index: 4,
    label: "Bid Evaluation",
    shortLabel: "Evaluation",
    role: "TEC",
    roleLabel: "TEC Members",
    description: "The Technical Evaluation Committee conducts a preliminary, technical, and financial evaluation of all received bids. A Bid Evaluation Summary (BES) report is prepared and submitted to the appropriate approving authority.",
    waitingMessage: "Waiting for TEC to complete technical and financial evaluation of bids",
    mapToStatuses: ["Technical Evaluation"],
    completedByStatuses: ["Authority Approval", "Purchase Order Issued", "Awaiting Delivery", "Quality Report Required", "Payment Pending", "Completed"],
  },
  {
    index: 5,
    label: "Authority Approval",
    shortLabel: "Approval",
    role: "TB",
    roleLabel: "Tender Board / Registrar / VC",
    description: "The BES report is forwarded for final sign-off to the appropriate authority based on the procurement value: Registrar (up to LKR 75,000), Vice Chancellor (up to LKR 1 Million), or the Tender Board (above LKR 1 Million).",
    waitingMessage: "Waiting for authority approval of the BES evaluation report",
    mapToStatuses: ["Authority Approval"],
    completedByStatuses: ["Purchase Order Issued", "Awaiting Delivery", "Quality Report Required", "Payment Pending", "Completed"],
  },
  {
    index: 6,
    label: "Purchase Order",
    shortLabel: "PO Issued",
    role: "SDC",
    roleLabel: "Supplies Division Clerk",
    description: "Following authority approval, a formal Purchase Order (PO) is generated and issued to the selected supplier. The supplier is notified with delivery instructions and timeline.",
    waitingMessage: "Waiting for SDC to generate and issue the Purchase Order",
    mapToStatuses: ["Purchase Order Issued"],
    completedByStatuses: ["Awaiting Delivery", "Quality Report Required", "Payment Pending", "Completed"],
  },
  {
    index: 7,
    label: "Goods Receipt",
    shortLabel: "GRN",
    role: "STK",
    roleLabel: "Storekeeper",
    description: "The supplier delivers the goods. The Storekeeper receives, counts, and inspects the items, then issues an official Goods Received Note (GRN) documenting the received quantities and condition.",
    waitingMessage: "Waiting for Storekeeper to receive goods and issue GRN",
    mapToStatuses: ["Awaiting Delivery"],
    completedByStatuses: ["Quality Report Required", "Payment Pending", "Completed"],
  },
  {
    index: 8,
    label: "Quality Report",
    shortLabel: "Quality",
    role: "HOD",
    roleLabel: "Acceptance Committee / HOD",
    description: "The Acceptance Committee conducts a formal quality inspection of the received goods. An official Quality/Good Received Note report is issued confirming that all items meet the required specifications.",
    waitingMessage: "Waiting for HOD / Acceptance Committee to submit quality inspection report",
    mapToStatuses: ["Quality Report Required"],
    completedByStatuses: ["Payment Pending", "Completed"],
  },
  {
    index: 9,
    label: "Payment",
    shortLabel: "Payment",
    role: "FIN",
    roleLabel: "Finance Division",
    description: "The complete payment packet (invoices, GRN records, and the verified quality report) is forwarded to the Finance Division, who processes the final payment to the supplier and closes the procurement.",
    waitingMessage: "Waiting for Finance Division to process final supplier payment",
    mapToStatuses: ["Payment Pending"],
    completedByStatuses: ["Completed"],
  },
];

/** Requisition type (consumable vs capital) */
export type RequisitionType = "Consumables" | "Capital Goods" | "—";

/** Quality inspection item entry */
export interface QualityCheckItem {
  itemName: string;
  quantity: number;
  status: "Approved" | "Rejected" | "Pending";
  notes?: string;
}

/** A single procurement record */
export interface Procurement {
  id: string;           // e.g. "PR-2026-001"
  title: string;
  faculty: string;
  department?: string;
  value: number;        // LKR amount
  method: ProcurementMethod;
  status: ProcurementStatus;
  updatedAt: string;    // ISO date string
  submittedBy?: string;
  description?: string;
  notes?: string;
  rejectionReason?: string;
  supplierName?: string;   // populated after PO issued
  poNumber?: string;       // populated after PO issued
  budgetCode?: string;     // populated after fund verification
  grnNumber?: string;      // populated after GRN issued
  activityLog?: ProcurementActivityLog[];
  bids?: BidEntry[];
  
  // New fields for enhanced features
  requisitionType?: RequisitionType;      // Consumables or Capital Goods
  currentStockBalance?: number;           // HOD stock level
  fundingSource?: string;                 // Operating Budget, Capital Grant, etc.
  openingDate?: string;                   // Backend bidding opening date
  closingDate?: string;                   // Backend bidding closing date
  documentFee?: number;                   // RFQ/document fee
  requiresBidBond?: boolean;              // Whether bid bond is required
  bidBondPercentage?: number;             // Required bid bond percentage
  budgetAllocated?: number;               // Amount allocated in budget
  budgetAvailable?: number;               // Available balance after allocation
  biddingDocuments?: string[];            // Document IDs/names
  documentApprovalStatus?: "Pending" | "Approved" | "Rejected";
  documentApprovedBy?: string;            // Name of approver
  biddingDeadline?: string;               // ISO date string
  biddingMethod?: "Sealed Bid" | "Open Auction" | "Direct Purchase";
  supplierDirectory?: Array<{ name: string; contact: string; registered: boolean }>;
  annualPlanName?: string;                // APP reference
  inventoryItems?: Array<{ name: string; quantity: number; unit: string }>;
  invoiceNumber?: string;                 // Storekeeper invoice ref
  invoiceAmount?: number;                 // Invoice amount
  grnDocuments?: string[];                // GRN document files
  qualityCheckItems?: QualityCheckItem[]; // Quality inspection details
  qualityReportApproved?: boolean;
  paymentVerificationStatus?: "Not Started" | "In Progress" | "Verified" | "Approved";
  paymentProcessedAt?: string;            // ISO date string
}

/** Logged-in user context */
export interface UserContext {
  role: Role;
  name: string;
  title: string;       // e.g. "Head of Department"
  faculty?: string;
  department?: string;
  avatarInitials: string;
}
