import { 
  Order, 
  DocumentTemplate, 
  StaffMember, 
  ShopeeProduct, 
  ShopeeSyncLog, 
  AppSettings,
  ProductionStatus,
  OrderRevision,
  OrderFile,
  CustomerData,
  CustomerProfile,
  ProductFormFieldConfig,
  ProductType,
  AppNotification
} from '../types';
import { 
  INITIAL_ORDERS, 
  INITIAL_TEMPLATES, 
  INITIAL_STAFF, 
  INITIAL_SHOPEE_PRODUCTS, 
  INITIAL_SHOPEE_LOGS, 
  INITIAL_SETTINGS,
  SAMPLE_CUSTOMER_DATA 
} from '../data/initialData';

const KEYS = {
  ORDERS: 'arise_orders_v2',
  CUSTOMERS: 'arise_customers_v2',
  TEMPLATES: 'arise_templates_v2',
  STAFF: 'arise_staff_v2',
  SHOPEE_PRODUCTS: 'arise_shopee_products_v2',
  SHOPEE_LOGS: 'arise_shopee_logs_v2',
  FORM_CONFIGS: 'arise_form_configs_v2',
  SETTINGS: 'arise_settings_v2',
  CURRENT_ROLE: 'arise_current_role_v2',
  NOTIFICATIONS: 'arise_notifications_v2'
};

const DEFAULT_FORM_CONFIGS: ProductFormFieldConfig[] = [
  {
    productType: 'CV ATS-Friendly',
    requiredFields: ['personal', 'summary', 'education', 'experience', 'skills', 'languages'],
    optionalFields: ['certifications', 'socials']
  },
  {
    productType: 'CV Kreatif / Desain',
    requiredFields: ['personal', 'photo', 'summary', 'education', 'experience', 'skills', 'projects', 'languages'],
    optionalFields: ['certifications', 'socials']
  },
  {
    productType: 'Paket Komplit (CV + Portfolio + CL)',
    requiredFields: ['personal', 'photo', 'summary', 'education', 'experience', 'skills', 'certifications', 'projects', 'languages', 'socials', 'targetJob'],
    optionalFields: []
  },
  {
    productType: 'Portfolio Profesional',
    requiredFields: ['personal', 'summary', 'skills', 'projects', 'socials'],
    optionalFields: ['photo', 'experience', 'languages']
  },
  {
    productType: 'Cover Letter / Surat Lamaran',
    requiredFields: ['personal', 'summary', 'experience', 'targetJob'],
    optionalFields: ['skills', 'education']
  },
  {
    productType: 'Optimasi Profil LinkedIn',
    requiredFields: ['personal', 'summary', 'experience', 'skills', 'socials'],
    optionalFields: ['certifications', 'education']
  },
  {
    productType: 'Executive Resume & Bio',
    requiredFields: ['personal', 'photo', 'summary', 'education', 'experience', 'skills', 'certifications', 'projects', 'languages'],
    optionalFields: ['socials', 'targetJob']
  }
];

const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'CUST-001',
    fullName: 'Bagas Aditya Pratama, S.Kom.',
    phone: '0812-9844-3210',
    email: 'bagas.aditya@gmail.com',
    city: 'Jakarta Selatan',
    country: 'Indonesia',
    notes: 'Klien prioritas untuk lowongan Tech Lead di unicorn fintech.',
    customerData: SAMPLE_CUSTOMER_DATA,
    createdAt: '2025-05-18T09:15:00Z',
    updatedAt: '2025-05-18T10:30:00Z'
  },
  {
    id: 'CUST-002',
    fullName: 'Clara Michelle Simanjuntak, S.E.',
    phone: '0857-1239-8124',
    email: 'clara.michelle@yahoo.com',
    city: 'Surabaya',
    country: 'Indonesia',
    notes: 'Klien HRD Specialist untuk FMCG multinational.',
    customerData: {
      ...SAMPLE_CUSTOMER_DATA,
      id: 'CUST-002',
      fullName: 'Clara Michelle Simanjuntak, S.E.',
      professionalTitle: 'Human Resources & Talent Acquisition Specialist',
      email: 'clara.michelle@yahoo.com',
      phone: '0857-1239-8124',
      city: 'Surabaya',
      summary: 'Talent Acquisition profesional dengan 3+ tahun pengalaman dalam end-to-end recruitment.'
    },
    createdAt: '2025-05-18T11:45:00Z',
    updatedAt: '2025-05-18T12:10:00Z'
  }
];

type Listener = () => void;
const listeners = new Set<Listener>();

// Safe localStorage wrapper with in-memory fallback for Incognito / Safari / mobile WebView
const inMemoryStorage = new Map<string, string>();
const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return inMemoryStorage.get(key) || null;
      return window.localStorage.getItem(key) || inMemoryStorage.get(key) || null;
    } catch {
      return inMemoryStorage.get(key) || null;
    }
  },
  setItem(key: string, value: string): void {
    inMemoryStorage.set(key, value);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  removeItem(key: string): void {
    inMemoryStorage.delete(key);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  }
};

// Cross-tab and cross-window sync channel
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('arise_sync_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data === 'sync_storage') {
        listeners.forEach((listener) => {
          try { listener(); } catch (e) { console.error(e); }
        });
      }
    };
  }
} catch {
  // Ignore fallback
}

// Server syncing helper
async function syncFromServerApi() {
  if (typeof window === 'undefined') return;
  try {
    const [ordersRes, notifsRes] = await Promise.all([
      fetch('/api/orders').catch(() => null),
      fetch('/api/notifications').catch(() => null)
    ]);

    let changed = false;

    if (ordersRes && ordersRes.ok) {
      try {
        const serverOrders: Order[] = await ordersRes.json();
        if (Array.isArray(serverOrders) && serverOrders.length > 0) {
          const localOrders = storageService.getOrders();
          const localMap = new Map(localOrders.map((o) => [o.id, o]));
          let hasNewOrUpdated = false;

          serverOrders.forEach((so) => {
            const lo = localMap.get(so.id);
            if (!lo) {
              localOrders.unshift(so);
              hasNewOrUpdated = true;
            } else {
              // Compare JSON to detect ANY updates from database (customerData, status, isFormLocked, editRequestStatus)
              if (JSON.stringify(so) !== JSON.stringify(lo)) {
                Object.assign(lo, so);
                hasNewOrUpdated = true;
              }
            }
          });

          if (hasNewOrUpdated) {
            safeLocalStorage.setItem(KEYS.ORDERS, JSON.stringify(localOrders));
            changed = true;
          }
        }
      } catch {}
    }

    if (notifsRes && notifsRes.ok) {
      try {
        const serverNotifs: AppNotification[] = await notifsRes.json();
        if (Array.isArray(serverNotifs) && serverNotifs.length > 0) {
          const localNotifs = storageService.getNotifications();
          const localIds = new Set(localNotifs.map((n) => n.id));
          let addedNotifs = false;

          serverNotifs.forEach((sn) => {
            if (!localIds.has(sn.id)) {
              localNotifs.unshift(sn);
              addedNotifs = true;
            }
          });

          if (addedNotifs) {
            safeLocalStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(localNotifs.slice(0, 50)));
            changed = true;
          }
        }
      } catch {}
    }

    if (changed) {
      notify();
    }
  } catch (err) {
    // Fail silently on network errors
  }
}

// Start background server sync polling (Read from Firestore Server as Source of Truth)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncFromServerApi().catch(() => {});
    setInterval(() => {
      syncFromServerApi().catch(() => {});
    }, 2000);
  }, 100);
}

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });

  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage('sync_storage');
    }
  } catch {
    // Ignore
  }
}

export const storageService = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Role
  getCurrentRole(): 'Admin' | 'Operator' | 'Designer' {
    const saved = safeLocalStorage.getItem(KEYS.CURRENT_ROLE);
    return (saved as 'Admin' | 'Operator' | 'Designer') || 'Admin';
  },

  setCurrentRole(role: 'Admin' | 'Operator' | 'Designer') {
    safeLocalStorage.setItem(KEYS.CURRENT_ROLE, role);
    notify();
  },

  // Orders
  getOrders(): Order[] {
    const data = safeLocalStorage.getItem(KEYS.ORDERS);
    if (!data) {
      safeLocalStorage.setItem(KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_ORDERS;
    }
  },

  saveOrders(orders: Order[]) {
    safeLocalStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
    notify();
  },

  getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id);
  },

  getOrCreateOrderForClient(
    id: string,
    fallbackMeta?: { customerName?: string; productType?: ProductType; phone?: string }
  ): Order {
    const existing = this.getOrderById(id);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const productType: ProductType = fallbackMeta?.productType || 'CV ATS-Friendly';
    const customerName = fallbackMeta?.customerName || 'Klien Arise Career';
    const customerPhone = fallbackMeta?.phone || '0812-0000-0000';

    const newOrder: Order = {
      id,
      customerName,
      customerPhone,
      customerEmail: 'klien@gmail.com',
      productType,
      variation: 'Standar',
      marketplaceOrderId: '',
      templateId: 'TMP-ATS-01',
      marketplace: 'WhatsApp',
      orderDate: now.toISOString(),
      deadlineDate: deadline,
      status: 'Menunggu Data',
      priority: 'Normal',
      paymentStatus: 'Lunas',
      price: 99000,
      customerData: {
        id: `CUST-${id}`,
        fullName: customerName !== 'Klien Arise Career' ? customerName : '',
        professionalTitle: '',
        email: '',
        phone: customerPhone !== '0812-0000-0000' ? customerPhone : '',
        city: '',
        country: 'Indonesia',
        summary: '',
        educations: [],
        experiences: [],
        skills: [
          { id: 'SKL-1', categoryName: 'Hard Skills & Tools', skills: [] },
          { id: 'SKL-2', categoryName: 'Soft Skills', skills: [] }
        ],
        certifications: [],
        projects: [],
        languages: [
          { id: 'LNG-1', language: 'Bahasa Indonesia', proficiency: 'Penutur Asli' },
          { id: 'LNG-2', language: 'Bahasa Inggris', proficiency: 'Profesional' }
        ],
        socialLinks: [],
        lastUpdated: now.toISOString()
      },
      revisions: [],
      files: [],
      isFormLocked: false,
      editRequestStatus: 'none'
    };

    this.addOrder(newOrder);
    return newOrder;
  },

  addOrder(order: Order) {
    const orders = this.getOrders();
    orders.unshift(order);
    this.saveOrders(orders);

    // Also auto register/sync customer profile
    this.syncCustomerFromOrder(order);

    // Sync to backend server
    if (typeof window !== 'undefined') {
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      }).catch(() => {});
    }
  },

  updateOrder(order: Order) {
    const orders = this.getOrders();
    const index = orders.findIndex((o) => o.id === order.id);
    if (index !== -1) {
      orders[index] = order;
      this.saveOrders(orders);
      this.syncCustomerFromOrder(order);
    }
  },

  deleteOrder(id: string) {
    const orders = this.getOrders().filter((o) => o.id !== id);
    this.saveOrders(orders);
  },

  updateOrderStatus(id: string, status: ProductionStatus) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      this.saveOrders(orders);
    }
  },

  assignStaff(orderId: string, staffId: string) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.assignedStaffId = staffId;
      this.saveOrders(orders);
    }
  },

  updateOrderNotes(orderId: string, notes: string) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.internalNotes = notes;
      this.saveOrders(orders);
    }
  },

  addRevisionToOrder(orderId: string, revision: Omit<OrderRevision, 'id'>) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const newRev: OrderRevision = {
        ...revision,
        id: `REV-${Date.now()}`
      };
      order.revisions.push(newRev);
      order.status = 'Revisi';
      this.saveOrders(orders);
    }
  },

  addFileToOrder(orderId: string, file: Omit<OrderFile, 'id'>) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const newFile: OrderFile = {
        ...file,
        id: `FIL-${Date.now()}`
      };
      order.files.push(newFile);
      this.saveOrders(orders);
    }
  },

  updateOrderCustomerData(orderId: string, customerData: CustomerData) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.customerData = customerData;
      order.customerName = customerData.fullName || order.customerName;
      order.customerPhone = customerData.phone || order.customerPhone;
      order.customerEmail = customerData.email || order.customerEmail;
      if (order.status === 'Menunggu Data') {
        order.status = 'Data Masuk';
      }
      order.customerSubmittedAt = new Date().toISOString();
      order.isFormLocked = true;
      order.editRequestStatus = 'none';
      this.saveOrders(orders);
      this.syncCustomerFromOrder(order);

      // Add in-app notification for seller
      this.addNotification({
        orderId: order.id,
        type: 'form_submitted',
        title: '📥 Data Formulir Masuk',
        message: `Klien ${order.customerName} telah melengkapi dan mengirimkan data formulir untuk pesanan ${order.id} (${order.productType}).`,
        customerName: order.customerName,
        productType: order.productType
      });

      // Push to backend server for real-time seller synchronization across devices
      if (typeof window !== 'undefined') {
        fetch(`/api/orders/${orderId}/customer-data`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerData,
            status: 'Data Masuk',
            isFormLocked: true
          })
        }).catch(() => {});
      }
    }
  },

  requestFormEdit(orderId: string, reason?: string) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.editRequestStatus = 'requested';
      order.editRequestReason = reason || 'Klien ingin memperbarui data profil/pengalaman';
      this.saveOrders(orders);

      // Add in-app notification for seller
      this.addNotification({
        orderId: order.id,
        type: 'edit_requested',
        title: '🔔 Permintaan Perubahan Data',
        message: `Klien ${order.customerName} (${order.id}) meminta izin ubah data: "${order.editRequestReason}".`,
        customerName: order.customerName,
        productType: order.productType
      });

      // Push to backend server for real-time seller notification across devices
      if (typeof window !== 'undefined') {
        fetch(`/api/orders/${orderId}/request-edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: order.editRequestReason })
        }).catch(() => {});
      }
    }
  },

  approveFormEdit(orderId: string) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.isFormLocked = false;
      order.editRequestStatus = 'approved';
      this.saveOrders(orders);

      // Add notification
      this.addNotification({
        orderId: order.id,
        type: 'edit_approved',
        title: '🔓 Izin Edit Disetujui',
        message: `Formulir pesanan ${order.id} (${order.customerName}) telah dibuka kuncinya agar klien dapat mengirimkan data terbaru.`,
        customerName: order.customerName,
        productType: order.productType
      });

      // Push to backend server so client HP gets unlocked immediately
      if (typeof window !== 'undefined') {
        fetch(`/api/orders/${orderId}/approve-edit`, {
          method: 'POST'
        }).catch(() => {});
      }
    }
  },

  lockForm(orderId: string) {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.isFormLocked = true;
      order.editRequestStatus = 'none';
      this.saveOrders(orders);
    }
  },

  // Notifications System
  getNotifications(): AppNotification[] {
    const data = safeLocalStorage.getItem(KEYS.NOTIFICATIONS);
    if (!data) {
      const initialNotifs: AppNotification[] = [
        {
          id: 'NOTIF-INIT-1',
          orderId: 'ORD-2025-001',
          type: 'form_submitted',
          title: '📥 Data Formulir Diterima',
          message: 'Klien Bagas Aditya Pratama telah melengkapi data pesanan ORD-2025-001 (CV ATS-Friendly).',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: false,
          customerName: 'Bagas Aditya Pratama',
          productType: 'CV ATS-Friendly'
        }
      ];
      safeLocalStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(initialNotifs));
      return initialNotifs;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveNotifications(notifications: AppNotification[]) {
    safeLocalStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    notify();
  },

  addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) {
    const notifications = this.getNotifications();
    const newNotif: AppNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    notifications.unshift(newNotif);
    this.saveNotifications(notifications.slice(0, 50));
  },

  markNotificationAsRead(id: string) {
    const notifications = this.getNotifications().map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    this.saveNotifications(notifications);
  },

  markAllNotificationsAsRead() {
    const notifications = this.getNotifications().map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(notifications);
  },

  getUnreadNotificationsCount(): number {
    return this.getNotifications().filter((n) => !n.isRead).length;
  },

  // Sync payload import helper (from client compressed sync payload)
  syncCustomerDataFromPayload(orderId: string, customerData: CustomerData): boolean {
    const order = this.getOrCreateOrderForClient(orderId, {
      customerName: customerData.fullName,
      phone: customerData.phone
    });
    if (order) {
      this.updateOrderCustomerData(orderId, customerData);
      return true;
    }
    return false;
  },

  generateNextOrderId(): string {
    const settings = this.getSettings();
    const year = new Date().getFullYear();
    const orders = this.getOrders();
    const currentMax = orders.reduce((max, o) => {
      const match = o.id.match(new RegExp(`${settings.orderIdPrefix}-${year}-(\\d+)`));
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 1288);
    const nextNum = (currentMax + 1).toString().padStart(6, '0');
    return `${settings.orderIdPrefix}-${year}-${nextNum}`;
  },

  // Customers
  getCustomers(): CustomerProfile[] {
    const data = safeLocalStorage.getItem(KEYS.CUSTOMERS);
    if (!data) {
      safeLocalStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  saveCustomers(customers: CustomerProfile[]) {
    safeLocalStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    notify();
  },

  getCustomerById(id: string): CustomerProfile | undefined {
    return this.getCustomers().find((c) => c.id === id);
  },

  addCustomer(customer: CustomerProfile) {
    const customers = this.getCustomers();
    customers.unshift(customer);
    this.saveCustomers(customers);
  },

  updateCustomer(customer: CustomerProfile) {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === customer.id);
    if (index !== -1) {
      customers[index] = customer;
      this.saveCustomers(customers);
    }
  },

  deleteCustomer(id: string) {
    const customers = this.getCustomers().filter((c) => c.id !== id);
    this.saveCustomers(customers);
  },

  syncCustomerFromOrder(order: Order) {
    const customers = this.getCustomers();
    const matchIndex = customers.findIndex(
      (c) => (c.phone && c.phone === order.customerPhone) || (c.email && c.email === order.customerEmail) || c.fullName === order.customerName
    );

    if (matchIndex !== -1) {
      customers[matchIndex].customerData = order.customerData;
      customers[matchIndex].updatedAt = new Date().toISOString();
      this.saveCustomers(customers);
    } else {
      const newCust: CustomerProfile = {
        id: order.customerData?.id || `CUST-${Date.now().toString().slice(-4)}`,
        fullName: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
        city: order.customerData?.city || '',
        country: order.customerData?.country || 'Indonesia',
        notes: `Pelanggan dari pesanan ${order.id} (${order.marketplace})`,
        customerData: order.customerData,
        createdAt: order.orderDate || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      customers.push(newCust);
      this.saveCustomers(customers);
    }
  },

  // Dynamic Form Field Configs
  getFormFieldConfigs(): ProductFormFieldConfig[] {
    const data = safeLocalStorage.getItem(KEYS.FORM_CONFIGS);
    if (!data) {
      safeLocalStorage.setItem(KEYS.FORM_CONFIGS, JSON.stringify(DEFAULT_FORM_CONFIGS));
      return DEFAULT_FORM_CONFIGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_FORM_CONFIGS;
    }
  },

  saveFormFieldConfigs(configs: ProductFormFieldConfig[]) {
    safeLocalStorage.setItem(KEYS.FORM_CONFIGS, JSON.stringify(configs));
    notify();
  },

  updateProductFormConfig(productType: ProductType, requiredFields: string[], optionalFields: string[] = []) {
    const configs = this.getFormFieldConfigs();
    const idx = configs.findIndex((c) => c.productType === productType);
    if (idx !== -1) {
      configs[idx] = { productType, requiredFields, optionalFields };
    } else {
      configs.push({ productType, requiredFields, optionalFields });
    }
    this.saveFormFieldConfigs(configs);
  },

  // Templates
  getTemplates(): DocumentTemplate[] {
    const data = safeLocalStorage.getItem(KEYS.TEMPLATES);
    if (!data) {
      safeLocalStorage.setItem(KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
      return INITIAL_TEMPLATES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_TEMPLATES;
    }
  },

  saveTemplates(templates: DocumentTemplate[]) {
    safeLocalStorage.setItem(KEYS.TEMPLATES, JSON.stringify(templates));
    notify();
  },

  getTemplateById(id: string): DocumentTemplate | undefined {
    return this.getTemplates().find((t) => t.id === id);
  },

  addTemplate(template: DocumentTemplate) {
    const templates = this.getTemplates();
    templates.push(template);
    this.saveTemplates(templates);
  },

  updateTemplate(template: DocumentTemplate) {
    const templates = this.getTemplates();
    const index = templates.findIndex((t) => t.id === template.id);
    if (index !== -1) {
      templates[index] = template;
      this.saveTemplates(templates);
    }
  },

  toggleTemplateFavorite(id: string) {
    const templates = this.getTemplates();
    const t = templates.find((item) => item.id === id);
    if (t) {
      t.isFavorite = !t.isFavorite;
      this.saveTemplates(templates);
    }
  },

  toggleTemplateActive(id: string) {
    const templates = this.getTemplates();
    const t = templates.find((item) => item.id === id);
    if (t) {
      t.isActive = !t.isActive;
      this.saveTemplates(templates);
    }
  },

  duplicateTemplate(id: string) {
    const templates = this.getTemplates();
    const orig = templates.find((t) => t.id === id);
    if (orig) {
      const copy: DocumentTemplate = {
        ...orig,
        id: `TMP-${Date.now().toString().slice(-6)}`,
        name: `${orig.name} (Salinan)`,
        usageCount: 0,
        isFavorite: false
      };
      templates.push(copy);
      this.saveTemplates(templates);
    }
  },

  // Staff
  getStaff(): StaffMember[] {
    const data = safeLocalStorage.getItem(KEYS.STAFF);
    if (!data) {
      safeLocalStorage.setItem(KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_STAFF;
    }
  },

  saveStaff(staff: StaffMember[]) {
    safeLocalStorage.setItem(KEYS.STAFF, JSON.stringify(staff));
    notify();
  },

  addStaff(member: StaffMember) {
    const staff = this.getStaff();
    staff.push(member);
    this.saveStaff(staff);
  },

  updateStaff(member: StaffMember) {
    const staff = this.getStaff();
    const index = staff.findIndex((s) => s.id === member.id);
    if (index !== -1) {
      staff[index] = member;
      this.saveStaff(staff);
    }
  },

  deleteStaff(id: string) {
    const staff = this.getStaff().filter((s) => s.id !== id);
    this.saveStaff(staff);
  },

  // Shopee
  getShopeeProducts(): ShopeeProduct[] {
    const data = safeLocalStorage.getItem(KEYS.SHOPEE_PRODUCTS);
    if (!data) {
      safeLocalStorage.setItem(KEYS.SHOPEE_PRODUCTS, JSON.stringify(INITIAL_SHOPEE_PRODUCTS));
      return INITIAL_SHOPEE_PRODUCTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_SHOPEE_PRODUCTS;
    }
  },

  saveShopeeProducts(products: ShopeeProduct[]) {
    safeLocalStorage.setItem(KEYS.SHOPEE_PRODUCTS, JSON.stringify(products));
    notify();
  },

  updateShopeeProductMapping(productId: string, templateId: string, requiredFields: string[]) {
    const products = this.getShopeeProducts();
    const p = products.find((item) => item.id === productId);
    if (p) {
      p.defaultTemplateId = templateId;
      p.requiredFormFields = requiredFields;
      this.saveShopeeProducts(products);
    }
  },

  getShopeeLogs(): ShopeeSyncLog[] {
    const data = safeLocalStorage.getItem(KEYS.SHOPEE_LOGS);
    if (!data) {
      safeLocalStorage.setItem(KEYS.SHOPEE_LOGS, JSON.stringify(INITIAL_SHOPEE_LOGS));
      return INITIAL_SHOPEE_LOGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_SHOPEE_LOGS;
    }
  },

  addShopeeLog(log: Omit<ShopeeSyncLog, 'id'>) {
    const logs = this.getShopeeLogs();
    logs.unshift({
      ...log,
      id: `LOG-${Date.now()}`
    });
    safeLocalStorage.setItem(KEYS.SHOPEE_LOGS, JSON.stringify(logs.slice(0, 50)));
    notify();
  },

  // Settings
  getSettings(): AppSettings {
    const data = safeLocalStorage.getItem(KEYS.SETTINGS);
    if (!data) {
      safeLocalStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings) {
    safeLocalStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    notify();
  },

  resetAllData() {
    safeLocalStorage.setItem(KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    safeLocalStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    safeLocalStorage.setItem(KEYS.TEMPLATES, JSON.stringify(INITIAL_TEMPLATES));
    safeLocalStorage.setItem(KEYS.STAFF, JSON.stringify(INITIAL_STAFF));
    safeLocalStorage.setItem(KEYS.SHOPEE_PRODUCTS, JSON.stringify(INITIAL_SHOPEE_PRODUCTS));
    safeLocalStorage.setItem(KEYS.SHOPEE_LOGS, JSON.stringify(INITIAL_SHOPEE_LOGS));
    safeLocalStorage.setItem(KEYS.FORM_CONFIGS, JSON.stringify(DEFAULT_FORM_CONFIGS));
    safeLocalStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    notify();
  }
};
