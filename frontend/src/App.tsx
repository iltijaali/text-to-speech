import { useRef, useState } from 'react';

function App() {
  const [text, setText] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
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
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.text));
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  };

  const transcribeAudio = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsTranscribing(true);
      setTranscription('');

      const response = await fetch('http://localhost:3003/stt/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data: { text?: string; message?: string | string[] } =
        await response.json();

      if (!response.ok || !data.text) {
        const message = Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message;
        throw new Error(message ?? 'Transcription failed');
      }

      setTranscription(data.text);
    } catch (error) {
      console.error('Speech-to-text error:', error);
      alert(error instanceof Error ? error.message : 'Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleTranscribe = () => {
    if (!audioFile) {
      alert('Please select an audio file');
      return;
    }

    void transcribeAudio(audioFile);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      alert('Your browser does not support microphone recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          setAudioFile(recordedAudio);
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
    <div>
      <h1>Text to Speech App</h1>

      <textarea
        placeholder="Write something here..."
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        cols={50}
      />

      <br />
      <br />

      <button onClick={handleSpeak}>🔊 Speak</button>
      <br />
      <br />

      <button onClick={() => window.speechSynthesis.cancel()}>
        ⏹ Stop
      </button>

      <hr />

      <h2>Speech to Text</h2>
      <button
        onClick={isRecording ? stopRecording : () => void startRecording()}
        disabled={isTranscribing}
      >
        {isRecording ? '⏹ Stop Recording' : '🎙 Start Recording'}
      </button>
      <p>{isRecording && 'Recording... speak now, then click Stop Recording.'}</p>
      <p>Or upload an existing audio file:</p>
      <input
        type="file"
        accept="audio/*"
        onChange={(event) => {
          setAudioFile(event.target.files?.[0] ?? null);
          setTranscription('');
        }}
      />
      <br />
      <br />

      <button onClick={handleTranscribe} disabled={!audioFile || isTranscribing}>
        {isTranscribing ? 'Transcribing...' : 'Convert Voice to Text'}
      </button>

      {transcription && (
        <section>
          <h3>Transcription</h3>
          <p>{transcription}</p>
        </section>
      )}
    </div>
  );
}

export default App;
