import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { firestoreDb } from './src/services/firestoreDb';
import { Order, AppNotification } from './src/types';

const app = express();
const port = 3000;

app.use(express.json({ limit: '20mb' }));

// Cross-origin headers and Cache-Control headers for all requests
app.use((req, res, next) => {
  const traceId = (req.headers['x-trace-id'] as string) || `TRACE-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  res.setHeader('X-Trace-ID', traceId);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Trace-ID');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/portal/')) {
    console.log('[HTTP_REQUEST]', {
      traceId,
      method: req.method,
      path: req.originalUrl,
      origin: req.headers.origin || '',
      userAgent: (req.headers['user-agent'] || '').slice(0, 60)
    });

    res.on('finish', () => {
      console.log('[HTTP_RESPONSE]', {
        traceId,
        status: res.statusCode,
        path: req.originalUrl
      });
    });
  }

  next();
});

// Seed JSON data fallback
const DATA_FILE = path.join(process.cwd(), '.app_data.json');
interface ServerData {
  orders: Order[];
  notifications: AppNotification[];
  lastUpdated: string;
}

function loadLocalSeed(): ServerData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading seed data file:', err);
  }
  return {
    orders: [],
    notifications: [],
    lastUpdated: new Date().toISOString()
  };
}

function saveLocalSeed(data: ServerData) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving seed data file:', err);
  }
}

// REST API Endpoints
const handleHealth = async (req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    database: 'Cloud Firestore (Persistent)',
    time: new Date().toISOString()
  });
};

app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// Version debug endpoint
const handleVersion = (req: express.Request, res: express.Response) => {
  res.json({
    commit: 'production-release-v2.1',
    build: '2026-10-01T04:56:00Z',
    environment: 'production',
    storage: 'firestore',
    projectId: 'arise-career-craft-510204',
    databaseId: 'ai-studio-arisecareercraft-9fa42135-0cda-4eac-ba4a-adf2dd1804fb'
  });
};

app.get('/api/debug/version', handleVersion);
app.get('/debug/version', handleVersion);

// Firestore connectivity debug endpoint
const handleDebugFirestore = async (req: express.Request, res: express.Response) => {
  try {
    let ordersReadable = false;
    let notifsReadable = false;
    try {
      const orders = await firestoreDb.getOrders();
      ordersReadable = Array.isArray(orders);
    } catch {}

    try {
      const notifs = await firestoreDb.getNotifications();
      notifsReadable = Array.isArray(notifs);
    } catch {}

    res.json({
      connected: ordersReadable || notifsReadable,
      projectId: 'arise-career-craft-510204',
      databaseId: 'ai-studio-arisecareercraft-9fa42135-0cda-4eac-ba4a-adf2dd1804fb',
      ordersReadable,
      notificationsReadable: notifsReadable
    });
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      projectId: 'arise-career-craft-510204',
      databaseId: 'ai-studio-arisecareercraft-9fa42135-0cda-4eac-ba4a-adf2dd1804fb',
      ordersReadable: false,
      notificationsReadable: false,
      error: err?.message || String(err)
    });
  }
};

app.get('/api/debug/firestore', handleDebugFirestore);
app.get('/debug/firestore', handleDebugFirestore);

// Diagnostic test endpoint (WRITE -> READ-BACK -> DELETE)
const handleDebugFirestoreTest = async (req: express.Request, res: express.Response) => {
  try {
    const result = await firestoreDb.runDiagnosticTest();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      write: 'FAIL',
      readBack: 'FAIL',
      delete: 'FAIL',
      error: err?.message || String(err)
    });
  }
};

app.get('/api/debug/firestore-test', handleDebugFirestoreTest);
app.get('/debug/firestore-test', handleDebugFirestoreTest);

const handleConfig = (req: express.Request, res: express.Response) => {
  res.json({
    appUrl: process.env.APP_URL || '',
    time: new Date().toISOString()
  });
};

app.get('/api/config', handleConfig);
app.get('/config', handleConfig);

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

// CLIENT PORTAL GET ORDER
const handleGetPortalOrder = async (req: express.Request, res: express.Response) => {
  const cleanId = (req.params.id || '').trim();
  const token = (req.query.token as string) || '';
  if (token && !verifyPortalToken(cleanId, token)) {
    return res.status(403).json({ error: 'Token formulir tidak valid' });
  }

  try {
    let order = await firestoreDb.getOrderById(cleanId);
    if (!order) {
      // Check local seed
      const seed = loadLocalSeed();
      order = seed.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase()) || null;
      if (order) {
        // Save to firestore for future requests
        await firestoreDb.saveOrder(order);
      }
    }

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    // Filter client response for security (do not expose supplier costs or staff margins)
    const rawCd = (order.customerData as any) || {};
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
  } catch (err: any) {
    console.error('[PORTAL_GET_ERROR]', err);
    res.status(500).json({ error: 'Gagal mengambil data pesanan dari database' });
  }
};

app.get('/api/portal/orders/:id', handleGetPortalOrder);
app.get('/portal/orders/:id', handleGetPortalOrder);

// CLIENT PORTAL PUT CUSTOMER DATA (WITH READ-BACK VERIFICATION)
const handlePutCustomerData = async (req: express.Request, res: express.Response) => {
  const cleanId = (req.params.id || '').trim();
  const token = (req.query.token as string) || (req.body.token as string) || '';
  const traceId = res.getHeader('X-Trace-ID');
  
  console.log('[TRACE_CLIENT_SUBMIT]', {
    traceId,
    orderId: cleanId,
    timestamp: new Date().toISOString(),
    updatedSource: 'CLIENT_PORTAL',
    contentType: req.headers['content-type'],
    userAgent: (req.headers['user-agent'] || '').slice(0, 50)
  });

  const isAuth = verifyPortalToken(cleanId, token);
  if (!isAuth) {
    console.warn('[TRACE_CLIENT_SUBMIT_ERROR]', { traceId, orderId: cleanId, error: 'Token formulir tidak valid', status: 403 });
    return res.status(403).json({ error: 'Token formulir tidak valid' });
  }

  const { customerData, status, isFormLocked } = req.body;

  try {
    // 1. Write to Persistent Cloud Firestore Database with Read-Back verification
    const result = await firestoreDb.saveCustomerData(cleanId, customerData, status, isFormLocked);

    console.log('[TRACE_CLIENT_SUBMIT_SUCCESS]', {
      traceId,
      orderId: cleanId,
      updatedAt: result.order.updatedAt,
      updatedSource: result.order.updatedSource,
      verifiedName: result.order.customerData?.fullName || result.order.customerName,
      verifiedStatus: result.order.status,
      notificationId: result.notification.id
    });

    // 2. Also mirror to local seed for offline dev redundancy
    const seed = loadLocalSeed();
    const idx = seed.orders.findIndex(o => o.id === cleanId);
    if (idx !== -1) {
      seed.orders[idx] = result.order;
    } else {
      seed.orders.unshift(result.order);
    }
    seed.notifications.unshift(result.notification);
    saveLocalSeed(seed);

    res.json({ success: true, order: result.order, notification: result.notification });
  } catch (err: any) {
    console.error('[TRACE_CLIENT_SUBMIT_ERROR]', { traceId, orderId: cleanId, error: err?.message || String(err), status: 500 });
    res.status(500).json({ error: 'Gagal menyimpan data ke persistent database' });
  }
};

app.put('/api/portal/orders/:id/customer-data', handlePutCustomerData);
app.put('/portal/orders/:id/customer-data', handlePutCustomerData);

// CLIENT PORTAL POST REQUEST EDIT (WITH READ-BACK VERIFICATION)
const handlePostRequestEdit = async (req: express.Request, res: express.Response) => {
  const cleanId = (req.params.id || '').trim();
  const token = (req.query.token as string) || (req.body.token as string) || '';
  const traceId = res.getHeader('X-Trace-ID');

  console.log('[TRACE_EDIT_REQUEST]', {
    traceId,
    orderId: cleanId,
    timestamp: new Date().toISOString(),
    updatedSource: 'CLIENT_PORTAL',
    contentType: req.headers['content-type'],
    userAgent: (req.headers['user-agent'] || '').slice(0, 50)
  });

  const isAuth = verifyPortalToken(cleanId, token);
  if (!isAuth) {
    console.warn('[TRACE_EDIT_REQUEST_ERROR]', { traceId, orderId: cleanId, error: 'Token formulir tidak valid', status: 403 });
    return res.status(403).json({ error: 'Token formulir tidak valid' });
  }

  const { reason } = req.body;

  try {
    // 1. Write to Persistent Cloud Firestore Database with Read-Back verification
    const result = await firestoreDb.requestEdit(cleanId, reason);

    console.log('[TRACE_EDIT_REQUEST_SUCCESS]', {
      traceId,
      orderId: cleanId,
      notificationId: result.notification.id,
      timestamp: result.order.updatedAt,
      updatedSource: result.order.updatedSource,
      verifiedEditStatus: result.order.editRequestStatus
    });

    // 2. Also mirror to local seed
    const seed = loadLocalSeed();
    const idx = seed.orders.findIndex(o => o.id === cleanId);
    if (idx !== -1) {
      seed.orders[idx] = result.order;
    } else {
      seed.orders.unshift(result.order);
    }
    seed.notifications.unshift(result.notification);
    saveLocalSeed(seed);

    res.json({ success: true, order: result.order, notification: result.notification });
  } catch (err: any) {
    console.error('[TRACE_EDIT_REQUEST_ERROR]', { traceId, orderId: cleanId, error: err?.message || String(err), status: 500 });
    res.status(500).json({ error: 'Gagal memproses permintaan ubah data ke database' });
  }
};

app.post('/api/portal/orders/:id/request-edit', handlePostRequestEdit);
app.post('/portal/orders/:id/request-edit', handlePostRequestEdit);

// SELLER APPROVES EDIT / UNLOCKS FORM (WITH READ-BACK VERIFICATION)
const handleApproveEdit = async (req: express.Request, res: express.Response) => {
  const cleanId = (req.params.id || '').trim();
  const traceId = res.getHeader('X-Trace-ID');
  
  console.log('[TRACE_APPROVAL_WRITE]', {
    traceId,
    orderId: cleanId,
    timestamp: new Date().toISOString(),
    updatedSource: 'SELLER'
  });

  try {
    const result = await firestoreDb.approveEdit(cleanId);
    
    console.log('[TRACE_APPROVAL_WRITE_SUCCESS]', {
      traceId,
      orderId: cleanId,
      editRequestStatus: result.order.editRequestStatus,
      isFormLocked: result.order.isFormLocked,
      timestamp: result.order.updatedAt
    });

    // Mirror to local seed
    const seed = loadLocalSeed();
    const idx = seed.orders.findIndex(o => o.id === cleanId);
    if (idx !== -1) {
      seed.orders[idx] = result.order;
    }
    seed.notifications.unshift(result.notification);
    saveLocalSeed(seed);

    res.json({ success: true, order: result.order, notification: result.notification });
  } catch (err: any) {
    console.error('[TRACE_APPROVAL_WRITE_ERROR]', { traceId, orderId: cleanId, error: err?.message || String(err) });
    res.status(500).json({ error: err?.message || 'Gagal menyetujui perubahan data' });
  }
};

app.post('/api/orders/:id/approve-edit', handleApproveEdit);
app.post('/orders/:id/approve-edit', handleApproveEdit);

// GET ALL ORDERS (SELLER READ)
const handleGetOrders = async (req: express.Request, res: express.Response) => {
  const traceId = res.getHeader('X-Trace-ID');
  console.log('[TRACE_SELLER_LOAD]', {
    traceId,
    timestamp: new Date().toISOString(),
    action: 'READ_ONLY',
    target: 'Cloud Firestore orders collection'
  });

  try {
    let orders = await firestoreDb.getOrders();
    if (orders.length === 0) {
      const seed = loadLocalSeed();
      orders = seed.orders;
    }
    res.json(orders);
  } catch (err) {
    console.error('[GET_ORDERS_ERROR]', err);
    res.json(loadLocalSeed().orders);
  }
};

app.get('/api/orders', handleGetOrders);
app.get('/orders', handleGetOrders);

// GET SINGLE ORDER (SELLER)
const handleGetOrderById = async (req: express.Request, res: express.Response) => {
  const cleanId = (req.params.id || '').trim();
  try {
    let order = await firestoreDb.getOrderById(cleanId);
    if (!order) {
      const seed = loadLocalSeed();
      order = seed.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase()) || null;
    }
    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    res.json(order);
  } catch (err) {
    console.error('[GET_ORDER_ERROR]', err);
    const seed = loadLocalSeed();
    const order = seed.orders.find((o) => o.id.toLowerCase() === cleanId.toLowerCase());
    if (order) return res.json(order);
    res.status(500).json({ error: 'Gagal mengambil data pesanan' });
  }
};

app.get('/api/orders/:id', handleGetOrderById);
app.get('/orders/:id', handleGetOrderById);

// POST CREATE ORDER (SELLER)
const handlePostOrder = async (req: express.Request, res: express.Response) => {
  const newOrder = req.body;
  if (!newOrder.id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }
  try {
    const saved = await firestoreDb.saveOrder(newOrder);
    
    // Mirror to local seed
    const seed = loadLocalSeed();
    seed.orders.unshift(saved);
    saveLocalSeed(seed);

    res.status(201).json(saved);
  } catch (err) {
    console.error('[CREATE_ORDER_ERROR]', err);
    res.status(500).json({ error: 'Gagal membuat pesanan di database' });
  }
};

app.post('/api/orders', handlePostOrder);
app.post('/orders', handlePostOrder);

// POST BATCH SYNC ORDERS (Safe: only inserts non-existing orders, never overwrites existing modified orders)
const handleBatchSync = async (req: express.Request, res: express.Response) => {
  const incomingOrders = req.body.orders || [];
  try {
    for (const ord of incomingOrders) {
      const existing = await firestoreDb.getOrderById(ord.id);
      if (!existing) {
        await firestoreDb.saveOrder(ord);
      }
    }
    const current = await firestoreDb.getOrders();
    res.json({ success: true, count: current.length });
  } catch (err) {
    res.status(500).json({ error: 'Batch sync failed' });
  }
};

app.post('/api/orders/batch-sync', handleBatchSync);
app.post('/orders/batch-sync', handleBatchSync);

// GET ALL NOTIFICATIONS (SELLER READ)
const handleGetNotifications = async (req: express.Request, res: express.Response) => {
  const traceId = res.getHeader('X-Trace-ID');
  console.log('[TRACE_NOTIFICATION_READ]', {
    traceId,
    timestamp: new Date().toISOString(),
    action: 'READ_ONLY',
    target: 'Cloud Firestore notifications collection'
  });

  try {
    let notifs = await firestoreDb.getNotifications();
    if (notifs.length === 0) {
      notifs = loadLocalSeed().notifications;
    }
    res.json(notifs);
  } catch (err) {
    console.error('[GET_NOTIFS_ERROR]', err);
    res.json(loadLocalSeed().notifications);
  }
};

app.get('/api/notifications', handleGetNotifications);
app.get('/notifications', handleGetNotifications);

// PUT MARK NOTIFICATION READ
const handleMarkNotificationRead = async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  try {
    await firestoreDb.markNotificationRead(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

app.put('/api/notifications/:id/read', handleMarkNotificationRead);
app.put('/notifications/:id/read', handleMarkNotificationRead);

// PUT MARK ALL NOTIFICATIONS READ
const handleMarkAllNotificationsRead = async (req: express.Request, res: express.Response) => {
  try {
    await firestoreDb.markAllNotificationsRead();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications read' });
  }
};

app.put('/api/notifications/read-all', handleMarkAllNotificationsRead);
app.put('/notifications/read-all', handleMarkAllNotificationsRead);

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
      if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/portal/') || req.originalUrl.startsWith('/debug/')) {
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
    console.log(`Server listening on port ${port} (0.0.0.0:${port}) with Cloud Firestore Persistent Database`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
