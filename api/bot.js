const { Bot, webhookCallback } = require("grammy");
const whois = require('whois');

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// Commands

bot.command("start", (ctx) => {
  ctx.reply("*Welcome!* ✨ Send a website to get WHOIS details.", { parse_mode: "Markdown" });
  console.log("New user added:", ctx.from);
});
bot.command("help", (ctx) => ctx.reply("*@anzubo Project.*\n\nThis bot uses the whois lib to get WHOIS domain information data.\n_Note that names or details of registrant may be privacy protected and hence not available._", { parse_mode: "Markdown" } ));

// Messages

bot
  .on("msg", async (ctx) => {

    // Logging

    if (ctx.from.last_name === undefined) { console.log('from:', ctx.from.first_name, '(@' + ctx.from.username + ')', 'ID:', ctx.from.id); }
    else { console.log('from:', ctx.from.first_name, ctx.from.last_name, '(@' + ctx.from.username + ')', 'ID:', ctx.from.id); }
    console.log("Message:", ctx.msg.text); 

    // Logic

    whois.lookup(ctx.msg.text, async function(err, data) {
        if (err) {
            ctx.reply("An error occurred.");
            console.log(err);
            return; } 
        await ctx.reply("*Domain Information*" + "\n\n" + data, { parse_mode: "Markdown" }); });

  });

// Function

export default webhookCallback(bot, 'https');