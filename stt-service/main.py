from fastapi import FastAPI, UploadFile, File
from transformers import pipeline
import tempfile
import os

app = FastAPI()

print("Loading Whisper Small model...")

transcriber = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-small"
)

print("Model loaded successfully!")


@app.get("/")
def home():
    return {
        "message": "Whisper Small STT service is running"
    }


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    
    # Create a temporary file
    suffix = os.path.splitext(file.filename)[1]

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name

    try:
        # Send audio to Whisper
        result = transcriber(temp_file_path)

        return {
            "text": result["text"]
        }

    finally:
        # Delete temporary audio file
        os.remove(temp_file_path)