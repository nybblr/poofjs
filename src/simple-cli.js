let readInput = (stream) => new Promise(resolve => {
  let chunks = [];
  stream.on('data', chunk => chunks.push(chunk));
  stream.on('end', () => resolve(Buffer.concat(chunks)));
});

let simpleCLI = async (transform) => {
  let input = await readInput(process.stdin);
  let output = await transform(input);
  process.stdout.end(output);
};

export default simpleCLI;
