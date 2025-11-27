from bertopic import BERTopic
from bertopic.representation import MaximalMarginalRelevance, OpenAI
from sklearn.feature_extraction.text import CountVectorizer
from pythainlp.tokenize import word_tokenize
from pythainlp.corpus import thai_stopwords
from dotenv import load_dotenv
import pandas as pd
import io
import openai

load_dotenv()

def thai_tokenizer(text):
    return word_tokenize(text)

def get_topic_documents(file_content):
    try:
        df = pd.read_csv(io.BytesIO(file_content))
    except Exception:
        return {"error": "ไม่สามารถอ่านไฟล์ได้ กรุณาอัปโหลดไฟล์ .csv เท่านั้น"}

    docs = df['text'].to_list()
    th_stopwords = list(thai_stopwords())
    vectorizer_model = CountVectorizer(tokenizer=thai_tokenizer, stop_words=th_stopwords)

    prompt = """
    I have a topic that contains the following documents: \n[DOCUMENTS]
    The topic is described by the following keywords: [KEYWORDS]

    Based on the information above, please provide a short, concise topic label in Thai language (ภาษาไทย).
    The label should be professional and summarize the core issue.
    
    Topic:
    """

    mmr = MaximalMarginalRelevance(diversity=0.3)
    client = openai.OpenAI()
    openai_model = OpenAI(client, prompt=prompt)
    rep_model = [mmr, openai_model]

    topic_model = BERTopic(
        language="multilingual", 
        vectorizer_model=vectorizer_model,
        min_topic_size=3,
        representation_model=rep_model
    )

    topic_model.fit_transform(docs)

    doc_info = topic_model.get_document_info(docs)

    mask = doc_info['Topic'] == -1
    if mask.any():
        doc_info.loc[mask, 'Representation'] = doc_info.loc[mask, 'Representation'].apply(lambda x: ['อื่นๆ'])

    return doc_info['Representation'].tolist()