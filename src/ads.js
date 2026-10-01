/** Rewarded gate. A native ad can replace this by setting window.__cryptoverseShowAd. */

const AD_SECONDS = 6;

export const APPLE_APP_ID = '';

export function storeUrl() {
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  if (ios && APPLE_APP_ID) {
    return `https://apps.apple.com/app/id${APPLE_APP_ID}?action=write-review`;
  }
  if (ios) return 'https://apps.apple.com/search?term=CryptoVerse';
  return 'https://play.google.com/store/apps/details?id=com.nadavturgeman.cryptoverse&showAllReviews=true';
}

export function openStore(url) {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.click();
  return true;
}

let adOpen = false;

export function showRewardedAd(copy) {
  if (adOpen) return Promise.resolve(false);
  if (typeof window.__cryptoverseShowAd === 'function') {
    return Promise.resolve(window.__cryptoverseShowAd()).then((ok) => Boolean(ok));
  }
  const overlay = document.getElementById('ad-overlay');
  const wait = document.getElementById('ad-wait');
  const claim = document.getElementById('ad-claim');
  const skip = document.getElementById('ad-skip');
  const title = document.getElementById('ad-title');
  if (!overlay || !claim || !skip) return Promise.resolve(false);
  adOpen = true;
  if (title) title.textContent = copy.title;
  claim.textContent = copy.claim;
  skip.textContent = copy.skip;
  overlay.classList.remove('hidden');
  overlay.inert = false;
  let left = AD_SECONDS;
  claim.disabled = true;
  if (wait) wait.textContent = copy.wait(left);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      window.clearInterval(timer);
      claim.removeEventListener('click', onClaim);
      skip.removeEventListener('click', onSkip);
      overlay.classList.add('hidden');
      overlay.inert = true;
      adOpen = false;
      resolve(ok);
    };
    const onClaim = () => finish(true);
    const onSkip = () => finish(false);
    claim.addEventListener('click', onClaim);
    skip.addEventListener('click', onSkip);
    const timer = window.setInterval(() => {
      left -= 1;
      if (wait) wait.textContent = copy.wait(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(timer);
        claim.disabled = false;
      }
    }, 1000);
  });
}
