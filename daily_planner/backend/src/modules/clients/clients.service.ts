import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ClientsService {constructor(private readonly prisma: PrismaService) {}

async history(id: string) {
  if (!id) throw new BadRequestException("id is required");
  const clientId = BigInt(id);

  const rows = await this.prisma.client.appointment.findMany({
    where: { clientId },
    orderBy: { startAt: "desc" },
    include: {
      employee: true,
      services: { include: { service: true } },
    },
  });

  // BigInt -> string, чтобы не было 500
  return rows.map((a) => ({
    ...a,
    id: a.id.toString(),
    employeeId: a.employeeId.toString(),
    clientId: a.clientId ? a.clientId.toString() : null,
    employee: a.employee ? { ...a.employee, id: a.employee.id.toString() } : null,
    services: a.services.map((s) => ({
      ...s,
      appointmentId: s.appointmentId.toString(),
      serviceId: s.serviceId.toString(),
      service: { ...s.service, id: s.service.id.toString?.() ?? s.service.id },
    })),
  }));
}
async getOne(id: string) {
    const clientId = BigInt(id);
  
    const client = await this.prisma.client.client.findUnique({
      where: { id: clientId },
    });
  
    if (!client) return null; // позже заменим на 404
  
    return {
      ...client,
      id: client.id.toString(),
    };
  }
  async update(id: string, body: any) {
    const clientId = BigInt(id);

    // 1) Подготовим "data" только из тех полей, которые реально пришли
    const data: any = {};

    if (body.fullName !== undefined) {
      const name = String(body.fullName).trim();
      if (!name) throw new BadRequestException("fullName cannot be empty");
      data.fullName = name;
    }

    if (body.phone !== undefined) {
      const phone = body.phone === null ? null : String(body.phone).trim();
      // минимальная валидация: либо null, либо непустая строка
      if (phone !== null && phone.length === 0) {
        throw new BadRequestException("phone cannot be empty string");
      }
      data.phone = phone;
    }

    if (body.birthDate !== undefined) {
      if (body.birthDate === null || body.birthDate === "") {
        data.birthDate = null;
      } else {
        const d = new Date(body.birthDate);
        if (Number.isNaN(d.getTime())) {
          throw new BadRequestException("birthDate must be a valid date string");
        }
        data.birthDate = d;
      }
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException("No fields to update");
    }

    // 2) Обновляем
    try {
      const updated = await this.prisma.client.client.update({
        where: { id: clientId },
        data,
      });

      // 3) BigInt -> string
      return { ...updated, id: updated.id.toString() };
    } catch (e: any) {
      // если id не найден
      throw new NotFoundException("Client not found");
    }
  }
  async search(query: string) {
    const q = query.trim();
  
    // Если строка пустая — отдаём последних созданных клиентов (например 20)
    if (!q) {
      const rows = await this.prisma.client.client.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      });
  
      return rows.map((c) => ({ ...c, id: c.id.toString() }));
    }
  
    // Поиск по имени (contains, без учета регистра)
    // и по телефону (contains)
    const rows = await this.prisma.client.client.findMany({
      where: {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  
    return rows.map((c) => ({ ...c, id: c.id.toString() }));
  }
  
}
