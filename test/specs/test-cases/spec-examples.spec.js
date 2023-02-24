import { expect } from 'chai';
import { resolver } from '../../../src/resolver.js';
import { readFileSync } from 'node:fs';

describe.only('examples in the json hyper schema spec', () => {
  const suites = JSON.parse(
    readFileSync('test/test-cases/spec-examples.json', 'utf8')
  );

  for (const suite of suites) {
    for (const test of suite.tests) {
      it(suite.description + ': ' + test.description, () => {
        const result = resolver({
          schema: test.schema,
          instance: test.instanceData,
          instanceUri: test.instanceUri,
        });

        expect(result.resolvedLinks.length).to.equal(test.resolvedLinks.length);

        for (const [index, link] of Object.entries(result.resolvedLinks)) {
          expect(link).to.deep.equal(test.resolvedLinks[index]);
        }
      });
    }
  }
});
