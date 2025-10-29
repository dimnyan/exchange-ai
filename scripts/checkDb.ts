import prisma from "@/lib/prisma";

async function checkConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$queryRaw`SELECT 1`; // Lightweight query
    console.log('✅ Database query executed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();