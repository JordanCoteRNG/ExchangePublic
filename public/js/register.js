
const getRanHex = size => {
    let result = [];
    let hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

    for (let n = 0; n < size; n++) {
        result.push(hexRef[Math.floor(Math.random() * 16)]);
    }
    return result.join('');
}
const successMessage = "SUCCÈS... INSERTION DU CODE...";
const fakeSin = getRanHex(successMessage.length);
setTimeout(() => {
    var hackingField = document.querySelector("#hackingField");

    hackingField.value = successMessage;

    let delay = 1500;
    for(let i = 0; i < fakeSin.length; i++) {
        setTimeout(() => {
            var hackingField = document.querySelector("#hackingField");
            hackingField.value = hackingField.value.substring(0, i) + fakeSin.charAt(i) + hackingField.value.substring(i + 1);

        }, delay);
        delay = delay + 33;
    }

}, 3000);