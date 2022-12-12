import { Module } from '@nestjs/common';
import { RatingsController } from 'src/controllers/ratings.controller';
import { RatingsService } from 'src/services/ratings.service';

@Module({
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
