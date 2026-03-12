<template>
  <v-container fluid>
    <!-- 时间流速控制 -->
    <v-card elevation="2" class="mb-4">
      <v-card-title>时间流速控制</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-slider
              v-model="timeSpeed"
              :min="1"
              :max="50"
              :step="1"
              label="时间流速倍率"
              thumb-label
              color="primary"
            >
              <template v-slot:append>
                <v-text-field
                  v-model="timeSpeed"
                  type="number"
                  style="width: 80px"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </template>
            </v-slider>
          </v-col>
          <v-col cols="12" md="6" class="d-flex align-center">
            <span class="text-h6">当前流速: {{ timeSpeed }}x</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>



    <v-card elevation="2" class="mb-4">
      <v-card-title>充电站场景</v-card-title>
      <v-card-text>
        <div class="scene-layout">
          <div class="charging-station">
            <!-- 充电桩 -->
            <div v-for="(charger, index) in chargers" :key="charger.id" class="charger">
              <div class="charger-header">
                <span>充电桩 {{ charger.id }}</span>
              </div>
              
              <!-- 储能电池电量进度条 -->
              <div class="battery-soc-fullwidth">
                <div class="battery-label">储能电池: {{ charger.batterySOC ? charger.batterySOC.toFixed(1) : '0.0' }}%</div>
                <v-progress-linear
                  :value="charger.batterySOC || 0"
                  :color="getBatteryColor(charger.batterySOC)"
                  height="12"
                  class="battery-progress"
                >
                  <template v-slot:default>
                    <span class="battery-soc-text">{{ charger.batterySOC ? charger.batterySOC.toFixed(0) : '0' }}%</span>
                  </template>
                </v-progress-linear>
              </div>
              
              <!-- 储能电池功率双向进度条 - 固定中心0值 -->
              <div class="battery-power-section">
                <div class="battery-power-label">
                  电池功率
                  <span v-if="charger.batteryPower > 0" class="power-status-badge charge">充电 {{ charger.batteryPower.toFixed(1) }} kW</span>
                  <span v-else-if="charger.batteryPower < 0" class="power-status-badge discharge">放电 {{ Math.abs(charger.batteryPower).toFixed(1) }} kW</span>
                  <span v-else class="power-status-badge idle">待机</span>
                </div>
                <div class="center-fixed-bar-container">
                  <div class="center-fixed-bar-wrapper">
                    <!-- 左侧放电区域 - 从中心向左延伸 -->
                    <div class="center-fixed-left-area">
                      <div class="center-fixed-bar discharge" :style="{ width: getBatteryPowerDischargeWidth(charger.batteryPower) + '%' }">
                        <span v-if="charger.batteryPower < 0" class="center-fixed-text">{{ Math.abs(charger.batteryPower).toFixed(1) }}</span>
                      </div>
                    </div>
                    <!-- 中心固定0值 -->
                    <div class="center-fixed-zero">0</div>
                    <!-- 右侧充电区域 - 从中心向右延伸 -->
                    <div class="center-fixed-right-area">
                      <div class="center-fixed-bar charge" :style="{ width: getBatteryPowerChargeWidth(charger.batteryPower) + '%' }">
                        <span v-if="charger.batteryPower > 0" class="center-fixed-text">{{ charger.batteryPower.toFixed(1) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 充电枪 -->
              <div class="charging-guns">
                <div v-for="gun in charger.guns" :key="gun.id" class="charging-gun" :class="{ 'charging': gun.isCharging }">
                  <div class="gun-header">
                    <span>枪 {{ gun.id }}</span>
                    <span class="max-power">最大: {{ gun.maxPower }}kW</span>
                  </div>
                  
                  <!-- 输出功率柱状图 -->
                  <div class="power-bar-section">
                    <div class="power-source-label">输出功率</div>
                    <v-progress-linear
                      :model-value="getGunPowerPercentage(gun.power, gun.maxPower)"
                      color="primary"
                      height="20"
                      class="output-power-bar"
                    >
                      <template v-slot:default>
                        <span class="power-bar-text">{{ gun.power ? gun.power.toFixed(1) : '0.0' }} kW</span>
                      </template>
                    </v-progress-linear>
                  </div>
                  
                  <!-- 功率来源分解 -->
                  <div v-if="gun.isCharging" class="power-source-bars">
                    <div class="source-bar-item">
                      <span class="source-label">电网</span>
                      <v-progress-linear
                        :model-value="getGunGridPowerPercentage(gun, charger)"
                        color="blue"
                        height="14"
                        class="source-bar"
                      >
                        <template v-slot:default>
                          <span class="source-value">{{ getGunGridPower(gun, charger).toFixed(1) }} kW</span>
                        </template>
                      </v-progress-linear>
                    </div>
                    <div class="source-bar-item">
                      <span class="source-label">储能</span>
                      <v-progress-linear
                        :model-value="getGunBatteryPowerPercentage(gun, charger)"
                        color="green"
                        height="14"
                        class="source-bar"
                      >
                        <template v-slot:default>
                          <span class="source-value">{{ getGunBatteryPower(gun, charger).toFixed(1) }} kW</span>
                        </template>
                      </v-progress-linear>
                    </div>
                  </div>
                  
                  <!-- 车辆电池SOC柱状图 -->
                  <div v-if="gun.isCharging && gun.car" class="car-soc-section">
                    <div class="car-info-header">
                      <span>汽车 {{ gun.car.id }}</span>
                      <span class="car-capacity">{{ gun.car.batteryCapacity.toFixed(1) }}kWh</span>
                    </div>
                    <div class="soc-bar-container">
                      <span class="soc-label">SOC</span>
                      <v-progress-linear
                        :model-value="gun.car.currentSOC"
                        :color="getCarSocColor(gun.car.currentSOC)"
                        height="18"
                        class="soc-bar"
                      >
                        <template v-slot:default>
                          <span class="soc-text">{{ gun.car.currentSOC.toFixed(1) }}%</span>
                        </template>
                      </v-progress-linear>
                    </div>
                    <div v-if="gun.remainingTime && gun.remainingTime > 0" class="remaining-time-section">
                      <span class="remaining-time-label">剩余时间</span>
                      <span class="remaining-time-value">{{ formatRemainingTime(gun.remainingTime) }}</span>
                    </div>
                  </div>
                  
                  <!-- 冷却时间显示 -->
                  <div v-if="!gun.isCharging && gun.coolingEndTime" class="cooling-time-section">
                    <div class="cooling-time-label">下一台车</div>
                    <div class="cooling-time-value">{{ getRemainingCoolingTime(gun.coolingEndTime) }}</div>
                  </div>
                  
                  <button v-if="!gun.isCharging" @click="connectCar(charger.id, gun.id)" class="connect-btn">
                    连接汽车
                  </button>
                  <button v-else-if="gun.isCharging" @click="disconnectCar(charger.id, gun.id)" class="disconnect-btn">
                    断开连接
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { useStore } from '../store';
  
  const store = useStore();
  
  // 从store中获取数据
  const chargers = computed(() => store.chargers.value);
  const cars = computed(() => store.cars.value);
  const timeSpeed = computed({
    get: () => store.timeSpeed.value,
    set: (value) => { 
      store.timeSpeed.value = value; 
      store.updateConfig({ timeSpeed: value });
    }
  });
  
  // 计算总功率
  const totalGridPower = computed(() => {
    return chargers.value.reduce((sum, charger) => sum + (charger.gridPower || 0), 0);
  });
  
  const totalBatteryPower = computed(() => {
    return chargers.value.reduce((sum, charger) => sum + (charger.batteryPower || 0), 0);
  });
  
  // 电网功率百分比（基于500kW最大电网功率）
  const getTotalGridPowerPercentage = computed(() => {
    const maxGridPower = 500;
    return Math.min((totalGridPower.value / maxGridPower) * 100, 100);
  });
  
  // 储能电池功率显示宽度
  const getBatteryPositiveWidth = computed(() => {
    const maxBatteryPower = 500;
    if (totalBatteryPower.value > 0) {
      return Math.min((totalBatteryPower.value / maxBatteryPower) * 50, 50);
    }
    return 0;
  });
  
  const getBatteryNegativeWidth = computed(() => {
    const maxBatteryPower = 500;
    if (totalBatteryPower.value < 0) {
      return Math.min((Math.abs(totalBatteryPower.value) / maxBatteryPower) * 50, 50);
    }
    return 0;
  });
  
  // 充电枪功率百分比
  const getGunPowerPercentage = (power: number, maxPower: number) => {
    return Math.min((power / maxPower) * 100, 100);
  };
  
  // 计算充电枪从电网获取的功率
  // 电网功率优先分配给各枪，按比例分配
  const getGunGridPower = (gun: any, charger: any) => {
    if (!gun.isCharging || gun.power <= 0) return 0;
    const totalGunPower = charger.guns.reduce((sum: number, g: any) => sum + (g.power || 0), 0);
    if (totalGunPower === 0) return 0;
    
    // 电网功率按比例分配给各枪
    const gridPowerForGuns = Math.max(0, charger.gridPower);
    const gunGridPower = (gun.power / totalGunPower) * gridPowerForGuns;
    
    // 该枪的电网功率不超过该枪的总功率
    return Math.min(gunGridPower, gun.power);
  };
  
  // 计算充电枪从储能电池获取的功率
  // 储能功率 = 枪总功率 - 电网功率
  const getGunBatteryPower = (gun: any, charger: any) => {
    if (!gun.isCharging || gun.power <= 0) return 0;
    const gunGridPower = getGunGridPower(gun, charger);
    // 储能功率 = 枪输出功率 - 电网输入功率
    const gunBatteryPower = Math.max(0, gun.power - gunGridPower);
    return gunBatteryPower;
  };
  
  // 功率来源百分比
  const getGunGridPowerPercentage = (gun: any, charger: any) => {
    return Math.min((getGunGridPower(gun, charger) / gun.maxPower) * 100, 100);
  };
  
  const getGunBatteryPowerPercentage = (gun: any, charger: any) => {
    return Math.min((getGunBatteryPower(gun, charger) / gun.maxPower) * 100, 100);
  };
  
  // 连接汽车到充电枪
  const connectCar = (chargerId: number, gunId: number) => {
    store.connectCar(chargerId, gunId);
  };
  
  // 断开汽车与充电枪的连接
  const disconnectCar = (chargerId: number, gunId: number) => {
    store.disconnectCar(chargerId, gunId);
  };
  
  // 计算剩余冷却时间（模拟时间）
  const getRemainingCoolingTime = (coolingEndTime?: number) => {
    if (!coolingEndTime) return '';
    
    const now = store.simulationTime.value;
    const remainingMs = Math.max(0, coolingEndTime - now);
    
    // 转换为秒（模拟时间）
    const remainingSimulatedSeconds = remainingMs / 1000;
    
    if (remainingSimulatedSeconds < 60) {
      return `${Math.floor(remainingSimulatedSeconds)}秒`;
    } else {
      const minutes = Math.floor(remainingSimulatedSeconds / 60);
      const seconds = Math.floor(remainingSimulatedSeconds % 60);
      return `${minutes}分${seconds}秒`;
    }
  };
  
  // 格式化剩余充电时间
  const formatRemainingTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0秒';
    
    if (seconds < 60) {
      return `${Math.floor(seconds)}秒`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}分${secs}秒`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}小时${minutes}分`;
    }
  };
  
  // 根据电池SOC获取颜色
  const getBatteryColor = (soc: number) => {
    if (soc >= 70) return 'green';
    if (soc >= 30) return 'amber';
    return 'red';
  };
  
  // 根据车辆SOC获取颜色
  const getCarSocColor = (soc: number) => {
    if (soc >= 80) return 'green';
    if (soc >= 50) return 'blue';
    if (soc >= 20) return 'amber';
    return 'red';
  };
  
  // 功率条颜色
  const getPowerBarColor = (percentage: number) => {
    if (percentage >= 80) return 'red';
    if (percentage >= 50) return 'amber';
    return 'green';
  };
  
  // 计算储能电池放电功率宽度（左侧）
  const getBatteryPowerDischargeWidth = (batteryPower: number) => {
    const maxPower = 1000; // 储能电池最大功率1000kW
    // 放电时 batteryPower 为负值
    if (batteryPower < 0) {
      const absPower = Math.abs(batteryPower);
      return Math.min((absPower / maxPower) * 100, 100);
    }
    return 0;
  };
  
  // 计算储能电池充电功率宽度（右侧）
  const getBatteryPowerChargeWidth = (batteryPower: number) => {
    const maxPower = 1000; // 储能电池最大功率1000kW
    // 充电时 batteryPower 为正值
    if (batteryPower > 0) {
      return Math.min((batteryPower / maxPower) * 100, 100);
    }
    return 0;
  };
</script>

<style scoped>
  .scene-layout {
    min-height: 400px;
    background-color: #f5f5f5;
    border-radius: 8px;
    display: flex;
    padding: 24px;
    gap: 24px;
  }
  
  .charging-station {
    flex: 1;
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }
  
  .charger {
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    min-width: 320px;
    flex: 1;
  }
  
  .charger-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: bold;
    font-size: 18px;
  }
  
  /* 储能电池电量进度条 - 占满组件 */
  .battery-soc-fullwidth {
    margin-bottom: 20px;
    padding: 12px;
    background-color: #f5f5f5;
    border-radius: 6px;
  }
  
  .battery-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }
  
  .battery-progress {
    border-radius: 6px;
  }
  
  .battery-soc-text {
    font-size: 11px;
    color: white;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  }
  
  /* 储能电池功率双向进度条 - 左右对称 */
  .battery-power-section {
    margin-bottom: 20px;
    padding: 16px;
    background-color: #f9f9f9;
    border-radius: 6px;
  }
  
  .battery-power-label {
    font-size: 15px;
    color: #666;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .power-status-badge {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 4px;
    font-weight: bold;
  }
  
  .power-status-badge.charge {
    background-color: #2196f3;
    color: white;
  }
  
  .power-status-badge.discharge {
    background-color: #4caf50;
    color: white;
  }
  
  .power-status-badge.idle {
    background-color: #999;
    color: white;
  }
  
  /* 固定中心0值的双向进度条 */
  .center-fixed-bar-container {
    width: 100%;
  }
  
  .center-fixed-bar-wrapper {
    display: flex;
    align-items: center;
    height: 32px;
    background-color: #f5f5f5;
  }
  
  /* 左侧区域 - 从右向左延伸 */
  .center-fixed-left-area {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    background-color: #e8e8e8;
  }
  
  /* 右侧区域 - 从左向右延伸 */
  .center-fixed-right-area {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    background-color: #e8e8e8;
  }
  
  /* 中心固定的0值 */
  .center-fixed-zero {
    width: 40px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    border-left: 2px solid #bbb;
    border-right: 2px solid #bbb;
    font-size: 14px;
    font-weight: bold;
    color: #666;
    flex-shrink: 0;
  }
  
  /* 进度条 */
  .center-fixed-bar {
    height: 100%;
    display: flex;
    align-items: center;
    transition: width 0.3s ease;
    min-width: 0;
  }
  
  .center-fixed-bar.discharge {
    background-color: #4caf50;
    justify-content: flex-start;
    padding-left: 10px;
  }
  
  .center-fixed-bar.charge {
    background-color: #2196f3;
    justify-content: flex-end;
    padding-right: 10px;
  }
  
  .center-fixed-text {
    font-size: 13px;
    color: white;
    font-weight: bold;
    white-space: nowrap;
  }
  
  /* 总功率监控 */
  .power-bar-container {
    padding: 16px;
  }
  
  .power-bar-label {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
    color: #333;
  }
  
  .power-bar {
    border-radius: 6px;
  }
  
  .power-bar-text {
    font-size: 14px;
    color: white;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  }
  
  /* 双向功率条 */
  .bidirectional-power-bar {
    display: flex;
    align-items: center;
    height: 28px;
    background-color: #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }
  
  .power-bar-negative {
    height: 100%;
    background-color: #4caf50;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 8px;
    transition: width 0.3s ease;
  }
  
  .power-bar-center {
    width: 3px;
    height: 100%;
    background-color: #666;
    flex-shrink: 0;
  }
  
  .power-bar-positive {
    height: 100%;
    background-color: #2196f3;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
    transition: width 0.3s ease;
  }
  
  .power-bar-text-negative,
  .power-bar-text-positive {
    font-size: 13px;
    color: white;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    white-space: nowrap;
  }
  
  .power-bar-status {
    text-align: center;
    margin-top: 8px;
    font-size: 14px;
  }
  
  .charging-text {
    color: #2196f3;
    font-weight: bold;
  }
  
  .discharging-text {
    color: #4caf50;
    font-weight: bold;
  }
  
  /* 充电枪样式 */
  .charging-guns {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .charging-gun {
    background-color: #f0f0f0;
    border-radius: 6px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .charging-gun.charging {
    background-color: #e3f2fd;
    border-left: 6px solid #2196f3;
  }
  
  .gun-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .max-power {
    font-size: 14px;
    color: #666;
  }
  
  /* 功率条区域 */
  .power-bar-section {
    margin: 8px 0;
  }
  
  .power-source-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
  }
  
  .output-power-bar {
    border-radius: 4px;
  }
  
  /* 功率来源分解 */
  .power-source-bars {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 6px;
  }
  
  .source-bar-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .source-label {
    font-size: 14px;
    color: #666;
    width: 45px;
    flex-shrink: 0;
  }
  
  .source-bar {
    flex: 1;
    border-radius: 4px;
  }
  
  .source-value {
    font-size: 12px;
    color: white;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  }
  
  /* 车辆SOC区域 */
  .car-soc-section {
    padding: 12px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
  }
  
  .car-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .car-capacity {
    font-size: 14px;
    color: #666;
  }
  
  .soc-bar-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .soc-label {
    font-size: 14px;
    color: #666;
    width: 40px;
    flex-shrink: 0;
  }
  
  .soc-bar {
    flex: 1;
    border-radius: 4px;
  }
  
  .soc-text {
    font-size: 13px;
    color: white;
    font-weight: bold;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  }
  
  /* 冷却时间显示 */
  .cooling-time-section {
    padding: 12px;
    background-color: rgba(255, 152, 0, 0.1);
    border: 2px solid rgba(255, 152, 0, 0.3);
    border-radius: 6px;
    text-align: center;
  }
  
  .cooling-time-label {
    font-size: 14px;
    color: #ff9800;
    margin-bottom: 5px;
  }
  
  .cooling-time-value {
    font-size: 20px;
    font-weight: bold;
    color: #ff6f00;
  }
  
  /* 按钮样式 */
  .connect-btn, .disconnect-btn {
    margin-top: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 15px;
  }
  
  .connect-btn {
    background-color: #4caf50;
    color: white;
  }
  
  .disconnect-btn {
    background-color: #f44336;
    color: white;
  }
  
  .remaining-time-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
    padding: 8px;
    background-color: #e3f2fd;
    border-radius: 4px;
  }
  
  .remaining-time-label {
    font-size: 12px;
    color: #1976d2;
    font-weight: 500;
  }
  
  .remaining-time-value {
    font-size: 14px;
    color: #1565c0;
    font-weight: 600;
  }
</style>
