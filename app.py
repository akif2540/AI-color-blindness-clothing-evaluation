from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np

# Flask uygulamasını oluştur
app = Flask(__name__)

# Eğitilmiş model dosyasını yükle
model = pickle.load(open('color.pkl', 'rb'))

# Ana sayfa rota tanımı (GET isteği)
@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')  # index.html dosyasını render et

# Tahmin yapma rota tanımı (POST isteği)
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()  # İstekten JSON verisini al
    r = int(data['r'])  # Kırmızı değerini al ve tamsayıya çevir
    g = int(data['g'])  # Yeşil değerini al ve tamsayıya çevir
    b = int(data['b'])  # Mavi değerini al ve tamsayıya çevir
    prediction = model.predict([[r, g, b]])  # Model ile tahmin yap
    return jsonify({'answer': prediction[0]})  # Tahmin sonucunu JSON formatında döndür

# Uygulamanın ana fonksiyonu
if __name__ == "__main__":
    app.run(debug=True)  # Uygulamayı debug modunda çalıştır
