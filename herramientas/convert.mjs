// Convert a 3DGS .ply into a .ksplat using the library's own generator.
// Usage: node convert.mjs in.ply out.ksplat [compressionLevel=1] [alphaThreshold=5] [shDegree=0]
import * as fs from 'node:fs';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import { Vector3 } from 'three';

const [,, inputFile, outputFile, compressionArg, alphaArg, shArg] = process.argv;
if (!inputFile || !outputFile) {
  console.error('usage: node convert.mjs in.ply out.ksplat [compression] [alpha] [sh]');
  process.exit(1);
}
const compressionLevel = compressionArg ? parseInt(compressionArg, 10) : 1;
const alphaRemovalThreshold = alphaArg ? parseInt(alphaArg, 10) : 5;
const shDegree = shArg ? parseInt(shArg, 10) : 0;
const sceneCenter = new Vector3(0, 0, 0);
const blockSize = 5.0;
const bucketSize = 256;

const fileData = fs.readFileSync(inputFile);
const arrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength);
console.log(`parsing ${inputFile} (${(arrayBuffer.byteLength / 1e6).toFixed(1)} MB)`);
const splatArray = GaussianSplats3D.PlyParser.parseToUncompressedSplatArray(arrayBuffer, shDegree);
console.log(`splats parsed: ${splatArray.splatCount}`);
// Signature: (minimumAlpha, compressionLevel, sectionSize, sceneCenter, blockSize, bucketSize)
const generator = GaussianSplats3D.SplatBufferGenerator.getStandardGenerator(
  alphaRemovalThreshold, compressionLevel, 0, sceneCenter, blockSize, bucketSize);
const splatBuffer = generator.generateFromUncompressedSplatArray(splatArray);
fs.writeFileSync(outputFile, Buffer.from(splatBuffer.bufferData));
console.log(`wrote ${outputFile}: ${splatBuffer.getSplatCount()} splats, ${(splatBuffer.bufferData.byteLength / 1e6).toFixed(1)} MB`);
