import { Injectable } from '@nestjs/common';
import { UpdateTodayDto } from 'src/modules/today/dto/update-today.dto';
import { CreateTodayDto } from 'src/modules/today/dto/create-today.dto';

@Injectable()
export class TodayService {
  create(createTodayDto: CreateTodayDto) {
    return 'This action adds a new today';
  }

  findAll() {
    return `This action returns all today`;
  }

  findOne(id: number) {
    return `This action returns a #${id} today`;
  }

  update(id: number, updateTodayDto: UpdateTodayDto) {
    return `This action updates a #${id} today`;
  }

  remove(id: number) {
    return `This action removes a #${id} today`;
  }
}
