import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class StocksService {
  constructor(private prisma: PrismaService) {}

  // Opération principale pour ajuster le stock
  async adjustStock(adjustStockDto: AdjustStockDto) {
    const { productId, location, changeQuantity } = adjustStockDto;

    // 1. Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found` );
    }

    // 2. Utiliser une transaction pour assurer l'intégrité des données
    return this.prisma.$transaction(async (tx) => {
      // 3. Essayer de trouver le niveau de stock existant
      const stockLevel = await tx.stockLevel.findUnique({
        where: {
          productId_location: { productId, location },
        },
      });

      if (stockLevel) {
        // 4a. Si le stock existe, on le met à jour (opération d'incrémentation)
        const newQuantity = stockLevel.quantity + changeQuantity;
        if (newQuantity < 0) {
          throw new Error('Stock quantity cannot be negative.');
        }
        return tx.stockLevel.update({
          where: { id: stockLevel.id },
          data: { quantity: newQuantity },
        });
      } else {
        // 4b. Si le stock n'existe pas, on le crée
        if (changeQuantity < 0) {
          throw new Error('Cannot create a new stock level with a negative quantity.');
        }
        return tx.stockLevel.create({
          data: {
            productId,
            location,
            quantity: changeQuantity,
          },
        });
      }
    });
  }

  // Lister tous les niveaux de stock
  findAll() {
    return this.prisma.stockLevel.findMany({
      include: { product: true }, // Inclure les détails du produit associé
    });
  }

  // Trouver le stock pour un produit spécifique
  findStockForProduct(productId: string) {
    return this.prisma.stockLevel.findMany({
      where: { productId },
    });
  }
}
