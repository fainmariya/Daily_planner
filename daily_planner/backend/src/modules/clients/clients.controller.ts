import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ClientsService } from "./clients.service";

@Controller('clients')
export class ClientsController {constructor(private readonly clients: ClientsService) {}
@Get()
search(@Query("query") query?: string) {
  return this.clients.search(query ?? "");
}
@Get(":id/history")
history(@Param("id") id: string) {
  return this.clients.history(id);}
  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.clients.getOne(id);
  }
  @Patch(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return this.clients.update(id, body);
  }
}
