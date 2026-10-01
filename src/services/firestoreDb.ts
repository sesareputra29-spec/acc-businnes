import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, AppNotification } from '../types';

const ORDERS_COL = 'orders';
const NOTIFS_COL = 'notifications';

// Clean document data for Firestore (remove undefined values & guard against oversized base64 payloads)
function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'string') {
    if (obj.startsWith('data:') && obj.length > 300000) {
      return '[ATTACHMENT_PREVIEW_STORED_LOCALLY]';
    }
    return obj;
  }
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        if (k === 'files' && Array.isArray(v)) {
          cleaned[k] = v.map((f: any) => {
            if (f && typeof f === 'object' && f.url && typeof f.url === 'string' && f.url.startsWith('data:') && f.url.length > 100000) {
              return { ...f, url: '' };
            }
            return cleanForFirestore(f);
          });
        } else {
          cleaned[k] = cleanForFirestore(v);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

export const firestoreDb = {
  async getOrders(): Promise<Order[]> {
    try {
      const q = query(collection(db, ORDERS_COL), orderBy('orderDate', 'desc'), limit(100));
      const snap = await getDocs(q);
      const orders: Order[] = [];
      snap.forEach((docSnap) => {
        orders.push(docSnap.data() as Order);
      });
      return orders;
    } catch (err) {
      console.error('[FIRESTORE_GET_ORDERS_ERROR]', err);
      // Fallback: try simple getDocs without orderBy index requirement
      const snap = await getDocs(collection(db, ORDERS_COL));
      const orders: Order[] = [];
      snap.forEach((docSnap) => {
        orders.push(docSnap.data() as Order);
      });
      return orders.sort((a, b) => new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime());
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const cleanId = orderId.trim();
    const docRef = doc(db, ORDERS_COL, cleanId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as Order;
  },

  async saveOrder(order: Order): Promise<Order> {
    const cleanId = order.id.trim();
    const docRef = doc(db, ORDERS_COL, cleanId);
    const cleaned = cleanForFirestore(order);
    await setDoc(docRef, cleaned, { merge: true });

    // Read-back verification
    const verified = await this.getOrderById(cleanId);
    if (!verified) {
      throw new Error(`Read-back verification failed for order ${cleanId}`);
    }
    return verified;
  },

  async saveCustomerData(
    orderId: string,
    customerData: any,
    status?: string,
    isFormLocked?: boolean
  ): Promise<{ order: Order; notification: AppNotification }> {
    const cleanId = orderId.trim();
    let existing = await this.getOrderById(cleanId);
    const now = new Date();

    if (!existing) {
      existing = {
        id: cleanId,
        customerName: customerData?.fullName || 'Klien Arise Career',
        customerPhone: customerData?.phone || '0812-0000-0000',
        customerEmail: customerData?.email || 'klien@gmail.com',
        productType: 'CV ATS-Friendly',
        variation: 'Standar',
        marketplaceOrderId: '',
        templateId: 'TMP-ATS-01',
        marketplace: 'WhatsApp',
        orderDate: now.toISOString(),
        deadlineDate: new Date(now.getTime() + 48 * 3600000).toISOString(),
        status: (status as any) || 'Data Masuk',
        priority: 'Normal',
        paymentStatus: 'Lunas',
        price: 99000,
        customerData: customerData as any,
        revisions: [],
        files: [],
        isFormLocked: isFormLocked ?? true,
        editRequestStatus: 'none',
        customerSubmittedAt: now.toISOString()
      };
    } else {
      existing.customerData = customerData;
      if (status) existing.status = status as any;
      if (isFormLocked !== undefined) existing.isFormLocked = isFormLocked;
      existing.editRequestStatus = 'none';
      existing.customerSubmittedAt = now.toISOString();
    }

    const docRef = doc(db, ORDERS_COL, cleanId);
    await setDoc(docRef, cleanForFirestore(existing), { merge: true });

    // Read-back verification
    const verifiedOrder = await this.getOrderById(cleanId);
    if (!verifiedOrder) {
      throw new Error(`Read-back verification failed for order ${cleanId}`);
    }

    // Create persistent notification
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}`,
      orderId: cleanId,
      type: 'form_submitted',
      title: '📥 Data Formulir Masuk (HP/Client)',
      message: `Klien ${verifiedOrder.customerName} telah melengkapi dan mengirimkan data formulir untuk pesanan ${verifiedOrder.id} (${verifiedOrder.productType}).`,
      timestamp: now.toISOString(),
      isRead: false,
      customerName: verifiedOrder.customerName,
      productType: verifiedOrder.productType
    };

    await this.addNotification(newNotif);

    return { order: verifiedOrder, notification: newNotif };
  },

  async requestEdit(orderId: string, reason?: string): Promise<{ order: Order; notification: AppNotification }> {
    const cleanId = orderId.trim();
    let order = await this.getOrderById(cleanId);
    const now = new Date();

    if (!order) {
      order = {
        id: cleanId,
        customerName: 'Klien Arise Career',
        customerPhone: '0812-0000-0000',
        customerEmail: 'klien@gmail.com',
        productType: 'CV ATS-Friendly',
        variation: 'Standar',
        marketplaceOrderId: '',
        templateId: 'TMP-ATS-01',
        marketplace: 'WhatsApp',
        orderDate: now.toISOString(),
        deadlineDate: new Date(now.getTime() + 48 * 3600000).toISOString(),
        status: 'Data Masuk',
        priority: 'Normal',
        paymentStatus: 'Lunas',
        price: 99000,
        customerData: undefined as any,
        revisions: [],
        files: [],
        isFormLocked: true,
        editRequestStatus: 'requested',
        editRequestReason: reason || 'Klien ingin memperbarui data profil/pengalaman',
        customerSubmittedAt: now.toISOString()
      };
    } else {
      order.editRequestStatus = 'requested';
      order.editRequestReason = reason || 'Klien ingin memperbarui data profil/pengalaman';
    }

    const docRef = doc(db, ORDERS_COL, cleanId);
    await setDoc(docRef, cleanForFirestore(order), { merge: true });

    // Read-back verification
    const verifiedOrder = await this.getOrderById(cleanId);
    if (!verifiedOrder) {
      throw new Error(`Read-back verification failed for order ${cleanId}`);
    }

    // Create persistent notification for seller
    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}`,
      orderId: cleanId,
      type: 'edit_requested',
      title: '🔔 Permintaan Ubah Data dari HP/Klien',
      message: `Klien ${verifiedOrder.customerName} (#${verifiedOrder.id}) meminta izin ubah data: "${verifiedOrder.editRequestReason}".`,
      timestamp: now.toISOString(),
      isRead: false,
      customerName: verifiedOrder.customerName,
      productType: verifiedOrder.productType
    };

    await this.addNotification(newNotif);

    return { order: verifiedOrder, notification: newNotif };
  },

  async approveEdit(orderId: string): Promise<{ order: Order; notification: AppNotification }> {
    const cleanId = orderId.trim();
    const order = await this.getOrderById(cleanId);
    if (!order) {
      throw new Error(`Order ${cleanId} not found`);
    }

    order.isFormLocked = false;
    order.editRequestStatus = 'approved';

    const docRef = doc(db, ORDERS_COL, cleanId);
    await setDoc(docRef, cleanForFirestore(order), { merge: true });

    const verifiedOrder = await this.getOrderById(cleanId);
    if (!verifiedOrder) {
      throw new Error(`Read-back verification failed after approve for order ${cleanId}`);
    }

    const newNotif: AppNotification = {
      id: `NOTIF-${Date.now()}`,
      orderId: cleanId,
      type: 'edit_approved',
      title: '🔓 Izin Edit Disetujui',
      message: `Formulir pesanan ${verifiedOrder.id} (${verifiedOrder.customerName}) telah dibuka kuncinya.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      customerName: verifiedOrder.customerName,
      productType: verifiedOrder.productType
    };

    await this.addNotification(newNotif);

    return { order: verifiedOrder, notification: newNotif };
  },

  async getNotifications(): Promise<AppNotification[]> {
    try {
      const q = query(collection(db, NOTIFS_COL), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      const notifs: AppNotification[] = [];
      snap.forEach((docSnap) => {
        notifs.push(docSnap.data() as AppNotification);
      });
      return notifs;
    } catch {
      const snap = await getDocs(collection(db, NOTIFS_COL));
      const notifs: AppNotification[] = [];
      snap.forEach((docSnap) => {
        notifs.push(docSnap.data() as AppNotification);
      });
      return notifs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()).slice(0, 50);
    }
  },

  async addNotification(notif: AppNotification): Promise<AppNotification> {
    const docRef = doc(db, NOTIFS_COL, notif.id);
    await setDoc(docRef, cleanForFirestore(notif), { merge: true });
    return notif;
  },

  async markNotificationRead(notifId: string): Promise<void> {
    const docRef = doc(db, NOTIFS_COL, notifId);
    await updateDoc(docRef, { isRead: true });
  },

  async markAllNotificationsRead(): Promise<void> {
    const snap = await getDocs(collection(db, NOTIFS_COL));
    const promises: Promise<any>[] = [];
    snap.forEach((docSnap) => {
      promises.push(updateDoc(docSnap.ref, { isRead: true }));
    });
    await Promise.all(promises);
  },

  async runDiagnosticTest(): Promise<{ write: 'PASS' | 'FAIL'; readBack: 'PASS' | 'FAIL'; delete: 'PASS' | 'FAIL'; latencyMs: number }> {
    const start = Date.now();
    const testId = `diag_test_${Date.now()}`;
    const testDocRef = doc(db, '_debug_test', testId);

    // 1. Write Test Document
    await setDoc(testDocRef, {
      testId,
      timestamp: new Date().toISOString(),
      agent: 'Vercel Production Diagnostics'
    });

    // 2. Read-Back Test Document
    const snap = await getDoc(testDocRef);
    const readBackSuccess = snap.exists() && snap.data()?.testId === testId;

    // 3. Delete Test Document
    await deleteDoc(testDocRef);

    return {
      write: 'PASS',
      readBack: readBackSuccess ? 'PASS' : 'FAIL',
      delete: 'PASS',
      latencyMs: Date.now() - start
    };
  }
};
