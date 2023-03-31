const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const use = require('@tensorflow-models/universal-sentence-encoder');
const TrainingSchema = require("../database/Schema/training.js");
const natural = require('natural');

let CodeIndex = [];
let TrainingData = [];
let ResponseMap = [];

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
  const sentences = data.map(comment => comment.text.toLowerCase());
  const model = await use.load();
  const embeddings = await model.embed(sentences);
  return embeddings;
};

async function Train() {
  await fetchTrainingData();

  const model = tf.sequential();
  model.add(tf.layers.dense({
    inputShape: [512],
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

  // Encode input data
  const inputDataArray = TrainingData.map(comment => comment.text);
  const tokenizer = new natural.AggressiveTokenizer();
  const tokenizedInputData = inputDataArray.map(comment => tokenizer.tokenize(comment.toLowerCase()));
  const vocabulary = [...new Set(tokenizedInputData.flat())];
  const wordIndex = {};
  vocabulary.forEach((word, index) => wordIndex[word] = index);

  // Encode output data
  const CodeIndex2 = [...new Set(TrainingData.map(comment => comment.intent))];
  const outputDataArray = TrainingData.map(comment => {
    const intentIndex = CodeIndex2.indexOf(comment.intent);
    const outputArray = Array(CodeIndex2.length).fill(0);
    outputArray[intentIndex] = 1;
    return outputArray;
  });
  const outputData = tf.tensor2d(outputDataArray);

  console.log('-----------------------------------------------------------');
  console.log('Creating model...');
  console.log('Training: Training CodeIndex (Shape): ' + CodeIndex.length);
  console.log('-----------------------------------------------------------');
  model.summary();

  const [training_data, testing_data] = await Promise.all([
    encodeData(TrainingData),
    encodeData(TrainingData)
  ]);

  await model.fit(training_data, outputData, { epochs: 5000 });

  await model.save('file://./src/AI/model/');
  console.log('Model saved to path: ' + 'file://./src/AI/model/');
}


async function PredictedIntent(inputSentence) {
  const modelPath = 'file://./src/AI/model/model.json';
  const model = await tf.loadLayersModel(modelPath);

  const sentenceEmbedding = await use.load().then(model => {
    return model.embed(inputSentence.toLowerCase())
      .then(embedding => {
        return embedding;
      });
  }).catch(err => console.error('Encoding Error:', err));

  const prediction = model.predict(sentenceEmbedding);
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

module.exports = {
  Train, PredictedIntent
};