import { expect, test } from "bun:test";
import {
  enrollLocalVoice,
  extractVoiceSignature,
  parseWavPcm,
  verifyLocalVoice,
} from "./local-voice-verification";

function createTestWav(durationSeconds: number, frequency: number) {
  const sampleRate = 16_000;
  const sampleCount = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const sample = Math.sin((2 * Math.PI * frequency * index) / sampleRate);
    view.setInt16(44 + index * 2, sample * 0x7fff, true);
  }

  return buffer;
}

test("parseWavPcm extracts PCM samples", () => {
  const wav = createTestWav(1, 220);
  const pcm = parseWavPcm(wav);

  expect(pcm.length).toBe(16_000);
});

test("local voice verification accepts matching samples", () => {
  const enrolled = createTestWav(4, 180);
  const verify = createTestWav(4, 182);
  const enrollment = enrollLocalVoice(enrolled);
  const result = verifyLocalVoice(verify, enrollment.signature);

  expect(result.recognitionResult).toBe("Accept");
  expect(result.score).toBeGreaterThan(0.62);
});

test("local voice verification rejects very different samples", () => {
  const enrolled = createTestWav(4, 180);
  const verify = createTestWav(4, 180);
  const silent = new ArrayBuffer(44 + verify.byteLength - 44);
  new Uint8Array(silent).set(new Uint8Array(verify).subarray(0, 44));
  const enrollment = enrollLocalVoice(enrolled);
  const result = verifyLocalVoice(silent, enrollment.signature);

  expect(result.recognitionResult).toBe("Reject");
});

test("extractVoiceSignature returns normalized features", () => {
  const signature = extractVoiceSignature(createTestWav(4, 200));
  const magnitude = Math.sqrt(
    signature.reduce((sum, value) => sum + value * value, 0),
  );

  expect(signature.length).toBe(40);
  expect(magnitude).toBeCloseTo(1, 5);
});
