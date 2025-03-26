require('dotenv').config();
const TOKEN = process.env.DISCORD_BOT_TOKEN;

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, 
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildPresences,
    ],
  });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Auto add member role
client.on('guildMemberAdd', member => {
    member.roles.add('1354468796806467794');
    member.send(`Welcome, ${member.user.username}! Make sure to take a look around the server, and if you have any questions, type ".help" in "bot-commands".`);
});

// Message Handler
client.on('messageCreate', message => {
    if (message.content === '.help') {
        message.reply('Hey!')
    }
});

client.login(TOKEN);