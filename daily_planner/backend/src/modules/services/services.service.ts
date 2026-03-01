

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.client.service.findMany({
      orderBy: { id: "asc" },
      // можно явно выбрать нужные поля (полезно, если появятся лишние)
      select: { id: true, name: true, durationMin: true },
    });
  
  }
}
