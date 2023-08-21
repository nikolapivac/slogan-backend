import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SloganGeneratorService } from './slogan-generator.service';
import { GenerateSloganDto } from './dto/generate-slogan.dto';
import { SloganResponseDto } from './dto/slogan-response.dto';

@Controller('slogan-generator')
@ApiTags('slogan-generator')
export class SloganGeneratorController {
  constructor(
    private readonly sloganGeneratorService: SloganGeneratorService,
  ) {}

  // generate a new slogan
  @Post('/generate')
  @ApiOperation({ summary: 'Generate a new slogan' })
  @ApiCreatedResponse({
    description: 'Slogan generated successfully',
    type: SloganResponseDto,
  })
  async generateSlogan(
    @Body() data: GenerateSloganDto,
  ): Promise<SloganResponseDto> {
    const response = await this.sloganGeneratorService.generateSlogan(data);
    return SloganResponseDto.map(response);
  }
}
