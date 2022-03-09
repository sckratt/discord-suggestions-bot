require('dotenv').config();
const config = require('../config.json');

const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: Object.values(Intents.FLAGS),
    partials: ["CHANNEL", "GUILD_MEMBER", "USER", "GUILD"]
});
client.commands = new Collection();
client.translate = (text, variables) => {
    const langs = [ "fr", "en", "sp", "de" ];
    const translations = fs.readFileSync(path.resolve(process.cwd(), "assets/translations.txt"), "utf-8")
        .replace("\r", "")
        .split("\n")
        .map(translation => translation.split(" :: "));
    let translation = translations.find(translation => translation[0] == text)[langs.indexOf(config.lang || "en")];
    if(!variables) return translation;
    let translated = [];
    for(let word of translation.split(/ +/g)) {
        if(Object.keys(variables).includes(word)) translated.push(variables[word]);
        else translated.push(word);
    };
    return translated.join(" ");
};
client.login(process.env.token);

fs.readdirSync(path.resolve(__dirname, "events"))
.filter(f => f.endsWith(".js"))
.forEach(name => client.on(name.split(".js")[0], (...args) => require(`./events/${name}`)( client, ...args )));