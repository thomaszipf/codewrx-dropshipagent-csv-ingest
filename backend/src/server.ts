import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { CsvIngestionService } from './services/csvIngestion.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Fastify
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  }
});

// Register plugins
await fastify.register(import('@fastify/cors'), {
  origin: true
});

await fastify.register(import('@fastify/static'), {
  root: path.join(__dirname, '../public'),
  prefix: '/public/'
});

// Initialize CSV Ingestion Service
const csvService = new CsvIngestionService(prisma, process.env.FTP_PATH || '../exports');

// Health check endpoint
fastify.get('/health', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    fastify.log.error('Health check failed:', error);
    throw new Error('Database connection failed');
  }
});

// API Routes
fastify.register(async function (fastify) {
  // Get processing stats
  fastify.get('/api/stats', async () => {
    try {
      const stats = await csvService.getProcessingStats();
      return { success: true, data: stats };
    } catch (error) {
      fastify.log.error('Failed to get stats:', error);
      throw new Error('Failed to retrieve statistics');
    }
  });

  // Get shops with pagination
  fastify.get('/api/shops', async (request) => {
    try {
      const query = request.query as any;
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '10');
      const skip = (page - 1) * limit;

      const [shops, total] = await Promise.all([
        prisma.shop.findMany({
          skip,
          take: limit,
          include: {
            _count: {
              select: {
                orders: true,
                customers: true,
                csvFiles: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }),
        prisma.shop.count()
      ]);

      return {
        success: true,
        data: {
          shops,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      fastify.log.error('Failed to get shops:', error);
      throw new Error('Failed to retrieve shops');
    }
  });

  // Get recent orders
  fastify.get('/api/orders', async (request) => {
    try {
      const query = request.query as any;
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '20');
      const skip = (page - 1) * limit;

      const where = query.shopId 
        ? { shopId: query.shopId }
        : {};

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          include: {
            customer: true,
            lineItems: true,
            shop: {
              select: { name: true, displayName: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.order.count({ where })
      ]);

      return {
        success: true,
        data: {
          orders,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } catch (error) {
      fastify.log.error('Failed to get orders:', error);
      throw new Error('Failed to retrieve orders');
    }
  });

  // Manual file processing
  fastify.post('/api/process-file', async (request) => {
    try {
      const body = request.body as any;
      const { filename } = body;
      const filePath = path.join(process.env.FTP_PATH || '../exports', filename);
      
      const stats = await csvService.processFile(filePath);
      
      return {
        success: true,
        message: 'File processed successfully',
        data: stats
      };
    } catch (error) {
      fastify.log.error('Failed to process file:', error);
      throw new Error('Failed to process file');
    }
  });
});

// Legal routes
fastify.get('/legal/privacy', async (request, reply) => {
  const html = `<!DOCTYPE html>
<html><head><title>Privacy Policy</title></head>
<body><h1>Privacy Policy</h1><p>This is a placeholder privacy policy.</p></body>
</html>`;
  reply.type('text/html').send(html);
});

fastify.get('/legal/terms', async (request, reply) => {
  const html = `<!DOCTYPE html>
<html><head><title>Terms of Service</title></head>
<body><h1>Terms of Service</h1><p>This is a placeholder terms of service.</p></body>
</html>`;
  reply.type('text/html').send(html);
});

// Dashboard UI Routes
fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

// Start server
const start = async (): Promise<void> => {
  try {
    // Connect to database
    await prisma.$connect();
    fastify.log.info('Database connected');

    // Start CSV file watcher
    await csvService.startWatching();
    fastify.log.info('CSV file watcher started');

    // Start server
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on ${host}:${port}`);
  } catch (error) {
    fastify.log.error('Error starting server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (): Promise<void> => {
  fastify.log.info('Shutting down server...');
  
  try {
    await csvService.stopWatching();
    await prisma.$disconnect();
    await fastify.close();
    fastify.log.info('Server shutdown complete');
  } catch (error) {
    fastify.log.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
start();