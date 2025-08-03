# Production Deployment Guide

## 🚀 SSL-Enabled Production Deployment for srv940901.hstgr.cloud

This guide covers deploying the CSV Ingestion Backend with automatic SSL certificates and production security.

## 📋 Prerequisites

- **Server**: srv940901.hstgr.cloud with root access
- **DNS**: Domain pointing to server IP
- **Ports**: 80, 443 open in firewall
- **Docker**: Docker & Docker Compose installed

## 🔧 Quick Production Setup

### 1. **Clone and Configure**
```bash
# Clone repository
git clone <repository-url>
cd codewrx-dropshipagent-csv-ingest

# Set up environment
cp .env.example .env
nano .env  # Update with your values
```

### 2. **Generate Secure Credentials**
```bash
# Generate secure password hash
htpasswd -c nginx/.htpasswd admin

# Generate JWT secret
openssl rand -base64 32
```

### 3. **Automated SSL Setup**
```bash
# Run automated SSL setup
./scripts/ssl-setup.sh
```

### 4. **Verify Deployment**
```bash
# Check services
docker-compose -f docker-compose.prod.yml ps

# Test endpoints
curl https://srv940901.hstgr.cloud/health
curl https://srv940901.hstgr.cloud/legal/privacy
```

## 🔐 SSL Configuration Details

### **Let's Encrypt Integration**
- **Automatic certificate generation** via Certbot
- **Auto-renewal** every 12 hours
- **HTTP to HTTPS redirect** for all traffic
- **Modern SSL ciphers** and security headers

### **Security Features**
- **HSTS** with preload directive
- **Content Security Policy** headers
- **Rate limiting** on API endpoints
- **Security.txt** at `/.well-known/security.txt`

## 📂 Service Architecture

```
srv940901.hstgr.cloud:443
├── / (Dashboard - Auth Required)
├── /api/* (API Endpoints - Auth Required)  
├── /legal/* (Legal Pages - Public)
├── /health (Health Check - Public)
└── /.well-known/* (Security/SSL - Public)
```

## 🌐 Public Endpoints (No Auth)

### **Legal Compliance**
- **Privacy Policy**: https://srv940901.hstgr.cloud/legal/privacy
- **Terms of Service**: https://srv940901.hstgr.cloud/legal/terms  
- **Data Processing Agreement**: https://srv940901.hstgr.cloud/legal/dpa

### **System Monitoring**
- **Health Check**: https://srv940901.hstgr.cloud/health
- **Security Contact**: https://srv940901.hstgr.cloud/.well-known/security.txt

## 🔑 Protected Endpoints (Basic Auth)

### **Dashboard Access**
- **Main Dashboard**: https://srv940901.hstgr.cloud/
- **Credentials**: Set in `nginx/.htpasswd`

### **API Endpoints**
- **Statistics**: `GET /api/stats`
- **Shops**: `GET /api/shops`
- **Orders**: `GET /api/orders`
- **Logs**: `GET /api/logs`
- **Manual Processing**: `POST /api/process-file`

## 📁 FTP Integration

### **Directory Structure**
```
exports/
├── ForeverFinds (131164-131864).csv
├── CloudLux (1808-1833).csv
└── [ShopName] ([OrderRange]).csv
```

### **File Processing**
1. **Upload CSV** to `./exports/` directory
2. **Automatic detection** by file watcher
3. **Shop extraction** from filename
4. **Duplicate prevention** via SHA256 hash
5. **Database ingestion** with error handling

## 🔧 Production Configuration

### **Environment Variables**
```env
# Required for production
POSTGRES_PASSWORD=secure_db_password
JWT_SECRET=generated_jwt_secret
DOMAIN=srv940901.hstgr.cloud
EMAIL=admin@dropshipagent.com
```

### **Docker Compose Override**
Uses `docker-compose.prod.yml` with:
- **SSL termination** in nginx
- **Certificate auto-renewal** 
- **Production logging**
- **Health checks** and restarts
- **Internal networking**

## 📊 Monitoring & Maintenance

### **Health Monitoring**
```bash
# Service status
docker-compose -f docker-compose.prod.yml ps

# Application logs  
docker-compose logs -f backend

# SSL certificate status
docker-compose exec certbot certbot certificates
```

### **Certificate Renewal**
```bash
# Manual renewal (automatic every 12h)
docker-compose exec certbot certbot renew

# Test renewal
docker-compose exec certbot certbot renew --dry-run
```

### **Database Maintenance**
```bash
# Access database
docker-compose exec postgres psql -U csvuser -d csv_ingestion

# Backup database
docker-compose exec postgres pg_dump -U csvuser csv_ingestion > backup.sql

# View processing stats
curl -u admin:password https://srv940901.hstgr.cloud/api/stats
```

## 🚨 Troubleshooting

### **SSL Issues**
```bash
# Check certificate
openssl s_client -connect srv940901.hstgr.cloud:443 -servername srv940901.hstgr.cloud

# Verify DNS
dig srv940901.hstgr.cloud

# Check nginx config
docker-compose exec nginx nginx -t
```

### **Authentication Issues**
```bash
# Regenerate htpasswd
htpasswd -c nginx/.htpasswd admin
docker-compose restart nginx

# Test basic auth
curl -u admin:password https://srv940901.hstgr.cloud/api/stats
```

### **File Processing Issues**
```bash
# Check file permissions
ls -la exports/

# Manual processing
curl -X POST https://srv940901.hstgr.cloud/api/process-file \
  -u admin:password \
  -H "Content-Type: application/json" \
  -d '{"filename": "TestShop (1-100).csv"}'

# View processing logs
docker-compose logs backend | grep "CSV"
```

## 🔒Security Checklist

- [ ] **Strong passwords** in `.htpasswd`
- [ ] **Secure JWT secret** in environment
- [ ] **Database password** changed from default
- [ ] **SSL certificate** valid and auto-renewing
- [ ] **Firewall** configured (ports 80, 443 only)
- [ ] **Rate limiting** enabled in nginx
- [ ] **Security headers** configured
- [ ] **Log monitoring** set up

## 📞 Support Contacts

- **Technical**: admin@dropshipagent.com
- **Privacy**: privacy@dropshipagent.com  
- **Legal**: legal@dropshipagent.com
- **Security**: security@dropshipagent.com

## 🔄 Updates & Maintenance

### **Updating the Application**
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### **Backup Strategy**
```bash
# Database backup
docker-compose exec postgres pg_dump -U csvuser csv_ingestion | gzip > backup-$(date +%Y%m%d).sql.gz

# File backup
tar -czf exports-backup-$(date +%Y%m%d).tar.gz exports/
```

---

🎉 **Your CSV Ingestion Backend is now production-ready with SSL!**

Access your dashboard at: **https://srv940901.hstgr.cloud**