import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";

@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  list(
    @Query("date") date: string,
    @Query("employeeId") employeeId: string
  ) {
    return this.appointments.listByDay({ date, employeeId });
  }
  @Post()
  create(@Body() body: any) {
    return this.appointments.create(body);
  }
}
