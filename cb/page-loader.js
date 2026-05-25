/**
 * Page Loader - Complete ClickBank parameter and redirect handler
 * Automatically runs when script loads - no function calls needed
 * 
 * BIDIRECTIONAL LOGIC:
 * - If on a -c page (compliant) and rd=vdrd or rd=indexb is present: redirects to non-c page (aggressive content)
 * - If on a non-c page and rd is NOT vdrd or indexb: redirects to -c page (compliant content)
 * - Otherwise: stays on current page
 * 
 * PARAMETER HANDLING:
 * - rd parameter: Stores in localStorage and cookie, handles redirects, adds to ClickBank links
 * - cbf parameter: Stores in localStorage and cookie, updates cbfid in ClickBank checkout links
 * 
 * CLICKBANK LINK UPDATES:
 * - Automatically adds rd parameter to all ClickBank checkout links
 * - Updates cbfid in checkout links if cbf parameter is present
 * - Handles dynamically loaded links
 */

(function () {
  'use strict';

  // ===== rd PARAMETER UTILITIES =====
  const VALID_rd_VALUES = ['vdrd', 'indexb'];

  function isValidrdValue(value) {
    return value && VALID_rd_VALUES.includes(value);
  }

  function setrdValue(value) {
    if (!isValidrdValue(value)) {
      return;
    }

    // Store in localStorage
    try {
      localStorage.setItem('rd', value);
    } catch (e) {
      // localStorage might be disabled or full
      console.warn('Failed to set rd in localStorage:', e);
    }

    // Store in cookie
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
      document.cookie = `rd=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn('Failed to set rd cookie:', e);
    }
  }

  function getrdParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Priority 1: Check URL parameters
    const urlrd = urlParams.get('rd');
    if (isValidrdValue(urlrd)) {
      return urlrd;
    }

    // Priority 2: Check localStorage
    try {
      const storedrd = localStorage.getItem('rd');
      if (isValidrdValue(storedrd)) {
        return storedrd;
      }
    } catch (e) {
      // localStorage might be disabled
    }

    // Priority 3: Check cookies
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'rd') {
          const rdValue = decodeURIComponent(value);
          if (isValidrdValue(rdValue)) {
            return rdValue;
          }
        }
      }
    } catch (e) {
      // Cookie parsing might fail
    }

    return null;
  }

  function getAndStorerdParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlrd = urlParams.get('rd');

    // If rd is in URL and valid, store it
    if (isValidrdValue(urlrd)) {
      setrdValue(urlrd);
      return urlrd;
    }

    // Otherwise, try to get from storage
    const storedrd = getrdParameter();
    return storedrd;
  }

  // ===== CBF PARAMETER HANDLING =====
  
  function setCookie(name, value, days = 30) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
  }

  function getParameter(paramName) {
    // First, check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlValue = urlParams.get(paramName);
    if (urlValue) {
      return urlValue;
    }
    
    // Second, check localStorage
    try {
      const storedValue = localStorage.getItem(paramName);
      if (storedValue) {
        return storedValue;
      }
    } catch (e) {
      // localStorage might be disabled
    }
    
    // Third, check cookies
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === paramName) {
          return decodeURIComponent(value);
        }
      }
    } catch (e) {
      // Cookie parsing might fail
    }
    
    return null;
  }

  // Get and store cbf parameter
  const cbf = getParameter('cbf');
  if (cbf) {
    try {
      localStorage.setItem('cbf', cbf);
    } catch (e) {
      // localStorage might be disabled or full
    }
    setCookie('cbf', cbf);
  }

  // ===== PAGE LOADER LOGIC =====

  function getAggressiveContentPath() {
    const pathname = window.location.pathname;
    const cbMatch = pathname.match(/^\/cb(?:\/([^\/]+))?\/?(?:index\.html)?$/);
    if (cbMatch) {
      const subdir = cbMatch[1];
      // If on /cb/c/, redirect to /cb/
      if (subdir === 'c') return `/cb/index.html`;
      // If on a -c subdirectory, redirect to non-c version
      if (subdir && subdir.endsWith('-c')) {
        const baseName = subdir.slice(0, -2); // Remove '-c' suffix
        return `/cb/${baseName}/index.html`;
      }
    }
    return null;
  }

  function getCompliantContentPath() {
    const pathname = window.location.pathname;
    const cbMatch = pathname.match(/^\/cb(?:\/([^\/]+))?\/?(?:index\.html)?$/);
    if (cbMatch) {
      const subdir = cbMatch[1];
      // If on /cb/ or /cb/index.html, redirect to /cb/c/
      if (!subdir || subdir === 'index.html') return `/cb/c/index.html`;
      // If on a non-c subdirectory (us1, us2, ds1, etc.), redirect to -c version
      if (subdir && !subdir.endsWith('-c') && subdir !== 'c') {
        return `/cb/${subdir}-c/index.html`;
      }
    }
    return null;
  }

  // Prevent infinite redirects by checking for redirect counter
  const urlParams = new URLSearchParams(window.location.search);
  const redirectCount = parseInt(urlParams.get('_redirect') || '0');
  if (redirectCount >= 3) {
    console.log('Redirect limit reached, stopping to prevent infinite loop');
    return;
  }

  // Get rd parameter (handles URL -> storage -> cookies priority)
  // This also automatically stores rd if found in URL
  let rd = getAndStorerdParameter();

  // If rd was found from storage but not in URL, add it to urlParams for redirects
  if (rd && !urlParams.has('rd')) {
    urlParams.set('rd', rd);
  }

  // Bidirectional redirect logic
  if (rd === "vdrd" || rd === "indexb") {
    // If rd is vdrd or indexb, redirect to aggressive content if on compliant page
    const aggressivePagePath = getAggressiveContentPath();
    if (aggressivePagePath) {
      // Ensure rd is in urlParams for redirect
      urlParams.set('rd', rd);
      urlParams.set('_redirect', (redirectCount + 1).toString());
      const redirectUrl = aggressivePagePath + "?" + urlParams.toString();
      console.log(`Redirecting to aggressive content: ${redirectUrl}`);
      window.location.href = redirectUrl;
    }
  } else {
    // If rd is NOT vdrd or indexb, redirect to compliant content if on aggressive page
    const compliantPagePath = getCompliantContentPath();
    if (compliantPagePath) {
      urlParams.delete("rd");
      urlParams.set('_redirect', (redirectCount + 1).toString());
      const remainingParams = urlParams.toString();
      const redirectUrl = compliantPagePath + (remainingParams ? "?" + remainingParams : "");
      console.log(`Redirecting to compliant content: ${redirectUrl}`);
      window.location.href = redirectUrl;
    }
  }

  // ===== CLICKBANK LINK UPDATES =====
  
  // Update parameters in all ClickBank checkout links
  function updateClickBankLinks() {
    const clickbankLinks = document.querySelectorAll('a[href*="clickbank.net"]');
    
    clickbankLinks.forEach(link => {
      try {
        const url = new URL(link.href, window.location.href);
        let updated = false;
        
        // Update cbfid with the cbf value if cbf exists
        if (cbf) {
          url.searchParams.set('cbfid', cbf);
          updated = true;
        }
        
        // Append rd parameter if it exists and isn't already present
        if (rd && isValidrdValue(rd) && !url.searchParams.has('rd')) {
          url.searchParams.set('rd', rd);
          updated = true;
        }
        
        // Update the link's href if we made changes
        if (updated) {
          link.href = url.toString();
        }
      } catch (e) {
        // If URL parsing fails, skip this link
        console.warn('Failed to parse ClickBank link URL:', link.href);
      }
    });
  }

  // ===== URL PARAMETER PROPAGATION TO INTERNAL LINKS =====
  
  // Automatically appends rd=vdrd (and other parameters) to internal links
  // This ensures rd=vdrd persists when users click through upsells/downsells
  function propagateUrlParameters() {
    // Only propagate if rd is valid (vdrd or indexb)
    if (rd && isValidrdValue(rd)) {
      // Ensure rd is in urlParams for propagation
      urlParams.set('rd', rd);
      const paramsString = urlParams.toString();
      if (paramsString) {
        document.querySelectorAll("a").forEach(function (link) {
          if (link.href) {
            // Skip external links and ClickBank/checkout links (handled separately)
            const url = new URL(link.href, window.location.href);
            if (url.hostname === window.location.hostname && 
                !link.href.includes('clickbank.net') && 
                !link.href.includes('clickbank.com')) {
              if (link.href.includes("?")) {
                link.href += "&" + paramsString;
              } else {
                link.href += "?" + paramsString;
              }
            }
          }
        });
      }
    }
  }

  // Initialize everything when DOM is ready
  function init() {
    // Update ClickBank links
    updateClickBankLinks();
    
    // Propagate parameters to internal links
    propagateUrlParameters();
    
    // Also update ClickBank links after a short delay to catch dynamically loaded links
    setTimeout(updateClickBankLinks, 100);
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
