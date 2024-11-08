function luhnCheck(num) {  
    let arr = (num + '')  
      .split('')  
      .reverse()  
      .map(x => parseInt(x));  
    let lastDigit = arr.shift();  
    let sum = arr.reduce((acc, val, i) =>   
      acc + (i % 2 !== 0 ? val : (val * 2 > 9 ? val * 2 - 9 : val * 2)), 0);  
    sum += lastDigit;  
    return sum % 10 === 0;  
  }  
  
  function generateCreditCardNumber(prefix) {  
    let number = prefix;  
    while (number.length < 15) {  
      number += Math.floor(Math.random() * 10).toString();  
    }  
    let checkDigit = 0;  
    while (!luhnCheck(number + checkDigit)) {  
      checkDigit++;  
    }  
    return number + checkDigit;  
  }  
  
  console.log(generateCreditCardNumber('4773')); // Exemplo de saída: 4773932090320103