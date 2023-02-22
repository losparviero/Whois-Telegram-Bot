require("dotenv").config();
const { Bot } = require("grammy");
const whois = require("whois");

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// DB

const mysql = require("mysql2");
const connection = mysql.createConnection(process.env.DATABASE_URL);

// Commands

bot.command("start", async (ctx) => {
  await ctx
    .reply("*Welcome!* ✨ Send a website to get WHOIS details.", {
      parse_mode: "Markdown",
    })
    .then(() => {
      connection.query(
        `
SELECT * FROM users WHERE userid = ?
`,
        [ctx.from.id],
        (error, results) => {
          if (error) throw error;
          if (results.length === 0) {
            connection.query(
              `
    INSERT INTO users (userid, username, firstName, lastName, firstSeen)
    VALUES (?, ?, ?, ?, NOW())
  `,
              [
                ctx.from.id,
                ctx.from.username,
                ctx.from.first_name,
                ctx.from.last_name,
              ],
              (error, results) => {
                if (error) throw error;
                console.log("New user added:", ctx.from);
              }
            );
          } else {
            console.log("User exists in database.", ctx.from);
          }
        }
      );
    })
    .catch((error) => console.error(error));
});

bot.command("help", async (ctx) => {
  await ctx
    .reply(
      "*@anzubo Project.*\n\nThis bot uses the whois lib to get WHOIS domain information data.\n_Note that names or details of registrant may be privacy protected and hence not available._",
      { parse_mode: "Markdown" }
    )
    .then(console.log("Help command sent to", ctx.from.id))
    .catch((e) => console.error(e));
});

// Messages

bot.on("msg", async (ctx) => {
  console.log("Query:", ctx.msg.text, "from", ctx.from.id);
  try {
    await whois.lookup(ctx.msg.text, async function (err, data) {
      if (err) {
        await ctx.reply("*Error fetching details. Send a valid website URL.*", {
          parse_mode: "Markdown",
          reply_to_message_id: ctx.msg.message_id,
        });
        console.log(err);
        return;
      }
      await ctx.reply("*Domain Information*" + "\n\n" + data, {
        parse_mode: "Markdown",
      });
    });
  } catch (error) {
    console.error(error);
    await ctx.reply("An error occured");
  }
});

// Run

bot.start();
