package main

import (
	"encoding/json"
	"log"
	"net"
	"os"
	"time"
)

type LogMessage struct {
	Timestamp string `json:"@timestamp"`
	Level     string `json:"level"`
	Message   string `json:"message"`
	Service   string `json:"service"`
}

func sendLog(conn net.Conn, level, message string) {
	logMsg := LogMessage{
		Timestamp: time.Now().Format(time.RFC3339),
		Level:     level,
		Message:   message,
		Service:   "go-logger",
	}

	data, err := json.Marshal(logMsg)
	if err != nil {
		log.Printf("Error marshaling log: %v", err)
		return
	}

	_, err = conn.Write(append(data, '\n'))
	if err != nil {
		log.Printf("Error sending log: %v", err)
	}
}

func connectWithRetries(addr string, maxRetries int, delay time.Duration) (net.Conn, error) {
	var conn net.Conn
	var err error

	for i := 0; i < maxRetries; i++ {
		conn, err = net.Dial("tcp", addr)
		if err == nil {
			return conn, nil
		}
		log.Printf("Attempt %d: cannot connect to Logstash: %v", i+1, err)
		time.Sleep(delay)
	}
	return nil, err
}

func main() {
	logstashAddr := os.Getenv("LOGSTASH_HOST")
	conn, err := connectWithRetries(logstashAddr, 5, 5*time.Second)
	if err != nil {
		log.Fatalf("Failed to connect to Logstash after retries: %v", err)
	}
	defer conn.Close()

	sendLog(conn, "INFO", "Aplikacja Go wystartowała")
	sendLog(conn, "ERROR", "To jest przykładowy błąd")
	sendLog(conn, "INFO", "Logowanie zakończone")
}
