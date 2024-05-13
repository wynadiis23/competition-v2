import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class UpdateStoreDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 128)
  @ApiProperty({
    name: 'code',
    type: 'string',
    required: true,
    description: 'Store code',
    example: 'PAKU',
  })
  code: string;

  @ApiProperty({
    name: 'id',
    type: 'string',
    format: 'uuid',
    required: true,
    description: 'Store id',
    example: 'd315e163-d38e-4bfe-ac0d-2538788fb7b5',
  })
  @IsUUID(4)
  @IsNotEmpty()
  id: string;
}
