import { ref, reactive, onMounted, onUnmounted } from 'vue';

// 充电桩配置接口
export interface ChargerConfig {
  batteryCapacity: number;
  gunAPower: number;
  gunBPower: number;
  gridPowerLimit: number; // 电网功率上限
}

// 价格配置接口
export interface PriceConfig {
  gridPrice: number; // 电网电价（元/kWh）
  serviceFee: number; // 充电服务费（元/kWh）
  chargingPrice: number; // 充电电费（元/kWh）
}

// 损耗配置接口
export interface LossConfig {
  gridToBattery: number; // 电网-储能电池损耗（%）
  batteryToCar: number; // 储能电池-汽车损耗（%）
  gridToCar: number; // 电网-汽车损耗（%）
}

// 充电枪接口
export interface ChargingGun {
  id: number;
  power: number; // 当前功率
  maxPower: number; // 最大功率
  isCharging: boolean; // 是否正在充电
  car?: Car; // 连接的汽车
  coolingEndTime?: number; // 冷却结束时间戳
}

// 充电桩接口
export interface Charger {
  id: number;
  guns: ChargingGun[];
  batterySOC: number; // 电池SOC
  batteryCapacity: number; // 电池容量
  gridPower: number; // 电网功率
  batteryPower: number; // 电池功率
}

// 汽车接口
export interface Car {
  id: number;
  batteryCapacity: number; // 电池容量
  currentSOC: number; // 当前SOC
  targetSOC: number; // 目标SOC
  chargingPower: number; // 充电功率
  nextChargeTime?: number; // 下一次可充电时间戳
}

// 配置接口
export interface AppConfig {
  gridPower: number;
  chargerCount: number;
  carBatteryCapacity: number;
  carCount: number;
  chargerConfigs: ChargerConfig[];
  timeSpeed: number;
  priceConfig: PriceConfig;
  lossConfig: LossConfig;
}

// 收支数据接口
export interface FinanceData {
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
}

// 时间段统计数据接口
export interface TimePeriodStats {
  startTime: number;
  endTime: number;
  chargingAmount: number; // 充电量(kWh)
  gridDischargeAmount: number; // 电网放电量(kWh)
  batteryDischargeAmount: number; // 储能放电量(kWh)
  batteryChargeAmount: number; // 储能充电量(kWh)
  batteryLossAmount: number; // 储能损耗量(kWh)
  chargingAmountCost: number; // 充电量金额
  gridDischargeAmountCost: number; // 电网放电量金额
  batteryDischargeAmountCost: number; // 储能放电量金额
  batteryChargeAmountCost: number; // 储能充电量金额
  batteryLossAmountCost: number; // 储能损耗量金额
  carChargeCount: number; // 汽车充电总数量
  gunStats: {
    [gunId: string]: {
      totalChargeTime: number; // 总充电时间(秒)
      totalIdleTime: number; // 总空闲时间(秒)
      chargingAmount: number; // 充电量(kWh)
    }
  };
}

class Store {
  // 配置数据
  config = reactive({
    gridPower: 500, // 默认电网功率500kW
    chargerCount: 2, // 默认充电桩数量2
    carBatteryCapacity: 100, // 默认汽车电池容量100kWh（实际使用随机数70-130kWh）
    carCount: 4, // 默认汽车数量4
  });

  // 充电桩配置
  chargerConfigs = reactive<ChargerConfig[]>([
    { batteryCapacity: 350, gunAPower: 1000, gunBPower: 300, gridPowerLimit: 500 },
    { batteryCapacity: 350, gunAPower: 1000, gunBPower: 300, gridPowerLimit: 500 }
  ]);

  // 时间流速
  timeSpeed = ref(20); // 时间流速倍率，默认10x

  // 价格配置
  priceConfig = reactive<PriceConfig>({
    gridPrice: 0.5, // 默认电网电价0.5元/kWh
    serviceFee: 0.3, // 默认充电服务费0.3元/kWh
    chargingPrice: 0.8 // 默认充电电费0.8元/kWh
  });

  // 损耗配置
  lossConfig = reactive<LossConfig>({
    gridToBattery: 2, // 默认电网-储能电池损耗2%
    batteryToCar: 2, // 默认储能电池-汽车损耗2%
    gridToCar: 2 // 默认电网-汽车损耗2%
  });

  // 充电站状态
  chargers = ref<Charger[]>([]);
  cars = ref<Car[]>([]);

  // 响应式数据
  gridPower = ref(0);
  batteryPower = ref(0);
  totalBatterySOC = ref(100); // 初始SOC为100%
  totalEnergy = ref(0);

  // 收支数据
  financeData = reactive<FinanceData>({
    totalCost: 0, // 总成本
    totalRevenue: 0, // 总收入
    totalProfit: 0 // 总利润
  });

  // 时间段统计数据
  timePeriodStats = reactive<TimePeriodStats>({
    startTime: Date.now() - 3600000, // 默认1小时前
    endTime: Date.now(), // 默认当前时间
    chargingAmount: 0, // 充电量(kWh)
    gridDischargeAmount: 0, // 电网放电量(kWh)
    batteryDischargeAmount: 0, // 储能放电量(kWh)
    batteryChargeAmount: 0, // 储能充电量(kWh)
    batteryLossAmount: 0, // 储能损耗量(kWh)
    chargingAmountCost: 0, // 充电量金额
    gridDischargeAmountCost: 0, // 电网放电量金额
    batteryDischargeAmountCost: 0, // 储能放电量金额
    batteryChargeAmountCost: 0, // 储能充电量金额
    batteryLossAmountCost: 0, // 储能损耗量金额
    carChargeCount: 0, // 汽车充电总数量
    gunStats: {}
  });

  // 充电枪状态历史
  gunStatusHistory = reactive<{
    [gunId: string]: {
      lastStatusChange: number;
      lastStatus: 'charging' | 'idle';
    }
  }>({});

  // 模拟数据更新
  updateInterval: number | null = null;

  // 模拟时间（考虑时间流速）
  simulationTime = ref(Date.now());

  // 初始化充电站
  initChargingStation() {
    // 清空现有数据
    this.chargers.value = [];
    this.cars.value = [];

    // 更新充电桩配置
    this.updateChargerConfigs();

    // 创建充电桩
    for (let i = 0; i < this.config.chargerCount; i++) {
      const chargerConfig = this.chargerConfigs[i];
      if (!chargerConfig) {
        console.error(`充电桩配置缺失，索引: ${i}`);
        continue;
      }

      const charger: Charger = {
        id: i + 1,
        guns: [
          { id: 1, power: 0, maxPower: chargerConfig.gunAPower, isCharging: false },
          { id: 2, power: 0, maxPower: chargerConfig.gunBPower, isCharging: false }
        ],
        batterySOC: 100, // 初始SOC为100%
        batteryCapacity: chargerConfig.batteryCapacity,
        gridPower: 0, // 初始电网功率
        batteryPower: 0 // 初始电池功率
      };
      this.chargers.value.push(charger);
    }

    // 创建汽车
    for (let i = 0; i < this.config.carCount; i++) {
      // 随机化电池容量，范围70-130kWh
      const batteryCapacity = 70 + Math.random() * 60;

      // 设置随机等待时间（1-5分钟，模拟世界中的真实时间）
      const waitMinutes = 1 + Math.random() * 4;
      const waitTimeMs = waitMinutes * 60 * 1000;

      const car: Car = {
        id: i + 1,
        batteryCapacity: batteryCapacity,
        currentSOC: 2 + Math.random() * 48,
        targetSOC: 97,
        chargingPower: 0,
        nextChargeTime: this.simulationTime.value + waitTimeMs
      };
      this.cars.value.push(car);
    }

    // 更新总电池SOC
    this.totalBatterySOC.value = this.calculateTotalBatterySOC();
  }

  // 当充电桩数量变化时，更新chargerConfigs
  updateChargerConfigs() {
    const count = this.config.chargerCount;
    const currentCount = this.chargerConfigs.length;

    if (count > currentCount) {
      // 添加新的充电桩配置
      for (let i = currentCount; i < count; i++) {
        this.chargerConfigs.push({ batteryCapacity: 1000, gunAPower: 500, gunBPower: 500 });
      }
    } else if (count < currentCount) {
      // 移除多余的充电桩配置
      this.chargerConfigs.splice(count);
    }
  }

  // 计算总电池SOC
  calculateTotalBatterySOC() {
    if (this.chargers.value.length === 0) return 100;
    const totalSOC = this.chargers.value.reduce((sum, charger) => sum + charger.batterySOC, 0);
    return totalSOC / this.chargers.value.length;
  }

  // 连接汽车到充电枪
  connectCar(chargerId: number, gunId: number) {
    const charger = this.chargers.value.find(c => c.id === chargerId);
    const gun = charger?.guns.find(g => g.id === gunId);

    if (charger && gun && !gun.isCharging) {
      // 找到第一个等待充电的汽车
      const waitingCar = this.getWaitingCars()[0];
      if (waitingCar) {
        gun.isCharging = true;
        gun.car = waitingCar;
        waitingCar.chargingPower = gun.maxPower;
      }
    }
  }

  // 断开汽车与充电枪的连接
  disconnectCar(chargerId: number, gunId: number) {
    const charger = this.chargers.value.find(c => c.id === chargerId);
    const gun = charger?.guns.find(g => g.id === gunId);

    if (charger && gun && gun.isCharging) {
      gun.isCharging = false;
      gun.power = 0;
      if (gun.car) {
        gun.car.chargingPower = 0;
        gun.car = undefined;
      }
    }
  }

  // 获取等待充电的汽车
  getWaitingCars() {
    // 找出所有未连接到充电枪的汽车
    const connectedCarIds = new Set<number>();
    this.chargers.value.forEach(charger => {
      charger.guns.forEach(gun => {
        if (gun.car) {
          connectedCarIds.add(gun.car.id);
        }
      });
    });

    // 找出所有等待充电的汽车（未连接且等待时间已过）
    const now = this.simulationTime.value;
    return this.cars.value.filter(car => {
      return !connectedCarIds.has(car.id) &&
        (!car.nextChargeTime || car.nextChargeTime <= now);
    });
  }

  // 自动连接汽车到空闲充电枪
  autoConnectCars() {
    const timeMultiplier = this.timeSpeed.value;
    const now = this.simulationTime.value;

    // 找出所有空闲且不在冷却期内的充电枪
    const availableGuns: { chargerId: number, gun: ChargingGun }[] = [];

    this.chargers.value.forEach(charger => {
      charger.guns.forEach(gun => {
        // 检查冷却时间（考虑时间流速）
        // 冷却时间已经根据时间流速计算，直接比较即可
        const isInCooling = gun.coolingEndTime && gun.coolingEndTime > now;
        if (!gun.isCharging && !isInCooling) {
          // 清除已过期的冷却时间
          if (gun.coolingEndTime && gun.coolingEndTime <= now) {
            gun.coolingEndTime = undefined;
          }
          availableGuns.push({ chargerId: charger.id, gun });
        }
      });
    });

    if (availableGuns.length === 0) return;

    // 获取等待充电的汽车
    let availableCars = this.getWaitingCars();

    // 如果等待的汽车不够，创建新汽车
    while (availableCars.length < availableGuns.length) {
      const newCar = this.createNewCar();
      availableCars.push(newCar);
    }

    // 自动连接汽车到空闲充电枪
    for (let i = 0; i < availableGuns.length; i++) {
      const { chargerId, gun } = availableGuns[i];
      const car = availableCars[i];

      gun.isCharging = true;
      gun.car = car;
      car.chargingPower = gun.maxPower;
    }
  }

  // 创建新汽车
  createNewCar(): Car {
    const maxCarId = this.cars.value.reduce((max, car) => Math.max(max, car.id), 0);
    const batteryCapacity = 70 + Math.random() * 60;

    // 设置随机等待时间（1-5分钟，模拟世界中的真实时间）
    const waitMinutes = 1 + Math.random() * 4;
    const waitTimeMs = waitMinutes * 60 * 1000;

    const newCar: Car = {
      id: maxCarId + 1,
      batteryCapacity: batteryCapacity,
      currentSOC: 2 + Math.random() * 48,
      targetSOC: 97,
      chargingPower: 0,
      nextChargeTime: this.simulationTime.value + waitTimeMs
    };
    this.cars.value.push(newCar);
    return newCar;
  }

  // 功率分配逻辑
  distributePower() {
    // 考虑时间流速倍率
    const timeMultiplier = this.timeSpeed.value;
    const now = this.simulationTime.value;

    // 基础时间单位是1秒，考虑时间流速后的实际经过时间（秒）
    const deltaTimeSeconds = 1 * timeMultiplier;
    const deltaTimeHours = deltaTimeSeconds / 3600;

    // 计算总充电需求
    let totalChargingDemand = 0;
    this.chargers.value.forEach(charger => {
      let chargerDemand = 0;
      charger.guns.forEach(gun => {
        if (gun.isCharging && gun.car) {
          // 计算汽车的充电需求
          const car = gun.car;
          const remainingCapacity = car.batteryCapacity * (car.targetSOC - car.currentSOC) / 100;
          // 计算充电速度：从10%到97%需要9分钟，即87%需要540秒
          const chargingRate = (car.batteryCapacity * 0.87) / 540; // kWh/s
          const requiredPower = chargingRate * 3600; // 转换为kW
          gun.power = Math.min(requiredPower, gun.maxPower);
          chargerDemand += gun.power;
        } else {
          gun.power = 0;
        }
      });
      totalChargingDemand += chargerDemand;
    });

    // 分配电网功率 - 每个充电桩独立优先使用电网
    const gridToCarLoss = 1 - this.lossConfig.gridToCar / 100;
    const gridToBatteryLoss = 1 - this.lossConfig.gridToBattery / 100;
    const batteryToCarLoss = 1 - this.lossConfig.batteryToCar / 100;

    // 初始化收支计算变量
    let gridEnergyInput = 0; // 电网输入能量
    let batteryEnergyInput = 0; // 电池输入能量
    let batteryEnergyOutput = 0; // 电池输出能量
    let carEnergyReceived = 0; // 汽车接收能量
    let totalGridPowerUsed = 0; // 总电网功率使用
    let totalBatteryPowerUsed = 0; // 总电池功率使用

    // 第一步：每个充电桩独立分配电网功率
    const chargerDemands: { charger: Charger; demand: number; gridPower: number; batteryPower: number }[] = [];
    this.chargers.value.forEach((charger, index) => {
      let chargerDemand = 0;
      charger.guns.forEach(gun => {
        chargerDemand += gun.power;
      });

      // 获取该充电桩的电网功率上限
      const gridPowerLimit = this.chargerConfigs[index]?.gridPowerLimit || 500;

      // 优先使用电网，电网不足时使用电池
      let gridPower = 0;
      let batteryPower = 0;

      if (chargerDemand <= gridPowerLimit) {
        // 需求小于等于电网上限，全部使用电网
        gridPower = chargerDemand;
        batteryPower = 0;
      } else {
        // 需求大于电网上限，电网用满，剩余用电池
        gridPower = gridPowerLimit;
        batteryPower = chargerDemand - gridPowerLimit;

        // 如果电池没电，只能使用电网
        if (batteryPower > 0 && charger.batterySOC <= 0) {
          batteryPower = 0;
          gridPower = chargerDemand; // 只能使用电网（可能超过上限）
        }
      }

      chargerDemands.push({ charger, demand: chargerDemand, gridPower, batteryPower });
    });

    // 第二步：更新每个充电桩的状态
    chargerDemands.forEach((item, index) => {
      const charger = item.charger;
      charger.gridPower = item.gridPower;
      charger.batteryPower = item.batteryPower > 0 ? -item.batteryPower : 0; // 负号表示放电

      totalGridPowerUsed += item.gridPower;
      totalBatteryPowerUsed += item.batteryPower;

      // 计算电网输入能量
      gridEnergyInput += item.gridPower * deltaTimeHours / gridToCarLoss;

      // 计算电池输出能量和更新SOC
      if (item.batteryPower > 0) {
        const batteryEnergyOut = item.batteryPower * deltaTimeHours / batteryToCarLoss;
        batteryEnergyOutput += batteryEnergyOut;
        const socDecrease = (batteryEnergyOut / charger.batteryCapacity) * 100;
        charger.batterySOC = Math.max(0, charger.batterySOC - socDecrease);
      }
    });

    // 第三步：如果有剩余电网功率，给电池充电
    // 储能电池充电速度：从10%到97%需要9分钟（540秒），即87%需要540秒
    this.chargers.value.forEach((charger, index) => {
      // 获取该充电桩的电网功率上限
      const gridPowerLimit = this.chargerConfigs[index]?.gridPowerLimit || 500;
      const remainingGridPower = gridPowerLimit - charger.gridPower;

      if (remainingGridPower > 0 && charger.batterySOC < 100) {
        // 计算需要的充电功率（基于9分钟从10%充到97%）
        // 充电功率 = 电池容量 * 0.87 / 540秒 * 3600 = kW
        const targetChargingPower = (charger.batteryCapacity * 0.87) / 540 * 3600;

        // 实际分配的充电功率 = min(目标功率, 剩余电网功率, 最大功率1000kW)
        const chargingPower = Math.min(
          targetChargingPower,
          remainingGridPower,
          1000 // 储能电池最大功率1000kW
        );

        if (chargingPower > 0) {
          const batteryChargingEnergy = chargingPower * deltaTimeHours / gridToBatteryLoss;
          gridEnergyInput += batteryChargingEnergy;
          batteryEnergyInput += batteryChargingEnergy;

          charger.gridPower += chargingPower;
          charger.batteryPower = chargingPower; // 正号表示充电

          const socIncrease = (batteryChargingEnergy / charger.batteryCapacity) * 100;
          charger.batterySOC = Math.min(100, charger.batterySOC + socIncrease);
        }
      }
    });

    // 更新总功率显示
    this.gridPower.value = totalGridPowerUsed;
    this.batteryPower.value = totalBatteryPowerUsed > 0 ? -totalBatteryPowerUsed : 0;

    // 更新汽车SOC并计算汽车接收能量
    this.chargers.value.forEach(charger => {
      charger.guns.forEach(gun => {
        if (gun.isCharging && gun.car) {
          const car = gun.car;
          // 能量增量 = 功率(kW) * 时间(小时) = 功率 * (秒数/3600) = kWh
          const energyAdded = gun.power * (deltaTimeSeconds / 3600); // 考虑时间流速的能量增量（kWh）
          const socIncrease = (energyAdded / car.batteryCapacity) * 100;
          car.currentSOC = Math.min(car.targetSOC, car.currentSOC + socIncrease);
          carEnergyReceived += energyAdded;

          // 如果达到目标SOC，停止充电
          if (car.currentSOC >= car.targetSOC) {
            gun.isCharging = false;
            gun.power = 0;
            if (gun.car) {
              // 增加汽车充电计数
              this.timePeriodStats.carChargeCount++;

              // 设置随机冷却时间（3-5分钟，模拟世界中的真实时间）
              const intervalMinutes = 3 + Math.random() * 2;
              const intervalMs = intervalMinutes * 60 * 1000;
              gun.coolingEndTime = this.simulationTime.value + intervalMs;
              gun.car.chargingPower = 0;
              gun.car = undefined;
            }
          }
        }
      });
    });

    // 计算收支
    // 1. 计算电网成本（充电站支付）
    const gridCost = gridEnergyInput * this.priceConfig.gridPrice;

    // 2. 计算用户支付的能量（包括电网-汽车损耗）
    // gridToCarLoss 已在前面定义
    const carPaymentEnergy = carEnergyReceived / gridToCarLoss;

    // 3. 计算用户支付的费用（电费+服务费）
    const userPayment = carPaymentEnergy * (this.priceConfig.chargingPrice + this.priceConfig.serviceFee);

    // 4. 计算充电站的收益（只有服务费）
    const revenue = carPaymentEnergy * this.priceConfig.serviceFee;

    // 5. 计算储能充放电损耗成本（充电站承担）
    // 电池充放电损耗 = 电池充电能量 - 电池放电能量
    const batteryLossCost = (batteryEnergyInput - batteryEnergyOutput) * this.priceConfig.gridPrice;

    // 6. 计算总成本和利润
    const totalCost = gridCost + batteryLossCost;
    const profit = revenue - totalCost;

    // 更新收支数据
    this.financeData.totalCost += totalCost;
    this.financeData.totalRevenue += userPayment;
    this.financeData.totalProfit += profit;

    // 更新总电池SOC
    this.totalBatterySOC.value = this.calculateTotalBatterySOC();

    // 更新总能量
    this.totalEnergy.value += Math.abs(this.gridPower.value) * deltaTimeHours;

    // 更新时间段统计数据
    if (now >= this.timePeriodStats.startTime && now <= this.timePeriodStats.endTime) {
      // 充电量
      this.timePeriodStats.chargingAmount += carEnergyReceived;
      this.timePeriodStats.chargingAmountCost += userPayment;

      // 电网放电量
      this.timePeriodStats.gridDischargeAmount += gridEnergyInput;
      this.timePeriodStats.gridDischargeAmountCost += gridCost;

      // 储能放电量
      this.timePeriodStats.batteryDischargeAmount += batteryEnergyOutput;
      this.timePeriodStats.batteryDischargeAmountCost += batteryEnergyOutput * this.priceConfig.gridPrice;

      // 储能充电量
      this.timePeriodStats.batteryChargeAmount += batteryEnergyInput;
      this.timePeriodStats.batteryChargeAmountCost += batteryEnergyInput * this.priceConfig.gridPrice;

      // 储能损耗量
      const batteryLoss = batteryEnergyInput - batteryEnergyOutput;
      this.timePeriodStats.batteryLossAmount += Math.abs(batteryLoss);
      this.timePeriodStats.batteryLossAmountCost += batteryLossCost;
    }

    // 更新充电枪状态历史和统计数据
    this.chargers.value.forEach(charger => {
      charger.guns.forEach(gun => {
        const gunId = `charger${charger.id}_gun${gun.id}`;

        // 初始化充电枪统计数据
        if (!this.timePeriodStats.gunStats[gunId]) {
          this.timePeriodStats.gunStats[gunId] = {
            totalChargeTime: 0,
            totalIdleTime: 0,
            chargingAmount: 0
          };
        }

        // 初始化充电枪状态历史
        if (!this.gunStatusHistory[gunId]) {
          this.gunStatusHistory[gunId] = {
            lastStatusChange: now,
            lastStatus: gun.isCharging ? 'charging' : 'idle'
          };
        }

        // 计算时间差
        const timeDiff = (now - this.gunStatusHistory[gunId].lastStatusChange) / 1000 * timeMultiplier;

        // 更新充电枪时间统计
        if (this.gunStatusHistory[gunId].lastStatus === 'charging') {
          this.timePeriodStats.gunStats[gunId].totalChargeTime += timeDiff;
        } else {
          this.timePeriodStats.gunStats[gunId].totalIdleTime += timeDiff;
        }

        // 更新充电枪充电量
        if (gun.isCharging) {
          const energyAdded = gun.power * deltaTimeHours;
          this.timePeriodStats.gunStats[gunId].chargingAmount += energyAdded;
        }

        // 更新充电枪状态历史
        this.gunStatusHistory[gunId].lastStatusChange = now;
        this.gunStatusHistory[gunId].lastStatus = gun.isCharging ? 'charging' : 'idle';
      });
    });
  }

  // 模拟数据更新
  updateData() {
    // 更新模拟时间（考虑时间流速）
    const timeMultiplier = this.timeSpeed.value;
    const deltaTimeMs = 1000 * timeMultiplier; // 每次更新经过的时间（毫秒）
    this.simulationTime.value += deltaTimeMs;

    // 先尝试连接空闲的充电枪
    this.autoConnectCars();
    // 然后分配功率和处理充电逻辑
    this.distributePower();
    // 再次尝试连接，处理刚完成充电的枪
    this.autoConnectCars();
  }

  // 更新配置
  updateConfig(newConfig: Partial<AppConfig>) {
    // 更新基本配置
    if (newConfig.gridPower !== undefined) this.config.gridPower = newConfig.gridPower;
    if (newConfig.chargerCount !== undefined) this.config.chargerCount = newConfig.chargerCount;
    if (newConfig.carBatteryCapacity !== undefined) this.config.carBatteryCapacity = newConfig.carBatteryCapacity;
    if (newConfig.carCount !== undefined) this.config.carCount = newConfig.carCount;

    // 更新充电桩配置
    if (newConfig.chargerConfigs) {
      this.chargerConfigs.splice(0, this.chargerConfigs.length, ...newConfig.chargerConfigs);
    }

    // 更新时间流速
    if (newConfig.timeSpeed !== undefined) this.timeSpeed.value = newConfig.timeSpeed;

    // 更新价格配置
    if (newConfig.priceConfig) {
      this.priceConfig.gridPrice = newConfig.priceConfig.gridPrice;
      this.priceConfig.serviceFee = newConfig.priceConfig.serviceFee;
      this.priceConfig.chargingPrice = newConfig.priceConfig.chargingPrice;
    }

    // 更新损耗配置
    if (newConfig.lossConfig) {
      this.lossConfig.gridToBattery = newConfig.lossConfig.gridToBattery;
      this.lossConfig.batteryToCar = newConfig.lossConfig.batteryToCar;
      this.lossConfig.gridToCar = newConfig.lossConfig.gridToCar;
    }

    // 重新初始化充电站
    this.initChargingStation();
  }

  // 启动模拟
  startSimulation() {
    if (this.updateInterval) return;
    this.updateInterval = window.setInterval(() => this.updateData(), 1000);
  }

  // 停止模拟
  stopSimulation() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// 创建并导出store实例
const store = new Store();

export function useStore() {
  return store;
}

// 初始化并启动模拟
store.initChargingStation();
store.startSimulation();

// 确保在窗口关闭时停止模拟
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    store.stopSimulation();
  });
}

export default store;
export { store };