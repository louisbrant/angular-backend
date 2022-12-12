import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedService } from 'src/services/shared.service';
import { InterestingH2hController } from 'src/controllers/interesting-h2h.controller';
import { InterestingH2hService } from 'src/services/interesting-h2h.service';
import { H2hAtp, H2hWta } from 'src/modules/h2h/entity/h2h.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      H2hAtp,
      H2hWta,
    ]),
  ],
  controllers: [InterestingH2hController],
  providers: [InterestingH2hService, SharedService],
})
export class InterestingH2hModule {}
