# Poof! 💥

Why leave your editor just to log a couple lines? Add a trailing `// =>` comment to any line you want to peak at, then run `poofjs` and see the results inline.

```javascript
5 * 7; // =>
```

Code in => POOF 💥 => Code + results out.

```javascript
5 * 7; // => 35
```

Designed for [TL;DR](https://www.youtube.com/channel/UCol-gOYBawJGqUn2AhwxhNg): a JavaScript screencast series for working web developers.

Inspired by `xmpfilter` and [RubyTapas](https://www.rubytapas.com/).

## Examples

```javascript
let res = 20 + 4; // => 24

let doThing = (val) => {
  return val * 4; // => 8
};

doThing(2);
// => 8

[1,2,3]; // => [ 1, 2, 3 ]
```

## Usage

`poofjs` takes your code as stdin and spits out the code with results as stdout.

```bash
$ echo "5 * 4; // =>" | poofjs
```

In vim, use the `cmd` command to feed it the current buffer:

```vimrc
:%! poofjs
```

## Inspiration

- `xmpfilter` for Ruby
- `arrow-logger` for JavaScript
- `pipe2eval` for anything
