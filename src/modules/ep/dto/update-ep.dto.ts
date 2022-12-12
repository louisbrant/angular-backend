import { PartialType } from '@nestjs/mapped-types';
import { CreateEpDto } from './create-ep.dto';

export class UpdateEpDto extends PartialType(CreateEpDto) {}
