const express = require('express');
const Replicate = require('replicate');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// تهيئة Replicate بالمفتاح الصحيح
const replicate = new Replicate({
  auth: "r8_Ow1c6MVWEl02a6MKcFImc5L9UAnyWWF2BKQ6j",
});

// مسار إرسال طلب توليد الفيديو
app.post('/generate-video', async (req, res) => {
    const { prompt } = req.body;
    try {
        const prediction = await replicate.predictions.create({
            version: "3d54d3d1d368297cb734b4c73499e710bf4b43b67eb49a888c3a91b4a3a60a7e",
            input: {
                prompt: prompt,
                fps: 6,
                motion_bucket_id: 127
            }
        });
        
        res.json({ 
            id: prediction.id, 
            status: prediction.status 
        });
    } catch (error) {
        res.status(500).json({ error: "فشل الاتصال بخدمة Replicate: " + error.message });
    }
});

// مسار فحص حالة الفيديو حتى يكتمل تجهيزه
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
        res.status(500).json({ error: "خطأ في فحص حالة الفيديو" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`السيرفر يعمل على المنفذ ${PORT}`));
