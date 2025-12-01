document.getElementById("generate").addEventListener("click", () => {
    const minLength = parseInt(document.getElementById("minLength").value);
    const maxLength = parseInt(document.getElementById("maxLength").value);
    const includeUpper = document.getElementById("uppercase").checked;
    const includeSpecial = document.getElementById("special").checked;

    if (minLength > maxLength) {
        alert("Minimalna długość nie może być większa niż maksymalna!");
        return;
    }

    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const special = "!@#$%^&*()_-+=<>?/{}[]";

    let characters = lower;
    if (includeUpper) characters += upper;
    if (includeSpecial) characters += special;

    const passLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

    let password = "";
    for (let i = 0; i < passLength; i++) {
        const randIndex = Math.floor(Math.random() * characters.length);
        password += characters[randIndex];
    }

    alert("Wygenerowane hasło: " + password);
});