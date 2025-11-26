import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [inputText, setInputText] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [file, setFile] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันเดิม
  const handleAnalyzeText = async () => {
    if (!inputText) return;
    try {
      const response = await axios.post('http://localhost:8000/analyze-text', {
        text: inputText
      });
      setSingleResult(response.data.sentiment);
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ Server");
    }
  };

  // ฟังก์ชันเดิม
  const handleFileUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post('http://localhost:8000/analyze-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.error) {
        alert(response.data.error);
      } else {
        setBatchResults(response.data.results);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setLoading(false);
    }
  };

  const getColor = (sentiment) => {
    if (sentiment === 'Positive') return '#4caf50'; 
    if (sentiment === 'Negative') return '#f44336'; 
    return '#ff9800'; 
  };

  // --- ส่วนที่เพิ่มใหม่: คำนวณยอดรวม ---
  // ใช้ .reduce เพื่อวนลูปนับจำนวนแต่ละ Sentiment
  const summary = batchResults.reduce((acc, item) => {
    const key = item.sentiment;
    acc[key] = (acc[key] || 0) + 1; // ถ้ามีคีย์นี้ให้ +1 ถ้าไม่มีให้เริ่มที่ 1
    return acc;
  }, { Positive: 0, Neutral: 0, Negative: 0 }); // ค่าเริ่มต้น

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>AI Sentiment Analysis</h1>
      
      {/* Box 1: Single Text (เหมือนเดิม) */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>📝 วิเคราะห์รายประโยค</h2>
        <textarea 
          rows="4" 
          style={{ width: '100%', padding: '10px', fontSize: '16px', boxSizing: 'border-box' }}
          placeholder="พิมพ์ข้อความที่นี่... (เช่น กฎหมายนี้ดีมาก)"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button 
          onClick={handleAnalyzeText} 
          style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          วิเคราะห์
        </button>

        {singleResult && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#b7b7b7ff', borderRadius: '4px', borderLeft: `5px solid ${getColor(singleResult)}` }}>
            ผลลัพธ์: <strong style={{ color: getColor(singleResult), fontSize: '1.2em' }}>{singleResult}</strong>
          </div>
        )}
      </div>

      {/* Box 2: File Upload (แก้ส่วนแสดงผล) */}
      <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>📂 วิเคราะห์จากไฟล์ (CSV) - สรุปผล</h2>
        <p style={{ color: '#666' }}>อัปโหลดไฟล์ CSV เพื่อดูจำนวน Sentiment แต่ละประเภท</p>
        
        <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".csv" />
        <button 
          onClick={handleFileUpload} 
          disabled={loading}
          style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? "กำลังประมวลผล..." : "อัปโหลดและวิเคราะห์"}
        </button>

        {/* ส่วนแสดงผลลัพธ์แบบใหม่ (Dashboard) */}
        {batchResults.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
              ผลการวิเคราะห์ทั้งหมด: {batchResults.length} รายการ
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: '10px', flexWrap: 'wrap' }}>
              
              {/* Card: Positive */}
              <div style={{ 
                flex: 1, minWidth: '150px', padding: '20px', textAlign: 'center', 
                backgroundColor: '#e8f5e9', border: `2px solid ${getColor('Positive')}`, borderRadius: '10px' 
              }}>
                <h2 style={{ color: getColor('Positive'), margin: 0, fontSize: '2.5em' }}>
                  {summary.Positive || 0}
                </h2>
                <div style={{ color: '#333', fontWeight: 'bold' }}>Positive</div>
              </div>

              {/* Card: Neutral */}
              <div style={{ 
                flex: 1, minWidth: '150px', padding: '20px', textAlign: 'center', 
                backgroundColor: '#fff3e0', border: `2px solid ${getColor('Neutral')}`, borderRadius: '10px' 
              }}>
                <h2 style={{ color: getColor('Neutral'), margin: 0, fontSize: '2.5em' }}>
                  {summary.Neutral || 0}
                </h2>
                <div style={{ color: '#333', fontWeight: 'bold' }}>Neutral</div>
              </div>

              {/* Card: Negative */}
              <div style={{ 
                flex: 1, minWidth: '150px', padding: '20px', textAlign: 'center', 
                backgroundColor: '#ffebee', border: `2px solid ${getColor('Negative')}`, borderRadius: '10px' 
              }}>
                <h2 style={{ color: getColor('Negative'), margin: 0, fontSize: '2.5em' }}>
                  {summary.Negative || 0}
                </h2>
                <div style={{ color: '#333', fontWeight: 'bold' }}>Negative</div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;