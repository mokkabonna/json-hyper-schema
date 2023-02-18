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
  const tokens = pointer.parse(basePointer);
  const match =
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

  const prefix = parseInt(match.groups.number, 10);
  const relPointer = match.groups.rest;

  if (prefix > tokens.length || (prefix >= tokens.length && tokens[0] === '')) {
    throw new Error('Trying to reference value above root.');
  }

  const relativeTokens = tokens.slice(0, tokens.length - prefix);

  if (relPointer === '#') {
    if (relativeTokens[0] === '') {
      throw new Error('Tring to get key of root. It does not have a key.');
    }

    let propOrIndex = relativeTokens.pop();
    let newPointer = pointer.compile(relativeTokens);
    let parentValue = pointer.get(data, newPointer);
    if (Array.isArray(parentValue)) {
      return parseInt(propOrIndex, 10);
    } else {
      return propOrIndex;
    }
  } else {
    let newPointer = pointer.compile(relativeTokens);

    newPointer = newPointer + (relPointer || '');

    if (newPointer === '/') {
      return data;
    } else {
      return pointer.get(data, newPointer);
    }
  }
}

export { resolveRelativeJsonPointer };
