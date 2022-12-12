import { Module } from '@nestjs/common';
import { CountriesController } from 'src/controllers/countries.controller';
import { CountriesService } from 'src/services/countries.service';

@Module({
  controllers: [CountriesController],
  providers: [CountriesService],
})
export class CountriesModule {}
