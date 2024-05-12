// Use require instead of import because of the error "Cannot use import statement outside a module"
import { Telegraf } from 'telegraf'
import { createClient } from '@vercel/kv';


const kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN
});

async function kvSession(ctx, next) {
    const sessionId = `session:${ctx.from.id}`;
    const asd = await kv.get(sessionId);
    try {
        let sessionData = await kv.get(sessionId);

        if (typeof sessionData === 'string') {
            ctx.session = JSON.parse(sessionData);
        } else {
            ctx.session = sessionData || {};
        }

        if (!ctx.session.lang) {
            ctx.session.lang = 'EN'; 
        }

    } catch (error) {
        console.error('Error fetching session data:', error);
        ctx.session = { lang: 'EN' };
    }

    await next();  // Передаём управление следующему промежуточному ПО

    try {
        // Сохраняем обновлённые данные сессии обратно в KV
        if (typeof ctx.session === 'object') {
            await kv.set(sessionId, JSON.stringify(ctx.session), { expirationTtl: 86400 });
        }
    } catch (error) {
        console.error('Error saving session data:', error);
    }
}


async function sendMessage(ctx, messageContent, options = {}, type = 'text') {

    let message;
    try {
        switch (type) {
            case 'text':
                message = await ctx.reply(messageContent, options);
                break;
            case 'photo':
                message = await ctx.replyWithPhoto(messageContent, options);
                break;
            case 'video':
                message = await ctx.replyWithVideo(messageContent, options);
                break; 
            default:
                message = await ctx.reply(messageContent, options);
                break;
        }
        if (message && message.message_id) {
            ctx.session.messageIds.push(message.message_id); // Добавление ID сообщения в сессию
        }
    } catch (error) {
        console.error(`Не удалось отправить ${type} сообщение:`, error);
    }

    try {
        const sessionId = `session:${ctx.from.id}`;
        await kv.set(sessionId, JSON.stringify(ctx.session), { expirationTtl: 86400 });
    } catch (error) {
        console.error('Ошибка при сохранении данных сессии:', error);
    }

    return message;
}

async function clearPreviousMessages(ctx, next) {
    if (ctx.session.messageIds && ctx.session.messageIds.length > 0) {
        const oldMessageIds = ctx.session.messageIds.slice(); // Копирование ID для безопасного удаления
        ctx.session.messageIds = []; // Очистка списка ID перед удалением

        for (let messageId of oldMessageIds) {
            try {
                await ctx.telegram.deleteMessage(ctx.chat.id, messageId);
            } catch (error) {
                console.error(`Ошибка при удалении сообщения с ID ${messageId}:`, error);
            }
        }
    }
    await next(); // Передача управления следующему middleware или обработчику
}


const data = {
    EN: {
        welcome: "Welcome to Zorka Venera Soft bot! ",
        miniApp: "Start Zorka Venera Soft Mini App 🚀",
        contact: "Contact Us ☎️",
        contact_data: "You can contact us via email at ilya.barachenia@zorkavenerasoft.pl \n or text directly on telegram @ZorkaVeneraSoft",
        feedback: "Send Feedback 📩",
        description: "What we do? ✨",
        description_data: "We excel at creating innovative Telegram mini-apps 🚀, designing cutting-edge digital experiences 🎨, and customizing chatbots 🤖 to meet unique needs. Our expertise extends to seamless blockchain integration 🔗, providing continuous support 🛠️, and implementing stringent quality assurance measures 📏 to ensure excellence.",
        faq: "FAQ 🧐",
        faqReply: "Here are some frequently asked questions and answers:\n" + "\n" +
            "1. Can you develop Telegram mini apps?\n - Yes, we specialize in developing custom Telegram mini apps and chat bots.\n" + "\n" +
            "2. Where are you located?\n - We are based in the European Union, adhering to top standards and regulations to ensure high-quality service and reliability.\n" + "\n" +
            "3. Tell me about your team.\n - Our team consists of highly skilled professionals with extensive experience in software development.\n" + "\n" +
            "4. What languages do you speak?\n - Our team is proficient in Russian, English, and Polish.\n" + "\n" +
            "5. Can you develop blockchain apps?\n - Yes, we can develop blockchain applications tailored to meet your specific needs.",
        promotions: "Special promotions and offers ⚡",
        promotions_data: "Have an app idea? Send us a message now to get a detailed proposal and time estimate! 🌝",
        back_menu: "Back to menu",
        back_lang: "Select language"
    },
    RU: {
        welcome: "Добро пожаловать в бот Zorka Venera Soft bot! ",
        miniApp: "Запустить Zorka Venera Soft Mini App 🚀",
        contact: "Связаться с нами ☎️",
        contact_data: "Вы можете связаться с нами по электронной почте на адрес ilya.barachenia@zorkavenerasoft.pl или написать напрямую в Telegram @ZorkaVeneraSoft",
        feedback: "Оставить отзыв 📩",
        description: "Что мы делаем? ✨",
        description_data: "Мы специализируемся в создании мини-приложений для Telegram 🚀, разработке передового цифрового дизайна 🎨, и настройке чат-ботов 🤖 по индивидуальным требованиям. Наш опыт включает базовую интеграцию блокчейна 🔗, предоставление постоянной поддержки 🛠️, и проведение строгого контроля качества 📏.",
        faq: "Часто задаваемые вопросы 🧐",
        faqReply: "Вот ответы на часто задаваемые вопросы:\n" + "\n" +
            "1. Можете ли вы разрабатывать мини-приложения для Telegram?\n - Да, мы специализируемся на разработке пользовательских мини-приложений и чат-ботов для Telegram.\n" + "\n" +
            "2. Где вы находитесь?\n - Мы базируемся в Европейском Союзе и придерживаемся высоких стандартов и норм, что гарантирует качество и надежность наших услуг.\n" + "\n" +
            "3. Расскажите о вашей команде.\n - Наша команда состоит из высококвалифицированных специалистов с большим опытом в области программирования.\n" + "\n" +
            "4. На каких языках вы говорите?\n - Мы владеем русским, английским и польским языками.\n" + "\n" +
            "5. Можете ли вы разрабатывать блокчейн-приложения?\n - Да, мы можем создавать блокчейн-приложения, соответствующие вашим конкретным потребностям.",
        promotions: "Специальные акции и предложения ⚡",
        promotions_data: "У вас есть идея для приложения? Отправьте нам сообщение сейчас, чтобы получить подробное предложение и оценку времени! 🌝",
        back_menu: "Назад в меню",
        back_lang: "Выбрать язык"
    }
};


function getNavigationInlineKeyboard(lang) {
    return {
        inline_keyboard: [
            [
                { text: data[lang].back_menu, callback_data: 'backToMenu' },
                { text: data[lang].back_lang, callback_data: 'start' }
            ]
        ]
    };
}


function launchBot(token) {
    const bot = new Telegraf(token)

    bot.use(kvSession);
    bot.use(clearPreviousMessages);

    listenToCommands(bot)
    listenToMessages(bot)
    // listenToQueries(bot)
    // listenToMiniAppData(bot)

    // Launch the bot
    bot.launch().then(() => console.log('bot launched'))

    // Handle stop events
    enableGracefulStop(bot)

    return bot
}

function listenToCommands(bot) {

    bot.start((ctx) => {
        sendMessage(ctx, "Please select your language / Пожалуйста, выберите ваш язык", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "English 🇬🇧", callback_data: 'EN' }],
                    [{ text: "Русский c:", callback_data: 'RU' }]
                ]
            }
        });
    });
}

function listenToMessages(bot) {

    bot.action(['EN', 'RU'], (ctx) => {
        const lang = ctx.match.input
        ctx.session.lang = lang
        // sendMessage(ctx, data[lang].welcome, {
        //     reply_markup: {
        //         keyboard: [
        //             [{ text: data[lang].miniApp, web_app: { url: process.env.APP_URL } }],
        //         ],
        //         resize_keyboard: true,
        //         one_time_keyboard: true
        //     }
        // });
        const imageUrl = 'https://vxmgnelqisbmjfxf.public.blob.vercel-storage.com/ZVS%20short%20logo%20film-sWDyHOoKiXlGiTRJDHazpFunTAtG4p.mp4';




        sendMessage(ctx, imageUrl, {
            caption: data[lang].welcome,
            reply_markup: {
                inline_keyboard: [
                    [{ text: data[lang].miniApp, web_app: { url: process.env.APP_URL } }],
                    [{ text: data[lang].description, callback_data: 'description' }],
                    [{ text: data[lang].contact, callback_data: 'contact' }],
                    [{ text: data[lang].faq, callback_data: 'faq' }],
                    [{ text: data[lang].promotions, callback_data: 'promotions' }]
                ],
                // keyboard: [
                //     [{ text: data[lang].miniApp, web_app: { url: process.env.APP_URL } }],
                // ],
            }
        }, 'video');
    });


    bot.action('contact', (ctx) => {
        const lang = ctx.session.lang;

        if (lang && data[lang]) {
            sendMessage(ctx, data[lang].contact_data, {
                reply_markup: getNavigationInlineKeyboard(lang)
            });
        }
    });


    bot.action('promotions', (ctx) => {
        const lang = ctx.session.lang;

        if (lang && data[lang]) {
            sendMessage(ctx, data[lang].promotions_data, {
                reply_markup: getNavigationInlineKeyboard(lang)
            });
        }
    });


    bot.action('description', (ctx) => {
        const lang = ctx.session.lang;

        if (lang && data[lang]) {
            sendMessage(ctx, data[lang].description_data, {
                reply_markup: getNavigationInlineKeyboard(lang)
            });
        }
    });

    bot.action('faq', (ctx) => {
        const lang = ctx.session.lang;
        if (lang && data[lang]) {
            sendMessage(ctx, data[lang].faqReply, {
                reply_markup: getNavigationInlineKeyboard(lang)
            });
        } else {
            sendMessage(ctx, "Please select your language first by using /start.");
        }
    });

    bot.action('start', (ctx) => {
        sendMessage(ctx, "Please select your language / Пожалуйста, выберите ваш язык", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "English 🇬🇧", callback_data: 'EN' }],
                    [{ text: "Русский c:", callback_data: 'RU' }]
                ]
            }
        });
    });

    bot.on('text', (ctx) => {
        const messageText = ctx.message.text;

        // Проверяем, что пользователь уже выбрал язык
        if (!ctx.session.lang) {
            sendMessage(ctx, "Please select your language first by using /start. / Пожалуйста, сначала выберите язык, используя команду /start.", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "English 🇬🇧", callback_data: 'EN' }],
                        [{ text: "Русский 🇷🇺", callback_data: 'RU' }]
                    ]
                }
            });
        } else {
            sendMessage(ctx, "Please select your language first by using /start. / Пожалуйста, сначала выберите язык, используя команду /start.");
        }
    });

    bot.action('backToMenu', (ctx) => {
        const lang = ctx.session.lang;
        if (!lang) {
            ctx.reply("Please select your language first by using /start.");
            return;
        }

    const videoUrl = 'https://vxmgnelqisbmjfxf.public.blob.vercel-storage.com/ZVS%20short%20logo%20film-sWDyHOoKiXlGiTRJDHazpFunTAtG4p.mp4';

        sendMessage(ctx, videoUrl, {
            caption: data[lang].welcome,
            reply_markup: {
                inline_keyboard: [
                    [{ text: data[lang].miniApp, web_app: { url: process.env.APP_URL } }],
                    [{ text: data[lang].description, callback_data: 'description' }],
                    [{ text: data[lang].contact, callback_data: 'contact' }],
                    [{ text: data[lang].faq, callback_data: 'faq' }],
                    [{ text: data[lang].promotions, callback_data: 'promotions' }]
                ]
            }
        }, 'video');
    });


}




export function enableGracefulStop(bot) {
    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
}

export { launchBot };