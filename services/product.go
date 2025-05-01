package services

import (
	"go-logger/utils"
	"math/rand"
	"net"
	"strconv"
	"time"
)

var (
	productActions       = []string{"product_added", "product_updated", "product_removed", "product_viewed", "product_out_of_stock"}
	productCategories    = []string{"electronics", "clothing", "home_appliances", "books", "toys"}
	availabilityStatuses = []string{"in_stock", "out_of_stock", "pre_order", "discontinued"}
	errorMsgs            = []string{"Invalid product ID", "Product not found", "Insufficient stock", "Invalid product details"}
	productIDs           = generateProductIDs(1000)
)

func SimulateProductService(conn net.Conn) {
	for {
		action := productActions[rand.Intn(len(productActions))]
		duration := rand.Int63n(800) + 200
		status := 200

		labels := map[string]string{
			"action":       action,
			"category":     productCategories[rand.Intn(len(productCategories))],
			"country":      countries[rand.Intn(len(countries))],
			"availability": availabilityStatuses[rand.Intn(len(availabilityStatuses))],
			"product_id":   generateProductID(),
			"customer_id":  generateCustomerID(),
			"user_agent":   generateUserAgent(),
		}

		switch action {
		case "product_added":
			productID := productIDs[rand.Intn(len(productIDs))]
			labels["product_id"] = productID
			labels["status"] = availabilityStatuses[0]
		case "product_updated":
			productID := productIDs[rand.Intn(len(productIDs))]
			labels["product_id"] = productID
			if rand.Float32() < 0.1 {
				status = 400
				labels["error"] = errorMsgs[3]
			}
		case "product_removed":
			productID := productIDs[rand.Intn(len(productIDs))]
			labels["product_id"] = productID
			if rand.Float32() < 0.2 {
				status = 404
				labels["error"] = errorMsgs[1]
			}
		case "product_viewed":
			productID := productIDs[rand.Intn(len(productIDs))]
			labels["product_id"] = productID
		case "product_out_of_stock":
			productID := productIDs[rand.Intn(len(productIDs))]
			labels["product_id"] = productID
			labels["status"] = availabilityStatuses[1] // "out_of_stock"
			if rand.Float32() < 0.15 {
				status = 500
				labels["error"] = errorMsgs[2] // "Insufficient stock"
			}
		}

		level := "INFO"
		if status >= 400 {
			level = "ERROR"
		}

		utils.SendLog(conn, level, "product-service",
			"Product action: "+action, labels, duration, status)

		time.Sleep(time.Duration(rand.Intn(2000)+500) * time.Millisecond)
	}
}

func generateProductIDs(count int) []string {
	ids := make([]string, count)
	for i := 0; i < count; i++ {
		ids[i] = "product_" + strconv.Itoa(10000+i)
	}
	return ids
}

func generateProductID() string {
	return "product_" + strconv.Itoa(rand.Intn(1000000))
}
