const express = require('express');
const Replicate = require('replicate');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// عرض صفحة الواجهة مباشرة عند فتح الموقع
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// مسار توليد الفيديو
app.post('/generate-video', async (req, res) => {
    const { prompt } = req.body;
    try {
        const prediction = await replicate.predictions.create({
            version: "33837648319f61b0d2d3cb535359dd347525287f3b609919f291e77030cb046a",
            input: {
                input_image: null,
                prompt: prompt,
                video_length: "14_frames_with_svd",
                fps: 6
            }
        });
        
        res.json({ id: prediction.id, status: prediction.status });
    } catch (error) {
        res.status(500).json({ error: "خطأ في الاتصال بـ Replicate: " + error.message });
    }
});

// مسار التحقق من حالة الفيديو
app.get('/check-status/:id', async (req, res) => {
    try {
        const prediction = await replicate.predictions.get(req.params.id);
        
        let outputUrl = null;
        if (prediction.status === 'succeeded' && prediction.output) {
            outputUrl = Array.isArray(prediction.output) ? prediction.output[prediction.output.length - 1] : prediction.output;
        }
        
        res.json({
            status: prediction.status,
            output: outputUrl
        });
    } catch (e) {
        res.status(500).json({ error: "خطأ في فحص حالة الفيديو: " + e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر يعمل على المنفذ ${PORT}`));
