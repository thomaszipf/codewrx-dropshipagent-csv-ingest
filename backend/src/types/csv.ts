export interface CsvOrderRecord {
  // Customer Information
  Name: string;
  Email: string;
  Phone?: string;
  'Accepts Marketing': string;

  // Order Details
  Id: string; // Order ID
  'Financial Status': string;
  'Paid at': string;
  'Fulfillment Status': string;
  'Fulfilled at': string;
  Currency: string;
  Subtotal: string;
  Shipping: string;
  Taxes: string;
  Total: string;
  'Discount Code': string;
  'Discount Amount': string;
  'Shipping Method': string;
  'Created at': string;

  // Line Item Details
  'Lineitem quantity': string;
  'Lineitem name': string;
  'Lineitem price': string;
  'Lineitem compare at price': string;
  'Lineitem sku': string;
  'Lineitem requires shipping': string;
  'Lineitem taxable': string;
  'Lineitem fulfillment status': string;
  'Lineitem discount': string;

  // Billing Address
  'Billing Name': string;
  'Billing Street': string;
  'Billing Address1': string;
  'Billing Address2': string;
  'Billing Company': string;
  'Billing City': string;
  'Billing Zip': string;
  'Billing Province': string;
  'Billing Country': string;
  'Billing Phone': string;
  'Billing Province Name': string;

  // Shipping Address
  'Shipping Name': string;
  'Shipping Street': string;
  'Shipping Address1': string;
  'Shipping Address2': string;
  'Shipping Company': string;
  'Shipping City': string;
  'Shipping Zip': string;
  'Shipping Province': string;
  'Shipping Country': string;
  'Shipping Phone': string;
  'Shipping Province Name': string;

  // Additional Fields
  Notes: string;
  'Note Attributes': string;
  'Cancelled at': string;
  'Payment Method': string;
  'Payment Reference': string;
  'Refunded Amount': string;
  Vendor: string;
  'Outstanding Balance': string;
  Employee: string;
  Location: string;
  'Device ID': string;
  Tags: string;
  'Risk Level': string;
  Source: string;

  // Tax Information
  'Tax 1 Name': string;
  'Tax 1 Value': string;
  'Tax 2 Name': string;
  'Tax 2 Value': string;
  'Tax 3 Name': string;
  'Tax 3 Value': string;
  'Tax 4 Name': string;
  'Tax 4 Value': string;
  'Tax 5 Name': string;
  'Tax 5 Value': string;

  // Additional Payment Info
  'Receipt Number': string;
  Duties: string;
  'Payment ID': string;
  'Payment Terms Name': string;
  'Next Payment Due At': string;
  'Payment References': string;
}

export interface ProcessedOrder {
  externalId: string;
  orderNumber: string;
  customer: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    acceptsMarketing: boolean;
  };
  order: {
    subtotalPrice?: number;
    shippingPrice?: number;
    totalTax?: number;
    totalPrice?: number;
    currency: string;
    financialStatus?: string;
    fulfillmentStatus?: string;
    paymentMethod?: string;
    paymentReference?: string;
    paidAt?: Date;
    shippingMethod?: string;
    fulfilledAt?: Date;
    discountCode?: string;
    discountAmount?: number;
    tags?: string;
    riskLevel?: string;
    source?: string;
    notes?: string;
    cancelledAt?: Date;
    refundedAmount?: number;
    orderDate?: Date;
  };
  lineItems: Array<{
    title?: string;
    variantTitle?: string;
    sku?: string;
    quantity: number;
    price?: number;
    compareAtPrice?: number;
    totalDiscount: number;
    requiresShipping: boolean;
    taxable: boolean;
    fulfillmentStatus: string;
  }>;
  addresses: {
    billing?: {
      firstName?: string;
      lastName?: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      province?: string;
      provinceName?: string;
      country: string;
      zip?: string;
      phone?: string;
    };
    shipping?: {
      firstName?: string;
      lastName?: string;
      company?: string;
      address1: string;
      address2?: string;
      city: string;
      province?: string;
      provinceName?: string;
      country: string;
      zip?: string;
      phone?: string;
    };
  };
}

export interface IngestionStats {
  totalRecords: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsErrors: number;
  errors: Array<{
    record: number;
    error: string;
    data?: any;
  }>;
}