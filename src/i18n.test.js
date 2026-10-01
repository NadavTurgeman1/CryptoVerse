import assert from 'node:assert/strict';
import test from 'node:test';
import { languageOffer, translate } from './i18n.js';

test('hebrew falls back to english for a missing key and fills placeholders', () => {
  assert.equal(translate('he', 'play'), 'שחק');
  assert.equal(translate('he', 'bestLine', { score: 40, round: 3 }), 'שיא: 40 נק׳ · סיבוב 3');
  assert.equal(translate('he', 'not-a-key'), 'not-a-key');
  assert.equal(translate('zz', 'shop'), 'Shop');
});

test('language stays English unless the browser prefers a language we ship', () => {
  assert.equal(languageOffer(['en-US', 'he'], null), null);
  assert.equal(languageOffer(['he-IL', 'en'], null), 'he');
  assert.equal(languageOffer(['fr-FR', 'he'], null), 'fr');
  assert.equal(languageOffer(['es', 'en'], null), 'es');
  assert.equal(languageOffer(['de-DE'], null), 'de');
  assert.equal(languageOffer(['fr', 'de'], null), 'fr');
  assert.equal(languageOffer(['he'], 'en'), null);
  assert.equal(languageOffer(['de'], 'fr'), null);
  assert.equal(translate('fr', 'play'), 'Jouer');
  assert.equal(translate('es', 'shop'), 'Tienda');
  assert.equal(translate('de', 'back'), 'Zurück');
});
