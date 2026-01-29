import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

type ListByDayParams = {
  date: string;
  employeeId: string;
};

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: any) {
    const employeeId = BigInt(body.employeeId);
    const startAt = new Date(body.startAt);
    const endAt = body.endAt ? new Date(body.endAt) : null;
  
    const serviceIds: number[] = Array.isArray(body.serviceIds) ? body.serviceIds : [];
  
    // 1) клиент: если передали — создадим нового (пока просто так, без поиска по телефону)
    const client = body.client?.fullName
      ? await this.prisma.client.client.create({
          data: {
            fullName: body.client.fullName,
            phone: body.client.phone ?? null,
            birthDate: body.client.birthDate ? new Date(body.client.birthDate) : null,
          },
        })
      : null;
  
    // 2) создаём appointment
    const created = await this.prisma.client.appointment.create({
      data: {
        employeeId,
        clientId: client ? client.id : null,
        startAt,
        endAt,
        status: body.status ?? "planned",
        priceCents: body.priceCents ?? null,
        notes: body.notes ?? null,
        formula: body.formula ?? null,
      },
    });
    const raw = body.priceCents;

const priceCents =
  raw === null || raw === undefined || raw === ""
    ? null
    : Number(raw);

if (priceCents !== null && (!Number.isInteger(priceCents) || priceCents < 0)) {
  throw new BadRequestException("priceCents must be a non-negative integer");
}

  
    // 3) создаём связи appointment -> services
    if (serviceIds.length > 0) {
      await this.prisma.client.appointmentService.createMany({
        data: serviceIds.map((sid) => ({
          appointmentId: created.id,
          serviceId: sid,
        })),
        skipDuplicates: true,
      });
    }
  
    // 4) возвращаем созданный appointment (и переводим BigInt в string)
    return {
      ...created,
      id: created.id.toString(),
      employeeId: created.employeeId.toString(),
      clientId: created.clientId ? created.clientId.toString() : null,
    };
  }
  
  async listByDay({ date, employeeId }: ListByDayParams) {
    if (!date) throw new BadRequestException("date is required");
    if (!employeeId) throw new BadRequestException("employeeId is required");

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const empId = BigInt(employeeId);

    const rows = await this.prisma.client.appointment.findMany({
      where: {
        employeeId: empId,
        startAt: { gte: start, lte: end },
      },
      orderBy: { startAt: "asc" },
      include: {
        client: true,
        services: { include: { service: true } },
      },
    });

    // BigInt -> string (иначе 500)
    return rows.map((a) => ({
      ...a,
      id: a.id.toString(),
      employeeId: a.employeeId?.toString?.() ?? null,
      clientId: a.clientId?.toString?.() ?? null,
      client: a.client ? { ...a.client, id: a.client.id.toString() } : null,
      services: a.services.map((s) => ({
        ...s,
        appointmentId: s.appointmentId.toString(),
        serviceId: s.serviceId.toString(),
        service: { ...s.service, id: s.service.id.toString() },
      })),
    }));
  }
}
