import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateStageRewardDto {
  @ApiProperty({
    name: 'rewards',
    type: 'number',
    required: true,
    example: 10000,
    nullable: false,
    description: 'Reward amount per stage',
  })
  @IsNumber()
  @IsNotEmpty()
  rewards: number;

  @IsString()
  @IsNotEmpty()
  @Length(4, 128)
  @ApiProperty({
    name: 'config',
    type: 'string',
    required: true,
    description: 'Config name',
    example: 'points',
  })
  config: string;

  @ApiProperty({
    name: 'stageId',
    type: 'string',
    format: 'uuid',
    required: true,
    description: 'Stage id',
    example: '06fe0ed6-005e-47c9-9714-47bbee9de94a',
  })
  @IsUUID(4)
  @IsNotEmpty()
  stageId: string;
}
