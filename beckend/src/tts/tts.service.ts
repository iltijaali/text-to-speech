import { Injectable } from '@nestjs/common';

@Injectable()
export class TtsService {
  speak(text: string) {
    console.log('Text received:', text);

    return {
      message: 'Text received successfully',
      text: text,
    };
  }
}