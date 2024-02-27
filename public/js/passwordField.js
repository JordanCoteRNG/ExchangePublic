function swapPasswordView() {
    swapCheckPasswordView();
}

function swapCheckPasswordView() {
    let x = document.querySelectorAll(".passwordField");
    x.forEach( (element) => {
        if (element.type === "password") {
            element.type = "text";
        } else {
            element.type = "password";
        }
    });
}