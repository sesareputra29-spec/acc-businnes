import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const app = express();
const port = 3000;

app.use(express.json({ limit: '20mb' }));

// Cross-origin headers for iframe and client requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// File-backed persistence for server data (with /tmp serverless support for Vercel)
function getDataFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpFile = path.join('/tmp', '.app_data.json');
    if (!fs.existsSync(tmpFile)) {
      try {
        const seedPath = path.join(process.cwd(), '.app_data.json');
        if (fs.existsSync(seedPath)) {
          fs.copyFileSync(seedPath, tmpFile);
        }
      } catch (e) {
        console.warn('Could not seed tmp data file:', e);
      }
    }
    return tmpFile;
  }
  return path.join(process.cwd(), '.app_data.json');
}

interface ServerData {
  orders: any[];
  notifications: any[];
  lastUpdated: string;
}

let memoryCache: ServerData | null = null;

function loadData(): ServerData {
  const filePath = getDataFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryCache = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Error loading data file:', err);
  }
  if (memoryCache) return memoryCache;
  return {
    orders: [],
    notifications: [],
    lastUpdated: new Date().toISOString()
  };
}

function saveData(data: ServerData) {
  memoryCache = data;
  const filePath = getDataFilePath();
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data file:', err);
  }
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json({
    appUrl: process.env.APP_URL || '',
    time: new Date().toISOString()
  });
});

function verifyPortalToken(orderId: string, token?: string): boolean {
  if (!token) return true; // Graceful compatibility if token omitted
  let hash = 0;
  const str = `arise_craft_${orderId.trim()}_portal_v1`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const expected = Math.abs(hash).toString(36).padStart(8, '0');
  return token.trim() === expected;
}

// CLIENT PORTAL AUTHORIZED ENDPOINTS (For clients on mobile HP / WhatsApp without Admin login)
app.get('/api/portal/orders/:id', (req, res) => {
  const cleanId = (req.params.id || '').trim();
  const token = (req.query.token as string) || '';
  if (token && !verifyPortalToken(cleanId, token)) {
    return res.status(403).json({ error: 'Token formulir tidak valid' });
  }

  const data = loadData();
  const order = data.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());
  if (!order) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
  }

  // Filter client response for security (do not expose supplier costs or staff margins)
  const rawCd = order.customerData || {};
  const safeCustomerData = {
    id: rawCd.id || `CUST-${order.id}`,
    fullName: rawCd.fullName || order.customerName || '',
    professionalTitle: rawCd.professionalTitle || '',
    email: rawCd.email || order.customerEmail || '',
    phone: rawCd.phone || order.customerPhone || '',
    city: rawCd.city || '',
    country: rawCd.country || 'Indonesia',
    summary: rawCd.summary || '',
    targetJobTitle: rawCd.targetJobTitle || '',
    targetCompany: rawCd.targetCompany || '',
    jobVacancySource: rawCd.jobVacancySource || '',
    coverLetterNotes: rawCd.coverLetterNotes || '',
    photoUrl: rawCd.photoUrl || undefined,
    educations: Array.isArray(rawCd.educations) ? rawCd.educations : [],
    experiences: Array.isArray(rawCd.experiences) ? rawCd.experiences : [],
    skills: Array.isArray(rawCd.skills) && rawCd.skills.length > 0 ? rawCd.skills : [
      { id: 'SKL-1', categoryName: 'Hard Skills & Tools', skills: [] },
      { id: 'SKL-2', categoryName: 'Soft Skills', skills: [] }
    ],
    certifications: Array.isArray(rawCd.certifications) ? rawCd.certifications : [],
    projects: Array.isArray(rawCd.projects) ? rawCd.projects : [],
    languages: Array.isArray(rawCd.languages) && rawCd.languages.length > 0 ? rawCd.languages : [
      { id: 'LNG-1', language: 'Bahasa Indonesia', proficiency: 'Penutur Asli' },
      { id: 'LNG-2', language: 'Bahasa Inggris', proficiency: 'Profesional' }
    ],
    socialLinks: Array.isArray(rawCd.socialLinks) ? rawCd.socialLinks : [],
    lastUpdated: rawCd.lastUpdated || new Date().toISOString()
  };

  res.json({
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    productType: order.productType,
    variation: order.variation,
    deadlineDate: order.deadlineDate,
    status: order.status,
    customerData: safeCustomerData,
    isFormLocked: order.isFormLocked,
    editRequestStatus: order.editRequestStatus,
    editRequestReason: order.editRequestReason,
    customerSubmittedAt: order.customerSubmittedAt
  });
});

const handlePutCustomerData = (req: express.Request, res: express.Response) => {
  const cleanId = (req.params.id || '').trim();
  const token = (req.query.token as string) || (req.body.token as string) || '';
  
  console.log('[PORTAL_WRITE_START]', {
    orderId: cleanId,
    method: 'PUT',
    path: req.originalUrl,
    contentType: req.headers['content-type'],
    userAgent: (req.headers['user-agent'] || '').slice(0, 50)
  });

  const isAuth = verifyPortalToken(cleanId, token);
  console.log('[PORTAL_WRITE_AUTH]', {
    orderId: cleanId,
    tokenProvided: !!token,
    authorized: isAuth
  });

  if (!isAuth) {
    console.warn('[PORTAL_WRITE_ERROR]', { orderId: cleanId, error: 'Token formulir tidak valid', status: 403 });
    return res.status(403).json({ error: 'Token formulir tidak valid' });
  }

  const { customerData, status, isFormLocked } = req.body;
  console.log('[PORTAL_WRITE_BODY]', {
    orderId: cleanId,
    hasCustomerData: !!customerData,
    customerName: customerData?.fullName || '',
    status: status || 'default',
    isFormLocked: isFormLocked ?? true
  });

  try {
    const data = loadData();
    let order = data.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());

    if (!order) {
      const now = new Date();
      order = {
        id: cleanId,
        customerName: customerData?.fullName || 'Klien Arise Career',
        customerPhone: customerData?.phone || '0812-0000-0000',
        customerEmail: customerData?.email || 'klien@gmail.com',
        productType: 'CV ATS-Friendly',
        variation: 'Standar',
        marketplaceOrderId: '',
        templateId: 'TMP-ATS-01',
        marketplace: 'Direct Link',
        orderDate: now.toISOString(),
        deadlineDate: new Date(now.getTime() + 48 * 3600000).toISOString(),
        status: status || 'Data Masuk',
        priority: 'Normal',
        paymentStatus: 'Lunas',
        price: 99000,
        customerData,
        revisions: [],
        files: [],
        isFormLocked: isFormLocked ?? true,
        editRequestStatus: 'none',
        customerSubmittedAt: now.toISOString()
      };
      data.orders.unshift(order);
    } else {
      order.customerData = customerData;
      if (status) order.status = status;
      if (isFormLocked !== undefined) order.isFormLocked = isFormLocked;
      order.editRequestStatus = 'none';
      order.customerSubmittedAt = new Date().toISOString();
    }

    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      orderId: cleanId,
      type: 'form_submitted',
      title: '📥 Data Formulir Masuk (HP/Client)',
      message: `Klien ${order.customerName} telah melengkapi dan mengirimkan data formulir untuk pesanan ${order.id} (${order.productType}).`,
      timestamp: new Date().toISOString(),
      isRead: false,
      customerName: order.customerName,
      productType: order.productType
    };
    data.notifications.unshift(newNotif);

    console.log('[PORTAL_WRITE_STORAGE]', {
      orderId: cleanId,
      totalOrders: data.orders.length,
      totalNotifs: data.notifications.length,
      storagePath: getDataFilePath()
    });

    saveData(data);

    // Read-back verification from storage to guarantee data was written
    const verifiedData = loadData();
    const verifiedOrder = verifiedData.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());
    if (!verifiedOrder) {
      throw new Error('Read-back verification failed: order was not written to storage');
    }

    console.log('[PORTAL_WRITE_SUCCESS]', {
      orderId: cleanId,
      orderStatus: order.status,
      isFormLocked: order.isFormLocked,
      notificationId: newNotif.id,
      verified: true
    });

    res.json({ success: true, order: verifiedOrder, notification: newNotif });
  } catch (err: any) {
    console.error('[PORTAL_WRITE_ERROR]', { orderId: cleanId, error: err?.message || String(err), status: 500 });
    res.status(500).json({ error: 'Gagal menyimpan data ke database server' });
  }
};

const handlePostRequestEdit = (req: express.Request, res: express.Response) => {
  const cleanId = (req.params.id || '').trim();
  const token = (req.query.token as string) || (req.body.token as string) || '';

  console.log('[REQUEST_EDIT_START]', {
    orderId: cleanId,
    method: 'POST',
    path: req.originalUrl,
    contentType: req.headers['content-type'],
    userAgent: (req.headers['user-agent'] || '').slice(0, 50)
  });

  const isAuth = verifyPortalToken(cleanId, token);
  console.log('[REQUEST_EDIT_AUTH]', {
    orderId: cleanId,
    tokenProvided: !!token,
    authorized: isAuth
  });

  if (!isAuth) {
    console.warn('[REQUEST_EDIT_ERROR]', { orderId: cleanId, error: 'Token formulir tidak valid', status: 403 });
    return res.status(403).json({ error: 'Token formulir tidak valid' });
  }

  const { reason } = req.body;

  try {
    const data = loadData();
    let order = data.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());

    if (!order) {
      const now = new Date();
      order = {
        id: cleanId,
        customerName: 'Klien Arise Career',
        customerPhone: '0812-0000-0000',
        customerEmail: 'klien@gmail.com',
        productType: 'CV ATS-Friendly',
        variation: 'Standar',
        marketplaceOrderId: '',
        templateId: 'TMP-ATS-01',
        marketplace: 'Direct Link',
        orderDate: now.toISOString(),
        deadlineDate: new Date(now.getTime() + 48 * 3600000).toISOString(),
        status: 'Data Masuk',
        priority: 'Normal',
        paymentStatus: 'Lunas',
        price: 99000,
        customerData: undefined,
        revisions: [],
        files: [],
        isFormLocked: true,
        editRequestStatus: 'requested',
        editRequestReason: reason || 'Klien ingin memperbarui data profil/pengalaman',
        customerSubmittedAt: now.toISOString()
      };
      data.orders.unshift(order);
    } else {
      order.editRequestStatus = 'requested';
      order.editRequestReason = reason || 'Klien ingin memperbarui data profil/pengalaman';
    }

    const newNotif = {
      id: `NOTIF-${Date.now()}`,
      orderId: cleanId,
      type: 'edit_requested',
      title: '🔔 Permintaan Ubah Data dari HP/Klien',
      message: `Klien ${order.customerName} (#${order.id}) meminta izin ubah data: "${order.editRequestReason}".`,
      timestamp: new Date().toISOString(),
      isRead: false,
      customerName: order.customerName,
      productType: order.productType
    };
    data.notifications.unshift(newNotif);

    console.log('[REQUEST_EDIT_STORAGE]', {
      orderId: cleanId,
      reason: order.editRequestReason,
      storagePath: getDataFilePath()
    });

    console.log('[REQUEST_EDIT_NOTIFICATION]', {
      orderId: cleanId,
      notificationId: newNotif.id,
      title: newNotif.title
    });

    saveData(data);

    // Read-back verification from storage to guarantee data and notification were written
    const verifiedData = loadData();
    const verifiedOrder = verifiedData.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());
    const verifiedNotif = verifiedData.notifications.find((n) => n.id === newNotif.id);
    if (!verifiedOrder || !verifiedNotif) {
      throw new Error('Read-back verification failed: order or notification was not written to storage');
    }

    console.log('[REQUEST_EDIT_SUCCESS]', {
      orderId: cleanId,
      editRequestStatus: order.editRequestStatus,
      verified: true
    });

    res.json({ success: true, order: verifiedOrder, notification: verifiedNotif });
  } catch (err: any) {
    console.error('[REQUEST_EDIT_ERROR]', { orderId: cleanId, error: err?.message || String(err), status: 500 });
    res.status(500).json({ error: 'Gagal memproses permintaan ubah data ke database server' });
  }
};

app.put('/api/portal/orders/:id/customer-data', handlePutCustomerData);
app.put('/portal/orders/:id/customer-data', handlePutCustomerData);
app.post('/api/portal/orders/:id/request-edit', handlePostRequestEdit);
app.post('/portal/orders/:id/request-edit', handlePostRequestEdit);

// GET all orders
app.get('/api/orders', (req, res) => {
  const data = loadData();
  res.json(data.orders);
});

// POST initialize/save full orders list (from admin initial state)
app.post('/api/orders/batch-sync', (req, res) => {
  const incomingOrders = req.body.orders || [];
  const data = loadData();
  
  // Merge incoming with existing
  const orderMap = new Map();
  data.orders.forEach((o) => orderMap.set(o.id, o));
  incomingOrders.forEach((o: any) => {
    // If incoming is newer or existing doesn't exist, set it
    const existing = orderMap.get(o.id);
    if (!existing) {
      orderMap.set(o.id, o);
    } else {
      // Merge smartly
      orderMap.set(o.id, { ...existing, ...o });
    }
  });

  data.orders = Array.from(orderMap.values());
  saveData(data);
  res.json({ success: true, count: data.orders.length });
});

// GET single order
app.get('/api/orders/:id', (req, res) => {
  const cleanId = (req.params.id || '').trim();
  const data = loadData();
  const order = data.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());
  if (order) {
    return res.json(order);
  }
  res.status(404).json({ error: 'Order not found' });
});

// POST / PUT single order (create or update)
app.post('/api/orders', (req, res) => {
  const order = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ error: 'Invalid order data' });
  }
  const data = loadData();
  const idx = data.orders.findIndex((o) => o.id === order.id);
  if (idx >= 0) {
    data.orders[idx] = { ...data.orders[idx], ...order };
  } else {
    data.orders.unshift(order);
  }
  saveData(data);
  res.json({ success: true, order });
});

// PUT update customer form data (Client submission from HP/PC)
app.put('/api/orders/:id/customer-data', (req, res) => {
  const { id } = req.params;
  const { customerData, status, isFormLocked } = req.body;
  const data = loadData();
  let order = data.orders.find((o) => o.id === id);

  if (!order) {
    // Auto-create order if submitted directly from client link
    const now = new Date();
    order = {
      id,
      customerName: customerData?.fullName || 'Klien Arise Career',
      customerPhone: customerData?.phone || '0812-0000-0000',
      customerEmail: customerData?.email || 'klien@gmail.com',
      productType: 'CV ATS-Friendly',
      variation: 'Standar',
      marketplaceOrderId: '',
      templateId: 'TMP-ATS-01',
      marketplace: 'Direct Link',
      orderDate: now.toISOString(),
      deadlineDate: new Date(now.getTime() + 48 * 3600000).toISOString(),
      status: status || 'Data Masuk',
      priority: 'Normal',
      paymentStatus: 'Lunas',
      price: 99000,
      customerData,
      revisions: [],
      files: [],
      isFormLocked: isFormLocked ?? true,
      editRequestStatus: 'none',
      customerSubmittedAt: now.toISOString()
    };
    data.orders.unshift(order);
  } else {
    order.customerData = customerData;
    if (status) order.status = status;
    if (isFormLocked !== undefined) order.isFormLocked = isFormLocked;
    order.editRequestStatus = 'none';
    order.customerSubmittedAt = new Date().toISOString();
  }

  // Create real-time notification for seller
  const newNotif = {
    id: `NOTIF-${Date.now()}`,
    orderId: id,
    type: 'form_submitted',
    title: '📥 Data Formulir Masuk (HP/Client)',
    message: `Klien ${order.customerName} telah melengkapi dan mengirimkan data formulir untuk pesanan ${order.id} (${order.productType}).`,
    timestamp: new Date().toISOString(),
    isRead: false,
    customerName: order.customerName,
    productType: order.productType
  };
  data.notifications.unshift(newNotif);

  saveData(data);
  res.json({ success: true, order, notification: newNotif });
});

// POST Client requests edit / unlock
app.post('/api/orders/:id/request-edit', (req, res) => {
  const cleanId = (req.params.id || '').trim();
  const { reason } = req.body;
  const data = loadData();
  let order = data.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());

  if (!order) {
    const now = new Date();
    order = {
      id: cleanId,
      customerName: 'Klien Arise Career',
      customerPhone: '0812-0000-0000',
      customerEmail: 'klien@gmail.com',
      productType: 'CV ATS-Friendly',
      variation: 'Standar',
      marketplaceOrderId: '',
      templateId: 'TMP-ATS-01',
      marketplace: 'Direct Link',
      orderDate: now.toISOString(),
      deadlineDate: new Date(now.getTime() + 48 * 3600000).toISOString(),
      status: 'Data Masuk',
      priority: 'Normal',
      paymentStatus: 'Lunas',
      price: 99000,
      customerData: undefined,
      revisions: [],
      files: [],
      isFormLocked: true,
      editRequestStatus: 'requested',
      editRequestReason: reason || 'Klien ingin memperbarui data profil/pengalaman',
      customerSubmittedAt: now.toISOString()
    };
    data.orders.unshift(order);
  } else {
    order.editRequestStatus = 'requested';
    order.editRequestReason = reason || 'Klien ingin memperbarui data profil/pengalaman';
  }

  // Create real-time notification for seller
  const newNotif = {
    id: `NOTIF-${Date.now()}`,
    orderId: cleanId,
    type: 'edit_requested',
    title: '🔔 Permintaan Ubah Data dari HP/Klien',
    message: `Klien ${order.customerName} (#${order.id}) meminta izin ubah data: "${order.editRequestReason}".`,
    timestamp: new Date().toISOString(),
    isRead: false,
    customerName: order.customerName,
    productType: order.productType
  };
  data.notifications.unshift(newNotif);

  saveData(data);
  res.json({ success: true, order, notification: newNotif });
});

// POST Seller approves edit / unlock form
app.post('/api/orders/:id/approve-edit', (req, res) => {
  const cleanId = (req.params.id || '').trim();
  const data = loadData();
  const order = data.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.isFormLocked = false;
  order.editRequestStatus = 'approved';

  // Create notification
  const newNotif = {
    id: `NOTIF-${Date.now()}`,
    orderId: cleanId,
    type: 'edit_approved',
    title: '🔓 Izin Edit Disetujui',
    message: `Formulir pesanan ${order.id} (${order.customerName}) telah dibuka kuncinya agar klien dapat memperbarui data di HP/PC.`,
    timestamp: new Date().toISOString(),
    isRead: false,
    customerName: order.customerName,
    productType: order.productType
  };
  data.notifications.unshift(newNotif);

  saveData(data);
  res.json({ success: true, order, notification: newNotif });
});

// GET notifications
app.get('/api/notifications', (req, res) => {
  const data = loadData();
  res.json(data.notifications || []);
});

// PUT mark notification read
app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const data = loadData();
  const notif = data.notifications.find((n: any) => n.id === id);
  if (notif) notif.isRead = true;
  saveData(data);
  res.json({ success: true });
});

// PUT mark all notifications read
app.put('/api/notifications/read-all', (req, res) => {
  const data = loadData();
  data.notifications.forEach((n: any) => (n.isRead = true));
  saveData(data);
  res.json({ success: true });
});

// Start Vite middleware in dev or static in production
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(process.cwd(), 'dist'))) {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Serve index.html transformed by Vite for all non-API GET routes
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port} (0.0.0.0:${port})`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
