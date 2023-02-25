import { expect } from 'chai';
import { discoverLinks } from '../../../src/discovery.js';
import { readFileSync } from 'node:fs';

describe('Link discovery based on examples in the JSON hyper schema spec', () => {
  const suites = JSON.parse(
    readFileSync('test/test-cases/spec-examples-discovery.json', 'utf8')
  );

  for (const suite of suites) {
    for (const test of suite.tests) {
      it(suite.title + ': ' + test.title, () => {
        const result = discoverLinks({
          schema: test.schema,
          instance: test.instanceData,
          instanceUri: test.instanceUri,
        });

        expect(result.discoveredLinks.length).to.equal(
          test.discoveredLinks.length
        );

        for (const [index, link] of Object.entries(result.discoveredLinks)) {
          expect(link).to.deep.equal(
            test.discoveredLinks[index],
            'linkIndex ' + index
          );
        }
      });
    }
  }
});
