/**
 * Wistia Video Player Configuration & Controls
 * Manages video display, fullscreen behavior, and CTA timing
 */

/**
 * Cookie name for tracking repeat visitors
 */
cookieName = typeof cookieName === "undefined" ? "repeatVisitorVSL" : cookieName;

/**
 * Preload images for faster display
 */
function preload(imageArray) {
  $(imageArray).each(function() {
    $("<img />")
      .attr("src", this)
      .appendTo("body")
      .css("display", "none")
      .attr("loading", "lazy");
  });
}

/**
 * Resize video container based on viewport and video type
 * @param {number} topOffset - Top offset adjustment
 * @param {number} bottomOffset - Bottom offset adjustment
 */
function resizeVideo(topOffset, bottomOffset) {
  var aspectRatio, headlineHeight, topBlockHeight;
  
  // Set aspect ratio based on video type
  if (video_type === "desktop") {
    aspectRatio = 16 / 9; // Desktop: 16:9
  } else {
    aspectRatio = 10 / 16; // Mobile: 10:16 (portrait)
  }
  
  // Calculate headline height
  headlineHeight = $(".headline-box").length && $(".headline-box").css("display") !== "none" 
    ? $(".headline-box").height() 
    : 0;
  
  // Calculate top block height (ClickBank block)
  topBlockHeight = $(".topCBblock").length && $(".cbh").css("display") !== "none" 
    ? 26 
    : 0;
  
  // Calculate available height
  var availableHeight = window.innerHeight - headlineHeight - topBlockHeight - topOffset - bottomOffset;
  var calculatedWidth = Math.round((availableHeight / aspectRatio.height) * aspectRatio.width);
  
  // Apply calculated dimensions
  $(".vid-type").attr("style", 
    "max-height: " + availableHeight + "px !important; max-width: " + calculatedWidth + "px !important"
  );
}

/**
 * Enter fullscreen mode (big video)
 * Hides header, expands video to fill viewport
 */
function bigVideo() {
  // Hide header elements
  $(".cbh").hide();
  $(".cbtb").hide();
  $(".headline-box").hide();
  
  // Apply fullscreen classes
  $(".video-lights").addClass("black-background-vid");
  $(".change-container").addClass("container-full");
  $(".video-container").removeClass("is-max-widescreen");
  $(".vb").removeClass("video-border");
  
  // Set video to full viewport height
  $(".vid-padding").attr("style", "height: " + window.innerHeight + "px !important");
  
  // Resize video
  resizeVideo(0, 0);
  
  // Scroll to video section
  $("html, body").animate({
    scrollTop: $(".video-section").offset().top
  }, 250, function() {});
  
  // Add overflow class to body
  $("body").addClass("ovrfl");
}

/**
 * Exit fullscreen mode (small video)
 * Restores header, returns video to normal size
 */
function smallVideo() {
  // Show header elements
  $(".cbh").show();
  $(".cbtb").show();
  $(".headline-box").show();
  
  // Remove fullscreen classes
  $(".video-lights").removeClass("black-background-vid");
  $(".change-container").removeClass("container-full");
  $(".video-container").addClass("is-max-widescreen");
  $(".vb").addClass("video-border");
  
  // Reset video height
  $(".vid-padding").attr("style", "height: auto !important;");
  
  // Resize video
  resizeVideo(50, -3);
  
  // Remove overflow class from body
  $("body").removeClass("ovrfl");
}

/**
 * Initialize Wistia Video Player
 */
window._wq = window._wq || [];
_wq.push({
  id: video_id, // video_id is set globally in the HTML
  
  options: {
    fullscreenOnRotateToLandscape: false,
    copyLinkAndThumbnailEnabled: false,
    playsinline: true,
    resumable: false,
    seo: false,
    volume: 1,
    wmode: "transparent",
    playbar: ld_video_controls,
    smallPlayButton: ld_video_controls,
    volumeControl: ld_video_controls,
    fullscreenButton: ld_video_controls,
    playSuspendedOffScreen: true
  },
  
  onReady: function(video) {
    // Initial video resize
    resizeVideo(50, -3);
    
    // Hide loading animation
    $(".loading-video-inner").hide();
    
    // Track if video has been played
    var hasPlayed = false;
    var currentTime = 0;
    
    /**
     * Play Event Handler
     */
    video.bind("play", function() {
      if (video.isMuted()) {
        // Show unmute button if video is muted
        $(".button-unmute").show();
      } else {
        // Hide unmute button
        $(".button-unmute").hide();
        hasPlayed = true;
        
        // Enter fullscreen if enabled
        if (fullscreen_video) {
          bigVideo();
        }
      }
      
      // Hide continue/play button
      $(".button-continue").hide();
    });
    
    /**
     * Unmute Button Click Handler
     */
    $(".button-unmute").click(function() {
      if (hasPlayed === false) {
        hasPlayed = true;
        
        // Reset video if user watched more than 2 seconds
        if (currentTime > 2) {
          video.time(0);
        }
      }
      
      video.unmute();
      $(".button-unmute").hide();
      
      // Enter fullscreen if enabled
      if (fullscreen_video) {
        bigVideo();
      }
    });
    
    /**
     * Continue/Play Button Click Handler
     */
    $(".button-continue").click(function() {
      if (hasPlayed === false) {
        hasPlayed = true;
        
        // Reset video if user watched more than 2 seconds
        if (currentTime > 2) {
          video.time(0);
        }
      }
      
      video.play();
      $(".button-continue").hide();
    });
    
    /**
     * Pause Event Handler
     */
    video.bind("pause", function() {
      video.unmute();
      $(".button-unmute").hide();
      
      // Exit fullscreen if enabled
      if (fullscreen_video) {
        smallVideo();
      }
      
      // Show continue/play button overlay
      $(".button-continue").show();
    });
    
    /**
     * End Event Handler
     */
    video.bind("end", function() {
      video.unmute();
      $(".button-unmute").hide();
      
      // Exit fullscreen if enabled
      if (fullscreen_video) {
        smallVideo();
      }
      
      // Show continue/play button overlay
      $(".button-continue").show();
    });
    
    /**
     * Second Change Event Handler
     * Tracks video progress and shows CTA after delay
     */
    video.bind("secondchange", function(time) {
      currentTime = time;
      
      // Show CTA after waitForSeconds delay
      if (!video.isMuted() && time * 1000 > timeForDelay && !isCTADisplayed) {
        displayLink();
        setCookie(cookieName, "yes", 1);
      }
    });
  }
});

/**
 * Preload overlay images
 */
preload([
  "../assets/images/loading-video.gif",
  "../assets/images/" + ld_image_continue,
  "../assets/images/" + ld_image_unmute
]);
