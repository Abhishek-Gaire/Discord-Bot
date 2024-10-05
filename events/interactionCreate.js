const { Events } = require("discord.js");
const wait = require("node:timers/promises").setTimeout;

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "ping") {
      // only responds to the single user if ephemeral is true
      // await interaction.reply({ content: "Secret Pong!", ephemeral: true });

      // await wait(2_000);

      //edits the reply
      // await interaction.editReply("Pong Again");

      // // if the bot takes more than 3 seconds to reply , it will be considered a failure(token invalidated)
      // // to not consider as a failure , you can use the `interaction.deferReply()` method before the delay

      // await interaction.deferReply();
      // // for deferReply to be ephemeral you need to use `await interaction.deferReply({ephemeral:true})

      // await wait(4_000);
      // await interaction.editReply("Pong!");

      await interaction.reply("Pong!");
      // for follow up messages
      await interaction.followUp("Pong Again!");

      // to delete the responses
      await interaction.deleteReply();
    }
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    const { cooldowns } = interaction.client;

    if (!cooldowns.has(command.data.name)) {
      cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = 3;
    const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime =
        timestamps.get(interaction.user.id) + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        return interaction.reply({
          content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
          ephemeral: true,
        });
      }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  },
};
