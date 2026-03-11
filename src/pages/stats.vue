<template>
  <v-container fluid>
    <!-- 累计统计数据 -->
    <v-card elevation="2" class="mb-4">
      <v-card-title>累计统计数据</v-card-title>
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
          
          <!-- 毛利 -->
          <v-col cols="12" md="6" lg="3">
            <v-card>
              <v-card-text>
                <h3 class="text-h4">毛利</h3>
                <p class="text-2xl" :class="financeData.totalProfit >= 0 ? 'text-green' : 'text-red'">¥{{ financeData.totalProfit.toFixed(2) }}</p>
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
          class="elevation-1 gun-stats-table"
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
  import { computed } from 'vue';
  import { useStore } from '../store';
  
  const store = useStore();
  
  // 从store中获取数据
  const timePeriodStats = computed(() => store.timePeriodStats);
  const financeData = computed(() => store.financeData);
  
  // 格式化时间（秒转换为时分秒）
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };
  
  // 充电枪统计数据表格头
  const gunStatsHeaders = [
    { title: '充电枪', value: 'gunId' },
    { title: '总充电时间', value: 'totalChargeTime' },
    { title: '总空闲时间', value: 'totalIdleTime' },
    { title: '充电量 (kWh)', value: 'chargingAmount' }
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
</script>

<style scoped>
  /* 充电枪统计表格样式 */
  :deep(.gun-stats-table .v-data-table__th) {
    background-color: #e8eaf6 !important;
    color: #1a237e !important;
    font-weight: 600 !important;
    font-size: 14px !important;
  }
  
  :deep(.gun-stats-table .v-data-table__th span) {
    color: #1a237e !important;
  }
  
  :deep(.gun-stats-table .v-data-table__wrapper) {
    border: 1px solid #c5cae9;
    border-radius: 4px;
  }
  
  :deep(.gun-stats-table .v-data-table__tr:hover) {
    background-color: #f5f7ff !important;
  }
  
  :deep(.gun-stats-table .v-data-table__tr:hover td) {
    color: #1a237e !important;
  }
</style>
