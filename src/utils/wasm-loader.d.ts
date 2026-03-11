// wasm-loader.d.ts - TypeScript 类型声明文件

// 充电枪接口
export interface ChargingGun {
  id: number;
  power: number;
  maxPower: number;
  isCharging: boolean;
  car?: Car;
  coolingEndTime?: number;
  remainingTime?: number;
}

// 充电桩接口
export interface Charger {
  id: number;
  guns: ChargingGun[];
  batterySOC: number;
  batteryCapacity: number;
  gridPower: number;
  batteryPower: number;
}

// 汽车接口
export interface Car {
  id: number;
  batteryCapacity: number;
  currentSOC: number;
  targetSOC: number;
  chargingPower: number;
  nextChargeTime?: number;
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
  chargingAmount: number;
  gridDischargeAmount: number;
  batteryDischargeAmount: number;
  batteryChargeAmount: number;
  batteryLossAmount: number;
  chargingAmountCost: number;
  gridDischargeAmountCost: number;
  batteryDischargeAmountCost: number;
  batteryChargeAmountCost: number;
  batteryLossAmountCost: number;
  carChargeCount: number;
  gunStats: {
    [gunId: string]: {
      totalChargeTime: number;
      totalIdleTime: number;
      chargingAmount: number;
    }
  };
}

// 状态接口
export interface WasmState {
  chargers: Charger[];
  cars: Car[];
  gridPower: number;
  batteryPower: number;
  totalBatterySOC: number;
  totalEnergy: number;
  financeData: FinanceData;
  timePeriodStats: TimePeriodStats;
  simulationTime: number;
}

// 配置接口
export interface WasmConfig {
  gridPower: number;
  chargerCount: number;
  carBatteryCapacity: number;
  carCount: number;
  chargerConfigs: any[];
  timeSpeed: number;
  priceConfig: any;
  lossConfig: any;
}

// WasmLoader 类接口
export interface WasmLoader {
  init(): Promise<void>;
  update(timeSpeed?: number): WasmState;
  updateConfig(config: WasmConfig): void;
  getState(): WasmState;
}

declare const wasmLoader: WasmLoader;
export default wasmLoader;
