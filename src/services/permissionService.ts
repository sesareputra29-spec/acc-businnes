import { UserRole } from '../types';

export type PermissionKey =
  | 'orders.view'
  | 'orders.create'
  | 'orders.edit'
  | 'orders.delete'
  | 'production.view'
  | 'production.update_status'
  | 'production.assign_staff'
  | 'builder.cv'
  | 'builder.portfolio'
  | 'builder.cover_letter'
  | 'templates.view'
  | 'templates.manage'
  | 'revisions.view'
  | 'revisions.manage'
  | 'files.view'
  | 'files.export'
  | 'customers.view'
  | 'customers.edit'
  | 'shopee.view'
  | 'shopee.sync'
  | 'shopee.manage_mapping'
  | 'reports.view_financials'
  | 'reports.export_csv'
  | 'staff.view'
  | 'staff.manage'
  | 'settings.view'
  | 'settings.manage';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  Admin: [
    'orders.view',
    'orders.create',
    'orders.edit',
    'orders.delete',
    'production.view',
    'production.update_status',
    'production.assign_staff',
    'builder.cv',
    'builder.portfolio',
    'builder.cover_letter',
    'templates.view',
    'templates.manage',
    'revisions.view',
    'revisions.manage',
    'files.view',
    'files.export',
    'customers.view',
    'customers.edit',
    'shopee.view',
    'shopee.sync',
    'shopee.manage_mapping',
    'reports.view_financials',
    'reports.export_csv',
    'staff.view',
    'staff.manage',
    'settings.view',
    'settings.manage'
  ],
  Operator: [
    'orders.view',
    'orders.create',
    'orders.edit',
    'production.view',
    'production.update_status',
    'production.assign_staff',
    'builder.cv',
    'builder.portfolio',
    'builder.cover_letter',
    'templates.view',
    'revisions.view',
    'revisions.manage',
    'files.view',
    'files.export',
    'customers.view',
    'customers.edit',
    'shopee.view',
    'shopee.sync',
    'shopee.manage_mapping',
    'staff.view',
    'settings.view'
  ],
  Designer: [
    'orders.view',
    'production.view',
    'production.update_status',
    'builder.cv',
    'builder.portfolio',
    'builder.cover_letter',
    'templates.view',
    'revisions.view',
    'revisions.manage',
    'files.view',
    'files.export',
    'customers.view'
  ]
};

export const hasPermission = (role: UserRole, permission: PermissionKey): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const canAccessTab = (role: UserRole, tabId: string): boolean => {
  switch (tabId) {
    case 'dashboard':
      return true;
    case 'pesanan':
      return hasPermission(role, 'orders.view');
    case 'produksi':
      return hasPermission(role, 'production.view');
    case 'cv-builder':
      return hasPermission(role, 'builder.cv');
    case 'portfolio-builder':
      return hasPermission(role, 'builder.portfolio');
    case 'cover-letter':
      return hasPermission(role, 'builder.cover_letter');
    case 'revisi':
      return hasPermission(role, 'revisions.view');
    case 'berkas':
      return hasPermission(role, 'files.view');
    case 'pelanggan':
      return hasPermission(role, 'customers.view');
    case 'form-klien':
      return true; // Form preview
    case 'templates':
      return hasPermission(role, 'templates.view');
    case 'shopee':
      return hasPermission(role, 'shopee.view');
    case 'laporan':
      return hasPermission(role, 'reports.view_financials');
    case 'staff':
      return hasPermission(role, 'staff.view');
    case 'settings':
      return hasPermission(role, 'settings.view');
    default:
      return true;
  }
};
