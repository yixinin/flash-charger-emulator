<template>
  <v-container fluid>
    <v-card elevation="2">
      <v-card-title>配置面板</v-card-title>
      <v-card-text>
        <v-form>
          <!-- 电网功率设置 -->
          <v-text-field
            label="电网功率 (kW)"
            v-model="config.gridPower"
            type="number"
            min="0"
            max="2000"
            step="100"
          />
          
          <!-- 充电桩数量设置 -->
          <v-text-field
            label="充电桩数量"
            v-model="config.chargerCount"
            type="number"
            min="1"
            max="10"
            step="1"
            class="mt-4"
          />
          
          <!-- 充电汽车电池容量设置 -->
          <v-text-field
            label="充电汽车电池容量 (kWh) - 实际使用随机数70-130kWh"
            v-model="config.carBatteryCapacity"
            type="number"
            min="70"
            max="130"
            step="10"
            class="mt-4"
            readonly
          />
          
          <!-- 充电汽车数量设置 -->
          <v-text-field
            label="充电汽车数量"
            v-model="config.carCount"
            type="number"
            min="0"
            max="20"
            step="1"
            class="mt-4"
          />
          
          <!-- 价格设置 -->
          <h4 class="mt-6">价格设置</h4>
          <v-text-field
            label="电网电价 (元/kWh)"
            v-model="priceConfig.gridPrice"
            type="number"
            min="0"
            step="0.01"
            class="mt-2"
          />
          <v-text-field
            label="充电服务费 (元/kWh)"
            v-model="priceConfig.serviceFee"
            type="number"
            min="0"
            step="0.01"
            class="mt-2"
          />
          <v-text-field
            label="充电电费 (元/kWh)"
            v-model="priceConfig.chargingPrice"
            type="number"
            min="0"
            step="0.01"
            class="mt-2"
          />
          
          <!-- 充放电损耗设置 -->
          <h4 class="mt-6">充放电损耗设置</h4>
          <v-text-field
            label="电网-储能电池损耗 (%)"
            v-model="lossConfig.gridToBattery"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="mt-2"
          />
          <v-text-field
            label="储能电池-汽车损耗 (%)"
            v-model="lossConfig.batteryToCar"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="mt-2"
          />
          <v-text-field
            label="电网-汽车损耗 (%)"
            v-model="lossConfig.gridToCar"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="mt-2"
          />
          
          <!-- 充电桩配置 -->
          <div class="mt-6" v-for="(charger, index) in chargerConfigs" :key="index">
            <h4>充电桩 {{ index + 1 }} 配置</h4>
            <v-text-field
              label="电网功率上限 (kW)"
              v-model="charger.gridPowerLimit"
              type="number"
              min="10"
              max="1000"
              step="50"
              class="mt-2"
            />
            <v-text-field
              label="储能电池容量 (kWh)"
              v-model="charger.batteryCapacity"
              type="number"
              min="100"
              max="5000"
              step="100"
              class="mt-2"
            />
            <v-text-field
              label="A枪最大功率 (kW)"
              v-model="charger.gunAPower"
              type="number"
              min="10"
              max="1000"
              step="50"
              class="mt-2"
            />
            <v-text-field
              label="B枪最大功率 (kW)"
              v-model="charger.gunBPower"
              type="number"
              min="10"
              max="1000"
              step="50"
              class="mt-2"
            />
          </div>
          
          <!-- 应用按钮 -->
          <v-btn
            color="primary"
            @click="applyConfig"
            class="mt-6"
            block
          >
            应用配置
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { useStore } from '../store';
  
  const store = useStore();
  
  // 配置数据
  const config = ref(store.config);
  const chargerConfigs = ref(store.chargerConfigs);
  const priceConfig = ref(store.priceConfig);
  const lossConfig = ref(store.lossConfig);
  
  // 当充电桩数量变化时，更新chargerConfigs
  const updateChargerConfigs = () => {
    const count = config.value.chargerCount;
    const currentCount = chargerConfigs.value.length;
    
    if (count > currentCount) {
      // 添加新的充电桩配置
      for (let i = currentCount; i < count; i++) {
        chargerConfigs.value.push({ batteryCapacity: 350, gunAPower: 1000, gunBPower: 300, gridPowerLimit: 500 });
      }
    } else if (count < currentCount) {
      // 移除多余的充电桩配置
      chargerConfigs.value = chargerConfigs.value.slice(0, count);
    }
  };
  
  // 应用配置
  const applyConfig = () => {
    updateChargerConfigs();
    store.updateConfig({
      ...config.value,
      chargerConfigs: chargerConfigs.value,
      priceConfig: priceConfig.value,
      lossConfig: lossConfig.value
    });
  };
</script>

<style scoped>
</style>