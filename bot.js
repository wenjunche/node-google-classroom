
const Discord = require('discord.js');
const auth = require('./bottoken.json');
const Calendar = require('./calendar.js');
const moment = require('moment-timezone');

const calendar = new Calendar();
calendar.connect().then(() => { console.log('Connected to Google Calendar') });

// Initialize Discord Bot
const bot = new Discord.Client();

bot.on('ready', function (evt) {
    console.log('Connected');
    console.log('Logged in as: ');
    console.log(bot.user.tag + ' - (' + bot.user.id + ')');

    const channel = bot.channels.cache.get('700860656240427030');
    if (channel) {
        setInterval(() => {
            calendar.listUpcomingEvents().then(events => {
                channel.send(formatEvents(events));
            });
        }, 2*60*1000);
    } else {
        console.error('channel not found');
    }
});
bot.on('message', function (message) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    console.log(JSON.stringify(message));
    if (message.content.substring(0, 1) == '!') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                // bot.
                // bot.({
                //     to: message.channelID,
                //     message: 'Pong!'
                // });
                const exampleEmbed = new Discord.MessageEmbed()
                .setColor('#2ed32e')
                .setTitle('Pong')
                .addFields({name: 'AnPig'});
                message.reply(exampleEmbed);
                break;
            case 'calendar':
                calendar.listUpcomingEvents().then(events => {
                    message.reply(formatEvents(events));
                });
                break;
            // Just add any case commands if you want to..
         }
     }
});

function formatEvents(events) {
    const embed = new Discord.MessageEmbed();
    embed.setColor('#2ed32e').setTitle('Upcoming Runs')
    events.forEach(element => {
        const mstart = moment(element.start);
        const mend = moment(element.end);
        embed.addFields({name: 'summary', value: element.summary},
            {name: 'location', value: element.location},
            {name: 'start', value: mstart.tz('America/New_York').format('YYYY-M-D h:mm A')},
            {name: 'end', value: mend.tz('America/New_York').format('YYYY-M-D h:mm A')});
    });
    return embed;
}

bot.login(auth.token);
