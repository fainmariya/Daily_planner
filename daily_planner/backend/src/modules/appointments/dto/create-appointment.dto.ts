import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
    IsIn,
    IsISO8601,
  } from "class-validator";
  import { Type } from "class-transformer";
  
  class ClientInputDto {
    @IsString()
    @IsNotEmpty()
    fullName!: string;
  
    @IsOptional()
    @IsString()
    phone?: string | null;
  
    @IsOptional()
    @IsISO8601()
    birthDate?: string | null;
  }
  
  export class CreateAppointmentDto {
    // BigInt мы всё равно создаём сами через BigInt(), поэтому тут держим как string/number
    @IsNotEmpty()
    employeeId!: string;
  
    @IsOptional()
    clientId?: string | null;
  
    @IsISO8601()
    startAt!: string;
  
    @IsOptional()
    @IsISO8601()
    endAt?: string | null;
  
    @IsOptional()
    @IsIn(["planned", "done", "canceled"])
    status?: "planned" | "done" | "canceled";
  
    @IsOptional()
    @IsInt()
    @Min(0)
    priceCents?: number | null;
  
    @IsOptional()
    @IsString()
    notes?: string | null;
  
    @IsOptional()
    @IsString()
    formula?: string | null;
  
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    serviceIds?: number[];
  
    @IsOptional()
    @ValidateNested()
    @Type(() => ClientInputDto)
    client?: ClientInputDto | null;
  }
  