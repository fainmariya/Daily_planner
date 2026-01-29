import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.client.employee.findMany({
      orderBy: { id: "asc" },
    });

    return rows.map((e) => ({
      ...e,
      id: e.id.toString(), // <-- ключевой фикс
    }));
  }
}
