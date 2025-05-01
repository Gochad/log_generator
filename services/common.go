package services

import (
	"math/rand"
	"strconv"
)

var (
	paymentActions      = []string{"payment_initiated", "payment_completed", "payment_failed", "payment_refunded", "payment_cancelled"}
	paymentMethods      = []string{"credit_card", "paypal", "bank_transfer", "crypto"}
	currencyTypes       = []string{"USD", "EUR", "PLN", "GBP", "JPY"}
	regionCodes         = []string{"EU", "NA", "APAC"}
	errorMessages       = []string{"Insufficient funds", "Invalid payment method", "Payment declined", "Payment gateway timeout", "Fraud detection triggered"}
	transactionIDs      = generateTransactionIDs(1000)
	customerIDs         = generateCustomerIDs(1000)
	transactionStatuses = []string{"pending", "completed", "failed", "refunded", "cancelled"}
)

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
