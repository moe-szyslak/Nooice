const start = require('./../commands/start');
const list = require('./../commands/list');
const location = require('./../commands/location');
const approve = require('./../commands/approve');
const pending = require('./../commands/pending');
const disapprove = require('./../commands/disapprove');
const ndelete = require('./../commands/delete');
const date = require('./../commands/date');
const geezer = require('./../commands/geezer');
const register = require('./../commands/register');
const unregister = require('./../commands/unregister');

// all will happen inside a `message` - middleware will be applied
// to break the monolithic crap here
module.exports = (bot, config, moedoo) => (msg) => {
  // // 9:14 launch...
  // // PS: `!` is difficult to notice; so I prefer === false
  // if (config.NOOICE.includes(msg.from.id) === false) {
  //   bot.sendMessage(msg.chat.id, 'Ask Siri about 9:14');
  //   return;
  // }

  if (Object.prototype.hasOwnProperty.call(msg, 'location')) {
    /**
     * there's a 64 byte limit on `callback_data` hence the single letter types
     *
     * S: Send me nearest ATM
     * A: Add new ATM location
     * N: NOOICE!
     */
    bot.sendChatAction(msg.chat.id, 'typing');

    moedoo
      .query('SELECT nooice_id FROM nooice WHERE nooice_id=$1', [msg.from.id])
      .then((rows) => {
        if (rows.length === 1) {
          bot.sendMessage(msg.chat.id, 'NOOICE! 📍', {
            reply_to_message_id: msg.message_id,
            reply_markup: JSON.stringify({
              inline_keyboard: [
                [{ text: 'Send me the nearest 🏧 📍', callback_data: JSON.stringify({ type: 'S', l: msg.location }) }],
                [{ text: '😇 Register an 🏧 📍', callback_data: JSON.stringify({ type: 'A', l: msg.location }) }],
                [{ text: 'Just say NOOICE!', callback_data: JSON.stringify({ type: 'N' }) }],
              ],
            }),
          });
        } else {

        moedoo.query(`
          SELECT atm_id,
                 atm_bank_name,
                 ST_AsGeoJSON(atm_location) as atm_location,
                 round(CAST(ST_Distance_Spheroid(atm_location, ST_GeomFromGeoJSON('{"type": "point", "coordinates": [${msg.location.latitude}, ${msg.location.longitude}]}'), 'SPHEROID["WGS 84",6378137,298.257223563]') as numeric), 0) as atm_distance
          FROM atm
          WHERE atm_approved = true
          ORDER BY atm_location <-> ST_GeomFromGeoJSON('{"type": "point", "coordinates": [${data.l.latitude}, ${data.l.longitude}]}')
          LIMIT 3;
        `).then((rows) => {
          // eslint-disable-next-line
          const atmsInRange = rows.filter(atm => Number.parseInt(atm.atm_distance, 10) <= config.THRESHOLD);

          // no ATMS in rage --- sending browse mode...
          if (rows.length === 0 || atmsInRange.length === 0) {
            bot.sendMessage(
              msg.chat.id,
              `😔 Could not find an 🏧 within *${config.THRESHOLD}* meters

              So instead I'll send you all 🏧s ordered from *nearest* to *furthest*`, {
                parse_mode: 'Markdown',
              });

            // TODO: browse mode
            return;

          if (atmsInRange.length === 1) {
            bot.sendMessage(msg.chat.id, `*NOOICE*!

*${atmsInRange[0].atm_bank_name}* 🏧 is within *${atmsInRange[0].atm_distance}* meter${Number.parseInt(atmsInRange[0].atm_distance, 10) > 1 ? 's' : ''} form your 📍`, {
  parse_mode: 'Markdown',
  disable_notification: true,
}).then(() => {
  // eslint-disable-next-line
  bot.sendLocation(msg.chat.id, JSON.parse(atmsInRange[0].atm_location).coordinates[0], JSON.parse(atmsInRange[0].atm_location).coordinates[1]);
});
            return;
          }

          bot.sendMessage(msg.chat.id, 'In Progress');
        }
      }, () => {
        bot.sendMessage(msg.chat.id, 'NOOICE?');
      });

    return;
  }

  // /start
  if (msg.text === '/start') {
    start(bot, msg);
    return;
  }

  // message contains NOOICE (but no location) --- sending a NOOICE back!
  if (msg.text.search(/nooice/i) > -1) {
    bot.sendChatAction(msg.chat.id, 'typing');

    bot.sendMessage(msg.chat.id, 'NOOICE!');
    return;
  }

  if (msg.text.search(/da(y|te)/i) > -1) {
    date(bot, msg);
    return;
  }

  if (msg.text.search(/^\d+$/) > -1) {
    geezer(bot, msg);
    return;
  }

  if (msg.text === '/register') {
    register(bot, msg, moedoo);
    return;
  }

  if (msg.text === '/unregister') {
    unregister(bot, msg, moedoo);
    return;
  }

  // NOOICE 👑 actions
  if (config.NOOICE.includes(msg.from.id)) {
    if (msg.text === '/list') {
      list(bot, msg, moedoo);
      return;
    }

    if (msg.text === '/pending') {
      pending(bot, msg, moedoo);
      return;
    }

    if (msg.text.search(/^\/location_\d+$/) === 0) {
      location(bot, msg, moedoo);
      return;
    }

    if (msg.text.search(/^\/approve_\d+$/) === 0) {
      approve(bot, msg, moedoo);
      return;
    }

    if (msg.text.search(/^\/disapprove_\d+$/) === 0) {
      disapprove(bot, msg, moedoo);
      return;
    }

    if (msg.text.search(/^\/delete_\d+$/) === 0) {
      ndelete(bot, msg, moedoo);
      return;
    }
  }

  bot.sendChatAction(msg.chat.id, 'typing');

  // message does not contain NOOICE!, sending NOOICE request
  bot.sendMessage(msg.chat.id, 'NOOICE?', {
    reply_markup: JSON.stringify({
      keyboard: [
        [{ text: 'Send 📍', request_location: true }],
        [{ text: 'ቀን / Date' }, { text: 'NOOICE!' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    }),
  });
};
