FROM golang:1.24.0-alpine

WORKDIR /app

COPY . .

RUN go mod tidy
RUN go build -o main .

CMD ["./main"]
