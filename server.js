// ============================================================
// server.js - النسخة النهائية مع سجلات فورية للتشخيص
// ============================================================

console.log('🚀 [BOOT] بدء تحميل server.js ...');

const express = require('express');
const Replicate = require('replicate');
const cors = require('cors');
const path = require('path');
const util = require('util');

console.log('✅ [BOOT] تم تحميل جميع المكتبات بنجاح');

const app = express();
app.use(cors());
app.use(express.json());

console.log('✅ [BOOT] تم إعداد middleware');

// التحقق من متغير البيئة فوراً
console.log(`🔑 [BOOT] REPLICATE_API_TOKEN ${process.env.REPLICATE_API_TOKEN ? '✅ موجود' : '❌ مفقود'}`);

// صفحة البداية
app.get('/', (req, res) => {
    console.log('📄 [GET /] طلب الصفحة الرئيسية');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// تهيئة عميل Replicate
let replicate;
try {
    replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
    });
    console.log('✅ [BOOT] تم تهيئة عميل Replicate بنجاح');
} catch (initError) {
    console.error('❌ [BOOT] فشل تهيئة عميل Replicate:', initError.message);
}

// ============================================================
// نقطة النهاية لتوليد الفيديو
// ============================================================
app.post('/generate-video', async (req, res) => {
    console.log('📥 [POST /generate-video] تم استلام الطلب');

    const { prompt } = req.body;

    // التحقق من صحة الطلب
    if (!prompt) {
        console.warn('⚠️ [POST /generate-video] الطلب يفتقر إلى حقل prompt');
        return res.status(400).json({ error: 'حقل prompt مطلوب' });
    }

    console.log(`📝 [POST /generate-video] النص المستلم: "${prompt}"`);

    // التحقق من وجود عميل Replicate
    if (!replicate) {
        console.error('❌ [POST /generate-video] عميل Replicate غير مهيأ');
        return res.status(500).json({ error: 'الخدمة غير مهيأة بشكل صحيح' });
    }

    const input = {
        prompt: prompt,
        width: 768,
        height: 512,
        num_frames: 81,
    };

    console.log('📦 [POST /generate-video] البيانات المرسلة:', util.inspect(input, { depth: null, colors: false }));

    try {
        console.log('⏳ [POST /generate-video] جاري الاتصال بـ Replicate ...');

        const prediction = await replicate.predictions.create({
            model: "lightricks/ltx-video",
            input: input,
        });

        console.log(`✅ [POST /generate-video] تم إنشاء التنبؤ، ID: ${prediction.id}`);
        res.json({ id: prediction.id, status: prediction.status });

    } catch (error) {
        // ===== طباعة كل تفاصيل الخطأ =====
        console.error('❌ [POST /generate-video] فشل الاتصال بـ Replicate:');
        console.error(`   الرسالة: ${error.message}`);
        console.error(`   نوع الخطأ: ${error.name || 'غير معروف'}`);

        if (error.response) {
            console.error(`   كود حالة Replicate: ${error.response.status}`);
            console.error('   بيانات الخطأ من Replicate:', util.inspect(error.response.data, { depth: null, colors: false }));
        } else if (error.request) {
            console.error('   تم إرسال الطلب ولكن لم تصل استجابة');
        }

        // إرجاع الخطأ للواجهة الأمامية
        const errorDetails = error.response?.data?.detail || error.response?.data?.error || error.message || 'خطأ غير معروف';
        res.status(500).json({
            error: 'فشل في توليد الفيديو',
            details: errorDetails,
        });
    }
});

// ============================================================
// نقطة النهاية للتحقق من الحالة
// ============================================================
app.get('/check-status/:id', async (req, res) => {
    const predictionId = req.params.id;
    console.log(`🔍 [GET /check-status/${predictionId}] جلب الحالة`);

    try {
        const prediction = await replicate.predictions.get(predictionId);
        console.log(`📊 [GET /check-status] الحالة: ${prediction.status}`);

        let outputUrl = null;
        if (prediction.status === 'succeeded' && prediction.output) {
            outputUrl = Array.isArray(prediction.output)
                ? prediction.output[prediction.output.length - 1]
                : prediction.output;
        }

        res.json({
            status: prediction.status,
            output: outputUrl
        });
    } catch (error) {
        console.error(`❌ [GET /check-status] فشل:`, error.message);
        res.status(500).json({ error: 'خطأ في فحص الحالة', details: error.message });
    }
});

// ============================================================
// تشغيل السيرفر
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ [BOOT] السيرفر يعمل على المنفذ ${PORT}`);
    console.log(`✅ [BOOT] النسخة: v2.0 مع سجلات تشخيصية كاملة`);
});

console.log('🚀 [BOOT] انتهى تحميل server.js بنجاح');
