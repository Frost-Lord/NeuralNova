const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const use = require('@tensorflow-models/universal-sentence-encoder');
const TrainingSchema = require("./database/Schema/training.js");
const natural = require('natural');
const mongoose = require('mongoose');

mongoose
    .connect("mongodb://127.0.0.1:27017/AI", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log("Unable to connect to MongoDB Database.\nError: " + err);
    });
mongoose.connection.on("err", (err) => {
    console.error(`Mongoose connection error: \n ${err.stack}`);
});
mongoose.connection.on("disconnected", () => {
    console.log("Mongoose connection disconnected");
});



let CodeIndex = [];
let TrainingData = [];
let ResponseMap = [];
let chatHistory = [];

async function fetchTrainingData() {
    const data = await TrainingSchema.find({});
    TrainingData = [];
    CodeIndex = [];
    data.forEach((TData) => {
        TrainingData.push({ text: TData.text, intent: TData.intent, response: TData.response });
        ResponseMap.push({ intent: TData.intent, response: TData.response });
        if (CodeIndex.indexOf(TData.intent) === -1) {
            CodeIndex.push(TData.intent);
        }
    });
}

const encodeData = async (data) => {
    const sentences = data.map(comment => comment.toLowerCase());
    const model = await use.load();
    const embeddings = await model.embed(sentences);
    return embeddings;
};

async function processChatHistory(inputMessage) {
    chatHistory.push(inputMessage);
    const chatHistoryEmbeddings = await encodeData(chatHistory);
    const inputMessageEmbedding = chatHistoryEmbeddings.slice([chatHistoryEmbeddings.shape[0] - 1, 0]);
    const previousResponsesEmbeddings = chatHistoryEmbeddings.slice(0, -1);

    // Create a specific response based on the input message and chat history
    // You can modify this part to improve response generation
    const similarityScores = previousResponsesEmbeddings
        .dot(inputMessageEmbedding.transpose())
        .flatten()
        .dataSync();
    const highestSimilarityIndex = similarityScores.reduce(
        (maxIndex, score, index, array) => (score > array[maxIndex] ? index : maxIndex),
        0
    );

    if (ResponseMap[highestSimilarityIndex]) {
        const response = ResponseMap[highestSimilarityIndex].response;
        chatHistory.push(response);
        return response;
    } else {
        // Handle the case when there is no matching response
        const defaultMessage = "I'm sorry, I couldn't find a suitable response.";
        chatHistory.push(defaultMessage);
        return defaultMessage;
    }
}


async function Train() {
    await fetchTrainingData();

    const model = tf.sequential();
    model.add(tf.layers.dense({
        inputShape: [1024],
        activation: 'sigmoid',
        units: CodeIndex.length,
    }));
    model.add(tf.layers.dense({
        inputShape: [CodeIndex.length],
        activation: 'sigmoid',
        units: CodeIndex.length,
    }));
    model.add(tf.layers.dense({
        inputShape: [CodeIndex.length],
        activation: 'sigmoid',
        units: CodeIndex.length,
    }));
    model.compile({
        loss: 'meanSquaredError',
        optimizer: tf.train.adam(.06),
    });

    const inputDataArray = TrainingData.map(comment => comment.text);
    const outputDataArray = TrainingData.map(comment => comment.response);

    const [inputEmbeddings, outputEmbeddings] = await Promise.all([
        encodeData(inputDataArray),
        encodeData(outputDataArray)
    ]);

    const concatenatedInputOutput = inputEmbeddings.concat(outputEmbeddings, 1);
    const outputData = tf.oneHot(tf.tensor1d(TrainingData.map(comment => CodeIndex.indexOf(comment.intent)), 'int32'), CodeIndex.length);

    console.log('-----------------------------------------------------------');
    console.log('Creating model...');
    console.log('Training: Training CodeIndex (Shape): ' + CodeIndex.length);
    console.log('-----------------------------------------------------------');
    model.summary();

    await model.fit(concatenatedInputOutput, outputData, { epochs: 5000 });

    await model.save('file://./model/');
    console.log('Model saved to path: ' + 'file://./model/');
}


async function PredictedIntent(inputSentence, previousResponse) {
    const modelPath = 'file://./model/model.json';
    const model = await tf.loadLayersModel(modelPath);

    const useModel = await use.load();

    const [inputSentenceEmbedding, previousResponseEmbedding] = await Promise.all([
        useModel.embed(inputSentence.toLowerCase()),
        useModel.embed(previousResponse.toLowerCase())
    ]);

    const concatenatedInputOutput = inputSentenceEmbedding.concat(previousResponseEmbedding, 1);

    const prediction = model.predict(concatenatedInputOutput);
    const predictionData = prediction.dataSync();

    const intentIndex = prediction.argMax(1).dataSync()[0];
    const predictedIntent = CodeIndex[intentIndex];
    const predictionThreshold = 0.95;

    const maxPrediction = Math.max(...predictionData);
    const predictionPass = maxPrediction >= predictionThreshold;
    fetchTrainingData();

    const responseMessage = ResponseMap.find(data => data.intent === predictedIntent)?.response ? ResponseMap.find(data => data.intent === predictedIntent).response : false;

    const numPredictions = 3;
    const topPredictions = {};

    const sortedPredictions = predictionData.slice().sort().reverse();
    for (let i = 0; i < numPredictions; i++) {
        const predictionIndex = predictionData.indexOf(sortedPredictions[i]);
        const predictionPercentage = (sortedPredictions[i] * 100).toFixed(2);
        if (sortedPredictions[i]) {
            topPredictions[i + 1] = {
                name: CodeIndex[predictionIndex] || 'none',
                percentage: `${predictionPercentage}%`,
                index: predictionIndex,
            };
        }
    }
    return (predictionPass) ? { predictedIntent, maxPrediction, topPredictions, intentIndex: prediction.dataSync(), responseMessage } : false;
}


async function main() {
    fetchTrainingData();
    //await Train();

    const userMessage1 = "How can I change my password?";
    const response1 = await processChatHistory(userMessage1);
    console.log("User:", userMessage1);
    console.log("AI:", response1);

    const userMessage2 = "How do I track my order?";
    const predictedIntent2 = await PredictedIntent(userMessage2, response1);
    console.log("User:", userMessage2);
    console.log("AI:", predictedIntent2.responseMessage);

    const userMessage3 = "How do I cancel my subscription?";
    const predictedIntent3 = await PredictedIntent(userMessage3, predictedIntent2.responseMessage);
    console.log("User:", userMessage3);
    console.log("AI:", predictedIntent3.responseMessage);

}

main();
