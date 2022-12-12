import { PartialType } from '@nestjs/mapped-types';
import { CreateH2hDto } from './create-h2h.dto';

export class UpdateH2hDto extends PartialType(CreateH2hDto) {}
