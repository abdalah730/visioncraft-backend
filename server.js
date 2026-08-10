const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
    const { prompt } = req.body;
    try {
        const response = await axios.get(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);
        res.json({ imageUrl: response.config.url });
    } catch (error) {
        res.status(500).json({ error: "فشل الاتصال بخدمة الذكاء الاصطناعي" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر يعمل على المنفذ ${PORT}`));
