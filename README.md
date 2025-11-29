ดำเนินการติดตั้งโปรเจกต์ตามขั้นตอนด้านล่างนี้:

1.  **Clone Repository:**
    * `git clone xxxxxxXXXXXXXXXXX` 

2.  **ตั้งค่า Environment:**
    * สร้างไฟล์ **`.env`** 
    * ใส่ API key ที่จำเป็นลงในไฟล์ `.env`

3.  **การติดตั้ง Dependencies และเปิดใช้งาน Virtual Environment:**
    * ใช้เครื่องมือ `uv` ในการเริ่มต้น (Initialize):
        * `uv init` 
    * เปิดใช้งาน Virtual Environment:
        * `.venv\Scripts\activate` 
    * ติดตั้ง Dependencies ตามไฟล์ `requirement.txt`:
        * `uv pip install -r requirement.txt` 

---

ติดตั้งโมเดลที่รันแล้ว

1.  **Download zip file ที่ส่งให้**

2.  **Extract zip file**

3.  **นำไฟล์ที่แตกมาแล้วมาใส่ใน Folder backend**

---

รันโปรเจกต์

### 1. รัน Backend

* ย้ายไปที่ไดเรกทอรี `backend`:
    * `cd backend` 
* รันเซิร์ฟเวอร์ Backend (uvicorn) ที่พอร์ต 8000:
    * `uvicorn main:app --port 8000 --reload` 

### 2. รัน Frontend

* ย้ายไปที่ไดเรกทอรี `frontend`:
    * `cd sentiment-frontend` 
* ติดตั้ง Dependencies:
    * `npm i` 
* รัน Frontend Server:
    * `npm run dev` 