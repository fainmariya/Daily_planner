import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { ServicesModule } from "./modules/services/services.module";
import { EmployeesModule } from "./modules/employees/employees.module";
import { AppointmentsModule } from './modules/appointments/appointments.module';

@Module({
  imports: [PrismaModule, ServicesModule, EmployeesModule, AppointmentsModule],
})
export class AppModule {}
