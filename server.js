const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// مسار لتوليد الفيديو/الصورة متوافق مع الواجهة
app.post('/generate-video', async (req, res) => {
    const { prompt } = req.body;
    try {
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
        
        res.json({ 
            id: "12345", 
            status: "succeeded", 
            output: imageUrl 
        });
    } catch (error) {
        res.status(500).json({ error: "فشل الاتصال بخدمة الذكاء الاصطناعي" });
    }
});

// مسار فحص الحالة
app.get('/check-status/:id', (req, res) => {
    res.json({ 
        status: 'succeeded', 
        output: "https://image.pollinations.ai/prompt/" + encodeURIComponent("AI Video Generation") 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر يعمل على المنفذ ${PORT}`));
