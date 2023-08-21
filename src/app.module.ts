import { Module } from '@nestjs/common';
import { SloganGeneratorModule } from './slogan-generator/slogan-generator.module';

@Module({
  imports: [SloganGeneratorModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
