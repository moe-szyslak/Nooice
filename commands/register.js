module.exports = (bot, msg, moedoo) => {
  bot.sendChatAction(msg.chat.id, 'typing');

  moedoo
    .query('INSERT INTO nooice (nooice_id) VALUES ($1);', [msg.from.id])
    .then(() => {
      bot.sendMessage(msg.chat.id, 'NOOICE!\nYou are now a contributor 🙌🏿\n\nWhenever you send me your location I\'ll ask you if you want to register an 🏧', {
        reply_markup: JSON.stringify({
          keyboard: [
            [{ text: 'Send 📍', request_location: true }],
            [{ text: 'ቀን / Date' }, { text: 'NOOICE!' }],
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
        }),
      });
    }, () => {
      bot.sendMessage(msg.chat.id, 'DOUBLE NOOICE!\nTho you\'re already a contributor 🙌🏿\n\nPS\nTo unregister send /unregister command', {
        reply_markup: JSON.stringify({
          keyboard: [
            [{ text: 'Send 📍', request_location: true }],
            [{ text: 'ቀን / Date' }, { text: 'NOOICE!' }],
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
        }),
      });
    });
};
