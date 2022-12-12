import { PartialType } from '@nestjs/mapped-types';
import { CreateTodayDto } from './create-today.dto';

export class UpdateTodayDto extends PartialType(CreateTodayDto) {}
