import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class AdjustStockDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsInt()
  // Pas de @IsNotEmpty car 0 est une valeur valide
  changeQuantity!: number; // Peut être positif (ajout) ou négatif (retrait)
}
