import { Injectable, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { CreateEmployeeDto } from "./dto/create-employee.dto";

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rows = await this.prisma.client.employee.findMany({
      orderBy: { id: "asc" },
    });

    return rows.map((e) => ({
      ...e,
      id: e.id.toString(),
    }));
  }

  async create(body: CreateEmployeeDto, file?: Express.Multer.File) {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException("name is required");

    const created = await this.prisma.client.employee.create({
      data: {
        name,
        displayName: body.displayName?.trim() || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        avatarUrl: file ? `/uploads/${file.filename}` : null,
        showInPlanner: body.showInPlanner ?? true,
      },
    });

    return { ...created, id: created.id.toString() };
  }

  async update(id: string, body: UpdateEmployeeDto, file?: Express.Multer.File) {
    const employeeId = BigInt(id);

    const data: any = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.displayName !== undefined) data.displayName = body.displayName?.trim() || null;

    if (body.birthDate !== undefined) {
      data.birthDate = body.birthDate ? new Date(body.birthDate) : null;
    }

    if (file) data.avatarUrl = `/uploads/${file.filename}`;
    if (body.showInPlanner !== undefined) {
      data.showInPlanner = body.showInPlanner;
    }
    const updated = await this.prisma.client.employee.update({
      where: { id: employeeId },
      data,
    });

    return { ...updated, id: updated.id.toString() };
  }

  // ✅ только ОДНА remove, с проверкой конфликтов
  async remove(id: string) {
    const employeeId = BigInt(id);

    const cnt = await this.prisma.client.appointment.count({
      where: { employeeId },
    });

    if (cnt > 0) {
      throw new ConflictException("Can't delete employee: this employee has appointments");
    }

    try {
      await this.prisma.client.employee.delete({ where: { id: employeeId } });
      return { success: true };
    } catch {
      throw new BadRequestException("Delete failed");
    }
  }

  async listClients(id: string) {
    const employeeId = BigInt(id);

    const rows = await this.prisma.client.appointment.findMany({
      where: { employeeId },
      include: { client: true },
      orderBy: { startAt: "desc" },
    });

    const map = new Map<string, any>();
    for (const a of rows) {
      if (!a.client) continue;
      map.set(a.client.id.toString(), {
        id: a.client.id.toString(),
        fullName: a.client.fullName,
        phone: a.client.phone,
        birthDate: a.client.birthDate,
      });
    }

    return Array.from(map.values());
  }
}