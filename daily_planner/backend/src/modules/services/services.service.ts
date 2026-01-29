

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.client.service.findMany({
      orderBy: { id: "asc" },
    });

    return rows.map((e) => ({
      ...e,
      id: e.id.toString?.() ?? e.id, // <-- ключевой фикс
    }));
  }
}
