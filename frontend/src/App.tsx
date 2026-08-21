import { useState } from 'react';

function App() {
  const [text, setText] = useState('');

 const handleSpeak = async () => {
  try {
    // Check if text is empty
    if (!text.trim()) {
      alert('Please enter some text');
      return;
    }

    // Stop any previous speech
    window.speechSynthesis.cancel();

    const response = await fetch('http://localhost:3003/tts/speak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
      }),
    });

    const data = await response.json();

    console.log('Backend response:', data);

    // Create new speech
    const speech = new SpeechSynthesisUtterance(data.text);

    // Speak
    window.speechSynthesis.speak(speech);
  } catch (error) {
    console.error('Error:', error);
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

      <button onClick={handleSpeak}>
  🔊 Speak
</button>
 <br />


<button onClick={() => window.speechSynthesis.cancel()}>
  ⏹ Stop
</button>
    </div>
  );
}

export default App;