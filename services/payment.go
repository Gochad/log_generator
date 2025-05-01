package services

import (
	"go-logger/utils"
	"math/rand"
	"net"
	"strconv"
	"time"
)

func SimulatePaymentService(conn net.Conn) {
	for {
		action := paymentActions[rand.Intn(len(paymentActions))]
		duration := rand.Int63n(800) + 200
		status := 200

		labels := map[string]string{
			"action":         action,
			"payment_method": paymentMethods[rand.Intn(len(paymentMethods))],
			"country":        countries[rand.Intn(len(countries))],
			"currency":       currencyTypes[rand.Intn(len(currencyTypes))],
			"region":         regionCodes[rand.Intn(len(regionCodes))],
			"transaction_id": generateTransactionID(),
			"customer_id":    generateCustomerID(),
			"user_agent":     generateUserAgent(),
		}

		switch action {
		case "payment_initiated":
			customerID := customerIDs[rand.Intn(len(customerIDs))]
			transactionID := transactionIDs[rand.Intn(len(transactionIDs))]
			labels["customer_id"] = customerID
			labels["transaction_id"] = transactionID
			labels["status"] = transactionStatuses[0] // "pending"
		case "payment_completed":
			transactionID := transactionIDs[rand.Intn(len(transactionIDs))]
			labels["transaction_id"] = transactionID
			labels["status"] = transactionStatuses[1] // "completed"
			if rand.Float32() < 0.05 {
				status = 500
				labels["error"] = errorMessages[3] // "Payment gateway timeout"
			}
		case "payment_failed":
			transactionID := transactionIDs[rand.Intn(len(transactionIDs))]
			labels["transaction_id"] = transactionID
			labels["status"] = transactionStatuses[2] // "failed"
			if rand.Float32() < 0.1 {
				status = 400
				labels["error"] = errorMessages[1] // "Invalid payment method"
			} else {
				status = 402
				labels["error"] = errorMessages[0] // "Insufficient funds"
			}
		case "payment_refunded":
			transactionID := transactionIDs[rand.Intn(len(transactionIDs))]
			labels["transaction_id"] = transactionID
			labels["status"] = transactionStatuses[3] // "refunded"
			if rand.Float32() < 0.2 {
				status = 404
				labels["error"] = errorMessages[4] // "Fraud detection triggered"
			}
		case "payment_cancelled":
			transactionID := transactionIDs[rand.Intn(len(transactionIDs))]
			labels["transaction_id"] = transactionID
			labels["status"] = transactionStatuses[4] // "cancelled"
			if rand.Float32() < 0.15 {
				status = 401
				labels["error"] = errorMessages[2] // "Payment declined"
			}
		}

		level := "INFO"
		if status >= 400 {
			level = "ERROR"
		}

		utils.SendLog(conn, level, "payment-service",
			"Payment action: "+action, labels, duration, status)

		time.Sleep(time.Duration(rand.Intn(2000)+500) * time.Millisecond)
	}
}

func generateTransactionIDs(count int) []string {
	ids := make([]string, count)
	for i := 0; i < count; i++ {
		ids[i] = "txn_" + strconv.Itoa(100000+i)
	}
	return ids
}

func generateCustomerIDs(count int) []string {
	ids := make([]string, count)
	for i := 0; i < count; i++ {
		ids[i] = "customer_" + strconv.Itoa(10000+i)
	}
	return ids
}

func generateTransactionID() string {
	return "txn_" + strconv.Itoa(rand.Intn(1000000))
}

func generateCustomerID() string {
	return "customer_" + strconv.Itoa(rand.Intn(1000000))
}
