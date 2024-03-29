const VkBot = require("node-vk-bot-api");
const mongoose = require("mongoose");

const User = require("./schemas/user");
const Event = require("./schemas/event");
const ActiveGame = require("./schemas/active_game");

const replies = require("./json/replies.json");

const stage = require("./Scenes/scenes");
const Session = require("node-vk-bot-api/lib/session");

const {
    register,
    send_message,
    get_user_ids,
    get_users_for_starting
} = require("./functions");

require("dotenv").config();

mongoose
    .connect(process.env.MONGOTOKEN, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("Mongo started"));

const bot = new VkBot(process.env.TOKEN);
const session = new Session();
bot.use(session.middleware());
bot.use(stage.middleware());

//-----------------------------------------

bot.command("/вкл старт", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id });

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    user.getting_starting_event = true;
    user.save();
    ctx.reply(replies.start_game_on);
});

bot.command("/выкл старт", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id });

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    user.getting_starting_event = false;
    user.save();
    ctx.reply(replies.start_game_off);
});

bot.command("/вкл", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id }); // ret Object

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    user.write_perm = true;
    user.save();
    ctx.reply(replies.activate);
});

bot.command("/выкл", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id }); // ret Object

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    user.write_perm = false;
    user.save();
    ctx.reply(replies.deactivate);
});

bot.command("/бан", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id });

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    ctx.scene.enter("ban_map");
});

bot.command("/разбан", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id });

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    ctx.scene.enter("unban_map");
});

bot.command("/тип", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id });

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    ctx.scene.enter("change_type");
});

bot.command("/не следить", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id });

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    ctx.scene.enter("active_games_pop");
});

bot.command("/следить", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id });

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    ctx.scene.enter("active_games_choose");
});

bot.command("/дуэли офф", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id });

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    user.duel_off = true;
    user.save();
    ctx.reply(replies.duels_off);
});

bot.command("/дуэли", async ctx => {
    let usr_id = ctx.message.from_id;
    let user = await User.findOne({ id: usr_id });

    if (user === null) {
        await register(usr_id);
        ctx.reply(replies.greeting);
        return;
    }

    user.duel_off = false;
    user.save();
    ctx.reply(replies.duels_on);
});

bot.command("/help", async ctx => {
    ctx.reply(replies.help);
});

//---------------------------------------------

bot.event("message_new", async ctx => {
    let usr_id = ctx.message.from_id; // int
    let user = await User.find({ id: usr_id });

    if (user.length) {
        let regex = /(Т|т|T)(р|Р|P)(o|O|о|О)(я|Я|и|Ю|И|ю)/; //TODO придумать регулярку получше
        if (ctx.message.text.search(regex) > -1) {
            ctx.reply("Flame велик и его решение не ставить Трою священно!");
        }

        return;
    } else {
        register(usr_id);
        ctx.reply(replies.greeting);
    }
});

bot.startPolling();

//----------------------------------------------

async function send_notifications() {
    let users = await User.find();
    let events = await Event.find();
    events = events.filter(el => !el.already_processed);

    for (const event of events) {
        let user_ids = get_user_ids(users, event);
        let event_info = `${event.name}\nКоличество игроков - ${event.player_number}\nНазвание карты - ${event.map}\nДо начала - ${event.time_remaining}\nПартия начнется ${event.starting_time}\nВремя на ход - ${event.time_for_move}\nСсылка на партию - ${event.url}`;

        //-------------------------------------------------------
        let time_for_start = event.starting_time - new Date() - 480 * 60;
        setTimeout(() => {
            send_message(
                "Игра началась!(Или ее отменили :D)\n" + event_info,
                get_users_for_starting(user_ids)
            );
        }, time_for_start);
        //-------------------------------------------------------

        if (user_ids.length) {
            send_message(event_info, user_ids);
        }

        event.already_processed = true;
        event.save();
    }
}

setInterval(() => {
    send_notifications();
}, 10000);

// method to update collections (deprecated)
// User.update(
//     {},
//     { $set: { watching: [] } },
//     { upsert: false, multi: true }
// ).exec();
