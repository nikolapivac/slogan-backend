import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class GenerateSloganDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'Company description' })
  description: string;
}
