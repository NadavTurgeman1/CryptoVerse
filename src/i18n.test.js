import assert from 'node:assert/strict';
import test from 'node:test';
import { translate } from './i18n.js';

test('hebrew falls back to english for a missing key and fills placeholders', () => {
  assert.equal(translate('he', 'play'), 'שחק');
  assert.equal(translate('he', 'bestLine', { score: 40, round: 3 }), 'שיא: 40 נק׳ · סיבוב 3');
  assert.equal(translate('he', 'not-a-key'), 'not-a-key');
  assert.equal(translate('zz', 'shop'), 'Shop');
});
