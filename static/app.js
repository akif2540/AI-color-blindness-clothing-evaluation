// Gerekli HTML elementlerini seç
let imageInput = document.querySelector('.imageInput');
let openCameraButton = document.querySelector('#openCameraButton');
let captureButton = document.querySelector('#captureButton');
let introduction = document.querySelector('.introduction');
let image = document.querySelector('.image');
let video = document.querySelector('.video');
let canvas = document.querySelector('canvas');
let answer = document.querySelector('.answer');
let compatibilityText = document.querySelector('.compatibility-text');
let c = canvas.getContext('2d');

// Son tıklanan 3 renk
let lastColors = [];
let clickCount = 0;

// Tahminleri ve renk seçimlerini sıfırlayan fonksiyon
function resetPredictions() {
    document.querySelector('.prediction-container').innerHTML = '';
    clickCount = 0;
    lastColors = [];
    compatibilityText.innerText = "";
}

// Resim yüklendiğinde görüntüyü ayarlayan fonksiyon
function loadImage(src) {
    introduction.hidden = true; // Tanıtım yazısını gizle
    image.hidden = false; // Resim elementini göster
    video.hidden = true; // Video elementini gizle
    image.src = src; // Resim elementine kaynak ayarla
}

// Dosya yüklendiğinde çağrılan fonksiyon
function loadFile(e) {
    resetPredictions(); // Yeni dosya yüklendiğinde tahminleri sıfırla
    if (e.target.files) {
        let imageFile = e.target.files[0]; // Yüklenen dosyayı al
        let reader = new FileReader(); // Dosya okuyucu oluştur
        reader.readAsDataURL(imageFile); // Dosyayı DataURL olarak oku
        reader.onloadend = function (e) {
            loadImage(e.target.result); // Dosya okuma tamamlandığında resmi yükle
        }
    }
}

// Pikselden RGB değerlerini al
function getColor(x, y) {
    let pixel = c.getImageData(x, y, 1, 1);
    let rgb = pixel.data;
    return rgb; // RGB değerini döndür
}

// Renk tahminini ve rengi gösteren fonksiyon
function displayAnswer(text, rgb) {
    answer.innerText = text.answer; // Tahmini metin olarak göster
    answer.innerHTML += "  :  <div class='colorBox'></div>";
    let colorBox = document.querySelector('.colorBox');
    colorBox.style.backgroundColor = "rgb(" + rgb + ")"; // Tahmin edilen rengi kutu içinde göster
}

// RGB ve tahmin edilen rengi gösteren kutucuk ekleyen fonksiyon
function displayPrediction(rgb, prediction) {
    let predictionBox = document.createElement('div');
    predictionBox.classList.add('prediction-box');
    predictionBox.innerHTML = `<div class='colorBox' style='background-color: rgb(${rgb});'></div><div class='prediction-text'>${prediction}</div><div class='rgb-values'>RGB: ${rgb}</div>`;
    document.querySelector('.prediction-container').appendChild(predictionBox); // Yeni tahmin kutucuğunu ekle
}

// Canvas kullanarak resmi yükleyen ve işlem yapan fonksiyon
function useCanvas(el, image, callback) {
    el.width = image.width;
    el.height = image.height;
    el.getContext('2d').drawImage(image, 0, 0, image.width, image.height); // Resmi canvas'a çiz
    return callback(); // İşlem tamamlandığında geri çağırma fonksiyonunu çağır
}

// Üç renk uyumluluğunu kontrol eden fonksiyon
function checkCompatibility(colors) {
    for (let i = 0; i < colors.length - 2; i++) {
        for (let j = i + 1; j < colors.length - 1; j++) {
            for (let k = j + 1; k < colors.length; k++) {
                let color1 = colors[i];
                let color2 = colors[j];
                let color3 = colors[k];
                let diffR1 = Math.abs(color1[0] - color2[0]);
                let diffG1 = Math.abs(color1[1] - color2[1]);
                let diffB1 = Math.abs(color1[2] - color2[2]);
                let totalDiff1 = diffR1 + diffG1 + diffB1;

                let diffR2 = Math.abs(color1[0] - color3[0]);
                let diffG2 = Math.abs(color1[1] - color3[1]);
                let diffB2 = Math.abs(color1[2] - color3[2]);
                let totalDiff2 = diffR2 + diffG2 + diffB2;

                let diffR3 = Math.abs(color2[0] - color3[0]);
                let diffG3 = Math.abs(color2[1] - color3[1]);
                let diffB3 = Math.abs(color2[2] - color3[2]);
                let totalDiff3 = diffR3 + diffG3 + diffB3;

                if (totalDiff1 < 300 && totalDiff2 < 300 && totalDiff3 < 300) {
                    return "Tonsürton'a Göre Renkler Uyumlu!";
                } else if (totalDiff1 +totalDiff2 + totalDiff3 >1000) {
                    return "3 Renklere Göre Uyumlu!";
                } else {
                    return "Renkler Uyumsuz!";
                }
            }
        }
    }
}


// Metni sesli olarak söyleyen fonksiyon
function textToSpeech(text) {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance); // Metni seslendir
}

// Tıklama üzerine tahmin yapan fonksiyon
function predict(e) {
    var x = e.offsetX || e.layerX;
    var y = e.offsetY || e.layerY;

    useCanvas(canvas, image, function () {
        let rgb = getColor(x, y);
        let rgbString = rgb.slice(0, 3).join(","); 
        let sender = JSON.stringify({ r: rgb[0], g: rgb[1], b: rgb[2] });

        fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: sender,
        })
        .then(response => response.json())
        .then(text => {
            displayAnswer(text, rgbString); // Tahmini ve rengi göster
            displayPrediction(rgbString, text.answer); // Tahmin kutucuğunu ekle
            lastColors.push(rgb); // Rengi son renkler listesine ekle
            if (lastColors.length > 3) {
                lastColors.shift(); // Üçten fazla renk varsa ilkini çıkar
            }
            if (lastColors.length === 3) {
                let compatibility = checkCompatibility(lastColors); // Renk uyumluluğunu kontrol et
                let message, classToAdd;
                if (compatibility.includes("Uyumlu")) {
                    message = compatibility;
                    classToAdd = 'green';
                } else {
                    message = compatibility;
                    classToAdd = 'red';
                }
                compatibilityText.innerText = message; // Uyumluluk mesajını göster
                compatibilityText.classList.remove('green', 'red');
                compatibilityText.classList.add(classToAdd); // Mesajın rengini ayarla
                textToSpeech(message); // Renk uyumluluğunu sesli olarak söyle
            }
        });
    });

    if (clickCount % 3 === 0) {
        resetPredictions(); // Üç tıklamadan sonra tahminleri sıfırla
    }
    clickCount++;
}


// Dosya seçimi değiştiğinde dosya yükleme işlemini başlat
imageInput.addEventListener('change', loadFile);

// Kamera açma işlemini başlatan fonksiyon
function openCamera() {
    resetPredictions(); // Kamera açıldığında tahminleri sıfırla
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream; // Video akışını ayarla
            video.hidden = false; // Video elementini göster
            captureButton.hidden = false; // Fotoğraf çekme butonunu göster
            introduction.hidden = true; // Tanıtım yazısını gizle
            image.hidden = true; // Resim elementini gizle
        })
        .catch(error => {
            console.error("Kamera açılırken bir hata oluştu:", error); // Hata mesajı göster
        });
}

// Fotoğraf çekme işlemini başlatan fonksiyon
function capturePhoto() {
    if (!video.videoWidth || !video.videoHeight) {
        console.error("Video elementi yüklenemedi."); // Video yüklenemediyse hata mesajı göster
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    c.drawImage(video, 0, 0, canvas.width, canvas.height); // Video akışını canvas'a çiz

    let imageData = canvas.toDataURL('image/png'); // Canvas içeriğini resim verisine çevir
    loadImage(imageData); // Resmi yükle

    let stream = video.srcObject;
    let tracks = stream.getTracks();
    tracks.forEach(track => track.stop()); // Video akışını durdur
    video.srcObject = null; // Video kaynak nesnesini temizle
}

// HTML elementleriyle ilgili olay dinleyicileri ekle
imageInput.addEventListener('change', loadFile);
openCameraButton.addEventListener('click', openCamera);
captureButton.addEventListener('click', capturePhoto);
image.addEventListener('click', predict);
