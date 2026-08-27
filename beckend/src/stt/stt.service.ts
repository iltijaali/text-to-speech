import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';

interface WhisperResponse {
  text?: unknown;
}

@Injectable()
export class SttService {
  private readonly whisperUrl =
    process.env.STT_SERVICE_URL ?? 'http://localhost:8000/transcribe';

  async transcribe(file: Express.Multer.File): Promise<{ text: string }> {
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    try {
      const response = await axios.post<WhisperResponse>(
        this.whisperUrl,
        form,
        {
          headers: form.getHeaders(),
          maxBodyLength: Infinity,
          timeout: 120_000,
        },
      );

      if (typeof response.data.text !== 'string') {
        throw new BadGatewayException(
          'The STT service returned an invalid transcription response.',
        );
      }

      return { text: response.data.text };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        this.handleAxiosError(error);
      }

      throw new BadGatewayException('Whisper transcription failed.');
    }
  }

  private handleAxiosError(error: AxiosError): never {
    if (!error.response) {
      throw new ServiceUnavailableException(
        'The Python STT service is unavailable. Ensure it is running on port 8000.',
      );
    }

    throw new BadGatewayException(
      'The Python STT service could not transcribe this audio.',
    );
  }
}
