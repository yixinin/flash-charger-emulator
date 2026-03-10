<template>
  <v-container fluid>
    <v-card elevation="2" class="mt-6">
      <v-card-title class="text-center">欢迎使用充电站模拟器</v-card-title>
      <v-card-text>
        <div class="welcome-content">
          <v-img
            src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electric%20vehicle%20charging%20station%20with%20multiple%20charging%20piles%20and%20electric%20cars&image_size=landscape_16_9"
            alt="充电站" 
            class="mb-6"
            contain
          />
          <p class="text-center mb-6">
            这是一个基于Vue 3 + TypeScript + Vuetify 4开发的充电站模拟器，
            可以模拟充电站的运行状态、功率分配和收支情况。
          </p>
          <div class="welcome-buttons">
            <v-btn to="/config" color="primary" large class="mr-4">
              <v-icon left>mdi-cog</v-icon>
              配置
            </v-btn>
            <v-btn to="/scene" color="secondary" large class="mr-4">
              <v-icon left>mdi-map</v-icon>
              场景
            </v-btn>
            <v-btn to="/stats" color="accent" large>
              <v-icon left>mdi-chart-bar</v-icon>
              统计
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
  //
</script>

<style scoped>
  .welcome-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .welcome-buttons {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
</style>