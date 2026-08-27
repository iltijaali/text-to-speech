import { Body, Controller, Post } from '@nestjs/common';
import { TtsService } from './tts.service';

@Controller('tts')
export class TtsController {
  constructor(private readonly ttsService: TtsService) {}

  @Post('speak')
  speak(@Body() body: { text: string }) {
    return this.ttsService.speak(body.text);
  }
}
