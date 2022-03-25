const { Client, CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { colors } = require('discord-toolbox');
const { SlashCommandBuilder } = require('@discordjs/builders');
const db = require('quick.db');
const path = require('path');
const config = require("../../config.json");

module.exports = (client) => ({
    render() {
        return new SlashCommandBuilder()
            .setName("suggest")
            .setDescription(client.translate("Suggérez une nouveauté ou un changement !"))
            .addStringOption(option =>
                option.setRequired(true)
                    .setName(client.translate("détaillez"))
                    .setDescription(client.translate("Expliquez votre suggestion"))
            )
    },
    /**
     * @param {Client} client 
     * @param {CommandInteraction} interaction 
     */
    async execute(client, interaction) {
        if(!db.has("suggestions")) db.set("suggestions", {});

        await interaction.deferReply();
        const errorEmbed = new MessageEmbed()
            .setColor(colors.green)
            .setDescription("🧐 - " + client.translate("Oops, il y a eu une erreur !"))
        
        const channel = interaction.guild.channels.cache
            .filter(channel => channel.type == "GUILD_TEXT")
            .get(config.channelId);
        if(!channel) return interaction.editReply({ embeds: [errorEmbed] }).catch(()=>void 0);
        
        const validEmbed = new MessageEmbed()
            .setColor(colors.green)
            .setDescription("✅ - " + client.translate("Votre suggestion a bien été envoyée !") + ` (${channel.toString()})`)

        const details = interaction.options.getString(client.translate("détaillez"));
        
        const ID = Object.values(db.get("suggestions")).length ? Object.values(db.get("suggestions")).sort((a,b) => a.id - b.id)[0] + 1 : 1;
        const suggestion = {
            id: ID,
            authorId: interaction.user.id,
            details, created: new Date(new Date().setHours(new Date().getHours() +2)),
            upvotes: [],
            downvotes: [],
            accepted: false,
            refused: false,
            deleted: false,
            active: true,
            acceptedBy: null,
            refusedBy: null,
            deletedBy: null
        };
        db.set(`suggestions.${ID}`, suggestion);

        let suggestionEmbed = new MessageEmbed()
            .setColor(colors[config.suggestionsColor] || config.suggestionsColor || colors.blue)
            .setTitle(client.translate("Suggestion"))
            .setDescription(details)
            .addField(
                client.translate("Commentaires des utilisateurs"),
                `✅ - \`0\`\n` +
                `❌ - \`0\``
            ).setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        let components = [
            new MessageActionRow().addComponents([
                new MessageButton()
                    .setStyle("SUCCESS")
                    .setLabel(client.translate("Approuver"))
                    .setCustomId(`SUGGESTION_UPVOTE_${ID}`)
                , new MessageButton()
                    .setStyle("DANGER")
                    .setLabel(client.translate("Désapprouver"))
                    .setCustomId(`SUGGESTION_DOWNVOTE_${ID}`)
                /* , new MessageButton()
                    .setStyle("PRIMARY")
                    .setLabel(client.translate("Options Staff"))
                    .setCustomId(`SUGGESTION_STAFF-OPTIONS_${ID}`) */
            ])
        ];

        try {
            const message = await channel.send({ embeds: [suggestionEmbed], components });
            await message.startThread({ name: client.translate("Plus d'informations") });

            interaction.editReply({ embeds: [validEmbed] }).catch(()=>void 0);
        } catch (err) {
            interaction.editReply({ embeds: [errorEmbed] }).catch(() => void 0);
            console.error(err);
        }
    }
});
