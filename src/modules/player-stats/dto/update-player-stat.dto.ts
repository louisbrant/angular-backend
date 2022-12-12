import { PartialType } from '@nestjs/mapped-types';
import { CreatePlayerStatDto } from './create-player-stat.dto';

export class UpdatePlayerStatDto extends PartialType(CreatePlayerStatDto) {}
