import fs from 'fs';
import path from 'path';
import { firestoreDb } from './firestoreDb';
import { Order, AppNotification } from '../types';

export async function runMigration(): Promise<{ ordersCount: number; notifsCount: number }> {
  console.log('[MIGRATION_START] Starting migration from .app_data.json to Cloud Firestore...');
  const jsonPath = path.join(process.cwd(), '.app_data.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.warn('[MIGRATION_WARN] .app_data.json not found, skipping initial JSON seed.');
    return { ordersCount: 0, notifsCount: 0 };
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);
  const orders: Order[] = data.orders || [];
  const notifs: AppNotification[] = data.notifications || [];

  console.log(`[MIGRATION_INFO] Found ${orders.length} orders and ${notifs.length} notifications in .app_data.json`);

  let ordersMigrated = 0;
  for (const ord of orders) {
    try {
      await firestoreDb.saveOrder(ord);
      ordersMigrated++;
    } catch (err) {
      console.error(`[MIGRATION_ERROR] Failed to migrate order ${ord.id}:`, err);
    }
  }

  let notifsMigrated = 0;
  for (const notif of notifs) {
    try {
      await firestoreDb.addNotification(notif);
      notifsMigrated++;
    } catch (err) {
      console.error(`[MIGRATION_ERROR] Failed to migrate notification ${notif.id}:`, err);
    }
  }

  console.log(`[MIGRATION_SUCCESS] Migrated ${ordersMigrated}/${orders.length} orders and ${notifsMigrated}/${notifs.length} notifications to Cloud Firestore.`);
  return { ordersCount: ordersMigrated, notifsCount: notifsMigrated };
}
