#!/bin/bash

# SSL Setup Script for srv940901.hstgr.cloud
# CodeWRX DropshipAgent CSV Ingestion Backend

set -e

DOMAIN="srv940901.hstgr.cloud"
EMAIL="admin@dropshipagent.com"

echo "🔐 Setting up SSL certificates for $DOMAIN"

# Create directories
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p certbot/logs

# Check if certificate already exists
if [ -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "✅ SSL certificate already exists for $DOMAIN"
    echo "🔄 Use 'docker-compose exec certbot certbot renew' to renew"
    exit 0
fi

echo "📋 Step 1: Starting nginx for domain validation"

# Start nginx with basic HTTP configuration first
docker-compose up -d nginx

# Wait for nginx to be ready
sleep 10

echo "📋 Step 2: Obtaining SSL certificate from Let's Encrypt"

# Get SSL certificate
docker-compose run --rm certbot certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    echo "📋 Step 3: Switching to production configuration"
    
    # Update docker-compose to use production config
    docker-compose down
    docker-compose -f docker-compose.prod.yml up -d
    
    echo "🔄 Step 4: Testing SSL configuration"
    
    # Wait for services to be ready
    sleep 15
    
    # Test HTTPS
    if curl -k -s https://$DOMAIN/health > /dev/null; then
        echo "✅ HTTPS is working correctly!"
        echo ""
        echo "🎉 SSL setup complete!"
        echo "   Dashboard: https://$DOMAIN"
        echo "   Health Check: https://$DOMAIN/health"
        echo "   Privacy Policy: https://$DOMAIN/legal/privacy"
        echo "   Terms of Service: https://$DOMAIN/legal/terms"
        echo "   Data Processing Agreement: https://$DOMAIN/legal/dpa"
        echo ""
        echo "🔐 Login credentials:"
        echo "   Username: admin"
        echo "   Password: admin123"
        echo ""
        echo "📝 Next steps:"
        echo "   1. Update .htpasswd with secure credentials"
        echo "   2. Set environment variables in .env file"
        echo "   3. Configure your FTP server to upload to ./exports/"
        
    else
        echo "❌ HTTPS test failed. Check nginx logs:"
        docker-compose logs nginx
    fi
    
else
    echo "❌ Failed to obtain SSL certificate"
    echo "📋 Troubleshooting:"
    echo "   1. Ensure $DOMAIN points to this server's IP"
    echo "   2. Check firewall allows ports 80 and 443"
    echo "   3. Verify no other services using ports 80/443"
    exit 1
fi