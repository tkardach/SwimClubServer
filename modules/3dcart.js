var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

let test = new XMLHttpRequest();

test.open('GET', 'https://apirest.3dcart.com/3dCartWebAPI/v2/Orders?limit=26');

test.setRequestHeader('Content-Type', 'application/json');
test.setRequestHeader('Accept', 'application/json');
test.setRequestHeader('SecureUrl', "https://saratogaswimclub.3dcartstores.com/");
test.setRequestHeader('PrivateKey', 'f823680a1af79756059f9dd8df53d8a4');
test.setRequestHeader('Token', '2cf21df3b15c59f5e235aadf6e1efb5e');

test.onreadystatechange = function () {
  if (this.readyState === 4) {
    console.log(this.responseText);
    let data = JSON.parse(this.responseText);
    console.log('Status:', this.status);
    console.log('Headers:', this.getAllResponseHeaders());
    console.log('Body:', data.length);
  }
};

test.send();