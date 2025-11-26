from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import XLMRobertaTokenizer, XLMRobertaForSequenceClassification
import torch
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "./saved_model/saved_wangchan_model"

tokenizer = None
model = None

print(f"กำลังโหลดโมเดลจาก {MODEL_PATH} ...")
try:
    tokenizer = XLMRobertaTokenizer.from_pretrained(MODEL_PATH)
    model = XLMRobertaForSequenceClassification.from_pretrained(MODEL_PATH)
    print("✅ โหลดโมเดลสำเร็จ พร้อมใช้งาน!")
except Exception as e:
    print("\n" + "="*50)
    print(f"CRITICAL ERROR: โหลดโมเดลไม่สำเร็จ")
    print(f"สาเหตุ: {e}")
    print("="*50)
    print("คำแนะนำสำหรับการแก้ไข:")
    print("1. คุณต้องไปเปลี่ยนชื่อโฟลเดอร์ 'saved_wangchan_model (1)' ให้เป็น 'saved_model'")
    print("2. ห้ามมีเว้นวรรค หรือวงเล็บ ในชื่อโฟลเดอร์เด็ดขาด")
    print("="*50 + "\n")

def get_sentiment(text):
    if tokenizer is None or model is None:
        return "System Error: Model not loaded"
        
    if not text: return "Unknown"
    
    try:
        inputs = tokenizer(str(text), return_tensors="pt", truncation=True, max_length=128, padding=True)
        with torch.no_grad():
            logits = model(**inputs).logits
        
        predicted_index = logits.argmax().item()
        
        if predicted_index == 0:
            return "Positive"
        elif predicted_index == 1:
            return "Neutral"
        elif predicted_index == 2:
            return "Negative"
        else:
            return "Unknown"
    except Exception as e:
        print(f"Prediction Error: {e}")
        return "Error"

class TextInput(BaseModel):
    text: str

@app.post("/analyze-text")
async def analyze_text(input: TextInput):
    result = get_sentiment(input.text)
    return {"text": input.text, "sentiment": result}

@app.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    if model is None:
        return {"error": "Model failed to load. Please fix the folder name on server."}

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
    except Exception:
        return {"error": "ไม่สามารถอ่านไฟล์ได้ กรุณาอัปโหลดไฟล์ .csv เท่านั้น"}
    
    target_col = None
    possible_names = ['text', 'comment', 'message', 'data', 'content', 'review', 'ความคิดเห็น']
    for col in df.columns:
        if col.lower() in possible_names:
            target_col = col
            break
            
    if not target_col:
        target_col = df.columns[0]
        
    results = []
    
    limit_rows = 200
    
    for txt in df[target_col].head(limit_rows):
        sentiment = get_sentiment(str(txt))
        results.append({"text": str(txt), "sentiment": sentiment})
        
    return {"results": results}