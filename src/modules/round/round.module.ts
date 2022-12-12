import { Module } from '@nestjs/common';
import { Round } from 'src/modules/round/entity/round.entity';

@Module({
  controllers: [],
  providers: [Round],
})
export class RoundModule {}
