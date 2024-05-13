import { ApiProperty } from '@nestjs/swagger';
import { CreateStageDto } from './create-stage.dto';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateStageDto extends CreateStageDto {
  @ApiProperty({
    name: 'id',
    type: 'string',
    format: 'uuid',
    required: true,
    description: 'Stage id',
    example: 'd315e163-d38e-4bfe-ac0d-2538788fb7b5',
  })
  @IsUUID(4)
  @IsNotEmpty()
  id: string;
}
