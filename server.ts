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

// File-backed persistence for server data
const DATA_FILE = path.join(process.cwd(), '.app_data.json');

interface ServerData {
  orders: any[];
  notifications: any[];
  lastUpdated: string;
}

function loadData(): ServerData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading data file:', err);
  }
  return {
    orders: [],
    notifications: [],
    lastUpdated: new Date().toISOString()
  };
}

function saveData(data: ServerData) {
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data file:', err);
  }
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

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
  const { id } = req.params;
  const data = loadData();
  const order = data.orders.find((o) => o.id === id);
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
  const { id } = req.params;
  const { reason } = req.body;
  const data = loadData();
  let order = data.orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.editRequestStatus = 'requested';
  order.editRequestReason = reason || 'Klien ingin memperbarui data profil/pengalaman';

  // Create real-time notification for seller
  const newNotif = {
    id: `NOTIF-${Date.now()}`,
    orderId: id,
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
  const { id } = req.params;
  const data = loadData();
  const order = data.orders.find((o) => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.isFormLocked = false;
  order.editRequestStatus = 'approved';

  // Create notification
  const newNotif = {
    id: `NOTIF-${Date.now()}`,
    orderId: id,
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

startServer();
