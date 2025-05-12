package utils

import (
	"encoding/json"
	"log"
	"net"
	"os"
	"time"
)

type LogMessage struct {
	Timestamp  string            `json:"@timestamp"`
	Level      string            `json:"level"`
	Message    string            `json:"message"`
	Service    string            `json:"service"`
	Labels     map[string]string `json:"labels,omitempty"`
	DurationMs int64             `json:"duration_ms,omitempty"`
	StatusCode int               `json:"status_code,omitempty"`
}

func InitLogstashConnection() net.Conn {
	logstashAddr := os.Getenv("LOGSTASH_HOST")
	var conn net.Conn
	var err error

	for i := 0; i < 10; i++ {
		conn, err = net.Dial("tcp", logstashAddr)
		if err == nil {
			log.Println("Successfully connected to Logstash")
			return conn
		}
		log.Printf("Attempt %d: cannot connect to Logstash: %v", i+1, err)
		time.Sleep(5 * time.Second)
	}
	log.Fatalf("Failed to connect to Logstash: %v", err)
	return nil
}

func SendLog(conn net.Conn, level, service, message string, labels map[string]string, duration int64, status int) {
	logMsg := LogMessage{
		Timestamp:  time.Now().Format(time.RFC3339Nano),
		Level:      level,
		Message:    message,
		Service:    service,
		Labels:     labels,
		DurationMs: duration,
		StatusCode: status,
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
