//TODO: replace with actual utility files


let generateVerificationCode = () => {
    let length = 5;
    var chars = "1234567890";
    var code = "";
    for (var x = 0; x < length; x++) {
        var i = Math.floor(Math.random() * chars.length);
        code += chars.charAt(i);
    }
    return code;
}

exports.generateVerificationCode = generateVerificationCode;