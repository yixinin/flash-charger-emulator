
import { ref, reactive, onUnmounted } from 'vue';
import wasmLoader from '../utils/wasm-loader';

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
}

// 损耗配置接口
export interface LossConfig {
  gridToBattery: number; // 充放电损耗（%）
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
    gridPrice: 0.8, // 默认电网电价0.8元/kWh
    serviceFee: 0.3 // 默认充电服务费0.3元/kWh
  });

  // 损耗配置
  lossConfig = reactive<LossConfig>({
    gridToBattery: 2 // 默认充放电损耗2%
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

  // 模拟时间（考虑时间流速）
  simulationTime = ref(Date.now());

  // 模拟数据更新
  updateInterval: number | null = null;

  // 初始化充电站
  async initChargingStation() {
    try {
      // 初始化 Wasm 模块
      await wasmLoader.init();

      // 推送配置到 Wasm
      this.pushConfigToWasm();

      // 获取初始状态
      this.updateStateFromWasm();
    } catch (error) {
      console.error('初始化充电站失败:', error);
    }
  }

  // 推送配置到 Wasm
  pushConfigToWasm() {
    const config = {
      gridPower: this.config.gridPower,
      chargerCount: this.config.chargerCount,
      carBatteryCapacity: this.config.carBatteryCapacity,
      carCount: this.config.carCount,
      chargerConfigs: this.chargerConfigs,
      timeSpeed: this.timeSpeed.value,
      priceConfig: this.priceConfig,
      lossConfig: this.lossConfig
    };
    wasmLoader.updateConfig(config);
  }

  // 从 Wasm 更新状态
  updateStateFromWasm() {
    const state = wasmLoader.getState();
    this.chargers.value = state.chargers;
    this.cars.value = state.cars;
    this.gridPower.value = state.gridPower;
    this.batteryPower.value = state.batteryPower;
    this.totalBatterySOC.value = state.totalBatterySOC;
    this.totalEnergy.value = state.totalEnergy;
    this.simulationTime.value = state.simulationTime;

    // 更新财务数据
    this.financeData.totalCost = state.financeData.totalCost;
    this.financeData.totalRevenue = state.financeData.totalRevenue;
    this.financeData.totalProfit = state.financeData.totalProfit;

    // 更新统计数据
    this.timePeriodStats.chargingAmount = state.timePeriodStats.chargingAmount;
    this.timePeriodStats.gridDischargeAmount = state.timePeriodStats.gridDischargeAmount;
    this.timePeriodStats.batteryDischargeAmount = state.timePeriodStats.batteryDischargeAmount;
    this.timePeriodStats.batteryChargeAmount = state.timePeriodStats.batteryChargeAmount;
    this.timePeriodStats.batteryLossAmount = state.timePeriodStats.batteryLossAmount;
    this.timePeriodStats.chargingAmountCost = state.timePeriodStats.chargingAmountCost;
    this.timePeriodStats.gridDischargeAmountCost = state.timePeriodStats.gridDischargeAmountCost;
    this.timePeriodStats.batteryDischargeAmountCost = state.timePeriodStats.batteryDischargeAmountCost;
    this.timePeriodStats.batteryChargeAmountCost = state.timePeriodStats.batteryChargeAmountCost;
    this.timePeriodStats.batteryLossAmountCost = state.timePeriodStats.batteryLossAmountCost;
    this.timePeriodStats.carChargeCount = state.timePeriodStats.carChargeCount;
    this.timePeriodStats.gunStats = state.timePeriodStats.gunStats;
  }

  // 模拟数据更新
  updateData() {
    try {
      const state = wasmLoader.update(this.timeSpeed.value);
      this.chargers.value = state.chargers;
      this.cars.value = state.cars;
      this.gridPower.value = state.gridPower;
      this.batteryPower.value = state.batteryPower;
      this.totalBatterySOC.value = state.totalBatterySOC;
      this.totalEnergy.value = state.totalEnergy;
      this.simulationTime.value = state.simulationTime;

      // 更新财务数据
      this.financeData.totalCost = state.financeData.totalCost;
      this.financeData.totalRevenue = state.financeData.totalRevenue;
      this.financeData.totalProfit = state.financeData.totalProfit;

      // 更新统计数据
      this.timePeriodStats.chargingAmount = state.timePeriodStats.chargingAmount;
      this.timePeriodStats.gridDischargeAmount = state.timePeriodStats.gridDischargeAmount;
      this.timePeriodStats.batteryDischargeAmount = state.timePeriodStats.batteryDischargeAmount;
      this.timePeriodStats.batteryChargeAmount = state.timePeriodStats.batteryChargeAmount;
      this.timePeriodStats.batteryLossAmount = state.timePeriodStats.batteryLossAmount;
      this.timePeriodStats.chargingAmountCost = state.timePeriodStats.chargingAmountCost;
      this.timePeriodStats.gridDischargeAmountCost = state.timePeriodStats.gridDischargeAmountCost;
      this.timePeriodStats.batteryDischargeAmountCost = state.timePeriodStats.batteryDischargeAmountCost;
      this.timePeriodStats.batteryChargeAmountCost = state.timePeriodStats.batteryChargeAmountCost;
      this.timePeriodStats.batteryLossAmountCost = state.timePeriodStats.batteryLossAmountCost;
      this.timePeriodStats.carChargeCount = state.timePeriodStats.carChargeCount;
      this.timePeriodStats.gunStats = state.timePeriodStats.gunStats;
    } catch (error) {
      console.error('更新数据失败:', error);
    }
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

    // 推送配置到 Wasm
    this.pushConfigToWasm();

    // 更新状态
    this.updateStateFromWasm();
  }

  // 连接汽车到充电枪
  connectCar(chargerId: number, gunId: number) {
    // 这个方法暂时留空，因为连接逻辑在 Wasm 中自动处理
    console.log('Connect car request:', chargerId, gunId);
  }

  // 断开汽车与充电枪的连接
  disconnectCar(chargerId: number, gunId: number) {
    // 这个方法暂时留空，因为断开逻辑在 Wasm 中自动处理
    console.log('Disconnect car request:', chargerId, gunId);
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

// 确保在窗口关闭时停止模拟
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    store.stopSimulation();
  });
}

export default store;
export { store };