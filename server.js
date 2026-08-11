const express = require('express');
const Replicate = require('replicate');
const cors = require('cors');
const path = require('path');
const util = require('util'); // لطباعة الكائنات المعقدة

const app = express();
app.use(cors());
app.use(express.json());

// صفحة البداية (اختياري)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// تأكد من وجود مفتاح API في متغيرات البيئة
if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN غير موجود في متغيرات البيئة!');
}

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// ---------- نقطة النهاية لتوليد الفيديو ----------
app.post('/generate-video', async (req, res) => {
    const { prompt } = req.body;

    // تحقق من وجود النص المطلوب
    if (!prompt) {
        console.warn('⚠️ الطلب لا يحتوي على حقل prompt');
        return res.status(400).json({ error: 'حقل prompt مطلوب' });
    }

    console.log(`📤 استلام طلب لتوليد فيديو بالنص: "${prompt}"`);

    // بيانات الإدخال الخاصة بالنموذج (يمكنك تعديلها حسب حاجتك)
    const input = {
        prompt: prompt,
        width: 768,
        height: 512,
        num_frames: 81,
        // بعض النماذج قد تتطلب حقلاً إضافياً مثل "image"
        // إذا كان نموذج lightricks/ltx-video يحتاج صورة، أضفها هنا
        // image: "https://example.com/image.png"
    };

    console.log('📦 بيانات الإدخال المرسلة إلى Replicate:', util.inspect(input, { depth: null, colors: true }));

    try {
        const prediction = await replicate.predictions.create({
            model: "lightricks/ltx-video",
            input: input,
        });

        console.log(`✅ تم إنشاء التنبؤ بنجاح، ID: ${prediction.id}, الحالة: ${prediction.status}`);
        res.json({ id: prediction.id, status: prediction.status });

    } catch (error) {
        // ========== هنا نطبع كل تفاصيل الخطأ ==========
        console.error('❌ فشل الاتصال بـ Replicate:');
        console.error('   الرسالة:', error.message);

        // إذا كان الخطأ يحتوي على استجابة (response) من Replicate
        if (error.response) {
            console.error('   كود حالة الاستجابة:', error.response.status);
            console.error('   بيانات الاستجابة (body):', util.inspect(error.response.data, { depth: null, colors: true }));
        } else if (error.request) {
            // إذا تم إرسال الطلب ولكن لم تصل استجابة
            console.error('   تم إرسال الطلب ولكن لم تصل استجابة:', error.request);
        } else {
            // أي خطأ آخر
            console.error('   الخطأ الكامل:', util.inspect(error, { depth: null, colors: true }));
        }

        // إعادة الخطأ للمستخدم مع تفاصيل مفيدة (مع تجنب إرسال معلومات حساسة إن وجدت)
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || 'خطأ غير معروف';
        res.status(500).json({
            error: 'فشل في توليد الفيديو',
            details: errorMessage,
            // يمكنك إزالة السطر التالي في الإنتاج إذا كنت لا تريد إرسال التفاصيل الكاملة
            fullError: error.response?.data || error.message
        });
    }
});

// ---------- نقطة النهاية للتحقق من حالة الفيديو ----------
app.get('/check-status/:id', async (req, res) => {
    const predictionId = req.params.id;
    console.log(`🔍 جلب حالة التنبؤ ID: ${predictionId}`);

    try {
        const prediction = await replicate.predictions.get(predictionId);
        console.log(`📊 حالة التنبؤ: ${prediction.status}`);

        let outputUrl = null;
        if (prediction.status === 'succeeded' && prediction.output) {
            outputUrl = Array.isArray(prediction.output)
                ? prediction.output[prediction.output.length - 1]
                : prediction.output;
            console.log(`🎬 رابط الفيديو الناتج: ${outputUrl}`);
        }

        res.json({
            status: prediction.status,
            output: outputUrl
        });
    } catch (error) {
        console.error(`❌ فشل في جلب حالة التنبؤ ${predictionId}:`, error.message);
        if (error.response) {
            console.error('   تفاصيل الاستجابة:', util.inspect(error.response.data, { depth: null }));
        }
        res.status(500).json({
            error: 'خطأ في فحص حالة الفيديو',
            details: error.message
        });
    }
});

// تشغيل السيرفر (للاستخدام المحلي)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
    console.log(`📌 متغير REPLICATE_API_TOKEN ${process.env.REPLICATE_API_TOKEN ? '✅ موجود' : '❌ مفقود'}`);
});
