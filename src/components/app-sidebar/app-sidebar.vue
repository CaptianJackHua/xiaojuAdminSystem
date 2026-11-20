<!-- 全局左侧菜单栏：支持主菜单 + 分组子菜单 -->
<script setup lang="ts">
interface MenuItem {
  key: string
  label: string
  url: string
}
interface MenuGroup {
  key: string
  label: string
  items: MenuItem[]
}

defineProps<{ active?: string }>()

const groups: MenuGroup[] = [
  {
    key: 'func',
    label: '功能配置',
    items: [
      { key: 'app', label: 'APP 功能配置', url: '/pages/index/index' },
      { key: 'meter', label: '仪表功能配置', url: '/pages/wallpaper/index' }
    ]
  },
  {
    key: 'theme',
    label: '主题配置',
    items: [
      { key: 'theme-list', label: '主题库', url: '/pages/theme/list' },
      { key: 'theme-editor', label: '皮肤编辑器', url: '/pages/theme/editor' },
      { key: 'theme-preview', label: '预览与真机', url: '/pages/theme/preview' },
      { key: 'theme-release', label: '发布中心', url: '/pages/theme/release' }
    ]
  },
  {
    key: 'message-app',
    label: '私信管理 · APP演示',
    items: [
      { key: 'msg-app-conversations', label: '私信会话列表', url: '/pages/message/app/conversations' },
      { key: 'msg-app-chat', label: '聊天详情', url: '/pages/message/app/chat' },
      { key: 'msg-app-profile', label: '用户主页私信入口', url: '/pages/message/app/profile' },
      { key: 'msg-app-blocks', label: '拉黑管理', url: '/pages/message/app/blocks' },
      { key: 'msg-app-report', label: '举报提交', url: '/pages/message/app/report' }
    ]
  },
  {
    key: 'message-admin',
    label: '私信管理 · 后台管理',
    items: [
      { key: 'msg-admin-conversations', label: '私信会话查询', url: '/pages/message/admin/conversations' },
      { key: 'msg-admin-detail', label: '后台消息查看', url: '/pages/message/admin/detail' },
      { key: 'msg-admin-reports', label: '举报工单列表', url: '/pages/message/admin/reports' },
      { key: 'msg-admin-config', label: '后台配置', url: '/pages/message/admin/config' }
    ]
  }
]

function go(item: MenuItem, active?: string) {
  if (item.key === active) return
  uni.reLaunch({ url: item.url })
}

function isActive(itemKey: string, active?: string) {
  return itemKey === active
}
</script>

<template>
  <view class="side">
    <view class="side-brand">小驹GO管理后台</view>

    <view v-for="group in groups" :key="group.key" class="side-group">
      <view class="side-group-title">{{ group.label }}</view>
      <view
        v-for="item in group.items"
        :key="item.key"
        class="side-item"
        :class="{ 'side-item--active': isActive(item.key, active) }"
        @click="go(item, active)"
      >
        {{ item.label }}
      </view>
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

.side-group { margin-top: 8rpx; }
.side-group-title {
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 24rpx;
  font-size: 20rpx;
  color: #6b7785;
  letter-spacing: 1rpx;
  text-transform: uppercase;
}

.side-item {
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
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
    border-left: 4rpx solid #7aa5ff;
  }
}
</style>
