import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cost?: number;
}
