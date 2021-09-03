
/* Set the width of the sidebar to 250px (show it) */
function openNav() {
    document.getElementById("mySidepanel").style.width = "60%";
}

/* Set the width of the sidebar to 0 (hide it) */
function closeNav() {
    document.getElementById("mySidepanel").style.width = "0";
}

function moveProgressBar(progress) {
    var elem = document.getElementById("progress-bar");
    elem.innerHTML = progress + "%";
    elem.style.width = progress + "%";
    document.getElementById("progress-wrapper").innerHTML;
}
