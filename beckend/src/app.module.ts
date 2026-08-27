import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TtsModule } from './tts/tts.module';
import { SttModule } from './stt/stt.module';

@Module({
  imports: [TtsModule, SttModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
