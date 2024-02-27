var hackerman = document.getElementById("console");

var originalTxt = [
    "57414B4520544845204655434B2055502053414D555241492C20574520474F542041204349545920544F204255524E",
    "FORCE: XX0022. ENCRYPT://000.222.2345",
    "TRYPASS: ********* AUTH SIN CODE: ALPHA GAMMA: 1___ PRIORITY 1",
    "RETRY: AGENTS NEMESIS",
    "Z:> /BLACKHEARTS/SHADOW/BLADE/WOLF/ EXECUTE -ORDER 66",
    "================================================",
    "Priority 1 // local / scanning...",
    "SCANNING PORT...",
    "BACKDOOR FOUND (23.45.23.12.00000000)",
    "BACKDOOR FOUND (13.66.23.12.00110000)",
    "BACKDOOR FOUND (13.66.23.12.00110044)",
    "...",
    "...",
    "BRUTE.EXE -r -z",
    "...LOCATING VULNERABILITIES...",
    "...VULNERABILITIES FOUND...",
    "MCP/> DEPLOY CLU",
    "SCAN: __ 0100.0000.0554.0080",
    "SCAN: __ 0020.0000.0553.0080",
    "SCAN: __ 0001.0000.0333.0550",
    "SCAN: __ 0012.0000.0273.0095",
    "SCAN: __ 0020.0000.0663.0140",
];

var txt = originalTxt;

var docfrag = document.createDocumentFragment();
var lastIndex = txt.length - 1;

function updateScreen() {
    // Rebuild document fragment
    var p = document.createElement("p");
    p.className = "hackingIndex unselectable";
    if (txt.length > 0) {
        p.textContent = txt.shift();
    }
    docfrag.appendChild(p);

    // Add updated document fragment to the DOM
    hackerman.appendChild(docfrag.cloneNode(true));
    docfrag.textContent = '';
    hackerman.scrollTop = hackerman.scrollHeight;
}
// Set a timeout to change the message and stop the text scrolling animation
var intervalID = window.setInterval(updateScreen, 200);
setTimeout(() => {

    // Create a new element to hold the "ATTACK SUCCESSFUL" message
    var p = document.createElement("p");
    p.className = "hackingIndex unselectable";
    p.textContent = "BLOCKCHAIN ATTACK SUCCESSFUL. ENTERING THE SYSTEM...";
    hackerman.appendChild(p);

    // Update the scroll position to show the "ATTACK SUCCESSFUL" message
    hackerman.scrollTop = hackerman.scrollHeight;

    // Stop the text scrolling animation by clearing the interval
    clearInterval(intervalID);
}, 5250);


// Redirect to the login page after a delay
setTimeout(() => {
    window.location.pathname = "/login";
}, 8000);

document.addEventListener('click', function() {
    // disable pointer events on the body element
    document.body.style.pointerEvents = 'none';

    // redirect the user to the target URL
    window.location.pathname = '/login'; // replace with the URL you want to redirect to
    // re-enable pointer events after the redirect
    setTimeout(function() {
        document.body.style.pointerEvents = 'auto';
    }, 1000); // adjust the delay as needed
});
