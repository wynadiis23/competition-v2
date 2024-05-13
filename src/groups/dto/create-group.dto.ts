import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 128)
  @ApiProperty({
    name: 'name',
    type: 'string',
    required: true,
    description: 'Group name',
    example: 'Group A',
  })
  name: string;

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
