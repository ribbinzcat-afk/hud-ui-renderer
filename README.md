# ✨ HUD UI Renderer for SillyTavern

ส่วนขยาย (Extension) สำหรับ SillyTavern ที่จะเปลี่ยนข้อความธรรมดาในแชท ให้กลายเป็นหน้าต่าง UI สไตล์ **Liquid Glass (กระจกเรืองแสง)** สุดล้ำ! เหมาะสำหรับการโรลเพลย์แนว RPG, Sci-Fi, เอาชีวิตรอด หรือแม้แต่แนวสืบสวนสอบสวน ช่วยให้หน้าแชทดูมีมิติและดื่มด่ำกับเนื้อเรื่องได้มากยิ่งขึ้น

## 🌟 ฟีเจอร์หลัก (Features)

- **[HUD_UI] Status Tracker:** สร้างหน้าต่างสถานะตัวละครแบบพับเก็บได้ (Collapse) พร้อม Header แบบแคปซูล
- **[HUD_INDICATOR] Context Badge:** ป้ายกำกับสถานการณ์ด้านบนสุดของข้อความ (เช่น เวลา, สถานที่, สภาพอากาศ)
- **[NOTI] System Notification:** กล่องแจ้งเตือนจากระบบพร้อมไอคอนกระดิ่งสั่นเรืองแสง
- **[CHAT] Communication Link:** หน้าจอแชทจำลอง/วิทยุสื่อสาร แยกบับเบิ้ลซ้าย-ขวาได้
- **[EVENT_UI] Quick Event & Choices:** ระบบเหตุการณ์ด่วนพร้อมปุ่มตัวเลือก (Choice) ที่กดแล้วข้อความจะเด้งไปรอที่ช่องพิมพ์อัตโนมัติ
- **🎨 Custom Accent Color:** ปรับเปลี่ยนสีเรืองแสงของ UI ได้ตามใจชอบผ่านหน้าตั้งค่า
- **📱 Fully Responsive:** รองรับการแสดงผลบนหน้าจอมือถือได้อย่างสวยงาม

---

## 📦 วิธีการติดตั้ง (Installation)

### ส่วนที่ 1: ติดตั้ง Extension
1. เปิด SillyTavern ของคุณ
2. ไปที่เมนู **Extensions** (ไอคอนรูปกล่องจิ๊กซอว์ด้านบน)
3. คลิกที่ปุ่ม **Install Extension**
4. วางลิงก์ GitHub ของ Repository นี้ลงไป แล้วกด Install
5. รีเฟรชหน้าเว็บ SillyTavern (F5)
6. ไปที่แถบ Extensions มองหา **HUD UI Renderer** แล้วเปิดใช้งาน (สามารถเลือกสี Accent Color ได้ที่นี่)

### ส่วนที่ 2: การตั้งค่า Lorebook / System Prompt (เพื่อให้ AI ใช้งานเป็น)
เพื่อให้ AI สามารถสร้าง UI เหล่านี้ได้เองตามสถานการณ์ คุณจำเป็นต้องนำคำสั่งไปใส่ใน **System Prompt** หรือสร้างเป็น **Lorebook** ให้บอทอ่าน

**วิธีสร้าง Lorebook สำหรับ AI:**
1. สร้าง Lorebook ใหม่ชื่อ `HUD_UI_System`
2. **Activation Keys:** `[HUD_UI], [NOTI], [CHAT, [EVENT_UI], [HUD_INDICATOR], status, system, notification`
3. **Insertion Position:** `Before Character Definition` (หรือตามที่คุณถนัด)
4. **เนื้อหา (คัดลอกข้อความด้านล่างนี้ไปใส่):**
```text
[SYSTEM INSTRUCTION: UI RENDERING TAGS]
You must use the following tags to enhance the roleplay experience when appropriate:

1. For Context/Environment (Top of message):
[HUD_INDICATOR] Location: Name | Time: 00:00 | Weather: Condition [/HUD_INDICATOR]

2. For Character Status (Bottom of message):
[HUD_UI]
[HEADER] Name: Alan | Level: 15 [/HEADER]
[CONTENT] HP: 100/100 | MP: 50/50 [/CONTENT]
[INVENTORY] Gold: 500 | Potion: 2 [/INVENTORY]
[/HUD_UI]

3. For System Alerts or Quest Updates:
[NOTI] System Alert: You have discovered a hidden path. [/NOTI]

4. For Radio/Hologram/Phone Communication:
[CHAT:L:SenderName: Message here] (For NPC/System)
[CHAT:R:ReceiverName: Message here] (For User)

5. For Interactive Choices or Events:
[EVENT_UI]
[QUESTION] A monster blocks your path. What will you do? [/QUESTION]
[CHOICES] Attack | Defend | Run [/CHOICES]
[/EVENT_UI]
```

---

## 📖 วิธีการใช้งานและตัวอย่าง (Usage & Examples)

คุณสามารถพิมพ์แท็กเหล่านี้ลงในแชทด้วยตัวเอง หรือให้ AI เป็นคนพิมพ์ก็ได้ ระบบจะแปลงเป็น UI ให้ทันที

### 1. ป้ายกำกับสถานการณ์ (Indicator)
ใช้สำหรับบอกบริบทของฉากนั้นๆ จะแสดงเป็นแคปซูลเล็กๆ ตรงกลางหน้าจอ
**โค้ด:**
```text
[HUD_INDICATOR] สถานที่: ย่านไซเบอร์พังก์ | เวลา: 02:45 น. | อุณหภูมิ: 18°C [/HUD_INDICATOR]
```

### 2. หน้าต่างสถานะ (Status Tracker)
ใช้แสดงข้อมูลตัวละคร สามารถใส่หมวดหมู่ (แท็กด้านใน) ได้ไม่จำกัด และรองรับการพับเก็บ
**โค้ด:**
```text
[HUD_UI]
[HEADER] ข้อมูลตัวละคร: อลัน | คลาส: อัศวินเวทมนตร์ | ระดับ: 24 [/HEADER]
[STATUS] พลังชีวิต: 1200/1200 | มานา: 450/500 | ความเหนื่อยล้า: 12% [/STATUS]
[EQUIPMENT] อาวุธขวา: ดาบเพลิงโลกันต์ | อาวุธซ้าย: โล่แห่งรุ่งอรุณ | ชุดเกราะ: เกราะเหล็กไหล [/EQUIPMENT]
[ACTIVE_EFFECTS] บัพโจมตี: +15% (2 เทิร์น) | ฟื้นฟูเลือดอัตโนมัติ: 10 HP/วิ [/ACTIVE_EFFECTS]
[/HUD_UI]
```

### 3. ระบบแจ้งเตือน (Notification)
ใช้สำหรับแจ้งเตือนไอเทม, เควส, หรืออันตราย รองรับการแยกหัวข้อด้วยเครื่องหมาย `:` และรองรับการขึ้นบรรทัดใหม่
**โค้ด:**
```text
[NOTI] เควสสำเร็จ: กวาดล้างรังโจร
ได้รับรางวัล:
- เหรียญทอง x1500
- ค่าประสบการณ์ x5000
- ดาบสั้นขึ้นสนิม x1 [/NOTI]
```

### 4. หน้าจอสื่อสาร (Communication Link)
ใช้จำลองการคุยโทรศัพท์, วิทยุสื่อสาร, หรือแชทโฮโลแกรม
- `L:` สำหรับข้อความฝั่งซ้าย (NPC/คู่สนทนา)
- `R:` สำหรับข้อความฝั่งขวา (ตัวเรา)

**โค้ด:**
```text
[CHAT:L:Operator: สายลับ 007 คุณได้ข้อมูลเซิร์ฟเวอร์มาหรือยัง?]
[CHAT:R:Agent 007: กำลังดาวน์โหลดข้อมูล... ขอเวลาอีก 2 นาที]
[CHAT:L:Operator: รีบหน่อย ตรวจพบยามรักษาการณ์กำลังเดินไปทางคุณ!]
```

### 5. เหตุการณ์และตัวเลือก (Quick Event & Choices)
สร้างปุ่มกดแบบ Interactive เมื่อผู้เล่นคลิกที่ปุ่มตัวเลือก ข้อความนั้นจะเด้งไปรอที่ช่องพิมพ์ข้อความ (Textarea) ทันที
**โค้ด:**
```text
[EVENT_UI]
[QUESTION] คุณพบหีบสมบัติปริศนาวางอยู่กลางห้องบอส มีออร่าสีม่วงแผ่ออกมา... [/QUESTION]
[CHOICES] เปิดหีบทันที | ใช้เวทตรวจสอบกับดัก | เดินผ่านไปโดยไม่สนใจ [/CHOICES]
[/EVENT_UI]
```

---

## 🎨 การปรับแต่งสี (Customization)
คุณสามารถเปลี่ยนสีเรืองแสงของ UI ทั้งหมดได้ง่ายๆ:
1. เปิดเมนู Extensions (รูปกล่องจิ๊กซอว์)
2. เลื่อนหา **HUD UI Renderer**
3. คลิกที่กล่องเลือกสี (Color Picker) เพื่อเปลี่ยน **Accent Color**
4. UI ในแชทจะเปลี่ยนสีตามทันทีแบบ Real-time!

---

## Credit
*พัฒนาโดย: Apricity*
*Special Thanks: Universal Extension Creator Prompt by Chai*
*ขอบคุณ คุณ POPKO สำหรับการช่วยทดสอบ*
