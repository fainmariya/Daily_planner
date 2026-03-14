
import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.client.service.findMany({ orderBy: { id: "asc" } });
  }

  create(body: { name: string; durationMin: number }) {
    if (!body.name?.trim()) throw new BadRequestException("name is required");
    return this.prisma.client.service.create({
      data: { name: body.name.trim(), durationMin: Number(body.durationMin) || 0 },
    });
  }

  update(id: string, body: { name?: string; durationMin?: number }) {
    return this.prisma.client.service.update({
      where: { id: Number(id) },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.durationMin !== undefined ? { durationMin: Number(body.durationMin) || 0 } : {}),
      },
    });
  }

  remove(id: string) {
    return this.prisma.client.service.delete({ where: { id: Number(id) } });
  }
}