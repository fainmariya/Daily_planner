import { IsBoolean, IsISO8601, IsOptional, IsString } from "class-validator";

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string;

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