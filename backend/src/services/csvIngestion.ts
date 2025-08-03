import fs from 'fs/promises';
import path from 'path';
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import chokidar from 'chokidar';
import type { CsvOrderRecord, ProcessedOrder, IngestionStats } from '../types/csv.js';

export class CsvIngestionService {
  private prisma: PrismaClient;
  private ftpPath: string;
  private watcher?: chokidar.FSWatcher;

  constructor(prisma: PrismaClient, ftpPath: string = '/app/ftp') {
    this.prisma = prisma;
    this.ftpPath = ftpPath;
  }

  async startWatching(): Promise<void> {
    console.log(`Starting CSV file watcher on ${this.ftpPath}`);
    
    this.watcher = chokidar.watch(`${this.ftpPath}/*.csv`, {
      ignored: /^\./,
      persistent: true,
      ignoreInitial: false
    });

    this.watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('change', (filePath) => this.handleFileChange(filePath))
      .on('error', (error) => console.error('Watcher error:', error));

    console.log('CSV file watcher started');
  }

  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      console.log('CSV file watcher stopped');
    }
  }

  private async handleNewFile(filePath: string): Promise<void> {
    console.log(`New CSV file detected: ${filePath}`);
    await this.processFile(filePath);
  }

  private async handleFileChange(filePath: string): Promise<void> {
    console.log(`CSV file changed: ${filePath}`);
    await this.processFile(filePath);
  }

  async processFile(filePath: string): Promise<IngestionStats> {
    const filename = path.basename(filePath);
    const shopName = this.extractShopName(filename);
    
    console.log(`Processing file: ${filename} for shop: ${shopName}`);

    try {
      // Get file stats and hash
      const stats = await fs.stat(filePath);
      const fileHash = await this.calculateFileHash(filePath);

      // Find or create shop
      const shop = await this.findOrCreateShop(shopName);

      // Check if file already processed
      const existingFile = await this.prisma.csvFile.findUnique({
        where: {
          shopId_fileHash: {
            shopId: shop.id,
            fileHash
          }
        }
      });

      if (existingFile && existingFile.status === 'completed') {
        console.log(`File ${filename} already processed, skipping`);
        return {
          totalRecords: existingFile.recordsTotal,
          recordsInserted: existingFile.recordsInserted,
          recordsUpdated: existingFile.recordsUpdated,
          recordsErrors: existingFile.recordsErrors,
          errors: []
        };
      }

      // Create or update file record
      const csvFile = await this.prisma.csvFile.upsert({
        where: {
          shopId_fileHash: {
            shopId: shop.id,
            fileHash
          }
        },
        update: {
          status: 'processing',
          errorMessage: null
        },
        create: {
          shopId: shop.id,
          filename,
          filePath,
          fileSize: stats.size,
          fileHash,
          status: 'processing'
        }
      });

      // Process CSV records
      const ingestionStats = await this.processCsvRecords(filePath, shop.id);

      // Update file record with results
      await this.prisma.csvFile.update({
        where: { id: csvFile.id },
        data: {
          status: ingestionStats.recordsErrors > 0 ? 'completed' : 'completed',
          processedAt: new Date(),
          recordsTotal: ingestionStats.totalRecords,
          recordsInserted: ingestionStats.recordsInserted,
          recordsUpdated: ingestionStats.recordsUpdated,
          recordsErrors: ingestionStats.recordsErrors,
          errorMessage: ingestionStats.errors.length > 0 
            ? `${ingestionStats.errors.length} processing errors` 
            : null
        }
      });

      // Update shop last sync
      await this.prisma.shop.update({
        where: { id: shop.id },
        data: { lastSync: new Date() }
      });

      console.log(`File processing completed: ${filename}`, ingestionStats);
      return ingestionStats;

    } catch (error) {
      console.error(`Error processing file ${filename}:`, error);
      
      // Log error to database
      await this.logError(shopName, `File processing error: ${error}`);
      
      throw error;
    }
  }

  private async processCsvRecords(filePath: string, shopId: string): Promise<IngestionStats> {
    const stats: IngestionStats = {
      totalRecords: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsErrors: 0,
      errors: []
    };

    return new Promise((resolve, reject) => {
      const records: CsvOrderRecord[] = [];
      
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (record) => {
          records.push(record);
          stats.totalRecords++;
        })
        .on('end', async () => {
          try {
            // Process records in batches
            const batchSize = 100;
            for (let i = 0; i < records.length; i += batchSize) {
              const batch = records.slice(i, i + batchSize);
              
              for (const [index, record] of batch.entries()) {
                try {
                  const processed = this.transformCsvRecord(record);
                  const result = await this.upsertOrder(shopId, processed);
                  
                  if (result.created) {
                    stats.recordsInserted++;
                  } else {
                    stats.recordsUpdated++;
                  }
                } catch (error) {
                  stats.recordsErrors++;
                  stats.errors.push({
                    record: i + index + 1,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    data: record
                  });
                }
              }
            }
            
            resolve(stats);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  private transformCsvRecord(record: CsvOrderRecord): ProcessedOrder {
    const parseNumber = (value: string): number | undefined => {
      const num = parseFloat(value?.replace(/[^\d.-]/g, '') || '0');
      return isNaN(num) ? undefined : num;
    };

    const parseDate = (value: string): Date | undefined => {
      if (!value || value.trim() === '') return undefined;
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    };

    const parseBoolean = (value: string): boolean => {
      return value?.toLowerCase() === 'yes' || value?.toLowerCase() === 'true';
    };

    return {
      externalId: record.Id?.replace('#', '') || '',
      orderNumber: record.Id || '',
      customer: {
        email: record.Email || undefined,
        firstName: record.Name?.split(' ')[0] || undefined,
        lastName: record.Name?.split(' ').slice(1).join(' ') || undefined,
        phone: record.Phone || undefined,
        acceptsMarketing: parseBoolean(record['Accepts Marketing'])
      },
      order: {
        subtotalPrice: parseNumber(record.Subtotal),
        shippingPrice: parseNumber(record.Shipping),
        totalTax: parseNumber(record.Taxes),
        totalPrice: parseNumber(record.Total),
        currency: record.Currency || 'USD',
        financialStatus: record['Financial Status'] || undefined,
        fulfillmentStatus: record['Fulfillment Status'] || undefined,
        paymentMethod: record['Payment Method'] || undefined,
        paymentReference: record['Payment Reference'] || undefined,
        paidAt: parseDate(record['Paid at']),
        shippingMethod: record['Shipping Method'] || undefined,
        fulfilledAt: parseDate(record['Fulfilled at']),
        discountCode: record['Discount Code'] || undefined,
        discountAmount: parseNumber(record['Discount Amount']),
        tags: record.Tags || undefined,
        riskLevel: record['Risk Level'] || undefined,
        source: record.Source || undefined,
        notes: record.Notes || undefined,
        cancelledAt: parseDate(record['Cancelled at']),
        refundedAmount: parseNumber(record['Refunded Amount']),
        orderDate: parseDate(record['Created at'])
      },
      lineItems: [{
        title: record['Lineitem name'] || undefined,
        variantTitle: undefined,
        sku: record['Lineitem sku'] || undefined,
        quantity: parseInt(record['Lineitem quantity']) || 1,
        price: parseNumber(record['Lineitem price']),
        compareAtPrice: parseNumber(record['Lineitem compare at price']),
        totalDiscount: parseNumber(record['Lineitem discount']) || 0,
        requiresShipping: parseBoolean(record['Lineitem requires shipping']),
        taxable: parseBoolean(record['Lineitem taxable']),
        fulfillmentStatus: record['Lineitem fulfillment status'] || 'unfulfilled'
      }],
      addresses: {
        billing: record['Billing Address1'] ? {
          firstName: record['Billing Name']?.split(' ')[0] || undefined,
          lastName: record['Billing Name']?.split(' ').slice(1).join(' ') || undefined,
          company: record['Billing Company'] || undefined,
          address1: record['Billing Address1'],
          address2: record['Billing Address2'] || undefined,
          city: record['Billing City'],
          province: record['Billing Province'] || undefined,
          provinceName: record['Billing Province Name'] || undefined,
          country: record['Billing Country'],
          zip: record['Billing Zip'] || undefined,
          phone: record['Billing Phone'] || undefined
        } : undefined,
        shipping: record['Shipping Address1'] ? {
          firstName: record['Shipping Name']?.split(' ')[0] || undefined,
          lastName: record['Shipping Name']?.split(' ').slice(1).join(' ') || undefined,
          company: record['Shipping Company'] || undefined,
          address1: record['Shipping Address1'],
          address2: record['Shipping Address2'] || undefined,
          city: record['Shipping City'],
          province: record['Shipping Province'] || undefined,
          provinceName: record['Shipping Province Name'] || undefined,
          country: record['Shipping Country'],
          zip: record['Shipping Zip'] || undefined,
          phone: record['Shipping Phone'] || undefined
        } : undefined
      }
    };
  }

  private async upsertOrder(shopId: string, processed: ProcessedOrder): Promise<{ created: boolean }> {
    // Find or create customer
    let customer;
    if (processed.customer.email) {
      customer = await this.prisma.customer.upsert({
        where: {
          shopId_externalId: {
            shopId,
            externalId: processed.externalId
          }
        },
        update: {
          email: processed.customer.email,
          firstName: processed.customer.firstName,
          lastName: processed.customer.lastName,
          phone: processed.customer.phone,
          acceptsMarketing: processed.customer.acceptsMarketing
        },
        create: {
          shopId,
          externalId: processed.externalId,
          email: processed.customer.email,
          firstName: processed.customer.firstName,
          lastName: processed.customer.lastName,
          phone: processed.customer.phone,
          acceptsMarketing: processed.customer.acceptsMarketing
        }
      });

      // Create addresses
      if (processed.addresses.billing) {
        await this.prisma.customerAddress.create({
          data: {
            customerId: customer.id,
            addressType: 'billing',
            ...processed.addresses.billing
          }
        });
      }

      if (processed.addresses.shipping) {
        await this.prisma.customerAddress.create({
          data: {
            customerId: customer.id,
            addressType: 'shipping',
            ...processed.addresses.shipping
          }
        });
      }
    }

    // Upsert order
    const existingOrder = await this.prisma.order.findUnique({
      where: {
        shopId_externalId: {
          shopId,
          externalId: processed.externalId
        }
      }
    });

    const order = await this.prisma.order.upsert({
      where: {
        shopId_externalId: {
          shopId,
          externalId: processed.externalId
        }
      },
      update: {
        customerId: customer?.id,
        ...processed.order
      },
      create: {
        shopId,
        externalId: processed.externalId,
        customerId: customer?.id,
        ...processed.order
      }
    });

    // Create line items
    for (const lineItem of processed.lineItems) {
      await this.prisma.orderLineItem.create({
        data: {
          orderId: order.id,
          ...lineItem
        }
      });
    }

    return { created: !existingOrder };
  }

  private extractShopName(filename: string): string {
    // Handle uploaded files with timestamp prefix like "2025-08-03T23-20-16-775Z_ShopName (1234-5678).csv"
    let cleanFilename = filename;
    
    // Remove timestamp prefix if present (format: YYYY-MM-DDTHH-mm-ss-sssZ_)
    const timestampMatch = cleanFilename.match(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_(.+)$/);
    if (timestampMatch) {
      cleanFilename = timestampMatch[1];
    }
    
    // Extract shop name from filename like "ShopName (1234-5678).csv"
    const match = cleanFilename.match(/^(.+?)\s*\(/);
    return match ? match[1].trim() : cleanFilename.replace('.csv', '');
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  private async findOrCreateShop(shopName: string): Promise<{ id: string; name: string }> {
    return await this.prisma.shop.upsert({
      where: { name: shopName },
      update: { updatedAt: new Date() },
      create: {
        name: shopName,
        displayName: shopName
      }
    });
  }

  private async logError(shopName: string, message: string, context?: any): Promise<void> {
    try {
      const shop = await this.prisma.shop.findUnique({
        where: { name: shopName }
      });

      await this.prisma.processingLog.create({
        data: {
          shopId: shop?.id,
          level: 'error',
          message,
          context: context ? JSON.stringify(context) : null
        }
      });
    } catch (error) {
      console.error('Failed to log error to database:', error);
    }
  }

  async getProcessingStats(): Promise<any> {
    const shops = await this.prisma.shop.findMany({
      include: {
        csvFiles: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            orders: true,
            customers: true
          }
        }
      }
    });

    return shops.map(shop => ({
      id: shop.id,
      name: shop.name,
      displayName: shop.displayName,
      lastSync: shop.lastSync,
      ordersCount: shop._count.orders,
      customersCount: shop._count.customers,
      recentFiles: shop.csvFiles.map(file => ({
        filename: file.filename,
        status: file.status,
        processedAt: file.processedAt,
        recordsTotal: file.recordsTotal,
        recordsInserted: file.recordsInserted,
        recordsUpdated: file.recordsUpdated,
        recordsErrors: file.recordsErrors
      }))
    }));
  }
}