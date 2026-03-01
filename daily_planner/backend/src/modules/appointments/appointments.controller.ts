import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AppointmentsService } from "./appointments.service";
import { Delete } from "@nestjs/common";
import { CreateAppointmentDto } from "./dto/create-appointment.dto";
import { UpdateAppointmentDto } from "./dto/update-appointment.dto";

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
  @Patch(":id")
update(@Param("id") id: string, @Body() body: any) {
  return this.appointments.update(id, body);
}
@Delete(":id")
remove(@Param("id") id: string) {
  return this.appointments.remove(id);
}
}
