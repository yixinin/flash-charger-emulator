package main

import (
	"encoding/json"
	"math/rand"
	"time"
)

// ChargerConfig 充电桩配置
type ChargerConfig struct {
	BatteryCapacity float64 `json:"batteryCapacity"`
	GunAPower       float64 `json:"gunAPower"`
	GunBPower       float64 `json:"gunBPower"`
	GridPowerLimit  float64 `json:"gridPowerLimit"`
}

// PriceConfig 价格配置
type PriceConfig struct {
	GridPrice     float64 `json:"gridPrice"`
	ServiceFee    float64 `json:"serviceFee"`
	ChargingPrice float64 `json:"chargingPrice"`
}

// LossConfig 损耗配置
type LossConfig struct {
	GridToBattery float64 `json:"gridToBattery"`
	BatteryToCar  float64 `json:"batteryToCar"`
	GridToCar     float64 `json:"gridToCar"`
}

// Car 汽车
type Car struct {
	ID              int     `json:"id"`
	BatteryCapacity float64 `json:"batteryCapacity"`
	CurrentSOC      float64 `json:"currentSOC"`
	TargetSOC       float64 `json:"targetSOC"`
	ChargingPower   float64 `json:"chargingPower"`
	NextChargeTime  int64   `json:"nextChargeTime"`
}

// ChargingGun 充电枪
type ChargingGun struct {
	ID             int     `json:"id"`
	Power          float64 `json:"power"`
	MaxPower       float64 `json:"maxPower"`
	IsCharging     bool    `json:"isCharging"`
	Car            *Car    `json:"car,omitempty"`
	CoolingEndTime int64   `json:"coolingEndTime,omitempty"`
	RemainingTime  float64 `json:"remainingTime,omitempty"`
}

// Charger 充电桩
type Charger struct {
	ID              int           `json:"id"`
	Guns            []ChargingGun `json:"guns"`
	BatterySOC      float64       `json:"batterySOC"`
	BatteryCapacity float64       `json:"batteryCapacity"`
	GridPower       float64       `json:"gridPower"`
	BatteryPower    float64       `json:"batteryPower"`
}

// AppConfig 应用配置
type AppConfig struct {
	GridPower          float64         `json:"gridPower"`
	ChargerCount       int             `json:"chargerCount"`
	CarBatteryCapacity float64         `json:"carBatteryCapacity"`
	CarCount           int             `json:"carCount"`
	ChargerConfigs     []ChargerConfig `json:"chargerConfigs"`
	TimeSpeed          int             `json:"timeSpeed"`
	PriceConfig        PriceConfig     `json:"priceConfig"`
	LossConfig         LossConfig      `json:"lossConfig"`
}

// FinanceData 财务数据
type FinanceData struct {
	TotalCost    float64 `json:"totalCost"`
	TotalRevenue float64 `json:"totalRevenue"`
	TotalProfit  float64 `json:"totalProfit"`
}

// TimePeriodStats 时间段统计数据
type TimePeriodStats struct {
	StartTime                  int64                `json:"startTime"`
	EndTime                    int64                `json:"endTime"`
	ChargingAmount             float64              `json:"chargingAmount"`
	GridDischargeAmount        float64              `json:"gridDischargeAmount"`
	BatteryDischargeAmount     float64              `json:"batteryDischargeAmount"`
	BatteryChargeAmount        float64              `json:"batteryChargeAmount"`
	BatteryLossAmount          float64              `json:"batteryLossAmount"`
	ChargingAmountCost         float64              `json:"chargingAmountCost"`
	GridDischargeAmountCost    float64              `json:"gridDischargeAmountCost"`
	BatteryDischargeAmountCost float64              `json:"batteryDischargeAmountCost"`
	BatteryChargeAmountCost    float64              `json:"batteryChargeAmountCost"`
	BatteryLossAmountCost      float64              `json:"batteryLossAmountCost"`
	CarChargeCount             int                  `json:"carChargeCount"`
	GunStats                   map[string]*GunStats `json:"gunStats"`
}

// GunStats 充电枪统计数据
type GunStats struct {
	TotalChargeTime float64 `json:"totalChargeTime"`
	TotalIdleTime   float64 `json:"totalIdleTime"`
	ChargingAmount  float64 `json:"chargingAmount"`
}

// GunStatusHistory 充电枪状态历史
type GunStatusHistory struct {
	LastStatusChange int64  `json:"lastStatusChange"`
	LastStatus       string `json:"lastStatus"`
}

// Store 应用状态
type Store struct {
	Config           AppConfig
	Chargers         []Charger
	Cars             []Car
	GridPower        float64
	BatteryPower     float64
	TotalBatterySOC  float64
	TotalEnergy      float64
	FinanceData      FinanceData
	TimePeriodStats  TimePeriodStats
	GunStatusHistory map[string]*GunStatusHistory
	SimulationTime   int64
	TimeSpeed        int
}

// NewStore 创建新的 Store
func NewStore() *Store {
	rand.Seed(time.Now().UnixNano())
	return &Store{
		Config: AppConfig{
			GridPower:          500,
			ChargerCount:       2,
			CarBatteryCapacity: 100,
			CarCount:           4,
			ChargerConfigs: []ChargerConfig{
				{BatteryCapacity: 350, GunAPower: 1000, GunBPower: 300, GridPowerLimit: 500},
				{BatteryCapacity: 350, GunAPower: 1000, GunBPower: 300, GridPowerLimit: 500},
			},
			TimeSpeed: 20,
			PriceConfig: PriceConfig{
				GridPrice:     0.5,
				ServiceFee:    0.3,
				ChargingPrice: 0.8,
			},
			LossConfig: LossConfig{
				GridToBattery: 2,
				BatteryToCar:  2,
				GridToCar:     2,
			},
		},
		FinanceData: FinanceData{
			TotalCost:    0,
			TotalRevenue: 0,
			TotalProfit:  0,
		},
		TimePeriodStats: TimePeriodStats{
			StartTime: time.Now().Unix()*1000 - 3600000,
			EndTime:   time.Now().Unix() * 1000,
			GunStats:  make(map[string]*GunStats),
		},
		GunStatusHistory: make(map[string]*GunStatusHistory),
		SimulationTime:   time.Now().Unix() * 1000,
		TimeSpeed:        20,
	}
}

// InitChargingStation 初始化充电站
func (s *Store) InitChargingStation() {
	s.Chargers = []Charger{}
	s.Cars = []Car{}

	s.updateChargerConfigs()

	for i := 0; i < s.Config.ChargerCount; i++ {
		chargerConfig := s.Config.ChargerConfigs[i]

		charger := Charger{
			ID: i + 1,
			Guns: []ChargingGun{
				{ID: 1, Power: 0, MaxPower: chargerConfig.GunAPower, IsCharging: false},
				{ID: 2, Power: 0, MaxPower: chargerConfig.GunBPower, IsCharging: false},
			},
			BatterySOC:      100,
			BatteryCapacity: chargerConfig.BatteryCapacity,
			GridPower:       0,
			BatteryPower:    0,
		}
		s.Chargers = append(s.Chargers, charger)
	}

	for i := 0; i < s.Config.CarCount; i++ {
		batteryCapacity := 70 + rand.Float64()*60
		waitMinutes := 1 + rand.Float64()*4
		waitTimeMs := int64(waitMinutes * 60 * 1000)

		car := Car{
			ID:              i + 1,
			BatteryCapacity: batteryCapacity,
			CurrentSOC:      2 + rand.Float64()*48,
			TargetSOC:       97,
			ChargingPower:   0,
			NextChargeTime:  s.SimulationTime + waitTimeMs,
		}
		s.Cars = append(s.Cars, car)
	}

	s.TotalBatterySOC = s.calculateTotalBatterySOC()
}

// UpdateChargerConfigs 更新充电桩配置
func (s *Store) updateChargerConfigs() {
	count := s.Config.ChargerCount
	currentCount := len(s.Config.ChargerConfigs)

	if count > currentCount {
		for i := currentCount; i < count; i++ {
			s.Config.ChargerConfigs = append(s.Config.ChargerConfigs, ChargerConfig{
				BatteryCapacity: 1000,
				GunAPower:       500,
				GunBPower:       500,
				GridPowerLimit:  500,
			})
		}
	} else if count < currentCount {
		s.Config.ChargerConfigs = s.Config.ChargerConfigs[:count]
	}
}

// CalculateTotalBatterySOC 计算总电池SOC
func (s *Store) calculateTotalBatterySOC() float64 {
	if len(s.Chargers) == 0 {
		return 100
	}
	totalSOC := 0.0
	for _, charger := range s.Chargers {
		totalSOC += charger.BatterySOC
	}
	return totalSOC / float64(len(s.Chargers))
}

// GetWaitingCars 获取等待充电的汽车
func (s *Store) getWaitingCars() []Car {
	connectedCarIds := make(map[int]bool)
	for _, charger := range s.Chargers {
		for _, gun := range charger.Guns {
			if gun.Car != nil {
				connectedCarIds[gun.Car.ID] = true
			}
		}
	}

	now := s.SimulationTime

	var waitingCars []Car
	for _, car := range s.Cars {
		if connectedCarIds[car.ID] {
			continue
		}
		if car.NextChargeTime == 0 || car.NextChargeTime-now <= 0 {
			waitingCars = append(waitingCars, car)
		}
	}
	return waitingCars
}

// AutoConnectCars 自动连接汽车到空闲充电枪
func (s *Store) autoConnectCars() {
	timeMultiplier := s.TimeSpeed
	now := s.SimulationTime
	deltaTimeMs := int64(1000 * timeMultiplier)

	var availableGuns []struct {
		ChargerID int
		Gun       *ChargingGun
	}

	for chargerIndex, charger := range s.Chargers {
		for gunIndex := range charger.Guns {
			gun := &s.Chargers[chargerIndex].Guns[gunIndex]
			var isInCooling bool
			if gun.CoolingEndTime > 0 {
				remainingTime := gun.CoolingEndTime - now
				isInCooling = remainingTime > deltaTimeMs
				if remainingTime <= deltaTimeMs {
					gun.CoolingEndTime = 0
				}
			}

			if !gun.IsCharging && !isInCooling {
				availableGuns = append(availableGuns, struct {
					ChargerID int
					Gun       *ChargingGun
				}{ChargerID: charger.ID, Gun: gun})
			}
		}
	}

	if len(availableGuns) == 0 {
		return
	}

	availableCars := s.getWaitingCars()

	for len(availableCars) < len(availableGuns) {
		newCar := s.createNewCar()
		availableCars = append(availableCars, newCar)
	}

	for i := 0; i < len(availableGuns) && i < len(availableCars); i++ {
		gunItem := availableGuns[i]
		car := availableCars[i]

		gunItem.Gun.IsCharging = true
		gunItem.Gun.Car = &car
		for carIndex := range s.Cars {
			if s.Cars[carIndex].ID == car.ID {
				s.Cars[carIndex].ChargingPower = gunItem.Gun.MaxPower
				break
			}
		}
	}
}

// CreateNewCar 创建新汽车
func (s *Store) createNewCar() Car {
	maxCarId := 0
	for _, car := range s.Cars {
		if car.ID > maxCarId {
			maxCarId = car.ID
		}
	}
	batteryCapacity := 70 + rand.Float64()*60
	waitMinutes := 1 + rand.Float64()*4
	waitTimeMs := int64(waitMinutes * 60 * 1000)

	newCar := Car{
		ID:              maxCarId + 1,
		BatteryCapacity: batteryCapacity,
		CurrentSOC:      2 + rand.Float64()*48,
		TargetSOC:       97,
		ChargingPower:   0,
		NextChargeTime:  s.SimulationTime + waitTimeMs,
	}
	s.Cars = append(s.Cars, newCar)
	return newCar
}

// DistributePower 功率分配
func (s *Store) distributePower() {
	timeMultiplier := s.TimeSpeed
	now := s.SimulationTime
	deltaTimeSeconds := 1 * timeMultiplier
	deltaTimeHours := float64(deltaTimeSeconds) / 3600

	totalChargingDemand := 0.0
	for chargerIndex := range s.Chargers {
		charger := &s.Chargers[chargerIndex]
		chargerDemand := 0.0
		for gunIndex := range charger.Guns {
			gun := &charger.Guns[gunIndex]
			if gun.IsCharging && gun.Car != nil {
				car := gun.Car
				// remainingCapacity 已计算但未使用，注释掉
				// remainingCapacity := car.BatteryCapacity * (car.TargetSOC - car.CurrentSOC) / 100
				chargingRate := (car.BatteryCapacity * 0.87) / 540
				requiredPower := chargingRate * 3600
				gun.Power = min(requiredPower, gun.MaxPower)
				chargerDemand += gun.Power
			} else {
				gun.Power = 0
			}
		}
		totalChargingDemand += chargerDemand
	}

	gridToCarLoss := 1 - s.Config.LossConfig.GridToCar/100
	gridToBatteryLoss := 1 - s.Config.LossConfig.GridToBattery/100
	batteryToCarLoss := 1 - s.Config.LossConfig.BatteryToCar/100

	gridEnergyInput := 0.0
	batteryEnergyInput := 0.0
	batteryEnergyOutput := 0.0
	carEnergyReceived := 0.0
	totalGridPowerUsed := 0.0
	totalBatteryPowerUsed := 0.0

	type chargerDemandItem struct {
		Charger      *Charger
		Demand       float64
		GridPower    float64
		BatteryPower float64
	}

	var chargerDemands []chargerDemandItem
	for chargerIndex := range s.Chargers {
		charger := &s.Chargers[chargerIndex]
		chargerDemand := 0.0
		for _, gun := range charger.Guns {
			chargerDemand += gun.Power
		}

		gridPowerLimit := s.Config.ChargerConfigs[chargerIndex].GridPowerLimit

		var gridPower, batteryPower float64
		if chargerDemand <= gridPowerLimit {
			gridPower = chargerDemand
			batteryPower = 0
		} else {
			gridPower = gridPowerLimit
			batteryPower = chargerDemand - gridPowerLimit

			if batteryPower > 0 && charger.BatterySOC <= 0 {
				batteryPower = 0
				gridPower = chargerDemand
			}
		}

		chargerDemands = append(chargerDemands, chargerDemandItem{
			Charger:      charger,
			Demand:       chargerDemand,
			GridPower:    gridPower,
			BatteryPower: batteryPower,
		})
	}

	for index, item := range chargerDemands {
		charger := item.Charger
		charger.GridPower = item.GridPower
		if item.BatteryPower > 0 {
			charger.BatteryPower = -item.BatteryPower
		} else {
			charger.BatteryPower = 0
		}

		totalGridPowerUsed += item.GridPower
		totalBatteryPowerUsed += item.BatteryPower

		gridEnergyInput += item.GridPower * deltaTimeHours / gridToCarLoss

		if item.BatteryPower > 0 {
			batteryEnergyOut := item.BatteryPower * deltaTimeHours / batteryToCarLoss
			batteryEnergyOutput += batteryEnergyOut
			socDecrease := (batteryEnergyOut / charger.BatteryCapacity) * 100
			charger.BatterySOC = max(0, charger.BatterySOC-socDecrease)
		}

		s.Chargers[index] = *charger
	}

	for chargerIndex := range s.Chargers {
		charger := &s.Chargers[chargerIndex]
		gridPowerLimit := s.Config.ChargerConfigs[chargerIndex].GridPowerLimit
		remainingGridPower := gridPowerLimit - charger.GridPower

		if remainingGridPower > 0 && charger.BatterySOC < 100 {
			targetChargingPower := (charger.BatteryCapacity * 0.87) / 540 * 3600
			chargingPower := min(targetChargingPower, remainingGridPower, 1000.0)

			if chargingPower > 0 {
				batteryChargingEnergy := chargingPower * deltaTimeHours / gridToBatteryLoss
				gridEnergyInput += batteryChargingEnergy
				batteryEnergyInput += batteryChargingEnergy

				charger.GridPower += chargingPower
				charger.BatteryPower = chargingPower

				socIncrease := (batteryChargingEnergy / charger.BatteryCapacity) * 100
				charger.BatterySOC = min(100, charger.BatterySOC+socIncrease)
			}
		}

		s.Chargers[chargerIndex] = *charger
	}

	s.GridPower = totalGridPowerUsed
	if totalBatteryPowerUsed > 0 {
		s.BatteryPower = -totalBatteryPowerUsed
	} else {
		s.BatteryPower = 0
	}

	for chargerIndex := range s.Chargers {
		charger := &s.Chargers[chargerIndex]
		for gunIndex := range charger.Guns {
			gun := &charger.Guns[gunIndex]
			if gun.IsCharging && gun.Car != nil {
				car := gun.Car
				energyAdded := gun.Power * (float64(deltaTimeSeconds) / 3600)
				socIncrease := (energyAdded / car.BatteryCapacity) * 100
				car.CurrentSOC = min(car.TargetSOC, car.CurrentSOC+socIncrease)
				carEnergyReceived += energyAdded

				// 计算剩余充电时间
				if car.CurrentSOC < car.TargetSOC && gun.Power > 0 {
					remainingCapacity := car.BatteryCapacity * (car.TargetSOC - car.CurrentSOC) / 100
					remainingTimeHours := remainingCapacity / gun.Power
					gun.RemainingTime = remainingTimeHours * 3600
				} else {
					gun.RemainingTime = 0
				}

				if car.CurrentSOC >= car.TargetSOC {
					gun.IsCharging = false
					gun.Power = 0
					gun.RemainingTime = 0
					if gun.Car != nil {
						s.TimePeriodStats.CarChargeCount++

						intervalMinutes := 3 + rand.Float64()*2
						intervalMs := int64(intervalMinutes * 60 * 1000)
						gun.CoolingEndTime = s.SimulationTime + intervalMs
						for carIndex := range s.Cars {
							if s.Cars[carIndex].ID == car.ID {
								s.Cars[carIndex].ChargingPower = 0
								break
							}
						}
						gun.Car = nil
					}
				}
			} else {
				gun.RemainingTime = 0
			}
		}
		s.Chargers[chargerIndex] = *charger
	}

	gridCost := gridEnergyInput * s.Config.PriceConfig.GridPrice
	carPaymentEnergy := carEnergyReceived / gridToCarLoss
	userPayment := carPaymentEnergy * (s.Config.PriceConfig.ChargingPrice + s.Config.PriceConfig.ServiceFee)
	revenue := carPaymentEnergy * s.Config.PriceConfig.ServiceFee
	batteryLossCost := (batteryEnergyInput - batteryEnergyOutput) * s.Config.PriceConfig.GridPrice
	totalCost := gridCost + batteryLossCost
	profit := revenue - totalCost

	s.FinanceData.TotalCost += totalCost
	s.FinanceData.TotalRevenue += userPayment
	s.FinanceData.TotalProfit += profit

	s.TotalBatterySOC = s.calculateTotalBatterySOC()
	s.TotalEnergy += abs(s.GridPower) * deltaTimeHours

	s.TimePeriodStats.ChargingAmount += carEnergyReceived
	s.TimePeriodStats.ChargingAmountCost += userPayment

	s.TimePeriodStats.GridDischargeAmount += gridEnergyInput
	s.TimePeriodStats.GridDischargeAmountCost += gridCost

	s.TimePeriodStats.BatteryDischargeAmount += batteryEnergyOutput
	s.TimePeriodStats.BatteryDischargeAmountCost += batteryEnergyOutput * s.Config.PriceConfig.GridPrice

	s.TimePeriodStats.BatteryChargeAmount += batteryEnergyInput
	s.TimePeriodStats.BatteryChargeAmountCost += batteryEnergyInput * s.Config.PriceConfig.GridPrice

	batteryLoss := batteryEnergyInput * (1 - s.Config.LossConfig.GridToBattery/100)
	s.TimePeriodStats.BatteryLossAmount += abs(batteryLoss)
	s.TimePeriodStats.BatteryLossAmountCost += batteryLoss * s.Config.PriceConfig.GridPrice

	for _, charger := range s.Chargers {
		for _, gun := range charger.Guns {
			gunId := "charger" + string(charger.ID+'0') + "_gun" + string(gun.ID+'0')

			if _, ok := s.TimePeriodStats.GunStats[gunId]; !ok {
				s.TimePeriodStats.GunStats[gunId] = &GunStats{
					TotalChargeTime: 0,
					TotalIdleTime:   0,
					ChargingAmount:  0,
				}
			}

			if _, ok := s.GunStatusHistory[gunId]; !ok {
				s.GunStatusHistory[gunId] = &GunStatusHistory{
					LastStatusChange: now,
					LastStatus:       "idle",
				}
			}

			timeDiffSeconds := float64(deltaTimeSeconds)

			if s.GunStatusHistory[gunId].LastStatus == "charging" {
				s.TimePeriodStats.GunStats[gunId].TotalChargeTime += timeDiffSeconds
			} else {
				s.TimePeriodStats.GunStats[gunId].TotalIdleTime += timeDiffSeconds
			}

			if gun.IsCharging {
				energyAdded := gun.Power * deltaTimeHours
				s.TimePeriodStats.GunStats[gunId].ChargingAmount += energyAdded
			}

			s.GunStatusHistory[gunId].LastStatusChange = now
			if gun.IsCharging {
				s.GunStatusHistory[gunId].LastStatus = "charging"
			} else {
				s.GunStatusHistory[gunId].LastStatus = "idle"
			}
		}
	}
}

// UpdateData 更新数据
func (s *Store) UpdateData() {
	timeMultiplier := s.TimeSpeed
	deltaTimeMs := int64(1000 * timeMultiplier)
	s.SimulationTime += deltaTimeMs

	s.autoConnectCars()
	s.distributePower()
	s.autoConnectCars()
}

// UpdateConfig 更新配置
func (s *Store) UpdateConfig(newConfig AppConfig) {
	s.Config = newConfig
	s.TimeSpeed = newConfig.TimeSpeed
	s.InitChargingStation()
}

// GetState 获取当前状态
func (s *Store) GetState() map[string]interface{} {
	return map[string]interface{}{
		"chargers":        s.Chargers,
		"cars":            s.Cars,
		"gridPower":       s.GridPower,
		"batteryPower":    s.BatteryPower,
		"totalBatterySOC": s.TotalBatterySOC,
		"totalEnergy":     s.TotalEnergy,
		"financeData":     s.FinanceData,
		"timePeriodStats": s.TimePeriodStats,
		"simulationTime":  s.SimulationTime,
	}
}

// Helper functions
func min(vals ...float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	m := vals[0]
	for _, v := range vals[1:] {
		if v < m {
			m = v
		}
	}
	return m
}

func max(vals ...float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	m := vals[0]
	for _, v := range vals[1:] {
		if v > m {
			m = v
		}
	}
	return m
}

func abs(v float64) float64 {
	if v < 0 {
		return -v
	}
	return v
}

// Wasm exports

var store *Store

// Init initializes the store
func Init() {
	store = NewStore()
	store.InitChargingStation()
}

// Update updates the simulation
func Update() string {
	if store == nil {
		Init()
	}
	store.UpdateData()
	state := store.GetState()
	data, _ := json.Marshal(state)
	return string(data)
}

// UpdateConfig updates the configuration
func UpdateConfig(configJSON string) {
	if store == nil {
		Init()
	}
	var config AppConfig
	json.Unmarshal([]byte(configJSON), &config)
	store.UpdateConfig(config)
}

// GetState returns the current state
func GetState() string {
	if store == nil {
		Init()
	}
	state := store.GetState()
	data, _ := json.Marshal(state)
	return string(data)
}
