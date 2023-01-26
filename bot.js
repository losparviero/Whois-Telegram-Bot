require('dotenv').config();
const { Bot, session, GrammyError, HttpError } = require("grammy");
const { run, sequentialize } = require("@grammyjs/runner");
const whois = require('whois');

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// Concurrency

function getSessionKey(ctx) {
  return ctx.chat?.id.toString(); }

bot.use(sequentialize(getSessionKey));
bot.use(session({ getSessionKey })); 

// Commands

bot.command("start", async (ctx) => ctx.reply("*Welcome!* ✨ Send a website to get WHOIS details.", { parse_mode: "Markdown" }) );
bot.command("help", (ctx) => ctx.reply("*@anzubo Project.*\n\nThis bot uses the whois lib to get WHOIS domain information data.\n_Note that names or details of registrant may be privacy protected and hence not available._", { parse_mode: "Markdown" } ));

// Messages

bot
  .on("msg", async (ctx) => {

    // Logging

    if (ctx.from.last_name === undefined) { console.log('from:', ctx.from.first_name, '(@' + ctx.from.username + ')', 'ID:', ctx.from.id); }
    else { console.log('from:', ctx.from.first_name, ctx.from.last_name, '(@' + ctx.from.username + ')', 'ID:', ctx.from.id); }
    console.log("Message:", ctx.msg.text);

    // Logic

    whois.lookup(ctx.msg.text, function(err, data) {
        if (err) {
            ctx.reply("An error occurred.");
            console.log(err);
            return; }
        ctx.reply("*Domain Information*" + "\n\n" + data, { parse_mode: "Markdown" }); });

  });

// Error Handling

bot.catch((err) => {
  const ctx = err.ctx;
  console.error("Error while handling update", ctx.update.update_id, "\nQuery:", ctx.msg.text, "not found");
  if (ctx.config.isDeveloper) { ctx.reply("Query: " + ctx.msg.text + " " + "not found!"); }
  else { bot.api.sendMessage(ctx.config.botDeveloper, "Query: " + ctx.msg.text + " by @" + ctx.from.username + " ID: " + ctx.from.id + " not found!"); }
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

// Run

console.log('Bot running. Please keep this window open or use a startup manager like PM2 to setup persistent execution and store logs.');
run(bot);