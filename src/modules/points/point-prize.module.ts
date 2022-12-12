import { Module } from '@nestjs/common';
import { PointPrizeController } from 'src/controllers/point-prize.controller';
import { PointPrizeService } from 'src/services/point-prize.service';

@Module({
  controllers: [PointPrizeController],
  providers: [PointPrizeService],
})
export class PointPrizeModule {}
