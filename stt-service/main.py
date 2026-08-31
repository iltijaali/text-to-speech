from fastapi import FastAPI, UploadFile, File
from transformers import pipeline
import asyncio
import tempfile
import os

app = FastAPI()

print("Loading Whisper Small model...")

transcriber = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-small",
    chunk_length_s=30,
    stride_length_s=5,
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
        # Run the blocking Whisper inference in a thread so it doesn't
        # freeze the event loop for the whole request duration.
        # no_repeat_ngram_size/repetition_penalty prevent the model from
        # getting stuck in a repeated-token loop on silent or noisy audio,
        # which otherwise runs until it exhausts its generation budget.
        result = await asyncio.to_thread(
            transcriber,
            temp_file_path,
            generate_kwargs={
                "no_repeat_ngram_size": 3,
                "repetition_penalty": 1.3,
            },
        )

        return {
            "text": result["text"]
        }

    finally:
        # Delete temporary audio file
        os.remove(temp_file_path)