from transformers import XLMRobertaTokenizer, XLMRobertaForSequenceClassification
import torch
import pandas as pd
import io

def get_sentiment(text, model_path="./saved_model/saved_wangchan_model"):
    tokenizer = XLMRobertaTokenizer.from_pretrained(model_path)
    model = XLMRobertaForSequenceClassification.from_pretrained(model_path)
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

def get_sentiments(file_content):
    try:
        df = pd.read_csv(io.BytesIO(file_content))
    except Exception:
        return {"error": "ไม่สามารถอ่านไฟล์ได้ กรุณาอัปโหลดไฟล์ .csv เท่านั้น"}
    
    target_col = None
    possible_names = ['text']
    for col in df.columns:
        if col.lower() in possible_names:
            target_col = col
            break
            
    if not target_col:
        target_col = df.columns[0]

    results = []
    stat = {"positive": {
            "count" : 0,
            "docs" : []
        }, "negative": {
            "count" : 0,
            "docs" : []
        }, "neutral": {
            "count" : 0,
            "docs" : []
        }}
    
    for txt in df[target_col]:
        sentiment = get_sentiment(str(txt))
        if sentiment == "Positive":
            stat["positive"]['count'] += 1
            stat["positive"]['docs'].append(str(txt))
        elif sentiment == "Neutral":
            stat["neutral"]['count'] += 1
            stat["neutral"]['docs'].append(str(txt))
        elif sentiment == "Negative":
            stat["negative"]['count'] += 1
            stat["negative"]['docs'].append(str(txt))
        results.append({"text": str(txt), "sentiment": sentiment})
    
    return results, stat