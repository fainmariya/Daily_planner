import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@prisma/client";


const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const employees = ["employe_1", "employe_2", "employe_3"];

  for (const name of employees) {
    await prisma.employee.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // durationMin — примерные значения, потом подгонишь под реальные процедуры
  const services: Array<{ name: string; durationMin: number }> = [
    { name: "Наращивание", durationMin: 180 },
    { name: "Уход", durationMin: 60 },
    { name: "Сложное окрашивание", durationMin: 240 },
    { name: "Выпрямление", durationMin: 180 },
    { name: "Стрижка", durationMin: 60 },
    { name: "Укладка", durationMin: 45 },
    { name: "Тонирование", durationMin: 60 },
    { name: "Окрашивание волос", durationMin: 60 },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: { durationMin: s.durationMin },
      create: { name: s.name, durationMin: s.durationMin },
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
