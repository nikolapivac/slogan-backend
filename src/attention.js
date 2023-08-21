tf = require('@tensorflow/tfjs');

class AttentionLayer extends tf.layers.Layer {
  constructor() {
    super({});
  }

  build(inputShape) {
    const [encoderOutputShape, _] = inputShape;
    const enSeqLen = encoderOutputShape[1];
    const enHidden = encoderOutputShape[2];

    this.W_a = this.addWeight('W_a', [enHidden, enHidden], 'uniform');
    this.U_a = this.addWeight('U_a', [enHidden, enHidden], 'uniform');
    this.V_a = this.addWeight('V_a', [enHidden, 1], 'uniform');

    super.build(inputShape);
  }

  call(inputs, kwargs) {
    const [encoderOutSeq, decoderOutSeq] = inputs;

    const W_a_dot_s = tf.dot(encoderOutSeq, this.W_a);
    const U_a_dot_h = tf.matMul(decoderOutSeq, this.U_a);

    const Ws_plus_Uh = tf.tanh(tf.add(W_a_dot_s, tf.expandDims(U_a_dot_h, 1)));
    const e_i = tf.squeeze(tf.dot(Ws_plus_Uh, this.V_a), [-1]);
    const attentionScores = tf.softmax(e_i);

    return attentionScores;
  }

  computeOutputShape(inputShape) {
    return inputShape[0].slice(0, 2);
  }
}

AttentionLayer.className = 'AttentionLayer';

tf.serialization.registerClass(AttentionLayer);
