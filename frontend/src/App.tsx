import { useRef, useState } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSpeak = async () => {
    try {
      if (!text.trim()) {
        alert('Please enter some text');
        return;
      }

      window.speechSynthesis.cancel();

      const response = await fetch('http://localhost:3003/tts/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data: { text: string } = await response.json();
      const utterance = new SpeechSynthesisUtterance(data.text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const transcribeAudio = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const maxAttempts = 20;

    setIsTranscribing(true);
    setTranscription('');

    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const response = await fetch('http://localhost:3003/stt/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (response.status === 503 && attempt < maxAttempts) {
          setTranscription('Speech service is still starting up. Retrying…');
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }

        const data: { text?: string; message?: string | string[] } =
          await response.json();

        if (!response.ok || !data.text) {
          const message = Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message;
          throw new Error(message ?? 'Transcription failed');
        }

        setTranscription(data.text);
        return;
      }
    } catch (error) {
      console.error('Speech-to-text error:', error);
      setTranscription('');
      alert(error instanceof Error ? error.message : 'Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      alert('Your browser does not support microphone recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener('stop', () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        const audioType = recorder.mimeType || 'audio/webm';
        const recordedAudio = new File(
          audioChunksRef.current,
          'microphone-recording.webm',
          { type: audioType },
        );

        if (recordedAudio.size > 0) {
          void transcribeAudio(recordedAudio);
        }
      });

      mediaRecorderRef.current = recorder;
      recorder.start();
      setTranscription('');
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Microphone access was denied or is unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Speech Studio</h1>
        <p className="subtitle">Text to speech and speech to text, instantly.</p>
      </header>

      <main className="panels">
        <section className="card">
          <div className="card-header">
            <span className="card-icon" aria-hidden="true">
              🔊
            </span>
            <h2>Text to Speech</h2>
          </div>

          <textarea
            className="text-input"
            placeholder="Type something to hear it out loud..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={7}
          />

          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => void handleSpeak()}
              disabled={isSpeaking}
            >
              {isSpeaking ? 'Speaking…' : '▶ Speak'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleStop}
              disabled={!isSpeaking}
            >
              ■ Stop
            </button>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <span className="card-icon" aria-hidden="true">
              🎙
            </span>
            <h2>Speech to Text</h2>
          </div>

          <div className="record-area">
            <button
              className={`mic-button ${isRecording ? 'is-recording' : ''}`}
              onClick={isRecording ? stopRecording : () => void startRecording()}
              disabled={isTranscribing}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              <span className="mic-icon" aria-hidden="true">
                {isRecording ? '■' : '🎙'}
              </span>
            </button>
            <p className="record-status">
              {isRecording
                ? 'Listening… click to stop'
                : isTranscribing
                  ? 'Transcribing…'
                  : 'Click the mic to start recording'}
            </p>
          </div>

          <div className={`transcript ${transcription ? 'has-content' : ''}`}>
            {transcription || 'Your transcription will appear here.'}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
