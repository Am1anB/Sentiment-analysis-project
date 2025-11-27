from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentiment import get_sentiment, get_sentiments
from topic import get_topic_documents
from model import get_llm
from analyst import Summarizer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextInput(BaseModel):
    text: str

def gather_all(contents):
    llm = get_llm()
    summarizer = Summarizer(llm)

    sentiments_output, sentiments_stat = get_sentiments(contents)

    topic_output = get_topic_documents(contents)

    summarize, topic_stat = summarizer.summarization(sentiments_output, topic_output)

    sentiments_stat["topic"] = topic_stat
    sentiments_stat["summarize"] = summarize
    result = sentiments_stat

    return result

@app.post("/analyze-text")
async def analyze_text(input: TextInput):
    result = get_sentiment(input.text)
    return {"text": input.text, "sentiment": result}

@app.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    contents = await file.read()
    result = gather_all(contents)
    return result
