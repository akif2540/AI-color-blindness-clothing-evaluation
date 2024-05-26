let imageInput = document.querySelector('.imageInput');
let introduction = document.querySelector('.introduction');
let image = document.querySelector('.image');
let canvas = document.querySelector('canvas');
let answer = document.querySelector('.answer');
let compatibilityText = document.querySelector('.compatibility-text'); // Uyumlu olup olmadığını gösterecek olan alan
let c = canvas.getContext('2d');

// Son tıklanan 3 renk
let lastColors = [];

// Kaçıncı renge tıklandığını takip edecek değişken
let clickCount = 0;

// Renk tahminlerini sıfırlayan fonksiyon
function resetPredictions() {
    document.querySelector('.prediction-container').innerHTML = ''; // Tüm tahmin kutularını temizle
    clickCount = 0; // Tıklama sayısını sıfırla
    lastColors = []; // Son tıklanan renkleri sıfırla
    compatibilityText.innerText = ""; // Uyumlu veya uyumsuz mesajını temizle
}

function loadImage(src) {
    introduction.hidden = true;
    image.hidden = false;
    image.src = src;
}

function loadFile(e) {
    if (e.target.files) {
        let imageFile = e.target.files[0];
        let reader = new FileReader();
        reader.readAsDataURL(imageFile);
        reader.onloadend = function (e) {
            loadImage(e.target.result);
        }
    }
}

function getColor(x, y) {
    let pixel = c.getImageData(x, y, 1, 1);
    let rgb = pixel.data;

    return rgb;
}

function displayAnswer(text, rgb) {
    answer.innerText = text.answer;
    answer.innerHTML += "  :  <div class='colorBox'></div>";
    let colorBox = document.querySelector('.colorBox');
    colorBox.style.backgroundColor = "rgb(" + rgb + ")";
}

function displayPrediction(rgb, prediction) {
    let predictionBox = document.createElement('div');
    predictionBox.classList.add('prediction-box');
    predictionBox.innerHTML = `<div class='colorBox' style='background-color: rgb(${rgb});'></div><div class='prediction-text'>${prediction}</div><div class='rgb-values'>RGB: ${rgb}</div>`; // RGB değerlerinin alt alta gelmesi için <br> ekleyin
    
    // Tahmin sonuçlarını gösteren konteyner olan predictionContainer'a ekleyin
    document.querySelector('.prediction-container').appendChild(predictionBox);
}


function useCanvas(el, image, callback) {
    el.width = image.width;
    el.height = image.height;
    el.getContext('2d').drawImage(image, 0, 0, image.width, image.height);
    return callback();
}

function checkCompatibility(colors) {
    // Son tıklanan 3 renk arasındaki farkları kontrol et
    for (let i = 0; i < colors.length - 1; i++) {
        for (let j = i + 1; j < colors.length; j++) {
            let color1 = colors[i];
            let color2 = colors[j];
            if (Math.abs(color1[0] - color2[0]) > 100 ||
                Math.abs(color1[1] - color2[1]) > 100 ||
                Math.abs(color1[2] - color2[2]) > 100) {
                return false; // Uyumlu değil
            }
        }
    }
    return true; // Uyumlu
}

function predict(e) {
    if (e.offsetX) {
        var x = e.offsetX;
        var y = e.offsetY;
    } else if (e.layerX) {
        var x = e.layerX;
        var y = e.layerY;
    }
    image.crossOrigin = "Anonymous";
    useCanvas(canvas, image, function () {
        let rgb = getColor(x, y);
        let rgb_string = rgb[0] + "," + rgb[1] + "," + rgb[2];
        let sender = JSON.stringify(rgb_string);
        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: sender,
        })
        .then(function (response) {
            return response.json();
        }).then(function (text) {
            displayAnswer(text, rgb_string);
            displayPrediction(rgb_string, text.answer); // Tahmin sonucunu göstermek için yeni bir fonksiyon
            lastColors.push(rgb); // Son tıklanan rengi ekle
            if (lastColors.length > 3) {
                lastColors.shift(); // En eski rengi çıkar
            }
            if (lastColors.length === 3) {
                let compatible = checkCompatibility(lastColors);
                compatibilityText.innerText = compatible ? "TonSürTon a göre Renkler uyumlu!" : "TonSürTon a göre Renkler uyumsuz!";
                compatibilityText.classList.remove('green', 'red'); // Önceki sınıfları kaldır
                compatibilityText.classList.add(compatible ? 'green' : 'red'); // Uygun sınıfı ekle
            }
            
        });
    });

    // Her tıklamada clickCount'u arttır
    

    // Her üç tıklamada tahminleri sıfırla
    if (clickCount % 3 === 0) {
        resetPredictions();
    }
    clickCount++;
}

imageInput.addEventListener('change', loadFile);
image.addEventListener('click', predict);

// Her üç tıklamadan sonra uyumlu veya uyumsuz mesajını temizle
// Her üç tıklamadan sonra uyumlu veya uyumsuz mesajını temizle
canvas.addEventListener('click', function() {
    if (clickCount % 3 === 0 && clickCount !== 0) {
        resetPredictions();
        compatibilityText.style.backgroundColor = ""; // Uyumlu veya uyumsuz mesajının arka plan rengini kaldır
    }
});
// Her üç tıklamadan sonra uyumlu veya uyumsuz mesajını temizle
canvas.addEventListener('click', function() {
    if (clickCount % 3 === 0 && clickCount !== 0) {
        resetPredictions();
        compatibilityText.style.backgroundColor = ""; // Arka plan rengini kaldır
        document.body.style.backgroundColor = ""; // Arka plan rengini kaldır
    }
});
