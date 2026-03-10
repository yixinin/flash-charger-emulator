<template>
  <v-container fluid>
    <!-- 时间段选择器 -->
    <v-card elevation="2" class="mb-4">
      <v-card-title>时间段统计</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              label="开始时间"
              v-model="startTime"
              type="datetime-local"
              @change="updateTimePeriod"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              label="结束时间"
              v-model="endTime"
              type="datetime-local"
              @change="updateTimePeriod"
            />
          </v-col>
          <v-col cols="12" class="mt-4">
            <v-btn color="primary" @click="resetTimePeriod">
              <v-icon left>mdi-refresh</v-icon>
              重置为默认时间
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- 时间段统计数据 -->
    <v-card elevation="2" class="mb-4">
      <v-card-title>时间段统计数据</v-card-title>
      <v-card-text>
        <v-row>
          <!-- 充电量 -->
          <v-col cols="12" md="6" lg="3">
            <v-card>
              <v-card-text>
                <h3 class="text-h4">充电量</h3>
                <p class="text-2xl">{{ timePeriodStats.chargingAmount.toFixed(2) }} kWh</p>
                <p class="text-lg text-primary">¥{{ timePeriodStats.chargingAmountCost.toFixed(2) }}</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 电网放电量 -->
          <v-col cols="12" md="6" lg="3">
            <v-card>
              <v-card-text>
                <h3 class="text-h4">电网放电量</h3>
                <p class="text-2xl">{{ timePeriodStats.gridDischargeAmount.toFixed(2) }} kWh</p>
                <p class="text-lg text-red-500">¥{{ timePeriodStats.gridDischargeAmountCost.toFixed(2) }}</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 储能放电量 -->
          <v-col cols="12" md="6" lg="3">
            <v-card>
              <v-card-text>
                <h3 class="text-h4">储能放电量</h3>
                <p class="text-2xl">{{ timePeriodStats.batteryDischargeAmount.toFixed(2) }} kWh</p>
                <p class="text-lg text-red-500">¥{{ timePeriodStats.batteryDischargeAmountCost.toFixed(2) }}</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 储能充电量 -->
          <v-col cols="12" md="6" lg="3">
            <v-card>
              <v-card-text>
                <h3 class="text-h4">储能充电量</h3>
                <p class="text-2xl">{{ timePeriodStats.batteryChargeAmount.toFixed(2) }} kWh</p>
                <p class="text-lg text-red-500">¥{{ timePeriodStats.batteryChargeAmountCost.toFixed(2) }}</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 储能损耗量 -->
          <v-col cols="12" md="6" lg="3">
            <v-card>
              <v-card-text>
                <h3 class="text-h4">储能损耗量</h3>
                <p class="text-2xl">{{ timePeriodStats.batteryLossAmount.toFixed(2) }} kWh</p>
                <p class="text-lg text-red-500">¥{{ timePeriodStats.batteryLossAmountCost.toFixed(2) }}</p>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- 汽车充电总数量 -->
          <v-col cols="12" md="6" lg="3">
            <v-card>
              <v-card-text>
                <h3 class="text-h4">汽车充电总数量</h3>
                <p class="text-2xl">{{ timePeriodStats.carChargeCount }} 台</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- 充电枪统计数据 -->
    <v-card elevation="2">
      <v-card-title>充电枪统计数据</v-card-title>
      <v-card-text>
        <v-data-table
          :items="gunStatsItems"
          :headers="gunStatsHeaders"
          class="elevation-1"
        >
          <template v-slot:item.totalChargeTime="{ item }">
            {{ formatTime(item.totalChargeTime) }}
          </template>
          <template v-slot:item.totalIdleTime="{ item }">
            {{ formatTime(item.totalIdleTime) }}
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from 'vue';
  import { useStore } from '../store';
  
  const store = useStore();
  
  // 时间段选择
  const startTime = ref('');
  const endTime = ref('');
  
  // 从store中获取数据
  const timePeriodStats = computed(() => store.timePeriodStats);
  
  // 格式化时间（秒转换为时分秒）
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };
  
  // 充电枪统计数据表格头
  const gunStatsHeaders = [
    { text: '充电枪', value: 'gunId' },
    { text: '总充电时间', value: 'totalChargeTime' },
    { text: '总空闲时间', value: 'totalIdleTime' },
    { text: '充电量 (kWh)', value: 'chargingAmount' }
  ];
  
  // 充电枪统计数据表格数据
  const gunStatsItems = computed(() => {
    return Object.entries(timePeriodStats.value.gunStats).map(([gunId, stats]) => ({
      gunId: gunId.replace('charger', '充电桩').replace('_gun', '枪'),
      totalChargeTime: stats.totalChargeTime,
      totalIdleTime: stats.totalIdleTime,
      chargingAmount: stats.chargingAmount
    }));
  });
  
  // 初始化时间段
  const initTimePeriod = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    // 格式化为datetime-local格式
    startTime.value = formatDate(oneHourAgo);
    endTime.value = formatDate(now);
  };
  
  // 格式化日期为datetime-local格式
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  // 更新时间段
  const updateTimePeriod = () => {
    const startDate = new Date(startTime.value);
    const endDate = new Date(endTime.value);
    
    if (startDate < endDate) {
      store.timePeriodStats.startTime = startDate.getTime();
      store.timePeriodStats.endTime = endDate.getTime();
      // 重置统计数据
      resetStats();
    }
  };
  
  // 重置为默认时间
  const resetTimePeriod = () => {
    initTimePeriod();
    updateTimePeriod();
  };
  
  // 重置统计数据
  const resetStats = () => {
    store.timePeriodStats.chargingAmount = 0;
    store.timePeriodStats.gridDischargeAmount = 0;
    store.timePeriodStats.batteryDischargeAmount = 0;
    store.timePeriodStats.batteryChargeAmount = 0;
    store.timePeriodStats.batteryLossAmount = 0;
    store.timePeriodStats.chargingAmountCost = 0;
    store.timePeriodStats.gridDischargeAmountCost = 0;
    store.timePeriodStats.batteryDischargeAmountCost = 0;
    store.timePeriodStats.batteryChargeAmountCost = 0;
    store.timePeriodStats.batteryLossAmountCost = 0;
    store.timePeriodStats.carChargeCount = 0;
    store.timePeriodStats.gunStats = {};
  };
  
  // 初始化
  initTimePeriod();
</script>

<style scoped>
</style>