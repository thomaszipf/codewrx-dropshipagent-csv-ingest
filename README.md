# CodeWRX DropshipAgent CSV Ingestion Backend

A standalone, Shopify-independent backend service for ingesting CSV order exports from multiple e-commerce shops. This service acts as an intermediate data pipeline before Shopify app approval, providing automated CSV processing, monitoring, and a web dashboard.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Docker Compose Stack                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   Nginx     │  │   Backend    │  │     PostgreSQL      │ │
│  │ (Auth+Proxy)│◄─┤  (Fastify)   │◄─┤    (Database)       │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
│                           │                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            FTP Mount (./exports -> /ftp)               │ │
│  │    CSV Files: ShopName (1234-5678).csv                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Features

### **Automated CSV Processing**
- **File Watching**: Real-time monitoring of FTP directory (`./exports`)
- **Shop Detection**: Automatic shop identification from CSV filenames
- **Duplicate Prevention**: SHA256 hash-based file deduplication
- **Batch Processing**: Efficient processing with error handling

### **Data Management**
- **PostgreSQL Storage**: Shopify-compatible schema without Shopify dependencies
- **Order Ingestion**: Complete order lifecycle with customers, line items, addresses
- **Status Tracking**: Processing status, error logging, and statistics
- **Data Integrity**: Upsert operations prevent duplicates

### **Web Dashboard**
- **Real-time Stats**: Shop counts, order totals, processing status
- **Shop Management**: View shops with order/customer counts
- **File History**: Recent processing history and status
- **Basic Auth Protection**: Nginx-secured access

### **API Endpoints**
- `GET /api/stats` - Processing statistics
- `GET /api/shops` - Shop list with pagination
- `GET /api/orders` - Order list with filtering
- `GET /api/logs` - Processing logs
- `POST /api/process-file` - Manual file processing

## 🛠️ Technology Stack

- **Backend**: Fastify + TypeScript (faster than Express)
- **Database**: PostgreSQL + Prisma ORM
- **File Processing**: csv-parser + chokidar (file watching)
- **Authentication**: Basic Auth via Nginx
- **Deployment**: Docker Compose
- **Monitoring**: Health checks + logging

## 📋 Prerequisites

- **Docker & Docker Compose**
- **Node.js 18+** (for development)
- **FTP credentials** (for production deployment)

## 🚀 Quick Start

### 1. **Clone and Setup**
```bash
git clone <repository-url>
cd codewrx-dropshipagent-csv-ingest
```

### 2. **Environment Configuration**
```bash
# Copy sample CSV files to test with
cp ../docker/exports/*.csv ./exports/

# Update nginx/.htpasswd with your credentials if needed
# Default: admin/admin123
```

### 3. **Start Services**
```bash
docker-compose up -d
```

### 4. **Access Dashboard**
- **URL**: http://localhost:8080
- **Username**: admin
- **Password**: admin123

### 5. **Verify Health**
```bash
curl http://localhost:8080/health
```

## 📂 Project Structure

```
codewrx-dropshipagent-csv-ingest/
├── docker-compose.yml          # Multi-service orchestration
├── nginx/
│   ├── nginx.conf             # Reverse proxy + auth
│   └── .htpasswd              # Basic auth credentials
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── csvIngestion.ts    # Core CSV processing
│   │   ├── types/
│   │   │   └── csv.ts             # TypeScript interfaces
│   │   └── server.ts              # Fastify server
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── public/
│   │   └── index.html             # Dashboard UI
│   ├── Dockerfile
│   └── package.json
├── exports/                    # FTP mount point (CSV files)
├── logs/                      # Application logs
└── README.md
```

## 📊 CSV File Format

The service expects **Shopify order export** CSV format with columns:
- Customer: Name *, Email *, Phone, Accepts Marketing
- Order: Id *, Financial Status, Total *, Currency, Created at *
- Line Items: Lineitem name *, Lineitem quantity *, Lineitem price *
- Addresses: Billing/Shipping Address1 *, City *, Country *
- Payment: Payment Method, Payment Reference

**Required fields marked with ***

## 🔧 Configuration

### **Database**
```env
DATABASE_URL=postgresql://csvuser:csvpassword@postgres:5432/csv_ingestion
```

### **FTP Path**
```env
FTP_PATH=/app/ftp  # Container path for CSV files
```

### **Authentication**
```bash
# Generate new htpasswd entry
htpasswd -c nginx/.htpasswd username
```

## 🔍 Monitoring

### **Dashboard Metrics**
- Total/Active shops
- Order and customer counts
- Recent file processing status
- Real-time error logging

### **API Health Check**
```bash
GET /health
{
  "status": "healthy",
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

### **Log Levels**
- `info`: Normal operations
- `warn`: Recoverable issues  
- `error`: Processing failures

## 🔒 Security

### **Access Control**
- **Nginx Basic Auth**: Protects all routes except `/health`
- **Internal Network**: Services communicate via Docker network
- **No External Database**: Self-contained PostgreSQL

### **Data Privacy**
- **Hash-based Deduplication**: Files tracked by SHA256
- **Error Context**: Sensitive data excluded from logs
- **Access Logging**: All requests logged with IP/User-Agent

## 🚀 Production Deployment

### **1. Update Credentials**
```bash
# Generate secure password hash
htpasswd -c nginx/.htpasswd admin

# Update docker-compose.yml environment variables
JWT_SECRET=your-secure-jwt-secret-here
BCRYPT_ROUNDS=12
```

### **2. Configure FTP Ingress**
```yaml
# Add FTP server service to docker-compose.yml
ftp-server:
  image: stilliard/pure-ftpd
  environment:
    FTP_USER_NAME: ftpuser
    FTP_USER_PASS: ftppassword
    FTP_USER_HOME: /app/ftp
  volumes:
    - ./exports:/app/ftp
  ports:
    - "21:21"
```

### **3. Production Start**
```bash
docker-compose -f docker-compose.yml up -d
```

### **4. Verify Deployment**
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f backend

# Test ingestion
curl -X POST http://localhost:8080/api/process-file \
  -H "Content-Type: application/json" \
  -d '{"filename": "TestShop (1-100).csv"}'
```

## 🔧 Development

### **Local Development**
```bash
cd backend
npm install
npm run dev

# In separate terminal
docker-compose up -d postgres
```

### **Database Management**
```bash
# Run migrations
npm run setup

# Reset database  
npx prisma migrate reset

# View data
npx prisma studio
```

### **Testing CSV Processing**
```bash
# Copy sample files
cp ../docker/exports/*.csv ./exports/

# Watch logs
docker-compose logs -f backend
```

## 🤝 Integration with DropshipAgent

### **Shared Schema Compatibility**
This backend uses a **Shopify-independent version** of the DropshipAgent Prisma schema:
- Same core entities (Shop, Order, Customer, Product)
- No Shopify-specific fields (accessToken, webhooks)
- Compatible data types and relationships

### **Future Integration**
Once Shopify app is approved:
1. **Data Migration**: Export processed data to main DropshipAgent database
2. **Schema Merge**: Combine independent backend with Shopify app
3. **Unified Dashboard**: Merge CSV and Shopify order streams

## 📝 API Documentation

### **Statistics Endpoint**
```bash
GET /api/stats
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "ForeverFinds",
      "ordersCount": 1250,
      "customersCount": 980,
      "lastSync": "2024-03-15T10:30:00Z",
      "recentFiles": [...]
    }
  ]
}
```

### **Orders Endpoint**
```bash
GET /api/orders?shopId=uuid&page=1&limit=20
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1250,
      "pages": 63
    }
  }
}
```

## 🐛 Troubleshooting

### **Common Issues**

**1. Files Not Processing**
```bash
# Check file permissions
ls -la exports/
chmod 644 exports/*.csv

# Verify watcher
docker-compose logs backend | grep "watcher"
```

**2. Database Connection**
```bash
# Test connection
docker-compose exec backend npm run db:studio
```

**3. Authentication Issues**
```bash
# Regenerate htpasswd
htpasswd -c nginx/.htpasswd admin
docker-compose restart nginx
```

## 🔄 Maintenance

### **Log Rotation**
```bash
# Clear old logs (run monthly)
docker-compose exec backend rm -rf /app/logs/*.log.old
```

### **Database Cleanup**
```bash
# Remove old processing logs (run weekly)
docker-compose exec postgres psql -U csvuser -d csv_ingestion \
  -c "DELETE FROM processing_logs WHERE timestamp < NOW() - INTERVAL '30 days';"
```

## 📞 Support

- **Documentation**: This README + inline code comments
- **Logs**: `docker-compose logs -f backend`
- **Database**: Access via Prisma Studio on port 5555
- **Monitoring**: Dashboard at http://localhost:8080

---

**CodeWRX DropshipAgent CSV Ingestion Backend** - Bridging CSV exports to modern e-commerce fulfillment.