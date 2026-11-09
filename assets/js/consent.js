// +++===+++ 2026-10-13 Asia/Baku — Hasan Alizada — Google Analytics 4 (property "Hasan Alizada - GA4", stream 4837744098);
// page views only, no custom events. Loaded ONLY after the visitor accepts cookies (banner below, choice in localStorage "ga-consent");
// nothing is sent to Google before consent. "Cookie settings" link in the footer lets the visitor change the choice.
// +++===+++ 2026-11-09 Asia/Baku — Hasan Alizada — Moved from inline in index.html so every page shares one consent logic.
// Google's tag checker reports "tag not detected" for this setup, which is expected; do not paste its snippet into the pages.
(function () {
    var GA_ID = 'G-G542QZ48CY';
    var KEY = 'ga-consent';
    var getChoice = function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
    var setChoice = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };

    var loadGa = function () {
        if (window.__gaLoaded) return;
        window.__gaLoaded = true;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { dataLayer.push(arguments); };
        gtag('js', new Date());
        gtag('config', GA_ID);
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);
        console.debug('[Consent] GA4 loaded');
    };

    var showBanner = function () {
        if (document.getElementById('cookie-banner')) return;
        var b = document.createElement('div');
        b.id = 'cookie-banner';
        b.className = 'cookie-banner';
        b.setAttribute('role', 'dialog');
        b.setAttribute('aria-label', 'Cookie consent');
        b.innerHTML = '<p class="cookie-banner__text">This site uses Google Analytics cookies to count visits. Nothing is collected unless you accept.</p>' +
            '<div class="cookie-banner__actions">' +
            '<button type="button" class="cookie-banner__btn" data-choice="denied">Decline</button>' +
            '<button type="button" class="cookie-banner__btn cookie-banner__btn--primary" data-choice="granted">Accept</button>' +
            '</div>';
        b.addEventListener('click', function (e) {
            var choice = e.target.getAttribute && e.target.getAttribute('data-choice');
            if (!choice) return;
            setChoice(choice);
            console.debug('[Consent] choice =', choice);
            b.remove();
            if (choice === 'granted') {
                loadGa();
            } else if (window.__gaLoaded) {
                location.reload(); // withdraw: reload so GA4 is no longer running on this page
            }
        });
        document.body.appendChild(b);
    };

    window.openCookieSettings = showBanner;
    var choice = getChoice();
    console.debug('[Consent] stored choice =', choice);
    if (choice === 'granted') {
        loadGa();
    } else if (choice !== 'denied') {
        document.addEventListener('DOMContentLoaded', showBanner);
    }
})();
