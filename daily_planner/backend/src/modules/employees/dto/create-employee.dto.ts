import { IsBoolean, IsISO8601, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  displayName?: string | null;

  @IsOptional()
  @IsISO8601()
  birthDate?: string | null;

  @IsOptional()
  @IsBoolean()
  showInPlanner?: boolean;
}