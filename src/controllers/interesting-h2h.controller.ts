import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InterestingH2hService } from 'src/services/interesting-h2h.service';

@Controller('tennis/api2/interesting-h2h')
@ApiTags('interesting-h2h')
export class InterestingH2hController {
  constructor(private readonly interestingH2hService: InterestingH2hService) {}

  @Get(':type')
  findInterestingH2h(
    @Param('type') type: string
  ) {
    return this.interestingH2hService.interestingH2h(type);
  }
}
