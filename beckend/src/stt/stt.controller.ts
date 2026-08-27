import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SttService } from './stt.service';

const supportedAudioTypes = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
  'audio/flac',
]);

@Controller('stt')
export class SttController {
  constructor(private readonly sttService: SttService) {}

  @Post('transcribe')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const mimeType = file.mimetype.split(';')[0] ?? '';

        if (!supportedAudioTypes.has(mimeType)) {
          callback(
            new BadRequestException(
              'Unsupported audio type. Upload an MP3, WAV, M4A, OGG, WebM, or FLAC file.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  transcribe(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(
        'No audio file provided. Send an audio file using the multipart field name "file".',
      );
    }

    return this.sttService.transcribe(file);
  }
}
