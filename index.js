import {inspect} from 'util';
import sortBy from 'lodash.sortby';

import templator from "@babel/template";
import parser from '@babel/parser';
import generator from '@babel/generator';
import types from "@babel/types";

const {parse} = parser;
const template = templator.default;
const generate = generator.default;

const prefix = template.statements(`
  let __poofSnoop = {};
  let __poof = (key, val) => {
    __poofSnoop[key] = inspect(val, {depth: null});
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

/*
 * TODO: use a worker thread,
 * or run directly in the shell.
 */
let runCode = (code) =>
  eval(code);

let insertResults = (code, results) => {
  let chunks = [];
  let consumed = 0;
  let entries = sortBy(
    Object.entries(results)
      .map(([key, res]) => [key.split(':').map(Number), res])
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
  let {body} = ast.program;
  // console.error(deep(body));
  body.forEach(s => {
    let marker = getMarker(s);
    if (!marker) { return; }
    let key = types.stringLiteral(
      keyForMarker(marker)
    );
    //console.error(deep(statement));
    switch (s.type) {
      case 'ExpressionStatement': {
        let expression = s.expression;
        let newExpression = instrument({ key, expression });
        s.expression = newExpression;
        break;
      }
      case 'VariableDeclaration': {
        let expression = s.declarations[0].init;
        let newExpression = instrument({ key, expression });
        s.declarations[0].init = newExpression;
        break;
      }
    }
  });
  ast.program.body = [...prefix(), ...body, ...suffix()];
  let output = generate(ast, { /* options */ }, code);
  let instrumentedCode = output.code;

  let results = runCode(instrumentedCode);

  let final = insertResults(code, results);

  return final;
};

export default poof;
