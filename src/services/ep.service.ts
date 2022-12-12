import { Injectable } from '@nestjs/common';
import { UpdateEpDto } from 'src/modules/ep/dto/update-ep.dto';
import { CreateEpDto } from 'src/modules/ep/dto/create-ep.dto';

@Injectable()
export class EpService {
  create(createEpDto: CreateEpDto) {
    return 'This action adds a new ep';
  }

  findAll() {
    return `This action returns all ep`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ep`;
  }

  update(id: number, updateEpDto: UpdateEpDto) {
    return `This action updates a #${id} ep`;
  }

  remove(id: number) {
    return `This action removes a #${id} ep`;
  }
}
