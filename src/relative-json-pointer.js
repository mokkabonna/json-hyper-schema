import pointer from 'json-pointer';

function resolveRelativeJsonPointer(data, base, relative) {
  var tokens = pointer.parse(base);
  var parts = /^([\d]+)(.+)?/.exec(relative);
  var prefix = parseInt(parts[1], 10);
  var relPointer = parts[2];

  if (prefix > tokens.length || (prefix >= tokens.length && tokens[0] === '')) {
    throw new Error('Trying to reference value above root.');
  }

  tokens = tokens.slice(0, tokens.length - prefix);

  if (relPointer === '#') {
    if (tokens[0] === '') {
      throw new Error('Tring to get key of root. It does not have a key.');
    }

    let propOrIndex = tokens.pop();
    let newPointer = pointer.compile(tokens);
    let parentValue = pointer.get(data, newPointer);
    if (Array.isArray(parentValue)) {
      return parseInt(propOrIndex, 10);
    } else {
      return propOrIndex;
    }
  } else {
    let newPointer = pointer.compile(tokens);

    newPointer = newPointer + (relPointer || '');

    if (newPointer === '/') {
      return data;
    } else {
      return pointer.get(data, newPointer);
    }
  }
}

export { resolveRelativeJsonPointer };
