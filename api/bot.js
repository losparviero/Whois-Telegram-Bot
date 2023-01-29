const { Bot, webhookCallback } = require("grammy");
const whois = require('whois');

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// Response

async function responseTime(ctx, next) {
  const before = Date.now();
  await next();
  const after = Date.now();
  console.log(`Response time: ${after - before} ms`);
}

bot.use(responseTime);

// Commands

bot.command("start", async (ctx) => {
  await ctx.reply("*Welcome!* ✨ Send a website to get WHOIS details.", { parse_mode: "Markdown" })
    .then(() => console.log("New user added:", ctx.from))
    .catch((error) => console.error(error));
  });
bot.command("help", async (ctx) => {
  await ctx.reply("*@anzubo Project.*\n\nThis bot uses the whois lib to get WHOIS domain information data.\n_Note that names or details of registrant may be privacy protected and hence not available._", { parse_mode: "Markdown" } )
    .catch((error) => console.error(error));
  });

// Messages

bot
  .on("msg", async (ctx) => {

    // Logging

    if (ctx.from.last_name === undefined) {
      console.log('From:', ctx.from.first_name, '(@' + ctx.from.username + ')', 'ID:', ctx.from.id); }
    else { console.log('From:', ctx.from.first_name, ctx.from.last_name, '(@' + ctx.from.username + ')', 'ID:', ctx.from.id); }
    console.log("Message:", ctx.msg.text);

    // Logic

    whois.lookup(ctx.msg.text, async function(err, data) {
        if (err) {
            await ctx.reply("An error occurred.").catch((error) => console.error(error));
            console.log(err);
            return; } 
        await ctx.reply("*Domain Information*" + "\n\n" + data, { parse_mode: "Markdown" }).catch((error) => console.error(error));
      });

  });

// Function

export default webhookCallback(bot, 'https');