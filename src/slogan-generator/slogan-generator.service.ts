import { Injectable } from '@nestjs/common';
import { GenerateSloganDto } from './dto/generate-slogan.dto';
import * as tf from '@tensorflow/tfjs-node';
import * as fs from 'fs';

@Injectable()
export class SloganGeneratorService {
  private encoderModel: tf.LayersModel;
  private decoderModel: tf.LayersModel;
  private xVocab: { [word: string]: number };
  private yVocab: { [word: string]: number };
  private maxTextLen: 100;
  private maxSummaryLen: 16;
  private targetWordIndex: { [word: string]: number };

  constructor() {
    this.loadModelsAndData();
  }

  private async loadModelsAndData() {
    this.encoderModel = await tf.loadLayersModel(
      'file://src/model_big/encoder_big/model.json',
    );
    this.decoderModel = await tf.loadLayersModel(
      'file://src/model_big/decoder_big/model.json',
    );

    // Load vocabularies
    const xTokJson = fs.readFileSync('src/model_big/xVocab_big.json', 'utf-8');
    this.xVocab = JSON.parse(xTokJson);
    const yTokJson = fs.readFileSync('src/model_big/yVocab_big.json', 'utf-8');
    this.yVocab = JSON.parse(yTokJson);

    // Load target word index
    const twi = fs.readFileSync('src/model_big/twi_big.json', 'utf-8');
    this.targetWordIndex = JSON.parse(twi);
  }

  async generateSlogan(data: GenerateSloganDto): Promise<string> {
    const description = data.description.toLowerCase();

    // Tokenize the input description
    const descriptionSeq = this.tokenizeInput(description);

    // Padding
    const paddedSequence = this.padSequence(descriptionSeq);

    // Generate the slogan using the trained models
    const slogan = await this.decodeSequence(paddedSequence);

    return slogan;
  }

  private padSequence(inputArray: number[]): number[] {
    const paddedSeq = [...inputArray];
    if (paddedSeq.length < 100) {
      // Pad with 0s to reach the desired length
      paddedSeq.push(...new Array(100 - paddedSeq.length).fill(0));
    } else if (paddedSeq.length > 100) {
      // Truncate the array if it's longer than the desired length
      paddedSeq.length = 100;
    }

    return paddedSeq;
  }

  private tokenizeInput(text: string): number[] {
    // Preprocess and clean the text similar to the Python code's text_cleaner function
    let newString = text;
    newString = newString.replace(/(<br \/>|<br>|<br\/>)/g, ' '); // Remove HTML tags
    newString = newString.replace(/"/g, ''); // Remove double quotes
    newString = newString.replace(/(\r\n|\n|\r)/gm, ' '); // Remove newlines
    newString = newString.replace(/'s\b/g, ''); // Remove 's

    // Tokenize the text
    const words = newString.split(' ').filter((w) => w.length > 1);
    const sequence = words.map((word) => this.xVocab[word]);

    return sequence;
  }

  private async decodeSequence(inputSeq: number[]): Promise<string> {
    // Prepare the input tensor for the encoder
    const encoderInput = tf.tensor2d([inputSeq]);

    // Encode the input sequence to get the feature vector
    const [encoderOutputs, stateH, stateC] = this.encoderModel.predict(
      encoderInput,
    ) as tf.Tensor[];

    // Generate empty target sequence of length 1 (start token)
    let targetSeq = tf.tensor2d([[this.targetWordIndex['sostok']]], [1, 1]);

    let stopCondition = false;
    let decodedSentence = '';
    let h = stateH;
    let c = stateC;

    while (!stopCondition) {
      // Predict the next token based on the target sequence and encoder states
      const [decoderOutputs, newH, newC] = this.decoderModel.predict([
        targetSeq,
        encoderOutputs,
        h,
        c,
      ]) as tf.Tensor[];

      // Sample a token
      const sampledTokenIndex = tf
        .argMax(decoderOutputs.squeeze(), -1)
        .dataSync()[0];
      const sampledToken = Object.keys(this.yVocab).find(
        (key) => this.yVocab[key] === sampledTokenIndex,
      );

      if (sampledToken !== 'eostok') {
        decodedSentence += ' ' + sampledToken;
      }

      // Exit condition: either hit max length or find stop word
      if (
        sampledToken === 'eostok' ||
        decodedSentence.split(' ').length >= this.maxSummaryLen - 1
      ) {
        stopCondition = true;
      }

      // Update the target sequence (of length 1) with the new token index
      const newTargetSeq = tf.tensor2d([[sampledTokenIndex]], [1, 1]);
      targetSeq.dispose();
      targetSeq = newTargetSeq;
      h = newH;
      c = newC;
    }

    encoderInput.dispose();
    targetSeq.dispose();
    h.dispose();
    c.dispose();

    return decodedSentence.trim();
  }
}
