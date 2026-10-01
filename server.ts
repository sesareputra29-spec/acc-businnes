import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { firestoreDb } from './src/services/firestoreDb';
import { Order, AppNotification } from './src/types';

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
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    database: 'Cloud Firestore (Persistent)',
    time: new Date().toISOString()
  });
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
  
  console.log('[PORTAL_WRITE_START]', {
    orderId: cleanId,
    method: 'PUT',
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
    // 1. Write to Persistent Cloud Firestore Database with Read-Back verification
    const result = await firestoreDb.saveCustomerData(cleanId, customerData, status, isFormLocked);

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

    console.log('[PORTAL_WRITE_SUCCESS]', {
      orderId: cleanId,
      orderStatus: result.order.status,
      isFormLocked: result.order.isFormLocked,
      notificationId: result.notification.id,
      verified: true
    });

    res.json({ success: true, order: result.order, notification: result.notification });
  } catch (err: any) {
    console.error('[PORTAL_WRITE_ERROR]', { orderId: cleanId, error: err?.message || String(err), status: 500 });
    res.status(500).json({ error: 'Gagal menyimpan data ke persistent database' });
  }
};

app.put('/api/portal/orders/:id/customer-data', handlePutCustomerData);
app.put('/portal/orders/:id/customer-data', handlePutCustomerData);

// CLIENT PORTAL POST REQUEST EDIT (WITH READ-BACK VERIFICATION)
const handlePostRequestEdit = async (req: express.Request, res: express.Response) => {
  const cleanId = (req.params.id || '').trim();
  const token = (req.query.token as string) || (req.body.token as string) || '';

  console.log('[REQUEST_EDIT_START]', {
    orderId: cleanId,
    method: 'POST',
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
    // 1. Write to Persistent Cloud Firestore Database with Read-Back verification
    const result = await firestoreDb.requestEdit(cleanId, reason);

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

    console.log('[REQUEST_EDIT_SUCCESS]', {
      orderId: cleanId,
      editRequestStatus: result.order.editRequestStatus,
      notificationId: result.notification.id,
      verified: true
    });

    res.json({ success: true, order: result.order, notification: result.notification });
  } catch (err: any) {
    console.error('[REQUEST_EDIT_ERROR]', { orderId: cleanId, error: err?.message || String(err), status: 500 });
    res.status(500).json({ error: 'Gagal memproses permintaan ubah data ke database' });
  }
};

app.post('/api/portal/orders/:id/request-edit', handlePostRequestEdit);
app.post('/portal/orders/:id/request-edit', handlePostRequestEdit);

// SELLER APPROVES EDIT / UNLOCKS FORM (WITH READ-BACK VERIFICATION)
app.post('/api/orders/:id/approve-edit', async (req, res) => {
  const cleanId = (req.params.id || '').trim();
  try {
    const result = await firestoreDb.approveEdit(cleanId);
    
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
    console.error('[APPROVE_EDIT_ERROR]', err);
    res.status(500).json({ error: err?.message || 'Gagal menyetujui perubahan data' });
  }
});

// GET ALL ORDERS (SELLER)
app.get('/api/orders', async (req, res) => {
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
});

// GET SINGLE ORDER (SELLER)
app.get('/api/orders/:id', async (req, res) => {
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
});

// POST CREATE ORDER (SELLER)
app.post('/api/orders', async (req, res) => {
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
});

// POST BATCH SYNC ORDERS
app.post('/api/orders/batch-sync', async (req, res) => {
  const incomingOrders = req.body.orders || [];
  try {
    for (const ord of incomingOrders) {
      await firestoreDb.saveOrder(ord);
    }
    const current = await firestoreDb.getOrders();
    res.json({ success: true, count: current.length });
  } catch (err) {
    res.status(500).json({ error: 'Batch sync failed' });
  }
});

// GET ALL NOTIFICATIONS (SELLER)
app.get('/api/notifications', async (req, res) => {
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
});

// PUT MARK NOTIFICATION READ
app.put('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    await firestoreDb.markNotificationRead(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PUT MARK ALL NOTIFICATIONS READ
app.put('/api/notifications/read-all', async (req, res) => {
  try {
    await firestoreDb.markAllNotificationsRead();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all notifications read' });
  }
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
      if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/portal/')) {
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
