const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const use = require('@tensorflow-models/universal-sentence-encoder');
const TrainingSchema = require("../databse/Schema/training.js");

let CodeIndex = [];
let TrainingData = [];

async function fetchTrainingData() {
  const data = await TrainingSchema.find({});
  TrainingData = [];
  CodeIndex = [];
  data.forEach((TData) => {
    TrainingData.push({ text: TData.text, intent: TData.intent });
    if (CodeIndex.indexOf(TData.intent) === -1) {
      CodeIndex.push(TData.intent);
    }
  });
}

const encodeData = data => {
  const sentences = data.map(comment => comment.text.toLowerCase());
  const trainingData = use.load()
    .then(model => {
      return model.embed(sentences)
        .then(embeddings => {
          return embeddings;
        });
    })
    .catch(err => console.error('Fit Error:', err));

  return trainingData
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

  const outputDataArray = TrainingData.map(comment => {
    const intentIndex = CodeIndex.indexOf(comment.intent);
    const outputArray = Array(CodeIndex.length).fill(0);
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

  await model.fit(training_data, outputData, { epochs: 400 });

  await model.save('file://./src/AI/model/');
  console.log('Model saved to path: ' + 'file://./src/AI/model/');

  const prediction = await model.predict(testing_data);
  prediction.print();
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

  const numPredictions = 3;
  const topPredictions = {};
  
  const sortedPredictions = predictionData.slice().sort().reverse();
  for (let i = 0; i < numPredictions; i++) {
    const predictionIndex = predictionData.indexOf(sortedPredictions[i]);
    const predictionPercentage = (sortedPredictions[i] * 100).toFixed(2);
    if (sortedPredictions[i]) {
      topPredictions[i+1] = {
        name: CodeIndex[predictionIndex] || 'none',
        percentage: `${predictionPercentage}%`,
        index: predictionIndex,
      };
    }
  }

  fetchTrainingData();
  return (predictionPass) ? { predictedIntent, maxPrediction, topPredictions, intentIndex: prediction.dataSync() } : false;
} 

module.exports = {
  Train, PredictedIntent
};