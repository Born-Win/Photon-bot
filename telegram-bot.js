const TelegramApi = require('node-telegram-bot-api');

const token = '7750667497:AAH2JH2MCfI_3CuFptEmw8g_dVbMl74HVVg';
const bot = new TelegramApi(token, {polling: true});


// Save new room id
// function connectToMyBot() {
//   bot.on("new_chat_members", (member) => {
//     if (member.new_chat_member.username !== 'VistaPaketBot') return;

//     const chat_id = member.chat.id;

//     if (!chat_id) return;

//     Telegram.exists({room_id: chat_id, private_bot: false})
//     .then(room => {
//       if (room) return;

//       new Telegram({room_id: chat_id, chat_type: member.chat.type})
//       .save(() => {});
//     });
//   });


//   // Delete bot
//   bot.on("left_chat_member", member => {
//     if (member.left_chat_member.username !== 'VistaPaketBot') return;

//     const room_id = member.chat.id;

//     if (!room_id) return;
    
//     Telegram.deleteOne({room_id}, () => {});
//   });
// }


// function sendTelegramBotMsg(msg, private_function_code, login_for_private_msg) {
//   Telegram.find().lean()
//   .then(users => {
//     if (!users.length) return;
    
//     for (let u = 0; u < users.length; u++) {
//       // General messages
//       if (!users[u].private_bot) {
//         // Unique private msg (only private msg)
//         if (login_for_private_msg) continue;

//         bot.sendMessage(users[u].room_id, msg, {parse_mode: 'HTML'});   
//         // console.log(users[u].room_id);
//       } else {
//         // = Personal messages =
//         if (!users[u].login) {
//           sendAuthorizationMsg(users[u].room_id);
//           continue;
//         }
       
//         // Unique message
//         if (login_for_private_msg) {
//           if (users[u].login !== login_for_private_msg) continue;
//         } else {
//           // Basic message
//           if (!private_function_code || users[u].bot_function?.id !== private_function_code) continue;
//         }

//         private_bot.sendMessage(users[u].room_id, msg, {parse_mode: 'HTML'});     
//         // =
//       }
//     }
//   });
// }

function parseMessage(message) {
    const CONTRACT_INDICATOR = '合约';
    const clearedMsg = message.trim().toLowerCase();

    if (!clearedMsg.includes(CONTRACT_INDICATOR)) return;

    const contract = clearedMsg.substring(clearedMsg.indexOf(CONTRACT_INDICATOR) + CONTRACT_INDICATOR.length + 2);
    
    return contract;
}


module.exports = ((cb) => {
  bot.on("message", (msg, match) => {
    try {
        if (!msg.text) return;
        const contract = parseMessage(msg.text);
        if (!contract) return;
        cb(contract);
    } catch (err) {
        console.log(err);
    };
  });
});