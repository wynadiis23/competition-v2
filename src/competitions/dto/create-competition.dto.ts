import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Validate } from 'class-validator';
// import { IsNotExist } from '../../common';

export class CreateCompetitionDto {
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
  // @Validate(IsNotExist, ['Competitions'], {
  //   message: 'Competition already exist.',
  // })
  name: string;
}
