const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const MessageSchemas = require("../databse/Schema/messages.js");
const GenerationSchemas = require("../databse/Schema/generation.js");
const Canvas = require('canvas');

module.exports = {
    name: 'messageCreate',
    execute: async (message) => {
        let client = message.client;
        if (message.author.bot) return;
        if (message.channel.type === 'dm') return;

        const { PredictedIntent } = require("../AI/AI.js");


        if (!message.content) return;
        if (message.content.length < 20) return;

        const startTime = new Date();

        const predictionResult = await PredictedIntent(message.content);

        const endTime = new Date();
        const timeTakenMs = endTime - startTime;
        const timeTakenSeconds = timeTakenMs / 1000;
        let gen = 0;

        const DataBank = await GenerationSchemas.findOne({ id: 1 });
        if (!DataBank) {
            const newDataBank = new GenerationSchemas({
                id: 1,
                Generation: 1,
                CPUhours: 0,
                Lastmessage: "None",
                Lastintent: "None",
            });
            await newDataBank.save();
        }

        if (DataBank) {
            const newCPUhours = DataBank.CPUhours + timeTakenSeconds;
            const newLastmessage = message.content;
            const newLastintent = predictionResult.predictedIntent;
            gen = DataBank.Generation;

            DataBank.CPUhours = newCPUhours;
            DataBank.Lastmessage = newLastmessage;
            DataBank.Lastintent = newLastintent || "None";
            await DataBank.save();
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Primary)
                    .setLabel(`Correct (0)`)
                    .setCustomId('correct'),
                new ButtonBuilder()
                    .setStyle(ButtonStyle.Danger)
                    .setLabel(`Incorrect (0)`)
                    .setCustomId('incorrect')
            );

        if (predictionResult.predictedIntent) {
            if (predictionResult.predictedIntent === 'none') return;

            async function generateThumbnail(predictionResult) {
                const topPredictions = predictionResult.topPredictions;
                const canvas = Canvas.createCanvas(300, 300);
                const ctx = canvas.getContext('2d');

                // Draw background
                ctx.fillStyle = '#36393f';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw title
                const title = 'Prediction Results:';
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px Arial';
                const titleX = canvas.width / 2 - ctx.measureText(title).width / 2;
                ctx.fillText(title, titleX, 40);
                ctx.beginPath();
                ctx.moveTo(titleX, 60);
                ctx.lineTo(titleX + ctx.measureText(title).width, 60);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw bars
                const barWidth = 50;
                const barHeight = 200;
                const yOffset = canvas.height - barHeight - 20;
                let xOffset = 40;
                for (let i = 1; i <= predictionResult.intentIndex.length; i++) {
                    if (i > 3) return;
                    const prediction = topPredictions[i.toString()];
                    const percentage = parseFloat(prediction.percentage);
                    const barLength = barHeight * percentage / 100;
                    const barColor = '#158ef9';
                    ctx.fillStyle = barColor;
                    ctx.fillRect(xOffset, yOffset + barHeight - barLength, barWidth, barLength);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 16px Arial';
                    const nameWidth = ctx.measureText(prediction.name).width;
                    const nameX = xOffset + barWidth / 2 - nameWidth / 2;
                    const nameY = yOffset + barHeight + 10;
                    ctx.save();
                    ctx.translate(nameX, nameY);
                    ctx.fillText(prediction.name, 0, 0, barWidth);
                    ctx.restore();
                    xOffset += barWidth + 20;
                }
                // Draw y-axis labels
                const yMax = 100;
                const yMin = 0;
                const yStep = 10;
                const yLabelWidth = 40;
                const yLabelX = 5;
                const yStart = yOffset + barHeight;
                const yEnd = yOffset;
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 12px Arial';
                for (let y = yMax; y >= yMin; y -= yStep) {
                    const label = y + '%';
                    const yOffset2 = yOffset + barHeight * (1 - y / 100);
                    ctx.fillText(label, yLabelX, yOffset2 + 5);
                }
                ctx.beginPath();
                ctx.moveTo(yLabelWidth, yStart);
                ctx.lineTo(yLabelWidth, yEnd);
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();


                const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'thumbnail.png' });
                return attachment;
            }

            const thumbnail = await generateThumbnail(predictionResult);
            const embed = new EmbedBuilder()
                .setTitle('Prediction Result:')
                .setThumbnail(`attachment://` + thumbnail.name)
                .setColor(0x0099ff)
                .setDescription(`The predicted intent is **${predictionResult.predictedIntent}** with a confidence of **${predictionResult.maxPrediction.toFixed(2) * 100}%**`)
                .setFooter({ text: `Generation: ${gen}` });
            try {
                const sentMessage = await message.reply({ embeds: [embed], components: [row], files: [thumbnail] });
                const newMessage = new MessageSchemas({
                    messageid: sentMessage.id,
                    correctCount: 0,
                    incorrectCount: 0,
                });
                newMessage.save();
            } catch (err) {}
        }

    }
};
