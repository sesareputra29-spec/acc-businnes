import { storageService } from './storage';
import { Order, ShopeeProduct, CustomerData, ProductType } from '../types';

export type ShopeeOrderStatus = 
  | 'UNPAID' 
  | 'READY_TO_SHIP' 
  | 'PROCESSED' 
  | 'RETRY_SHIP' 
  | 'SHIPPED' 
  | 'TO_CONFIRM_RECEIVE' 
  | 'IN_CANCEL' 
  | 'CANCELLED' 
  | 'TO_RETURN' 
  | 'COMPLETED';

export interface ShopeeOrderItem {
  itemId: number;
  itemName: string;
  itemSku: string;
  modelId: number;
  modelName: string;
  modelQuantityPurchased: number;
  modelOriginalPrice: number;
  modelDiscountedPrice: number;
}

export interface ShopeeOrderWebhookPayload {
  orderSn: string;
  status: ShopeeOrderStatus;
  shopId: number;
  timestamp: number;
  buyerUsername: string;
  buyerPhone?: string;
  buyerEmail?: string;
  items: ShopeeOrderItem[];
}

export interface ShopeeSyncResult {
  success: boolean;
  syncedCount: number;
  orders: Order[];
  logs: string[];
  error?: string;
}

export const shopeeService = {
  /**
   * Product & Variation Mapping Matrix
   * Maps Shopee SKU or Model Name to Internal Product Type and Template ID
   */
  resolveProductMapping(sku: string, variationName?: string): {
    productType: ProductType;
    templateId: string;
    defaultPrice: number;
  } {
    const products = storageService.getShopeeProducts();
    
    // 1. Try exact SKU match
    const matchedBySku = products.find((p) => p.sku?.toUpperCase() === sku?.toUpperCase());
    if (matchedBySku) {
      return {
        productType: matchedBySku.mappedProductType,
        templateId: matchedBySku.defaultTemplateId || 'TMP-ATS-01',
        defaultPrice: matchedBySku.price
      };
    }

    // 2. Try variation / product keyword matching
    const query = `${sku} ${variationName || ''}`.toLowerCase();
    if (query.includes('paket') || query.includes('komplit') || query.includes('all in')) {
      return {
        productType: 'Paket Komplit (CV + Portfolio + CL)',
        templateId: 'TMP-ATS-01',
        defaultPrice: 135000
      };
    } else if (query.includes('kreatif') || query.includes('desain') || query.includes('visual')) {
      return {
        productType: 'CV Kreatif / Desain',
        templateId: 'TMP-CRE-01',
        defaultPrice: 65000
      };
    } else if (query.includes('portfolio') || query.includes('portofolio')) {
      return {
        productType: 'Portfolio Profesional',
        templateId: 'TMP-PORT-01',
        defaultPrice: 95000
      };
    } else if (query.includes('cover') || query.includes('surat lamaran') || query.includes('cl')) {
      return {
        productType: 'Cover Letter / Surat Lamaran',
        templateId: 'TMP-CL-01',
        defaultPrice: 35000
      };
    } else if (query.includes('linkedin') || query.includes('profil')) {
      return {
        productType: 'Optimasi Profil LinkedIn',
        templateId: 'TMP-ATS-01',
        defaultPrice: 75000
      };
    } else if (query.includes('executive') || query.includes('manajer') || query.includes('direktur')) {
      return {
        productType: 'Executive Resume & Bio',
        templateId: 'TMP-EXE-01',
        defaultPrice: 150000
      };
    }

    // Default Fallback: ATS Friendly Standard
    return {
      productType: 'CV ATS-Friendly',
      templateId: 'TMP-ATS-01',
      defaultPrice: 49000
    };
  },

  /**
   * Map Shopee Order Status into Internal 9-Stage Workflow
   */
  mapShopeeStatusToInternal(shopeeStatus: ShopeeOrderStatus): 'Menunggu Data' | 'Sedang Dikerjakan' | 'Selesai' | 'Batal' {
    switch (shopeeStatus) {
      case 'UNPAID':
        return 'Menunggu Data';
      case 'READY_TO_SHIP':
      case 'PROCESSED':
        return 'Menunggu Data'; // Order paid, awaiting customer form data
      case 'SHIPPED':
      case 'TO_CONFIRM_RECEIVE':
        return 'Sedang Dikerjakan';
      case 'COMPLETED':
        return 'Selesai';
      case 'CANCELLED':
      case 'IN_CANCEL':
        return 'Batal';
      default:
        return 'Menunggu Data';
    }
  },

  /**
   * Sync Orders using Shopee Open Platform Partner API v2
   * (Production-ready abstraction with simulated partner response)
   */
  async syncShopeeOrders(): Promise<ShopeeSyncResult> {
    const settings = storageService.getSettings();
    const logs: string[] = [];

    logs.push(`[${new Date().toLocaleTimeString()}] Menghubungi Shopee Partner API v2 (Shop ID: ${settings.shopeeShopId || 'Default'})...`);

    // Simulated API latency
    await new Promise((resolve) => setTimeout(resolve, 750));

    // Simulated incoming orders pool
    const mockOrderPool = [
      {
        sn: `2409${Math.floor(10000000 + Math.random() * 90000000)}`,
        buyer: 'Adinda Nurhaliza',
        phone: '0813-8899-7711',
        email: 'adinda.nurhaliza@gmail.com',
        sku: 'SKU-CV-ATS-01',
        variation: 'Bahasa Indonesia (Express 24 Jam)',
        price: 49000
      },
      {
        sn: `2409${Math.floor(10000000 + Math.random() * 90000000)}`,
        buyer: 'Bambang Sudarmono, S.T.',
        phone: '0857-4433-2211',
        email: 'bambang.sudarmono@yahoo.com',
        sku: 'SKU-PKT-KOMPLIT',
        variation: 'Paket All-in (CV + Portfolio + CL)',
        price: 135000
      },
      {
        sn: `2409${Math.floor(10000000 + Math.random() * 90000000)}`,
        buyer: 'Vania Clarissa',
        phone: '0812-7766-5544',
        email: 'vania.clarissa@gmail.com',
        sku: 'SKU-CV-CREATIVE',
        variation: 'Desain Modern Bold',
        price: 65000
      }
    ];

    const pick = mockOrderPool[Math.floor(Math.random() * mockOrderPool.length)];
    const mapping = this.resolveProductMapping(pick.sku, pick.variation);

    const nextOrderId = storageService.generateNextOrderId();
    const initialCustomerData: CustomerData = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      fullName: pick.buyer,
      professionalTitle: '',
      email: pick.email,
      phone: pick.phone,
      city: '',
      country: 'Indonesia',
      summary: '',
      educations: [],
      experiences: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
      socialLinks: [],
      lastUpdated: new Date().toISOString()
    };

    const newOrder: Order = {
      id: nextOrderId,
      marketplace: 'Shopee',
      marketplaceOrderId: pick.sn,
      customerName: pick.buyer,
      customerPhone: pick.phone,
      customerEmail: pick.email,
      productType: mapping.productType,
      variation: pick.variation,
      price: mapping.defaultPrice,
      orderDate: new Date().toISOString(),
      deadlineDate: new Date(Date.now() + settings.defaultDeadlineHours * 3600 * 1000).toISOString(),
      paymentStatus: 'Lunas',
      status: 'Menunggu Data',
      priority: 'Normal',
      templateId: mapping.templateId,
      customerData: initialCustomerData,
      customerFormSlug: `form-${nextOrderId.toLowerCase()}`,
      revisions: [],
      files: [],
      internalNotes: `Otomatis disinkronkan dari Shopee Open Platform API v2. No. Pesanan Shopee: ${pick.sn} (SKU: ${pick.sku})`
    };

    storageService.addOrder(newOrder);

    const logMessage = `1 Pesanan Shopee baru (#${pick.sn} - ${pick.buyer}) berhasil dipetakan ke layanan "${mapping.productType}".`;
    logs.push(logMessage);

    storageService.addShopeeLog({
      timestamp: new Date().toISOString(),
      action: 'API Sync Fetch',
      ordersSynced: 1,
      status: 'Success',
      message: logMessage
    });

    return {
      success: true,
      syncedCount: 1,
      orders: [newOrder],
      logs
    };
  },

  /**
   * Field requirements determination based on product
   */
  getRequiredFormFields(productType: ProductType | string): string[] {
    switch (productType) {
      case 'CV ATS-Friendly':
        return ['personal', 'summary', 'education', 'experience', 'skills', 'languages', 'certifications'];
      case 'CV Kreatif / Desain':
        return ['personal', 'photo', 'summary', 'education', 'experience', 'skills', 'projects', 'languages', 'socials'];
      case 'Paket Komplit (CV + Portfolio + CL)':
        return ['personal', 'photo', 'summary', 'education', 'experience', 'skills', 'certifications', 'projects', 'languages', 'socials', 'targetJob'];
      case 'Portfolio Profesional':
        return ['personal', 'summary', 'skills', 'projects', 'socials'];
      case 'Cover Letter / Surat Lamaran':
        return ['personal', 'summary', 'experience', 'targetJob'];
      case 'Optimasi Profil LinkedIn':
        return ['personal', 'summary', 'experience', 'skills', 'socials'];
      case 'Executive Resume & Bio':
        return ['personal', 'photo', 'summary', 'education', 'experience', 'skills', 'certifications', 'projects', 'languages'];
      default:
        return ['personal', 'summary', 'education', 'experience', 'skills', 'languages'];
    }
  }
};
