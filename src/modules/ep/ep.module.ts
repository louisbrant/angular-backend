import { Module } from '@nestjs/common';
import { EpController } from 'src/controllers/ep.controller';
import { EpService } from 'src/services/ep.service';

@Module({
  controllers: [EpController],
  providers: [EpService],
})
export class EpModule {}
