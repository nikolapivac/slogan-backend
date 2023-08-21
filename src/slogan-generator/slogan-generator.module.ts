import { Module } from '@nestjs/common';
import { SloganGeneratorController } from './slogan-generator.controller';
import { SloganGeneratorService } from './slogan-generator.service';

@Module({
  controllers: [SloganGeneratorController],
  providers: [SloganGeneratorService],
})
export class SloganGeneratorModule {}
