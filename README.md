# Logify - System Mikroserwisowy z Intensywnym Logowaniem

## 📦 Opis projektu
Logify to system oparty na architekturze mikroserwisów, symulujący pracę sklepu internetowego z ruchem generowanym przez bota. Każdy mikroserwis intensywnie loguje operacje, a system zbiera, przetwarza i wizualizuje te logi.

## 🧩 Mikroserwisy
- User Service (port 3001) - zarządzanie użytkownikami
- Product Service (port 3002) - katalog produktów
- Order Service (port 3003) - obsługa zamówień
- Payment Service (port 3004) - symulacja płatności
- Notification Service (port 3005) - wysyłanie powiadomień
- Traffic Bot - generator ruchu

## 🛠️ Technologie
- Node.js dla mikroserwisów
- Python dla Traffic Bota
- Elasticsearch + Kibana do agregacji i wizualizacji logów
- Docker + Docker Compose do konteneryzacji

## 🚀 Uruchomienie
1. Sklonuj repozytorium
2. Upewnij się, że masz zainstalowany Docker i Docker Compose
3. Uruchom system:
```bash
docker-compose up --build
```

## 📊 Dostęp do serwisów
- Kibana: http://localhost:5601
- Elasticsearch: http://localhost:9200
- Mikroserwisy: http://localhost:3001-3005

## 📝 Typy logów
- INFO: standardowe operacje
- WARN: niestandardowe zachowania
- ERROR: błędy i timeouty
- DEBUG: szczegóły requestów
- METRICS: metryki wydajności

## 🔍 Monitorowanie
System automatycznie zbiera i agreguje logi z wszystkich mikroserwisów. Możesz je przeglądać i analizować w Kibanie pod adresem http://localhost:5601

## 🎯 Przykładowe dashboardy w Kibanie
- Liczba błędów w czasie
- Heatmapa requestów
- Statystyki zamówień
- Metryki wydajności serwisów 