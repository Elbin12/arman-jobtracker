/**
 * GoHighLevel custom JS — contact profile button (multi-app routing).
 *
 * Paste into GHL: Settings → Company → Custom JS/CSS (or subaccount custom code).
 *
 * Debug: localStorage.setItem('sp_contact_profile_debug', '1')
 */
(function () {
  'use strict';

  var LOCATION_APP_ROUTES = {
    b8qvo7VooP3JD3dIZU42: 'https://services.theservicepilot.com',
  };

  var SNAPSHOT_APP_BASE_URL = 'https://snapshot.theservicepilot.com';

  var ONBOARD_CACHE_PREFIX = 'sp_location_onboarded_v3_';
  var ONBOARD_CACHE_TTL_MS = 5 * 60 * 1000;
  var BUTTON_ID = 'sp-contact-profile-button';
  var POPUP_ID = 'sp-contact-profile-popup';
  var onboardCheckToken = 0;
  var lastHref = '';

  function debugLog() {
    try {
      if (localStorage.getItem('sp_contact_profile_debug') === '1') {
        console.log.apply(console, ['[ServicePilot]'].concat(Array.prototype.slice.call(arguments)));
      }
    } catch (error) {
      // ignore
    }
  }

  function getAppBaseUrlForLocation(locationId) {
    return LOCATION_APP_ROUTES[locationId] || SNAPSHOT_APP_BASE_URL;
  }

  function isPinnedLocation(locationId) {
    return Object.prototype.hasOwnProperty.call(LOCATION_APP_ROUTES, locationId);
  }

  function findTargetContainer() {
    var selectors = [
      '[class*="right-sidebar-container"] nav div[class*="flex-col"][class*="items-center"]',
      '[class*="right-sidebar-container"] nav',
      '[class*="right-sidebar-container"] div[class*="flex-col"][class*="items-center"]',
      '#record-details-new-ui [class*="right-sidebar"] div[class*="flex-col"][class*="items-center"]',
      '#record-details-new-ui [class*="right-sidebar"]',
    ];

    for (var i = 0; i < selectors.length; i++) {
      var match = document.querySelector(selectors[i]);
      if (match) {
        debugLog('findTargetContainer matched:', selectors[i]);
        return match;
      }
    }

    var candidates = document.querySelectorAll('div[class*="flex-col"][class*="items-center"]');
    for (var j = 0; j < candidates.length; j++) {
      var el = candidates[j];
      var rect = el.getBoundingClientRect();
      if (rect.width >= 28 && rect.width <= 80 && rect.height >= 60 && rect.right >= window.innerWidth - 160) {
        debugLog('findTargetContainer fallback rail');
        return el;
      }
    }

    debugLog('findTargetContainer: no target found');
    return null;
  }

  function readOnboardCache(locationId, appBaseUrl) {
    if (isPinnedLocation(locationId)) return null;
    try {
      var raw = sessionStorage.getItem(ONBOARD_CACHE_PREFIX + locationId);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || Date.now() - parsed.at > ONBOARD_CACHE_TTL_MS) return null;
      if (parsed.appBaseUrl && parsed.appBaseUrl !== appBaseUrl) return null;
      return !!parsed.onboarded;
    } catch (error) {
      return null;
    }
  }

  function writeOnboardCache(locationId, appBaseUrl, onboarded) {
    if (isPinnedLocation(locationId)) return;
    try {
      sessionStorage.setItem(
        ONBOARD_CACHE_PREFIX + locationId,
        JSON.stringify({
          onboarded: !!onboarded,
          appBaseUrl: appBaseUrl,
          at: Date.now(),
        })
      );
    } catch (error) {
      // ignore
    }
  }

  function isLocationOnboarded(locationId, callback) {
    if (!locationId) {
      callback(false, null);
      return;
    }

    var appBaseUrl = getAppBaseUrlForLocation(locationId);

    // Dedicated apps: always show — no API gate (avoids stale cache / CORS flakes).
    if (isPinnedLocation(locationId)) {
      debugLog('pinned location, skip onboard check', locationId);
      callback(true, appBaseUrl);
      return;
    }

    var cached = readOnboardCache(locationId, appBaseUrl);
    if (cached !== null) {
      debugLog('onboard cache hit', locationId, cached);
      callback(cached, appBaseUrl);
      return;
    }

    var url =
      appBaseUrl +
      '/api/quote/account-info/?location_id=' +
      encodeURIComponent(locationId);

    fetch(url, { method: 'GET', credentials: 'omit', mode: 'cors' })
      .then(function (response) {
        var onboarded = response.ok;
        debugLog('onboard fetch', url, response.status, onboarded);
        writeOnboardCache(locationId, appBaseUrl, onboarded);
        callback(onboarded, appBaseUrl);
      })
      .catch(function (error) {
        debugLog('onboard fetch failed', url, error);
        writeOnboardCache(locationId, appBaseUrl, false);
        callback(false, appBaseUrl);
      });
  }

  function removeCustomButton() {
    var existing = document.getElementById(BUTTON_ID);
    if (existing) existing.remove();
  }

  function extractLocationId() {
    var match = window.location.pathname.match(/\/location\/([^/]+)\//);
    return match ? match[1] : null;
  }

  function extractContactId() {
    var match = window.location.href.match(/\/contacts\/details?\/([a-zA-Z0-9_-]+)/i);
    return match ? match[1] : null;
  }

  function isContactDetailPage() {
    return /\/contacts\/details?\//i.test(window.location.pathname) && !!extractLocationId();
  }

  function isElementVisible(element) {
    if (!element) return false;
    var rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    var style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function isButtonInDom() {
    var btn = document.getElementById(BUTTON_ID);
    return !!(btn && document.body.contains(btn));
  }

  function closePopup() {
    var popup = document.getElementById(POPUP_ID);
    if (popup) popup.remove();
  }

  function buildProfileUrl(appBaseUrl, contactId, locationId) {
    return (
      appBaseUrl +
      '/contact/jobs/' +
      encodeURIComponent(contactId) +
      '?location_id=' +
      encodeURIComponent(locationId)
    );
  }

  function showPopup(appBaseUrl) {
    var contactId = extractContactId();
    var locationId = extractLocationId();

    if (!contactId || !locationId) {
      console.error('[ServicePilot] Missing contactId or locationId');
      return;
    }

    var resolvedAppBaseUrl = appBaseUrl || getAppBaseUrlForLocation(locationId);
    var popupUrl = buildProfileUrl(resolvedAppBaseUrl, contactId, locationId);
    closePopup();

    var overlay = document.createElement('div');
    overlay.id = POPUP_ID;
    overlay.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.55);display:flex;align-items:center;justify-content:center;z-index:2147483646;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

    var popup = document.createElement('div');
    popup.style.cssText =
      'position:relative;width:94%;max-width:1100px;height:92vh;background:#fff;border-radius:16px;box-shadow:0 24px 64px rgba(15,23,42,0.28);display:flex;flex-direction:column;overflow:hidden;';

    var header = document.createElement('div');
    header.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid #e5e7eb;background:linear-gradient(90deg,#eff6ff,#f5f3ff);';

    var title = document.createElement('h2');
    title.textContent = 'Client profile';
    title.style.cssText = 'margin:0;font-size:18px;font-weight:700;color:#111827;';

    var closeBtn = document.createElement('button');
    closeBtn.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.style.cssText =
      'background:#fff;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;color:#6b7280;padding:8px;display:flex;align-items:center;justify-content:center;';
    closeBtn.addEventListener('click', closePopup);

    header.appendChild(title);
    header.appendChild(closeBtn);
    popup.appendChild(header);

    var iframeContainer = document.createElement('div');
    iframeContainer.style.cssText = 'flex:1;overflow:hidden;background:#f8fafc;';

    var iframe = document.createElement('iframe');
    iframe.src = popupUrl;
    iframe.title = 'ServicePilot client profile';
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    iframe.setAttribute('allow', 'geolocation');

    iframeContainer.appendChild(iframe);
    popup.appendChild(iframeContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closePopup();
    });

    document.addEventListener('keydown', function handleEscape(event) {
      if (event.key === 'Escape') {
        closePopup();
        document.removeEventListener('keydown', handleEscape);
      }
    });
  }

  function createButton(appBaseUrl, useFloating) {
    var button = document.createElement('button');
    button.id = BUTTON_ID;
    button.setAttribute('title', 'Open client profile');
    button.setAttribute('type', 'button');
    button.dataset.appBaseUrl = appBaseUrl;
    button.innerHTML =
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';

    if (useFloating) {
      button.style.cssText =
        'position:fixed;bottom:80px;right:20px;z-index:2147483645;width:48px;height:48px;border-radius:12px;border:none;background:#2563eb;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(37,99,235,0.45);padding:0;';
    } else {
      button.style.cssText =
        'width:40px;height:40px;border-radius:10px;border:2px solid transparent;background:transparent;color:#374151;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;padding:0;margin-top:4px;';
      button.onmouseover = function () {
        button.style.borderColor = '#dbeafe';
        button.style.color = '#2563eb';
        button.style.backgroundColor = '#fff';
      };
      button.onmouseout = function () {
        button.style.borderColor = 'transparent';
        button.style.color = '#374151';
        button.style.backgroundColor = 'transparent';
      };
    }

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      showPopup(button.dataset.appBaseUrl || appBaseUrl);
    });
    return button;
  }

  function addCustomButton(appBaseUrl) {
    if (isButtonInDom()) return;

    var targetElement = findTargetContainer();
    if (targetElement && isElementVisible(targetElement)) {
      targetElement.appendChild(createButton(appBaseUrl, false));
      debugLog('button added to sidebar rail');
      return;
    }

    document.body.appendChild(createButton(appBaseUrl, true));
    debugLog('button added as floating fallback');
  }

  function checkAndAddButton() {
    if (!isContactDetailPage()) {
      removeCustomButton();
      return;
    }

    var locationId = extractLocationId();
    if (!locationId) {
      removeCustomButton();
      return;
    }

    var checkId = ++onboardCheckToken;
    isLocationOnboarded(locationId, function (onboarded, appBaseUrl) {
      if (checkId !== onboardCheckToken) return;

      if (!onboarded) {
        debugLog('location not onboarded', locationId);
        removeCustomButton();
        return;
      }

      addCustomButton(appBaseUrl);
    });
  }

  function scheduleRetries() {
    [100, 250, 500, 1000, 2000, 4000, 8000].forEach(function (delay) {
      setTimeout(checkAndAddButton, delay);
    });
  }

  function watchSpaNavigation() {
    lastHref = window.location.href;
    setInterval(function () {
      if (window.location.href !== lastHref) {
        lastHref = window.location.href;
        debugLog('route changed', lastHref);
        checkAndAddButton();
        scheduleRetries();
      }
    }, 300);
  }

  function setupObserver() {
    checkAndAddButton();
    scheduleRetries();
    watchSpaNavigation();

    var observer = new MutationObserver(function () {
      clearTimeout(observer._t);
      observer._t = setTimeout(function () {
        if (!isContactDetailPage()) {
          removeCustomButton();
          return;
        }
        if (!isButtonInDom()) {
          checkAndAddButton();
        }
      }, 100);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
    console.log('[ServicePilot] Contact profile button loaded (v3)');
  }

  document.addEventListener('click', function () {
    if (isContactDetailPage()) {
      setTimeout(checkAndAddButton, 50);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }
})();
