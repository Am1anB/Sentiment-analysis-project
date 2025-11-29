from transformers import XLMRobertaTokenizer, TFXLMRobertaForSequenceClassification
import tensorflow as tf
import pandas as pd
import io
import os

MODEL_PATH = "./saved_model/xlm_roberta_model"

_tokenizer = None
_model = None

def load_model():
    """ฟังก์ชันช่วยโหลดโมเดลเพียงครั้งเดียว"""
    global _tokenizer, _model
    if _tokenizer is None or _model is None:
        try:
            print(f"Loading TensorFlow model from {MODEL_PATH}...")
            _tokenizer = XLMRobertaTokenizer.from_pretrained(MODEL_PATH)
            _model = TFXLMRobertaForSequenceClassification.from_pretrained(MODEL_PATH)
            print("✅ Model loaded successfully!")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False
    return True

def get_sentiment(text):
    if not load_model():
        return "System Error"
        
    if not text: return "Unknown"
    
    try:
        inputs = _tokenizer(str(text), return_tensors="tf", truncation=True, max_length=128, padding=True)

        outputs = _model(inputs)
        logits = outputs.logits
        
        predicted_index = int(tf.argmax(logits, axis=1))
        
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

def get_sentiments(file_content):
    try:
        try:
            df = pd.read_csv(io.BytesIO(file_content))
        except:
            df = pd.read_csv(io.BytesIO(file_content), header=None)
            df.columns = ['text']
    except Exception:
        return [], {"error": "อ่านไฟล์ไม่ได้"}
    
    target_col = None
    possible_names = ['text', 'comment', 'content', 'message', 'ความคิดเห็น', 'ข้อความ']
    for col in df.columns:
        if str(col).lower() in possible_names:
            target_col = col
            break
    if not target_col: target_col = df.columns[0]

    results = []
    stat = {
        "positive": {"count": 0, "docs": []},
        "negative": {"count": 0, "docs": []},
        "neutral": {"count": 0, "docs": []}
    }
    
    load_model()
    
    for txt in df[target_col].astype(str):
        if not txt or txt == 'nan': continue
        sentiment = get_sentiment(txt)
        
        key = sentiment.lower() 
        if key in stat:
            stat[key]['count'] += 1
            stat[key]['docs'].append(txt)
            
        results.append({"text": txt, "sentiment": sentiment})
    
    return results, stat