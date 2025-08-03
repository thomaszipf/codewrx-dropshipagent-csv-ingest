#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // 1. Find duplicate shops (shops with timestamp prefixes)
    console.log('\n📊 Analyzing duplicate shops...');
    const allShops = await prisma.shop.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            customers: true,
            csvFiles: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${allShops.length} total shops`);
    
    // Group shops by clean name (without timestamp prefix)
    const shopGroups = new Map();
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_(.+)$/;
    
    for (const shop of allShops) {
      let cleanName = shop.name;
      const timestampMatch = shop.name.match(timestampRegex);
      if (timestampMatch) {
        cleanName = timestampMatch[1];
      }
      
      if (!shopGroups.has(cleanName)) {
        shopGroups.set(cleanName, []);
      }
      shopGroups.get(cleanName).push(shop);
    }
    
    // 2. Identify duplicates and merge them
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;
    
    for (const [cleanName, shops] of shopGroups) {
      if (shops.length > 1) {
        duplicatesFound++;
        console.log(`\n🔍 Found duplicates for "${cleanName}": ${shops.length} entries`);
        
        // Find the best shop to keep (prefer one without timestamp prefix, or the oldest)
        let keepShop = shops.find(s => !timestampRegex.test(s.name)) || shops[0];
        const duplicateShops = shops.filter(s => s.id !== keepShop.id);
        
        console.log(`  ✅ Keeping: "${keepShop.name}" (ID: ${keepShop.id})`);
        console.log(`  ❌ Removing: ${duplicateShops.map(s => `"${s.name}"`).join(', ')}`);
        
        // 3. Move all data from duplicate shops to the kept shop
        for (const dupShop of duplicateShops) {
          console.log(`    📦 Moving data from "${dupShop.name}"...`);
          
          // Move orders (handle duplicates)
          const ordersToMove = await prisma.order.findMany({
            where: { shopId: dupShop.id }
          });
          
          let ordersMoved = 0;
          let ordersDeleted = 0;
          
          for (const order of ordersToMove) {
            try {
              // Try to move the order
              await prisma.order.update({
                where: { id: order.id },
                data: { shopId: keepShop.id }
              });
              ordersMoved++;
            } catch (error) {
              if (error.code === 'P2002') {
                // Duplicate external_id, delete this order instead
                await prisma.order.delete({
                  where: { id: order.id }
                });
                ordersDeleted++;
              } else {
                throw error;
              }
            }
          }
          console.log(`      - Moved ${ordersMoved} orders, deleted ${ordersDeleted} duplicates`);
          
          // Move customers (handle duplicates)
          const customersToMove = await prisma.customer.findMany({
            where: { shopId: dupShop.id }
          });
          
          let customersMoved = 0;
          let customersDeleted = 0;
          
          for (const customer of customersToMove) {
            try {
              // Try to move the customer
              await prisma.customer.update({
                where: { id: customer.id },
                data: { shopId: keepShop.id }
              });
              customersMoved++;
            } catch (error) {
              if (error.code === 'P2002') {
                // Duplicate email, delete this customer instead
                await prisma.customer.delete({
                  where: { id: customer.id }
                });
                customersDeleted++;
              } else {
                throw error;
              }
            }
          }
          console.log(`      - Moved ${customersMoved} customers, deleted ${customersDeleted} duplicates`);
          
          // Move CSV files (handle duplicates)
          const csvFilesToMove = await prisma.csvFile.findMany({
            where: { shopId: dupShop.id }
          });
          
          let csvFilesMoved = 0;
          let csvFilesDeleted = 0;
          
          for (const csvFile of csvFilesToMove) {
            try {
              // Try to move the CSV file
              await prisma.csvFile.update({
                where: { id: csvFile.id },
                data: { shopId: keepShop.id }
              });
              csvFilesMoved++;
            } catch (error) {
              if (error.code === 'P2002') {
                // Duplicate file_hash, delete this CSV file instead
                await prisma.csvFile.delete({
                  where: { id: csvFile.id }
                });
                csvFilesDeleted++;
              } else {
                throw error;
              }
            }
          }
          console.log(`      - Moved ${csvFilesMoved} CSV files, deleted ${csvFilesDeleted} duplicates`);
          
          // Delete the duplicate shop
          await prisma.shop.delete({
            where: { id: dupShop.id }
          });
          console.log(`      - Deleted duplicate shop "${dupShop.name}"`);
          duplicatesRemoved++;
        }
        
        // Update the kept shop's name to clean version if needed
        if (keepShop.name !== cleanName) {
          await prisma.shop.update({
            where: { id: keepShop.id },
            data: { 
              name: cleanName,
              displayName: cleanName,
              updatedAt: new Date()
            }
          });
          console.log(`      - Updated shop name to "${cleanName}"`);
        }
      }
    }
    
    // 4. Final statistics
    console.log('\n📈 Cleanup Summary:');
    console.log(`  - Shop groups with duplicates: ${duplicatesFound}`);
    console.log(`  - Duplicate shops removed: ${duplicatesRemoved}`);
    
    const finalShopCount = await prisma.shop.count();
    console.log(`  - Final shop count: ${finalShopCount}`);
    
    // 5. Show final shop list
    console.log('\n📋 Final shop list:');
    const finalShops = await prisma.shop.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            customers: true,
            csvFiles: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    for (const shop of finalShops) {
      console.log(`  - ${shop.name}: ${shop._count.orders} orders, ${shop._count.customers} customers, ${shop._count.csvFiles} files`);
    }
    
    console.log('\n✅ Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupDatabase()
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });