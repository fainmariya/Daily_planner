import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ServicesService } from "./services.service";

@Controller("services")
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  list() {
    return this.services.list();
  }

  @Post()
  create(@Body() body: { name: string; durationMin: number }) {
    return this.services.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: { name?: string; durationMin?: number }) {
    return this.services.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.services.remove(id);
  }
}