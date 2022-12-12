import { Injectable } from '@nestjs/common';
import { UpdatePointDto } from 'src/modules/points/dto/update-point.dto';
import { CreatePointDto } from 'src/modules/points/dto/create-point.dto';

@Injectable()
export class PointPrizeService {
  create(createPointDto: CreatePointDto) {
    return 'This action adds a new point';
  }

  findAll() {
    return `This action returns all points`;
  }

  findOne(id: number) {
    return `This action returns a #${id} point`;
  }

  update(id: number, updatePointDto: UpdatePointDto) {
    return `This action updates a #${id} point`;
  }

  remove(id: number) {
    return `This action removes a #${id} point`;
  }
}
