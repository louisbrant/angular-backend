import { Module } from '@nestjs/common';


import { StatController } from 'src/controllers/stat.controller';
import { StatService } from 'src/services/stat.service';



@Module({

 controllers: [StatController],
  providers: [StatService],
})
export class StatModule {

}
