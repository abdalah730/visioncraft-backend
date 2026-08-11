const express = require('express');
const Replicate = require('replicate');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post('/generate-video', async (req, res) => {
    const { prompt } = req.body;
    try {
        const prediction = await replicate.predictions.create({
            version: "9bb74cef8d3c1c49845348b6255d648c6f3938cf788f34b22c7a6e138a2e1d7f",
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
