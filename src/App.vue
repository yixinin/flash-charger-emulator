<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-title>充电站模拟器</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn to="/" text>首页</v-btn>
      <v-btn to="/config" text>配置</v-btn>
      <v-btn to="/scene" text>场景</v-btn>
      <v-btn to="/stats" text>统计</v-btn>
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  //
</script>
