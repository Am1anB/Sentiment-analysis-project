import { useState } from 'react';
import axios from 'axios';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [inputText, setInputText] = useState("");
  const [singleResult, setSingleResult] = useState(null);
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const COLORS = {
    Positive: '#28a745',
    Neutral: '#ffc107',
    Negative: '#dc3545'
  };

  const THAI_LABEL = {
    Positive: 'Positive',
    Neutral: 'Neutral',
    Negative: 'Negative'
  };

  const handleAnalyzeText = async () => {
    if (!inputText) return;
    try {
      const response = await axios.post('http://localhost:8000/analyze-text', { text: inputText });
      setSingleResult(response.data.sentiment);
    } catch (error) {
      console.error("Error:", error);
      alert("เชื่อมต่อ Server ไม่ได้");
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setLoading(true);
    setAnalysisResult(null);
    setSelectedTopic(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post('http://localhost:8000/analyze-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.error) {
        alert(response.data.error);
      } else {
        setAnalysisResult(response.data);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาด (เช็คว่า Server รันอยู่ไหม)");
    } finally {
      setLoading(false);
    }
  };

  const getPieData = () => {
    if (!analysisResult) return [];
    return [
      { name: 'Positive', value: analysisResult.positive.count },
      { name: 'Neutral', value: analysisResult.neutral.count },
      { name: 'Negative', value: analysisResult.negative.count },
    ].filter(item => item.value > 0);
  };

  const getBarData = () => {
    if (!analysisResult || !analysisResult.topic) return [];
    return analysisResult.topic.map((item) => {
      const topicName = Object.keys(item)[0];
      const data = item[topicName];
      return {
        name: topicName,
        total: data.positive.count + data.neutral.count + data.negative.count,
        details: data 
      };
    }).sort((a, b) => b.total - a.total);
  };

  const handleBarClick = (entry) => {
    if (!entry) return;
    const allComments = [];
    ['positive', 'neutral', 'negative'].forEach(sent => {
      const docs = entry.details[sent]?.docs || [];
      docs.forEach(doc => {
        allComments.push({
          text: doc,
          sentiment: sent.charAt(0).toUpperCase() + sent.slice(1)
        });
      });
    });

    setSelectedTopic({
      name: entry.name,
      comments: allComments
    });
  };

  const barData = getBarData();
  const chartHeight = Math.max(barData.length * 50, 300); 

  return (
    <div className="container">
      <h1 className="header">Sentiment Analysis Project</h1>
      
      {/* Input Section */}
      <div className="card-row">
        <div className="card half-width">
          <h3>🔍 ทดสอบข้อความ</h3>
          <div className="input-group">
            <input 
              type="text" 
              className="text-input"
              placeholder="พิมพ์ข้อความ..." 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyzeText()}
            />
            <button onClick={handleAnalyzeText} className="btn-primary">วิเคราะห์</button>
          </div>
          {singleResult && (
            <div className="result-badge" style={{ backgroundColor: COLORS[singleResult] }}>
              ผลลัพธ์: {THAI_LABEL[singleResult]} 
            </div>
          )}
        </div>

        <div className="card half-width">
          <h3>📂 อัปโหลดไฟล์ (CSV)</h3>
          <div className="upload-group">
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files[0])} 
              accept=".csv"
              style={{ flex: 1 }}
            />
            <button onClick={handleFileUpload} disabled={loading} className="btn-success">
              {loading ? "กำลังประมวลผล..." : "วิเคราะห์"}
            </button>
          </div>
          <p className="hint-text" style={{ marginTop: '10px' }}>
            * ไฟล์ CSV ต้องมีคอลัมน์ชื่อ 'text' หรือ 'comment'
          </p>
        </div>
      </div>

      {analysisResult && (
        <div className="dashboard-content fade-in">
          
          {/* สถิติด่วน */}
          <div className="stats-grid">
            <div className="stat-card positive">
              <div className="stat-number">{analysisResult.positive.count}</div>
              <div className="stat-label">Positive</div>
            </div>
            <div className="stat-card neutral">
              <div className="stat-number">{analysisResult.neutral.count}</div>
              <div className="stat-label">Neutral</div>
            </div>
            <div className="stat-card negative">
              <div className="stat-number">{analysisResult.negative.count}</div>
              <div className="stat-label">Negative</div>
            </div>
          </div>

          {/* บทสรุปสำหรับผู้บริหาร */}
          <div className="summary-section">
            <h2>บทสรุป</h2>
            <div className="markdown-content">
              <ReactMarkdown>{analysisResult.summarize}</ReactMarkdown>
            </div>
          </div>

          <div className="charts-layout">
            {/* Pie Chart */}
            <div className="card pie-chart-section">
              <h3>ภาพรวม Sentiment</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={getPieData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${THAI_LABEL[name]} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getPieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value, name) => [value, THAI_LABEL[name] || name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => THAI_LABEL[value] || value}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - ซ่อนแกน Y แล้ว */}
            <div className="card chart-box scroll-chart-container">
              <div className="chart-header">
                <h3>เจาะลึกประเด็น (Topics)</h3>
                <span className="hint-text">เอาเมาส์ชี้เพื่อดูชื่อหัวข้อ / คลิกแท่งกราฟเพื่อดูรายละเอียด</span>
              </div>
              
              <div className="scroll-area">
                <div style={{ width: '100%', height: chartHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      {/* แก้ไขตรงนี้: ซ่อนแกน Y (hide) */}
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={0} 
                        hide 
                      />
                      <RechartsTooltip 
                        cursor={{fill: 'rgba(79, 70, 229, 0.1)'}}
                        formatter={(value) => [`จำนวน: ${value}`, 'ความคิดเห็น']}
                        labelFormatter={(label) => `หัวข้อ: ${label}`}
                        contentStyle={{ 
                          maxWidth: '350px', 
                          whiteSpace: 'normal',
                          fontSize: '14px',
                          padding: '10px',
                          border: '1px solid #ccc',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="total" 
                        fill="#4f46e5" 
                        barSize={35}
                        radius={[0, 8, 8, 0]}
                        onClick={handleBarClick}
                        style={{ cursor: 'pointer' }}
                        label={{ position: 'right', fill: '#374151', fontSize: 12 }}
                      >
                        {barData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index % 2 === 0 ? '#4f46e5' : '#6366f1'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Overlay (Popup) --- */}
      {selectedTopic && (
        <div className="modal-overlay" onClick={() => setSelectedTopic(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ความคิดเห็น: "{selectedTopic.name}"</h2>
              <button className="close-btn" onClick={() => setSelectedTopic(null)}>×</button>
            </div>
            <div className="modal-body">
              {selectedTopic.comments.length === 0 ? (
                <div className="empty-state">ไม่มีข้อมูลคอมเมนต์</div>
              ) : (
                <div className="comments-grid">
                  {selectedTopic.comments.map((item, i) => (
                    <div key={i} className={`comment-card ${item.sentiment}`}>
                      <div className={`sentiment-badge ${item.sentiment}`}>
                        {THAI_LABEL[item.sentiment] || item.sentiment}
                      </div>
                      <p>{item.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;