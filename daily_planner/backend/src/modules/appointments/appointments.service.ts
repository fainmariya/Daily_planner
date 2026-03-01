import { BadRequestException, ConflictException,  Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";
import { Prisma } from "@prisma/client";


type ListByDayParams = {
  date: string;
  employeeId: string;
};

type Tx = Prisma.TransactionClient;

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {
    
  }

  
  private async assertNoOverlap(
    tx: Tx,
    params: {
      employeeId: bigint;
      startAt: Date;
      endAt: Date;
      excludeAppointmentId?: bigint;
    }
  ) {
    const { employeeId, startAt, endAt, excludeAppointmentId } = params;
  
    if (endAt <= startAt) {
      throw new BadRequestException("endAt must be greater than startAt");
    }
  
    const conflict = await tx.appointment.findFirst({
      where: {
        employeeId,
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        // cancelled не блокирует время (если хочешь иначе — уберём)
        status: { not: "canceled" },
  
        // пересечение интервалов:
        // existing.start < new.end && existing.end > new.start
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
      select: { id: true, startAt: true, endAt: true },
    });
  
    if (conflict) {
      throw new ConflictException({
        message: "Нельзя записать: время занято у этого сотрудника",
        conflictWith: conflict,
      });
    }
  }

  
  private async calcEndAtFromServices(
    tx: Tx,
    startAt: Date,
    serviceIds: number[]
  ) {
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      throw new BadRequestException("serviceIds is required to calculate endAt");
    }
  
    // защита от дублей (на всякий случай)
    const uniqueIds = Array.from(new Set(serviceIds));
  
    const services = await tx.service.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, durationMin: true },
    });
  
    if (services.length !== uniqueIds.length) {
      const found = new Set(services.map((s) => s.id));
      const missing = uniqueIds.filter((id) => !found.has(id));
      throw new BadRequestException(`Unknown serviceIds: ${missing.join(", ")}`);
    }
  
    const totalMin = services.reduce((sum, s) => sum + (s.durationMin ?? 0), 0);
  
    if (totalMin <= 0) {
      throw new BadRequestException("Total duration must be > 0");
    }
  
    const endAt = new Date(startAt.getTime() + totalMin * 60_000);
    return { endAt, totalMin };
  }
  
  private async getCurrentServiceIds(tx: Tx, appointmentId: bigint) {
    const rows = await tx.appointmentService.findMany({
      where: { appointmentId },
      select: { serviceId: true },
    });
    return rows.map((r) => r.serviceId);
  }
  

  async create(body: CreateAppointmentDto) {
    if (!body.employeeId) throw new BadRequestException("employeeId is required");
    if (!body.startAt) throw new BadRequestException("startAt is required");

    const employeeId = BigInt(body.employeeId);

    const startAt = new Date(body.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException("startAt must be a valid ISO date string");
    }

    

    // create: undefined -> null (удобно хранить как null)
    const priceCents = body.priceCents ?? null;
    if (priceCents !== null) {
      if (!Number.isInteger(priceCents) || priceCents < 0) {
        throw new BadRequestException("priceCents must be a non-negative integer");
      }
    }

    const serviceIds: number[] = Array.isArray(body.serviceIds) ? body.serviceIds : [];

    const created = await this.prisma.client.$transaction(async (tx) => {
      const clientData = body.client;

      // приоритет 1: clientId (если фронт выбрал клиента из поиска)
      const clientIdFromBody =
        body.clientId !== undefined && body.clientId !== null && body.clientId !== ""
          ? BigInt(body.clientId)
          : null;

      let client: { id: bigint } | null = null;

      if (clientIdFromBody) {
        const existing = await tx.client.findUnique({
          where: { id: clientIdFromBody },
          select: { id: true },
        });

        if (!existing) {
          throw new BadRequestException(`clientId ${body.clientId} not found`);
        }

        client = existing;
      } else {
        // приоритет 2: phone (find-or-create)
        const phone =
          clientData?.phone && String(clientData.phone).trim()
            ? String(clientData.phone).trim()
            : null;

        const fullName =
          clientData?.fullName && String(clientData.fullName).trim()
            ? String(clientData.fullName).trim()
            : null;

        const birthDate = clientData?.birthDate ? new Date(clientData.birthDate) : null;

        if (phone) {
          // phone @unique -> можно upsert
          client = await tx.client.upsert({
            where: { phone },
            update: {
              ...(fullName ? { fullName } : {}),
              ...(birthDate ? { birthDate } : {}),
            },
            create: {
              fullName: fullName ?? "Unknown",
              phone,
              birthDate,
            },
            select: { id: true },
          });
        } else if (fullName) {
          // приоритет 3: только имя -> создаём нового
          client = await tx.client.create({
            data: { fullName, phone: null, birthDate },
            select: { id: true },
          });
        }
      }
      // 1) endAt считаем по услугам
const { endAt: computedEndAt } = await this.calcEndAtFromServices(tx, startAt, serviceIds);

// 2) запрет пересечения по сотруднику
await this.assertNoOverlap(tx, {
  employeeId,
  startAt,
  endAt: computedEndAt,
});


      const appointment = await tx.appointment.create({
        data: {
          employeeId,
          clientId: client ? client.id : null,
          startAt,
          endAt: computedEndAt,
          status: body.status ?? "planned",
          priceCents,
          notes: body.notes ?? null,
          formula: body.formula ?? null,
        },
      });

      if (serviceIds.length > 0) {
        await tx.appointmentService.createMany({
          data: serviceIds.map((sid) => ({
            appointmentId: appointment.id,
            serviceId: sid,
          })),
          skipDuplicates: true,
        });
      }

      return appointment;
    });

    return created;
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

    return rows;
  }
  async update(id: string, body: UpdateAppointmentDto) {
    const appointmentId = BigInt(id);
    const startAt = body.startAt ? new Date(body.startAt) : undefined;
  
    const priceCents = body.priceCents;
    if (priceCents !== undefined && priceCents !== null) {
      if (!Number.isInteger(priceCents) || priceCents < 0) {
        throw new BadRequestException("priceCents must be a non-negative integer");
      }
    }
  
    const serviceIds: number[] | undefined = Array.isArray(body.serviceIds)
      ? body.serviceIds
      : undefined;
  
    return this.prisma.client.$transaction(async (tx) => {
      const current = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true, employeeId: true, startAt: true, clientId: true },
      });
  
      if (!current) throw new BadRequestException("Appointment not found");
  
      const nextStartAt = startAt ?? current.startAt;
  
      const nextServiceIds =
        serviceIds !== undefined
          ? serviceIds
          : await this.getCurrentServiceIds(tx, appointmentId);
  
      const { endAt: computedEndAt } =
        await this.calcEndAtFromServices(tx, nextStartAt, nextServiceIds);
  
      await this.assertNoOverlap(tx, {
        employeeId: current.employeeId,
        startAt: nextStartAt,
        endAt: computedEndAt,
        excludeAppointmentId: appointmentId,
      });
  
      // --- Обновление клиента ---
      let targetClientId: bigint | null = current.clientId ?? null;
  
      if (body.clientId) {
        targetClientId = BigInt(body.clientId);
      }
  
      if (targetClientId && body.client) {
        const fullName = body.client.fullName?.trim();
  
        const phone =
          body.client.phone === "" ? null : body.client.phone ?? undefined;
  
        const birthDate =
          body.client.birthDate === "" || body.client.birthDate === null
            ? null
            : body.client.birthDate
            ? new Date(body.client.birthDate)
            : undefined;
  
        await tx.client.update({
          where: { id: targetClientId },
          data: {
            ...(fullName ? { fullName } : {}),
            ...(phone !== undefined ? { phone } : {}),
            ...(birthDate !== undefined ? { birthDate } : {}),
          },
        });
      }
  
      const appointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          startAt,
          endAt: computedEndAt,
          status: body.status,
          notes: body.notes,
          formula: body.formula,
          priceCents,
        },
      });
  
      if (serviceIds !== undefined) {
        await tx.appointmentService.deleteMany({ where: { appointmentId } });
  
        if (serviceIds.length > 0) {
          await tx.appointmentService.createMany({
            data: serviceIds.map((sid) => ({
              appointmentId,
              serviceId: sid,
            })),
          });
        }
      }
  
      return appointment;
    });
  }

  async remove(id: string) {
    const appointmentId = BigInt(id);

    await this.prisma.client.$transaction(async (tx) => {
      await tx.appointmentService.deleteMany({
        where: { appointmentId },
      });

      await tx.appointment.delete({
        where: { id: appointmentId },
      });
    });

    return { success: true };
  }
}
