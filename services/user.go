package services

import (
	"go-logger/utils"
	"math/rand"
	"net"
	"strconv"
	"time"
)

var (
	userActions    = []string{"login", "logout", "register", "profile_update", "password_reset", "account_delete"}
	devices        = []string{"iOS", "Android", "Web", "Desktop"}
	countries      = []string{"PL", "US", "DE", "FR", "UK", "JP"}
	userTypes      = []string{"guest", "free", "premium", "admin"}
	messages       = []string{"Invalid credentials", "Session expired", "Email already exists", "Password too weak"}
	userIDs        = generateIDs(1000)
	currentUserIDs = make(map[string]bool)
)

func SimulateUserService(conn net.Conn) {
	for {
		action := userActions[rand.Intn(len(userActions))]
		duration := rand.Int63n(800) + 200
		status := 200

		labels := map[string]string{
			"action":     action,
			"device":     devices[rand.Intn(len(devices))],
			"country":    countries[rand.Intn(len(countries))],
			"user_type":  userTypes[rand.Intn(len(userTypes))],
			"user_agent": generateUserAgent(),
		}

		switch action {
		case "login":
			userID := userIDs[rand.Intn(len(userIDs))]
			labels["user_id"] = userID
			currentUserIDs[userID] = true
			if rand.Float32() < 0.15 {
				status = 401
				labels["error"] = messages[0]
			}
		case "register":
			if rand.Float32() < 0.1 {
				status = 409
				labels["error"] = messages[2]
			}
		case "password_reset":
			if rand.Float32() < 0.2 {
				status = 400
				labels["error"] = messages[3]
			}
		case "account_delete":
			if len(currentUserIDs) > 0 {
				idx := rand.Intn(len(currentUserIDs))
				i := 0
				for k := range currentUserIDs {
					if i == idx {
						labels["user_id"] = k
						delete(currentUserIDs, k)
						break
					}
					i++
				}
			}
		}

		level := "INFO"
		if status >= 400 {
			level = "ERROR"
		}

		utils.SendLog(conn, level, "user-service",
			"User action: "+action, labels, duration, status)

		time.Sleep(time.Duration(rand.Intn(2000)+500) * time.Millisecond)
	}
}

func generateIDs(count int) []string {
	ids := make([]string, count)
	for i := 0; i < count; i++ {
		ids[i] = "user_" + strconv.Itoa(10000+i)
	}
	return ids
}

func generateUserAgent() string {
	devices := []string{
		"Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)",
		"Mozilla/5.0 (Linux; Android 12; SM-G991B)",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0)",
	}
	return devices[rand.Intn(len(devices))]
}
