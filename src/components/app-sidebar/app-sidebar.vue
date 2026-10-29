<!-- 全局左侧菜单栏 -->
<script setup lang="ts">
interface MenuItem {
  key: string
  label: string
  url: string
}

defineProps<{ active?: string }>()

const menus: MenuItem[] = [
  { key: 'app', label: 'APP 功能配置', url: '/pages/index/index' },
  { key: 'meter', label: '仪表功能配置', url: '/pages/wallpaper/index' }
]

function go(item: MenuItem, active?: string) {
  if (item.key === active) return
  uni.reLaunch({ url: item.url })
}
</script>

<template>
  <view class="side">
    <view class="side-brand">小驹GO管理后台</view>
    <view
      v-for="item in menus"
      :key="item.key"
      class="side-item"
      :class="{ 'side-item--active': item.key === active }"
      @click="go(item, active)"
    >
      {{ item.label }}
    </view>
  </view>
</template>

<style lang="scss" scoped>
.side {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 210rpx;
  background: #1b2836;
  z-index: 100;
  overflow-y: auto;
  padding-bottom: 24rpx;
  box-sizing: border-box;
}

.side-brand {
  height: 96rpx;
  line-height: 96rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #fff;
  letter-spacing: 1rpx;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.08);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side-item {
  height: 84rpx;
  line-height: 84rpx;
  padding: 0 24rpx;
  font-size: 25rpx;
  color: #c2cbd6;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.15s;

  &:active {
    background: rgba(255, 255, 255, 0.08);
  }

  &--active {
    background: #2f6bff;
    color: #fff;
    font-weight: 500;
  }
}
</style>
