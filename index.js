const { Client, GatewayIntentBits } = require('discord.js');
const ytdl = require('ytdl-core');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
require('dotenv').config();

// Configura o caminho do ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Criação do cliente Discord
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Seu token do Discord
const TOKEN = process.env.DISCORD_TOKEN;
client.on('ready', () => {
    console.log(`Bot logado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // Verifica se a mensagem começa com o prefixo e possui uma URL
    if (message.content.startsWith('!bor')) {
        const args = message.content.split(' ');
        const url = args[1];

        if (!ytdl.validateURL(url)) {
            return message.reply('Por favor, insira uma URL válida do YouTube.');
        }

        try {
            // Baixa o áudio do YouTube
            const info = await ytdl.getInfo(url);
            const audioStream = ytdl(url, { filter: 'audioonly' });

            const sanitizedTitle = info.videoDetails.title
            .replace(/[<>:"/\\|?*]+/g, '') 
            .replace(/\s+/g, '_'); 

            // Define o nome do arquivo
            const fileName = `./downloads/${sanitizedTitle}.mp3`;

            // Converte para MP3 usando ffmpeg
            ffmpeg(audioStream)
                .audioBitrate(128)
                .toFormat('mp3')
                .save(fileName)
                .on('end', () => {
                    message.reply('Download concluído! Aqui está o arquivo:');
                    message.channel.send({
                        files: [fileName],
                    });
                })
                .on('error', (err) => {
                    console.error(err);
                    message.reply('Ocorreu um erro ao processar o áudio.');
                });
        } catch (error) {
            console.error(error);
            message.reply('Erro ao baixar o áudio.');
            message.reply(error.message);
        }
    }
});

client.login(TOKEN);
