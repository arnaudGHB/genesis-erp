import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { AuthGuard } from '@nestjs/passport';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post('adjust') // Route : POST /stocks/adjust
  adjustStock(@Body() adjustStockDto: AdjustStockDto) {
    return this.stocksService.adjustStock(adjustStockDto);
  }

  @Get() // Route : GET /stocks
  findAll() {
    return this.stocksService.findAll();
  }

  @Get('product/:productId') // Route : GET /stocks/product/{productId}
  findStockForProduct(@Param('productId') productId: string) {
    return this.stocksService.findStockForProduct(productId);
  }
}
