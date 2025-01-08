const { Client, GatewayIntentBits } = require('discord.js');
const ytdl = require('ytdl-core');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const sanitize = require('sanitize-filename');
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

            const downloadsDir = './downloads';
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir);
            }

            const cookies = fs.readFileSync('./cookies.txt', 'utf8')

            // Baixa o áudio do YouTube
            const info = await ytdl.getInfo(url);
            const audioStream = ytdl(url, {
                filter: 'audioonly',
                highWaterMark: 1 << 25,
                requestOptions: {
                    Headers: {
                        'Cookie': cookies,
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                    }
                }
            });

            const safeFileName = sanitize(info.videoDetails.title)
            
            // Define o nome do arquivo
            const fileName = `${downloadsDir}/${safeFileName}.mp3`;
            // Converte para MP3 usando ffmpeg
            ffmpeg(audioStream)
                .audioCodec('libmp3lame')
                .audioBitrate(128)
                .toFormat('mp3')
                .output(fileName)
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
