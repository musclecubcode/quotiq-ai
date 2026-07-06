import type {
  Client,
  DocumentRecord,
  Invoice,
  Note,
  Photo,
  Property,
  Quote,
  Vehicle,
  WarrantyRecord,
  WorkOrder,
} from "./types";

// Demo/fixture data. Still used internally to back the Work Orders, Estimates,
// Invoices, Dashboard, and AI Assistant screens, which haven't been wired
// to real persisted data yet. The Clients feature itself no longer reads
// from this array — see lib/client-storage.ts for the real, localStorage
// backed client store used by the Clients list and workspace.
export const clients: Client[] = [
  {
    id: "c1",
    firstName: "Marcus",
    lastName: "Whitfield",
    company: "Whitfield Properties LLC",
    email: "marcus@whitfieldproperties.com",
    phone: "(512) 555-0148",
    address: "2140 Barton Springs Rd",
    city: "Austin",
    state: "TX",
    zip: "78704",
    status: "active",
    createdAt: "2023-11-02",
  },
  {
    id: "c2",
    firstName: "Renee",
    lastName: "Castillo",
    email: "renee.castillo@gmail.com",
    phone: "(512) 555-0173",
    address: "908 Windsor Rd",
    city: "Austin",
    state: "TX",
    zip: "78703",
    status: "active",
    createdAt: "2024-02-15",
  },
  {
    id: "c3",
    firstName: "David",
    lastName: "Okafor",
    company: "Okafor Retail Group",
    email: "david@okaforretail.com",
    phone: "(737) 555-0192",
    address: "4408 Spicewood Springs Rd",
    city: "Austin",
    state: "TX",
    zip: "78759",
    status: "active",
    createdAt: "2022-06-21",
  },
  {
    id: "c4",
    firstName: "Priya",
    lastName: "Nandakumar",
    email: "priya.n@outlook.com",
    phone: "(512) 555-0116",
    address: "1517 Vargas Rd",
    city: "Austin",
    state: "TX",
    zip: "78741",
    status: "lead",
    createdAt: "2025-05-30",
  },
  {
    id: "c5",
    firstName: "Tom",
    lastName: "Bradshaw",
    company: "Bradshaw Auto Group",
    email: "tom@bradshawauto.com",
    phone: "(512) 555-0159",
    address: "8100 N Interstate Hwy 35",
    city: "Austin",
    state: "TX",
    zip: "78753",
    status: "active",
    createdAt: "2023-01-09",
  },
  {
    id: "c6",
    firstName: "Linda",
    lastName: "Chu",
    email: "linda.chu99@gmail.com",
    phone: "(512) 555-0184",
    address: "3312 Duval St",
    city: "Austin",
    state: "TX",
    zip: "78705",
    status: "inactive",
    createdAt: "2022-09-14",
  },
  {
    id: "c7",
    firstName: "Samuel",
    lastName: "Green",
    company: "Green Family Trust",
    email: "sgreen@greentrust.org",
    phone: "(512) 555-0127",
    address: "1900 Rio Grande St",
    city: "Austin",
    state: "TX",
    zip: "78705",
    status: "lead",
    createdAt: "2025-06-18",
  },
];

export const properties: Property[] = [
  {
    id: "p1",
    clientId: "c1",
    label: "Primary Residence",
    address: "2140 Barton Springs Rd, Austin, TX",
    type: "residential",
    squareFootage: 3200,
    yearBuilt: 2011,
  },
  {
    id: "p2",
    clientId: "c1",
    label: "Lake House",
    address: "410 Ranch Rd 620, Lakeway, TX",
    type: "residential",
    squareFootage: 2400,
    yearBuilt: 2005,
  },
  {
    id: "p3",
    clientId: "c2",
    label: "Home",
    address: "908 Windsor Rd, Austin, TX",
    type: "residential",
    squareFootage: 1850,
    yearBuilt: 1998,
  },
  {
    id: "p4",
    clientId: "c3",
    label: "Spicewood Retail Center",
    address: "4408 Spicewood Springs Rd, Austin, TX",
    type: "commercial",
    squareFootage: 18500,
    yearBuilt: 2016,
  },
  {
    id: "p5",
    clientId: "c3",
    label: "Riverside Warehouse",
    address: "2200 E Riverside Dr, Austin, TX",
    type: "commercial",
    squareFootage: 26000,
    yearBuilt: 2009,
  },
  {
    id: "p6",
    clientId: "c5",
    label: "Bradshaw Dealership - North",
    address: "8100 N Interstate Hwy 35, Austin, TX",
    type: "commercial",
    squareFootage: 42000,
    yearBuilt: 1999,
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "v1",
    clientId: "c1",
    year: 2022,
    make: "Ford",
    model: "F-250",
    licensePlate: "TX-DJK-2291",
    vin: "1FT7W2BT8NEC10453",
  },
  {
    id: "v2",
    clientId: "c3",
    year: 2020,
    make: "Chevrolet",
    model: "Silverado 2500",
    licensePlate: "TX-RTM-0087",
    vin: "1GC4KYEY5LF139876",
  },
  {
    id: "v3",
    clientId: "c3",
    year: 2023,
    make: "Ford",
    model: "Transit 350",
    licensePlate: "TX-GHV-4471",
    vin: "1FTBW2CM7PKA22190",
  },
  {
    id: "v4",
    clientId: "c5",
    year: 2021,
    make: "Ram",
    model: "1500",
    licensePlate: "TX-BXP-7734",
    vin: "1C6SRFFT3MN512087",
  },
];

export const workOrders: WorkOrder[] = [
  {
    id: "wo1",
    clientId: "c1",
    propertyId: "p1",
    title: "Kitchen Remodel",
    category: "remodel",
    priority: "medium",
    serviceAddress: "2140 Barton Springs Rd, Austin, TX",
    description: "Full kitchen remodel: cabinets, island, countertops, and electrical rough-in.",
    status: "in_progress",
    startDate: "2026-06-02",
    endDate: "2026-07-18",
    budget: 42500,
    progress: 65,
    crew: ["J. Alvarez", "M. Sato"],
  },
  {
    id: "wo2",
    clientId: "c2",
    propertyId: "p3",
    title: "Primary Bath Renovation",
    category: "remodel",
    priority: "medium",
    serviceAddress: "908 Windsor Rd, Austin, TX",
    description: "Tile, plumbing rework, and custom vanity install for the primary bathroom.",
    status: "scheduled",
    startDate: "2026-07-14",
    endDate: "2026-08-01",
    budget: 18900,
    progress: 0,
    crew: ["K. Diaz"],
  },
  {
    id: "wo3",
    clientId: "c3",
    propertyId: "p4",
    title: "Storefront Buildout - Unit 4",
    category: "installation",
    priority: "high",
    serviceAddress: "4408 Spicewood Springs Rd, Austin, TX",
    description: "New storefront glazing, HVAC rooftop units, and interior buildout for Unit 4.",
    status: "in_progress",
    startDate: "2026-05-11",
    endDate: "2026-07-30",
    budget: 96000,
    progress: 40,
    crew: ["J. Alvarez", "R. Kim", "T. Nguyen"],
  },
  {
    id: "wo4",
    clientId: "c5",
    propertyId: "p6",
    title: "Service Bay Roof Replacement",
    category: "repair",
    priority: "high",
    serviceAddress: "8100 N Interstate Hwy 35, Austin, TX",
    description: "Full TPO membrane roof replacement over the service bay.",
    status: "completed",
    startDate: "2026-03-03",
    endDate: "2026-04-02",
    budget: 74200,
    progress: 100,
    crew: ["M. Sato", "R. Kim"],
  },
  {
    id: "wo5",
    clientId: "c6",
    title: "Deck & Pergola Addition",
    category: "installation",
    priority: "low",
    serviceAddress: "3312 Duval St, Austin, TX",
    description: "Pressure-treated deck and cedar pergola addition to the backyard.",
    status: "on_hold",
    startDate: "2026-06-20",
    endDate: "2026-07-10",
    budget: 15600,
    progress: 20,
    crew: ["K. Diaz"],
  },
  {
    id: "wo6",
    clientId: "c5",
    propertyId: "p6",
    title: "Showroom Flooring Upgrade",
    category: "installation",
    priority: "medium",
    serviceAddress: "8100 N Interstate Hwy 35, Austin, TX",
    description: "Replace showroom flooring throughout the main sales floor.",
    status: "scheduled",
    startDate: "2026-07-21",
    endDate: "2026-08-08",
    budget: 31400,
    progress: 0,
    crew: ["T. Nguyen"],
  },
  {
    id: "wo7",
    clientId: "c3",
    propertyId: "p5",
    title: "Loading Dock Expansion",
    category: "installation",
    priority: "high",
    serviceAddress: "2200 E Riverside Dr, Austin, TX",
    description: "Expand the loading dock with a new slab and additional bay door.",
    status: "in_progress",
    startDate: "2026-06-15",
    endDate: "2026-08-20",
    budget: 58900,
    progress: 30,
    crew: ["J. Alvarez", "M. Sato"],
  },
  {
    id: "wo8",
    clientId: "c3",
    vehicleId: "v3",
    title: "Service Van A/C Repair",
    category: "repair",
    priority: "urgent",
    serviceAddress: "2200 E Riverside Dr, Austin, TX",
    description: "Diagnose and repair failing A/C compressor on the 2023 Ford Transit 350.",
    status: "scheduled",
    startDate: "2026-07-20",
    endDate: "2026-07-21",
    budget: 1200,
    progress: 0,
    crew: ["R. Kim"],
  },
  {
    id: "wo9",
    clientId: "c4",
    title: "Detached Garage Conversion",
    category: "remodel",
    priority: "medium",
    serviceAddress: "1517 Vargas Rd, Austin, TX",
    description: "Convert detached garage into a finished living space with framing, electrical, and drywall.",
    status: "quoting",
    startDate: "2026-07-25",
    endDate: "2026-08-25",
    budget: 0,
    progress: 0,
    crew: [],
  },
  {
    id: "wo10",
    clientId: "c7",
    title: "Whole-Home Window Replacement",
    category: "installation",
    priority: "medium",
    serviceAddress: "1900 Rio Grande St, Austin, TX",
    description: "Replace all 22 windows with double-hung vinyl units, including removal and disposal.",
    status: "quoting",
    startDate: "2026-08-01",
    endDate: "2026-08-15",
    budget: 0,
    progress: 0,
    crew: [],
  },
  {
    id: "wo11",
    clientId: "c3",
    propertyId: "p5",
    title: "Unit 5 Cold Storage Buildout",
    category: "installation",
    priority: "medium",
    serviceAddress: "2200 E Riverside Dr, Austin, TX",
    description: "Insulated panel walls and refrigeration tie-in for the new cold storage unit.",
    status: "quoting",
    startDate: "2026-08-10",
    endDate: "2026-10-01",
    budget: 0,
    progress: 0,
    crew: [],
  },
];

export const quotes: Quote[] = [
  {
    id: "q1",
    number: "EST-1042",
    workOrderId: "wo9",
    status: "sent",
    issueDate: "2026-06-25",
    expiryDate: "2026-07-25",
    lineItems: [
      { id: "l1", description: "Framing & structural work", quantity: 1, unitPrice: 12800 },
      { id: "l2", description: "Electrical rough-in", quantity: 1, unitPrice: 4200 },
      { id: "l3", description: "Insulation & drywall", quantity: 1, unitPrice: 5600 },
    ],
  },
  {
    id: "q2",
    number: "EST-1043",
    workOrderId: "wo10",
    status: "draft",
    issueDate: "2026-06-30",
    expiryDate: "2026-07-30",
    lineItems: [
      { id: "l1", description: "22 double-hung vinyl windows", quantity: 22, unitPrice: 640 },
      { id: "l2", description: "Removal & disposal", quantity: 1, unitPrice: 1800 },
    ],
  },
  {
    id: "q3",
    number: "EST-1039",
    workOrderId: "wo2",
    status: "approved",
    issueDate: "2026-05-28",
    expiryDate: "2026-06-28",
    lineItems: [
      { id: "l1", description: "Tile & fixtures", quantity: 1, unitPrice: 11200 },
      { id: "l2", description: "Plumbing rework", quantity: 1, unitPrice: 4900 },
      { id: "l3", description: "Custom vanity", quantity: 1, unitPrice: 2800 },
    ],
  },
  {
    id: "q4",
    number: "EST-1031",
    workOrderId: "wo5",
    status: "declined",
    issueDate: "2026-04-14",
    expiryDate: "2026-05-14",
    lineItems: [
      { id: "l1", description: "Pressure-treated deck (400 sq ft)", quantity: 1, unitPrice: 9800 },
      { id: "l2", description: "Cedar pergola", quantity: 1, unitPrice: 5800 },
    ],
  },
  {
    id: "q5",
    number: "EST-1046",
    workOrderId: "wo11",
    status: "sent",
    issueDate: "2026-07-01",
    expiryDate: "2026-08-01",
    lineItems: [
      { id: "l1", description: "Insulated panel walls", quantity: 1, unitPrice: 21400 },
      { id: "l2", description: "Refrigeration tie-in", quantity: 1, unitPrice: 9600 },
    ],
  },
];

export const invoices: Invoice[] = [
  {
    id: "i1",
    number: "INV-2201",
    workOrderId: "wo1",
    status: "sent",
    issueDate: "2026-06-20",
    dueDate: "2026-07-20",
    amount: 21250,
    amountPaid: 0,
  },
  {
    id: "i2",
    number: "INV-2195",
    workOrderId: "wo4",
    status: "paid",
    issueDate: "2026-04-05",
    dueDate: "2026-05-05",
    amount: 74200,
    amountPaid: 74200,
  },
  {
    id: "i3",
    number: "INV-2180",
    workOrderId: "wo5",
    status: "overdue",
    issueDate: "2026-05-01",
    dueDate: "2026-06-01",
    amount: 7800,
    amountPaid: 0,
  },
  {
    id: "i4",
    number: "INV-2203",
    workOrderId: "wo3",
    status: "sent",
    issueDate: "2026-06-28",
    dueDate: "2026-07-28",
    amount: 38400,
    amountPaid: 0,
  },
  {
    id: "i5",
    number: "INV-2150",
    workOrderId: "wo3",
    status: "paid",
    issueDate: "2026-05-15",
    dueDate: "2026-06-15",
    amount: 28800,
    amountPaid: 28800,
  },
  {
    id: "i6",
    number: "INV-2160",
    workOrderId: "wo2",
    status: "draft",
    issueDate: "2026-07-02",
    dueDate: "2026-08-02",
    amount: 18900,
    amountPaid: 0,
  },
  {
    id: "i7",
    number: "INV-2172",
    workOrderId: "wo6",
    status: "overdue",
    issueDate: "2026-05-20",
    dueDate: "2026-06-19",
    amount: 12500,
    amountPaid: 0,
  },
];

export const photos: Photo[] = [
  {
    id: "ph1",
    workOrderId: "wo1",
    caption: "Demo day — original cabinets removed",
    date: "2026-06-03",
    color: "#1d4ed8",
  },
  {
    id: "ph2",
    workOrderId: "wo1",
    caption: "Framing for new island layout",
    date: "2026-06-16",
    color: "#0369a1",
  },
  {
    id: "ph3",
    workOrderId: "wo1",
    caption: "Cabinet install, run 1 of 3",
    date: "2026-06-29",
    color: "#0e7490",
  },
  {
    id: "ph4",
    workOrderId: "wo3",
    caption: "Steel frame for storefront glazing",
    date: "2026-05-30",
    color: "#334155",
  },
  {
    id: "ph5",
    workOrderId: "wo4",
    caption: "TPO membrane welding, bay 3",
    date: "2026-03-20",
    color: "#0f766e",
  },
];

export const notes: Note[] = [
  {
    id: "n1",
    workOrderId: "wo1",
    author: "Ray Delgado",
    date: "2026-06-10",
    body: "Marcus wants soft-close cabinet hardware upgraded — confirmed change order won't affect the July 18 completion date.",
  },
  {
    id: "n2",
    workOrderId: "wo1",
    author: "J. Alvarez",
    date: "2026-06-24",
    body: "Countertop template scheduled for next Tuesday. Client will be out of town, garage code shared for access.",
  },
  {
    id: "n3",
    workOrderId: "wo7",
    author: "Ray Delgado",
    date: "2026-05-20",
    body: "David approved the loading dock expansion drawings. Waiting on city permit before pouring the new slab.",
  },
  {
    id: "n4",
    workOrderId: "wo4",
    author: "M. Sato",
    date: "2026-04-01",
    body: "Roof replacement passed final inspection. Tom asked about adding gutter guards as a follow-up job.",
  },
  {
    id: "n5",
    workOrderId: "wo2",
    author: "K. Diaz",
    date: "2026-07-01",
    body: "Renee approved tile selection (Calacatta porcelain). Ordering material this week to stay on schedule.",
  },
];

export const warranties: WarrantyRecord[] = [
  {
    id: "w1",
    workOrderId: "wo4",
    item: "TPO roofing membrane",
    provider: "GAF Materials Corporation",
    startDate: "2026-04-02",
    expiryDate: "2046-04-02",
    terms: "20-year manufacturer warranty covering material defects, transferable once.",
  },
  {
    id: "w2",
    workOrderId: "wo3",
    item: "HVAC rooftop units (x2)",
    provider: "Trane Technologies",
    startDate: "2026-01-15",
    expiryDate: "2031-01-15",
    terms: "5-year parts and labor warranty, annual maintenance required to stay valid.",
  },
  {
    id: "w3",
    workOrderId: "wo1",
    item: "Quartz countertops",
    provider: "Caesarstone",
    startDate: "2026-07-18",
    expiryDate: "2036-07-18",
    terms: "10-year limited warranty against manufacturing defects and staining.",
  },
];

export const documents: DocumentRecord[] = [
  {
    id: "d1",
    workOrderId: "wo1",
    name: "Kitchen Remodel - Signed Contract.pdf",
    type: "contract",
    uploadedDate: "2026-05-28",
    fileSize: "1.2 MB",
  },
  {
    id: "d2",
    workOrderId: "wo1",
    name: "City of Austin - Electrical Permit.pdf",
    type: "permit",
    uploadedDate: "2026-06-01",
    fileSize: "420 KB",
  },
  {
    id: "d3",
    workOrderId: "wo7",
    name: "Loading Dock Expansion - Permit Application.pdf",
    type: "permit",
    uploadedDate: "2026-05-22",
    fileSize: "980 KB",
  },
  {
    id: "d4",
    workOrderId: "wo3",
    name: "Certificate of Insurance - Okafor Retail.pdf",
    type: "insurance",
    uploadedDate: "2022-06-25",
    fileSize: "310 KB",
  },
  {
    id: "d5",
    workOrderId: "wo4",
    name: "Final Roof Inspection Report.pdf",
    type: "inspection",
    uploadedDate: "2026-04-03",
    fileSize: "740 KB",
  },
];

// --- Relational helpers -----------------------------------------------
// WorkOrder is the hub every other record joins through; these helpers
// keep that join logic in one place instead of scattering `.filter()`
// calls across page components.

export function getClientById(clientId: string): Client | undefined {
  return clients.find((client) => client.id === clientId);
}

export function getWorkOrderById(workOrderId: string): WorkOrder | undefined {
  return workOrders.find((workOrder) => workOrder.id === workOrderId);
}

export function getWorkOrdersByClient(clientId: string): WorkOrder[] {
  return workOrders.filter((workOrder) => workOrder.clientId === clientId);
}

export function getPropertiesByClient(clientId: string): Property[] {
  return properties.filter((property) => property.clientId === clientId);
}

export function getVehiclesByClient(clientId: string): Vehicle[] {
  return vehicles.filter((vehicle) => vehicle.clientId === clientId);
}

export function getQuotesByWorkOrder(workOrderId: string): Quote[] {
  return quotes.filter((quote) => quote.workOrderId === workOrderId);
}

export function getInvoicesByWorkOrder(workOrderId: string): Invoice[] {
  return invoices.filter((invoice) => invoice.workOrderId === workOrderId);
}

export function getQuoteTotal(quote: Quote): number {
  return quote.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
}

/** Total of an invoice or quote's owning work order's client lifetime value. */
export function getClientLifetimeValue(clientId: string): number {
  const workOrderIds = new Set(getWorkOrdersByClient(clientId).map((w) => w.id));
  return invoices
    .filter((invoice) => workOrderIds.has(invoice.workOrderId))
    .reduce((sum, invoice) => sum + invoice.amountPaid, 0);
}

/**
 * Bundles everything reachable through a client's work orders — the shape
 * the Client Workspace renders. Quotes, invoices, photos, notes,
 * warranties, and documents are all joined via workOrderId rather than
 * stored redundantly against the client.
 *
 * Takes a clientId rather than a Client so it works equally for the demo
 * fixture clients above and for real clients from the localStorage-backed
 * store in lib/client-storage.ts — a client with no matching records here
 * (e.g. every real client, for now) simply gets empty arrays back.
 */
export function getClientRelatedRecords(clientId: string) {
  const clientWorkOrders = getWorkOrdersByClient(clientId);
  const workOrderIds = new Set(clientWorkOrders.map((w) => w.id));

  const byWorkOrder = <T extends { workOrderId: string }>(records: T[]): T[] =>
    records.filter((record) => workOrderIds.has(record.workOrderId));

  return {
    properties: getPropertiesByClient(clientId),
    vehicles: getVehiclesByClient(clientId),
    workOrders: clientWorkOrders,
    quotes: byWorkOrder(quotes),
    invoices: byWorkOrder(invoices),
    notes: byWorkOrder(notes).sort((a, b) => (a.date < b.date ? 1 : -1)),
    warranties: byWorkOrder(warranties),
    documents: byWorkOrder(documents),
    photos: byWorkOrder(photos),
  };
}

export function getDashboardStats() {
  const activeWorkOrders = workOrders.filter(
    (workOrder) =>
      workOrder.status === "in_progress" || workOrder.status === "scheduled"
  ).length;

  const pendingQuotes = quotes.filter(
    (quote) => quote.status === "sent" || quote.status === "draft"
  ).length;

  const outstandingInvoices = invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + (invoice.amount - invoice.amountPaid), 0);

  const revenueThisYear = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amountPaid, 0);

  return { activeWorkOrders, pendingQuotes, outstandingInvoices, revenueThisYear };
}
