import {inspect} from 'util';
import vm from 'vm';
import sortBy from 'lodash.sortby';

import templator from '@babel/template';
import parser from '@babel/parser';
import generator from '@babel/generator';
import types from '@babel/types';
import traverser from '@babel/types/lib/traverse/traverseFast.js';

const {parse} = parser;
const template = templator.default;
const generate = generator.default;
const traverse = traverser.default;

const prefix = template.statements(`
  let __poofSnoop = {};
  let __poof = (key, val) => {
    __poofSnoop[key] = val;
    return val;
  };
`);
const suffix = template.statements(`
  __poofSnoop;
`);
const instrument = template.expression(`
  __poof(%%key%%, %%expression%%)
`);

let deep = (data) =>
  inspect(data, {depth: null});

const MARKER = ' =>';

let getMarker = (node) =>
  node.trailingComments
  && node.trailingComments
    .find(line => line.value.startsWith(MARKER));

let keyForMarker = ({ start, end }) => `${start}:${end}`;

let getMarkerKey = (node) => {
  let marker = getMarker(node);
  if (!marker) { return; }
  let key = types.stringLiteral(
    keyForMarker(marker)
  );
  return key;
};

/*
 * TODO: use a worker thread,
 * or run directly in the shell.
 */
let runCode = (code) =>
  vm.runInNewContext(code);

let insertResults = (code, results) => {
  let chunks = [];
  let consumed = 0;
  let entries = sortBy(
    Object.entries(results)
      .map(([key, res]) => [key.split(':').map(Number), deep(res)])
  , r => r[0][0]);
  entries.forEach(([[start, end], res]) => {
    chunks.push(
      code.slice(consumed, start)
    );
    chunks.push('// => ' + res);
    consumed = end;
  });
  chunks.push(
    code.slice(consumed)
  );
  return chunks.join('');
};

let poof = async (input) => {
  let code = input.toString();
  let ast = parse(code);

  traverse(ast, (node) => {
    switch (node.type) {
      case 'ExpressionStatement': {
        let key = getMarkerKey(node);
        if (!key) { return; }

        let expression = node.expression;
        let newExpression = instrument({ key, expression });
        node.expression = newExpression;
        break;
      }
      case 'VariableDeclaration': {
        let key = getMarkerKey(node);
        if (!key) { return; }

        let expression = node.declarations[0].init;
        let newExpression = instrument({ key, expression });
        node.declarations[0].init = newExpression;
        break;
      }
    }
  });

  let {body} = ast.program;
  ast.program.body = [...prefix(), ...body, ...suffix()];
  let output = generate(ast, { /* options */ }, code);
  let instrumentedCode = output.code;

  let results = runCode(instrumentedCode);

  let final = insertResults(code, results);

  return final;
};

export default poof;
