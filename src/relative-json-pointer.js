import pointer from 'json-pointer';

/**
 * Resolves a relative json pointer to a value in the provided data. Needs a base pointer to resolve from.
 *
 * @param {*} data the json data
 * @param {*} basePointer the starting point for the relative pointer
 * @param {*} relative the relative pointer
 * @returns the value located at the relative pointer location
 */
function resolveRelativeJsonPointer(data, basePointer, relative) {
  var tokens = pointer.parse(basePointer);
  var match =
    /^(?<number>(?<zero>[0])?(?<nonzero>[1-9]([0-9]+)?)?)(?<rest>.+)?/.exec(
      relative
    );

  if (
    !match ||
    (match.groups.zero && match.groups.nonzero) || // cant have both 0 and non zero
    !match.groups.number // must have a number
  ) {
    throw new Error(
      'Invalid relative pointer. Must start with either 0 or a number >= 1 with non leading zeros.'
    );
  }

  var prefix = parseInt(match.groups.number, 10);
  var relPointer = match.groups.rest;

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
