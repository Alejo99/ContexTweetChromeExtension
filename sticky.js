// Taken from https://www.w3schools.com/howto/howto_js_sticky_header.asp

// Get the navbar
var navbar = document.getElementById("menu");

// Get the offset position of the navbar
var sticky = navbar.offsetTop;

// When the user scrolls the page, execute handling function 
window.onscroll = function() {
	handleSticky()
};

// Add the sticky class to the navbar when you reach its scroll position. Remove "sticky" when you leave the scroll position
function handleSticky() {
  if (window.pageYOffset >= sticky) {
    navbar.classList.add("sticky");
  } else {
    navbar.classList.remove("sticky");
  }
}

// Handle click event on buttons
var options = jQuery("#menu .options .button");
options.each(function() {
	jQuery(this).on("click", function() {
		var sectionPos = jQuery(this.getAttribute("data-nav")).offset().top;
		var scrollTo = sectionPos - navbar.offsetHeight;
		$("html, body").animate({
			scrollTop: scrollTo
		}, 250);
		return false;
	});
});
