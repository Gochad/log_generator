# Używamy oficjalnego obrazu Go jako bazowego
FROM golang:1.24.0-alpine

# Ustalamy katalog roboczy w kontenerze
WORKDIR /app

# Kopiujemy pliki Go do kontenera
COPY . .

# Instalujemy zależności (jeśli są) i kompilujemy aplikację
RUN go mod tidy
RUN go build -o main .

# Uruchamiamy aplikację Go
CMD ["./main"]
