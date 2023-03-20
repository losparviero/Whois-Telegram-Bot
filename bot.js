require("dotenv").config();
const { Bot, HttpError, GrammyError } = require("grammy");
const wikifeet = require("wikifeet-js");
const { hydrate } = require("@grammyjs/hydrate");

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// Plugins

bot.use(hydrate());

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
  await ctx
    .reply("*Welcome!* ✨\n_Send the name of a celebrity._", {
      parse_mode: "Markdown",
    })
    .then(console.log("New user added:", ctx.from))
    .catch((error) => console.error(error));
});

bot.command("help", async (ctx) => {
  await ctx
    .reply(
      "*@anzubo Project.*\n\n_This bot uses the WikiFeet website.\nSend the name of a celebrity to try it out!_",
      { parse_mode: "Markdown" }
    )
    .then(() => console.log("Help command message sent to", ctx.from.id))
    .catch((error) => console.error(error));
});

// Messages

bot.on("msg", async (ctx) => {
  // Logging

  const from = ctx.from;
  const name =
    from.last_name === undefined
      ? from.first_name
      : `${from.first_name} ${from.last_name}`;
  console.log(
    `From: ${name} (@${from.username}) ID: ${from.id}\nMessage: ${ctx.msg.text}`
  );

  // Logic

  const formattedName = ctx.msg.text
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const statusMessage = await ctx.reply(`*Searching for ${formattedName}*`, {
    parse_mode: "Markdown",
  });

  try {
    const searchResults = await wikifeet.search(formattedName);
    if (searchResults.length === 0) {
      console.log(`No results found for ${formattedName}`);
      await sendMarkdownMessage(ctx, `*No results found for ${formattedName}*`);
      return;
    } else {
      let query = searchResults[0];
      let pics = await wikifeet.getImages(query);
      let randomIndices = Array.from({ length: 10 }, () =>
        Math.floor(Math.random() * pics.length)
      );

      let media = randomIndices.map((index) => ({
        type: "photo",
        media: pics[index],
      }));

      await ctx.replyWithMediaGroup(media, {
        reply_to_message_id: ctx.msg.message_id,
      });
    }
    await statusMessage.delete();
  } catch (error) {
    if (error instanceof GrammyError) {
      if (error.message.includes("Forbidden: bot was blocked by the user")) {
        console.log("Bot was blocked by the user");
      } else if (error.message.includes("Call to 'sendMediaGroup' failed!")) {
        console.log("Error sending media.");
        await ctx.reply(`*Error contacting WikiFeet.*`, {
          parse_mode: "Markdown",
          reply_to_message_id: ctx.msg.message_id,
        });
      } else {
        await ctx.reply(`*An error occurred: ${error.message}*`, {
          parse_mode: "Markdown",
          reply_to_message_id: ctx.msg.message_id,
        });
      }
      console.log(`Error sending message: ${error.message}`);
      return;
    } else {
      console.log(`An error occured:`, error);
      await ctx.reply(
        `*An error occurred. Are you sure you sent a valid celebrity name?*\n_Error: ${error.message}_`,
        { parse_mode: "Markdown", reply_to_message_id: ctx.msg.message_id }
      );
      return;
    }
  }

  async function sendMarkdownMessage(ctx, message) {
    await ctx.reply(message, {
      parse_mode: "Markdown",
    });
  }
});

// Error

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(
    "Error while handling update",
    ctx.update.update_id,
    "\nQuery:",
    ctx.msg.text
  );
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
    if (e.description === "Forbidden: bot was blocked by the user") {
      console.log("Bot was blocked by the user");
    } else {
      ctx.reply("An error occurred");
    }
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

// Run

bot.start();
