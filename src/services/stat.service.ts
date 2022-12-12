import { Injectable } from '@nestjs/common';
import { UpdateStatDto } from 'src/modules/stat/dto/update-stat.dto';
import { CreateStatDto } from 'src/modules/stat/dto/create-stat.dto';



@Injectable()
export class StatService {

  create(createStatDto: CreateStatDto) {
    return 'This action adds a new stat';
  }

  findAll() {
    return `This action returns all stats`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stat`;
  }

  update(id: number, updateStatDto: UpdateStatDto) {
    return `This action updates a #${id} stat`;
  }

  remove(id: number) {
    return `This action removes a #${id} stat`;
  }
}