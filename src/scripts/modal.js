function preventScrolling() {
    var modal = document.getElementById("myModal1");
    if (modal.style.display = "block" ) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "scroll";
    }
}

function scrollToTop() {
    window.scrollTo(0, 0);
}