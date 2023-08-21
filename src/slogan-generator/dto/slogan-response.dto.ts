import { ApiProperty } from '@nestjs/swagger';

export class SloganResponseDto {
  @ApiProperty()
  slogan: string;

  static map(slogan: string): SloganResponseDto {
    const dto = new SloganResponseDto();
    dto.slogan = slogan;
    return dto;
  }
}
