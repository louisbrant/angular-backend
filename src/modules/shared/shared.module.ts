import { Module } from '@nestjs/common';
import { SharedService } from 'src/services/shared.service';

@Module({
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}
