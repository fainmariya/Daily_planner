import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/index.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.employee.upsert({
    where: { name: "employe_1" },
    update: {},
    create: { name: "employe_1" },
  });

  const services = [
    "Наращивание",
    "Уход",
    "Сложное окрашивание",
    "Выпрямление",
    "Стрижка",
    "Укладка",
    "Тонирование",
    "Окрашивание волос",
  ];

  for (const name of services) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
