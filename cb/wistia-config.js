/**
 * Cookie Management Functions
 */
function setCookie(name, value, days) {
  var date = new Date();
  date.setTime(date.getTime() + (24 * days * 60 * 60 * 1000));
  var expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + "; " + expires + "; SameSite=Lax";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var cookies = document.cookie.split(";");
  
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) == " ") {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(nameEQ) == 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return "";
}

/**
 * Cookie name for tracking repeat visitors
 */
cookieName = typeof cookieName === "undefined" ? "repeatVisitorVSL" : cookieName;

/**
 * Popup Management Variables
 */
var openPop = false;
var popuptimer = false;

function closedpopup() {
  openPop = false;
}

/**
 * Popup with countdown timer
 */
function openedPopup() {
  if (openPop === true) return;
  
  openPop = true;
  
  if (popuptimer === false) {
    var time = "1:59"; // Countdown starts at 1 minute 59 seconds
    var interval = setInterval(function() {
      var parts = time.split(":");
      var minutes = parseInt(parts[0], 10);
      var seconds = parseInt(parts[1], 10);
      
      seconds--;
      if (seconds < 0) {
        minutes--;
        seconds = 59;
      }
      
      if (minutes < 0) {
        clearInterval(interval);
        popuptimer = false;
        return;
      }
      
      seconds = seconds < 10 ? "0" + seconds : seconds;
      $(".counter3").html(minutes + ":" + seconds);
      time = minutes + ":" + seconds;
    }, 1000);
    
    popuptimer = true;
  }
}

/**
 * Display the CTA/Buy Button
 */
var isCTADisplayed = false;

function displayLink() {
  // Show the offer section using Alpine.js
  const offerSection = document.getElementById('offer');
  if (offerSection && typeof Alpine !== 'undefined') {
    const alpineData = Alpine.$data(offerSection);
    if (alpineData) {
      alpineData.show = true;
    }
    // Also remove x-cloak class to ensure visibility
    offerSection.classList.remove('x-cloak');
  }
  
  // Legacy support for old BrainSong selector (if it exists)
  if (typeof $ !== 'undefined' && $(".buyButton").length) {
    $(".buyButton").removeClass("is-hidden");
    $("footer").removeClass("bottom-footer");
  }
  
  isCTADisplayed = true;
}

/**
 * Bounceback Popup Initialization
 * Only initializes if showPopup is true
 */
if (showPopup !== false) {
  Bounceback.init({
    aggressive: true,
    storeName: "bounceback-special",
    maxDisplay: 0,
    onBounce: function() {
      // Get the Wistia video instance
      video = window.Wistia.api();
      
      // Pause video if it's playing and not muted
      if (video.state() === "playing" && !video.isMuted()) {
        video.pause();
      }
      
      // Show the popup modal
      if (!$(".featherlight") || !$(".featherlight").length) {
        $.featherlight("#loadModal", {
          afterClose: closedpopup,
          otherClose: "a.closeit",
          afterOpen: openedPopup
        });
      }
    }
  });
}

/**
 * CTA Display Logic
 * Show CTA immediately if user has visited before,
 * otherwise show after delay (waitForSeconds)
 */
if (getCookie(cookieName) === "yes") {
  // Repeat visitor - show CTA immediately
  displayLink();
} else {
  // First-time visitor - show CTA after delay
  if (!delayedBtn) {
    timeForDelay = 1000; // Default 1 second if delayedBtn is false
  }
  
  setTimeout(function() {
    setCookie(cookieName, "yes", 1);
    displayLink();
  }, timeForDelay);
}
