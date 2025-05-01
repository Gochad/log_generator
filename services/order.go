package services

import (
	"go-logger/utils"
	"math/rand"
	"net"
	"strconv"
	"time"
)

var (
	orderActions      = []string{"order_placed", "order_updated", "order_shipped", "order_cancelled", "order_delivered"}
	orderStatuses     = []string{"pending", "shipped", "delivered", "cancelled", "returned"}
	errors            = []string{"Invalid order ID", "Order not found", "Payment failed", "Item out of stock", "Address not valid"}
	orderIDs          = generateOrderIDs(1000)
	shipmentMethods   = []string{"standard", "express", "overnight"}
	shippingAddresses = []string{"123 Main St", "456 Elm St", "789 Oak Ave", "101 Pine Blvd"}
)

func SimulateOrderService(conn net.Conn) {
	for {
		action := orderActions[rand.Intn(len(orderActions))]
		duration := rand.Int63n(800) + 200
		status := 200

		labels := map[string]string{
			"action":           action,
			"order_status":     orderStatuses[rand.Intn(len(orderStatuses))],
			"country":          countries[rand.Intn(len(countries))],
			"shipment_method":  shipmentMethods[rand.Intn(len(shipmentMethods))],
			"shipping_address": shippingAddresses[rand.Intn(len(shippingAddresses))],
			"order_id":         generateOrderID(),
			"customer_id":      generateCustomerID(),
			"user_agent":       generateUserAgent(),
		}

		switch action {
		case "order_placed":
			orderID := orderIDs[rand.Intn(len(orderIDs))]
			labels["order_id"] = orderID
			labels["status"] = orderStatuses[0] // "pending"
			if rand.Float32() < 0.1 {
				status = 402
				labels["error"] = errors[2] // "Payment failed"
			}
		case "order_updated":
			orderID := orderIDs[rand.Intn(len(orderIDs))]
			labels["order_id"] = orderID
			if rand.Float32() < 0.2 {
				status = 404
				labels["error"] = errors[1] // "Order not found"
			}
		case "order_shipped":
			orderID := orderIDs[rand.Intn(len(orderIDs))]
			labels["order_id"] = orderID
			labels["status"] = orderStatuses[1] // "shipped"
			if rand.Float32() < 0.05 {
				status = 400
				labels["error"] = errors[3] // "Item out of stock"
			}
		case "order_cancelled":
			orderID := orderIDs[rand.Intn(len(orderIDs))]
			labels["order_id"] = orderID
			labels["status"] = orderStatuses[3] // "cancelled"
			if rand.Float32() < 0.15 {
				status = 404
				labels["error"] = errors[0] // "Invalid order ID"
			}
		case "order_delivered":
			orderID := orderIDs[rand.Intn(len(orderIDs))]
			labels["order_id"] = orderID
			labels["status"] = orderStatuses[2] // "delivered"
			if rand.Float32() < 0.1 {
				status = 400
				labels["error"] = errors[4] // "Address not valid"
			}
		}

		level := "INFO"
		if status >= 400 {
			level = "ERROR"
		}

		utils.SendLog(conn, level, "order-service",
			"Order action: "+action, labels, duration, status)

		time.Sleep(time.Duration(rand.Intn(2000)+500) * time.Millisecond)
	}
}

func generateOrderIDs(count int) []string {
	ids := make([]string, count)
	for i := 0; i < count; i++ {
		ids[i] = "order_" + strconv.Itoa(10000+i)
	}
	return ids
}

func generateOrderID() string {
	return "order_" + strconv.Itoa(rand.Intn(1000000))
}
