package main

import (
	"go-logger/services"
	"go-logger/utils"
	"math/rand"
	"time"
)

func main() {
	rand.Seed(time.Now().UnixNano())

	conn := utils.InitLogstashConnection()
	defer conn.Close()

	go services.SimulateUserService(conn)
	go services.SimulateOrderService(conn)
	go services.SimulateProductService(conn)
	go services.SimulatePaymentService(conn)

	select {}
}
