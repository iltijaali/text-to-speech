import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TtsModule } from './tts/tts.module';

@Module({
  imports: [TtsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
