/**
 * Page Loader - rd redirect + ClickBank parameter handler
 *
 * LOGIC:
 * - If rd=vdrd or rd=indexb is present: use aggressive page
 * - If rd is NOT present: load compliant -c page
 *
 * Your current folder setup:
 * /triggers.html
 * /triggers-c/index.html
 * /page-loader.js
 */

(function () {
  'use strict';

  // ===== rd PARAMETER UTILITIES =====

  const VALID_rd_VALUES = ['vdrd', 'indexb'];

  function isValidrdValue(value) {
    return value && VALID_rd_VALUES.includes(value);
  }

  function setrdValue(value) {
    if (!isValidrdValue(value)) return;

    try {
      localStorage.setItem('rd', value);
    } catch (e) {
      console.warn('Failed to set rd in localStorage:', e);
    }

    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
      document.cookie = `rd=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('Failed to set rd cookie:', e);
    }
  }

  function getrdParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlrd = urlParams.get('rd');

    if (isValidrdValue(urlrd)) {
      setrdValue(urlrd);
      return urlrd;
    }

    return null;
  }

  // ===== GENERAL PARAMETER HANDLING =====

  function setCookie(name, value, days = 30) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`;
  }

  function getParameter(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlValue = urlParams.get(paramName);

    if (urlValue) return urlValue;

    try {
      const storedValue = localStorage.getItem(paramName);
      if (storedValue) return storedValue;
    } catch (e) {}

    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === paramName) {
          return decodeURIComponent(value);
        }
      }
    } catch (e) {}

    return null;
  }

  // ===== STORE cbf PARAMETER =====

  const cbf = getParameter('cbf');

  if (cbf) {
    try {
      localStorage.setItem('cbf', cbf);
    } catch (e) {}

    setCookie('cbf', cbf);
  }

  // ===== PAGE REDIRECT LOGIC =====

  function getAggressiveContentPath() {
    const pathname = window.location.pathname;

    if (pathname.endsWith('/triggers-c/') || pathname.endsWith('/triggers-c/index.html')) {
      return pathname.replace(/\/triggers-c\/?(index\.html)?$/, '/triggers.html');
    }

    return null;
  }

  function getCompliantContentPath() {
    const pathname = window.location.pathname;

    if (pathname.endsWith('/triggers.html')) {
      return pathname.replace(/\/triggers\.html$/, '/triggers-c/index.html');
    }

    return null;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const redirectCount = parseInt(urlParams.get('_redirect') || '0', 10);

  if (redirectCount >= 3) {
    console.log('Redirect limit reached. Stopping.');
    return;
  }

  const rd = getrdParameter();

  if (rd === 'vdrd' || rd === 'indexb') {
    const aggressivePagePath = getAggressiveContentPath();

    if (aggressivePagePath) {
      urlParams.set('rd', rd);
      urlParams.set('_redirect', String(redirectCount + 1));

      const redirectUrl = aggressivePagePath + '?' + urlParams.toString();
      console.log('Redirecting to aggressive content:', redirectUrl);
      window.location.href = redirectUrl;
      return;
    }
  } else {
    const compliantPagePath = getCompliantContentPath();

    if (compliantPagePath) {
      urlParams.delete('rd');
      urlParams.set('_redirect', String(redirectCount + 1));

      const remainingParams = urlParams.toString();
      const redirectUrl = compliantPagePath + (remainingParams ? '?' + remainingParams : '');

      console.log('Redirecting to compliant content:', redirectUrl);
      window.location.href = redirectUrl;
      return;
    }
  }

  // ===== CLICKBANK LINK UPDATES =====

  function updateClickBankLinks() {
    const clickbankLinks = document.querySelectorAll(
      'a[href*="clickbank.net"], a[href*="clickbank.com"]'
    );

    clickbankLinks.forEach(function (link) {
      try {
        const url = new URL(link.href, window.location.href);
        let updated = false;

        if (cbf) {
          url.searchParams.set('cbfid', cbf);
          updated = true;
        }

        if (rd && isValidrdValue(rd)) {
          url.searchParams.set('rd', rd);
          updated = true;
        }

        if (updated) {
          link.href = url.toString();
        }
      } catch (e) {
        console.warn('Failed to parse ClickBank link:', link.href);
      }
    });
  }

  // ===== INTERNAL LINK PARAMETER PROPAGATION =====

  function propagateUrlParameters() {
    if (!rd || !isValidrdValue(rd)) return;

    urlParams.set('rd', rd);
    urlParams.delete('_redirect');

    const paramsString = urlParams.toString();
    if (!paramsString) return;

    document.querySelectorAll('a').forEach(function (link) {
      if (!link.href) return;

      try {
        const url = new URL(link.href, window.location.href);

        const isInternal = url.hostname === window.location.hostname;
        const isClickBank =
          url.hostname.includes('clickbank.net') ||
          url.hostname.includes('clickbank.com');

        if (isInternal && !isClickBank) {
          paramsString.split('&').forEach(function (pair) {
            const [key, value] = pair.split('=');
            if (key && value) {
              url.searchParams.set(decodeURIComponent(key), decodeURIComponent(value));
            }
          });

          link.href = url.toString();
        }
      } catch (e) {}
    });
  }

  // ===== INIT =====

  function init() {
    updateClickBankLinks();
    propagateUrlParameters();

    setTimeout(updateClickBankLinks, 100);
    setTimeout(updateClickBankLinks, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();