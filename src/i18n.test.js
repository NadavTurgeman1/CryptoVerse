import assert from 'node:assert/strict';
import test from 'node:test';
import { STRINGS, UI_LANGS, languageOffer, translate } from './i18n.js';

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
  assert.equal(languageOffer(['ar-SA', 'en'], null), 'ar');
  assert.equal(languageOffer(['fr', 'de'], null), 'fr');
  assert.equal(languageOffer(['he'], 'en'), null);
  assert.equal(languageOffer(['de'], 'fr'), null);
  assert.equal(translate('fr', 'play'), 'Jouer');
  assert.equal(translate('es', 'shop'), 'Tienda');
  assert.equal(translate('de', 'back'), 'Zurück');
  assert.equal(translate('ar', 'play'), 'العب');
  assert.equal(translate('ar', 'shop'), 'المتجر');
});

test('pause and how-to lines exist in every language', () => {
  for (const lang of UI_LANGS) {
    for (const key of ['howTo', 'paused', 'resume', 'pauseBtn', 'tutorial', 'gotIt', 'tutorialMove', 'tutorialCoins', 'tutorialMissile', 'tutorialShield', 'sfx']) {
      const value = STRINGS[lang][key];
      assert.equal(typeof value, 'string', `${lang}.${key}`);
      assert.equal(value.length > 0, true, `${lang}.${key}`);
      assert.equal(translate(lang, key), value);
    }
  }
});

test('every shop item has its own name in every language', () => {
  const keys = [
    'rose', 'cyan', 'violet', 'matrix', 'gold', 'ember', 'lime', 'ice', 'magenta', 'royal',
    'amber', 'mint', 'pearl', 'crimson', 'sunset', 'void', 'peach', 'ocean', 'toxic', 'prism',
    'none', 'cap', 'beanie', 'tophat', 'crown', 'santa', 'dogears', 'catears', 'bunny', 'pirate',
    'astro', 'party', 'cowboy', 'wizard', 'beret', 'halo', 'viking', 'chef', 'flower', 'horns',
    'propeller', 'sombrero', 'headphones', 'banana', 'bag', 'imperial', 'rounds', 'shades', 'visor',
    'shadeRed', 'shadeBlue', 'shadeGold', 'shadeGreen', 'shadePink', 'shadeViolet', 'shadeWhite',
    'shadeAmber', 'patch', 'monocle', 'stereo', 'hearts', 'stars', 'goggles', 'aviator', 'nerd', 'mustache',
  ];
  for (const lang of UI_LANGS) {
    for (const key of keys) {
      const name = STRINGS[lang][key];
      assert.equal(typeof name, 'string', `${lang}.${key}`);
      assert.equal(name.length > 0, true, `${lang}.${key}`);
      assert.equal(translate(lang, key), name);
    }
  }
  assert.equal(translate('fr', 'dogears'), 'Oreilles de chien');
  assert.equal(translate('es', 'bag'), 'Bolsa de papel');
  assert.equal(translate('de', 'viking'), 'Wikinger');
  assert.equal(translate('ar', 'astro'), 'رائد فضاء');
  assert.equal(translate('he', 'prism'), 'מתחלף');
});
