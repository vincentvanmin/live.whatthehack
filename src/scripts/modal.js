function preventScrolling() {
    var modal = document.getElementById("myModal1");
    if (modal.style.display = "block" ) {
        document.body.style.overflowY = "hidden";
    } else {
        document.body.style.overflowY = "scroll";
    }
}

function scrollToTop() {
    window.scrollTo(0, 0);
    AOS.refresh();
}