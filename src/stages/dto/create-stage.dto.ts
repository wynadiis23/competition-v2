import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateStageDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 128)
  @ApiProperty({
    name: 'name',
    type: 'string',
    required: true,
    description: 'Stage name',
    example: 'Knockout Phase',
  })
  name: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    name: 'bestOfTaken',
    type: 'number',
    required: true,
    description: 'Best of group that was taken to next stage',
    example: 4,
  })
  bestOfTaken: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    name: 'wildcardTaken',
    type: 'number',
    required: true,
    description: 'Wildcard of group that was taken to the lower bracket',
    example: 2,
  })
  wildcardTaken: number;

  @ApiProperty({
    name: 'competitionId',
    type: 'string',
    format: 'uuid',
    required: true,
    description: 'Competition id',
    example: '06fe0ed6-005e-47c9-9714-47bbee9de94a',
  })
  @IsUUID(4)
  @IsNotEmpty()
  competitionId: string;
}
