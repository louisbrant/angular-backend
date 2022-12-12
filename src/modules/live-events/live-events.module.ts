import { Module } from '@nestjs/common';
import { LiveEventsService } from 'src/services/live-events.service';
import { LiveEventsController } from 'src/controllers/live-events.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodayAtp, TodayWta } from 'src/modules/today/entity/today.entity';
import { SharedService } from 'src/services/shared.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TodayAtp,
      TodayWta,
    ]),
  ],
  controllers: [LiveEventsController],
  providers: [LiveEventsService, SharedService],
})
export class LiveEventsModule {}
