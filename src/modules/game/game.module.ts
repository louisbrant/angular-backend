import { Module } from '@nestjs/common';
import { GameController } from 'src/controllers/game.controller';
import { GameService } from 'src/services/game.service';
import { SharedService } from 'src/services/shared.service';

@Module({
  controllers: [GameController],
  providers: [GameService, SharedService],
})
export class GameModule {}
