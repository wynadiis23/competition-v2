import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class UpdateCompetitionDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 128)
  @ApiProperty({
    name: 'name',
    type: 'string',
    required: true,
    description: 'Competition name',
    example: 'Ramadhan Cup',
  })
  name: string;

  @ApiProperty({
    name: 'id',
    type: 'string',
    format: 'uuid',
    required: true,
    description: 'Competition id',
    example: 'd315e163-d38e-4bfe-ac0d-2538788fb7b5',
  })
  @IsUUID(4)
  @IsNotEmpty()
  id: string;
}
