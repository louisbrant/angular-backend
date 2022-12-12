import { Module } from '@nestjs/common';
import { TodayController } from 'src/controllers/today.controller';
import { TodayService } from 'src/services/today.service';

@Module({
  controllers: [TodayController],
  providers: [TodayService],
})
export class TodayModule {}
