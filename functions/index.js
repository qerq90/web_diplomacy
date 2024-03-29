const register = require("./register");
const send_message = require("./send_mess");
const get_user_ids = require("./get_user_ids");
const get_event = require("./register_event");
const get_users_for_starting = require("./get_users_for_starting");
const duel_check = require("./duel_check");
const log = require("./log");

module.exports = {
    send_message: send_message,
    register: register,
    get_user_ids: get_user_ids,
    get_event: get_event,
    get_users_for_starting: get_users_for_starting,
    duel_check: duel_check,
    log: log
};
