<script setup lang="ts">
import { computed, ref } from 'vue'
import { parseTime } from '@/message/mock'
import { getUser, isMutual, messageState } from '@/message/store'

const keyword = ref('')
const startDate = ref('')
const endDate = ref('')

const list = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const start = startDate.value ? parseTime(`${startDate.value} 00:00:00`) : 0
  const end = endDate.value ? parseTime(`${endDate.value} 23:59:59`) : 0
  return messageState.conversations
    .filter((conversation) => {
      const users = conversation.userIds.map((id) => getUser(id))
      const matchesKeyword = !kw || conversation.id.toLowerCase().includes(kw) || users.some((user) =>
        !!user && (user.id.toLowerCase().includes(kw) || user.nickname.toLowerCase().includes(kw))
      )
      if (!matchesKeyword) return false
      const lastTime = parseTime(conversation.lastAt)
      if (start && lastTime < start) return false
      if (end && lastTime > end) return false
      return true
    })
    .sort((a, b) => parseTime(b.lastAt) - parseTime(a.lastAt))
})

function userName(id: string) {
  return getUser(id)?.nickname || '未知用户'
}

function relation(userIds: string[]) {
  return userIds.length >= 2 && isMutual(userIds[0], userIds[1]) ? '互关好友' : '陌生人'
}

function resetFilter() {
  keyword.value = ''
  startDate.value = ''
  endDate.value = ''
}

function viewMessages(id: string) {
  uni.navigateTo({ url: `/pages/message/admin/detail?id=${encodeURIComponent(id)}` })
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="msg-admin-conversations" />
    <view class="page">
      <view class="breadcrumb">
        <text>私信管理</text><text class="sep">/</text><text class="cur">会话查询</text>
      </view>
      <view class="page-head">
        <view>
          <text class="page-title">会话查询</text>
          <text class="page-sub">查询会话双方、关系与最新动态 · 当前 {{ list.length }} / {{ messageState.conversations.length }} 条</text>
        </view>
        <wd-button plain size="small" @click="resetFilter">重置筛选</wd-button>
      </view>

      <view class="filter-card">
        <view class="search-box">
          <wd-icon name="search" size="28rpx" color="#a9aeb8" />
          <input
            v-model="keyword"
            class="search-input"
            placeholder="搜索会话 ID / 双方用户 ID / 昵称"
            placeholder-style="color:#a9aeb8"
          />
        </view>
        <view class="date-filter">
          <text class="filter-label">最后消息时间</text>
          <input v-model="startDate" class="date-input" placeholder="YYYY-MM-DD" placeholder-style="color:#c9cdd4" />
          <text class="date-sep">至</text>
          <input v-model="endDate" class="date-input" placeholder="YYYY-MM-DD" placeholder-style="color:#c9cdd4" />
        </view>
      </view>

      <view class="table-card">
        <view class="table-head">
          <text class="col col-id">会话 ID</text>
          <text class="col col-users">双方用户</text>
          <text class="col col-relation">好友 / 陌生人</text>
          <text class="col col-message">最新消息</text>
          <text class="col col-time">时间</text>
          <text class="col col-unread">未读</text>
          <text class="col col-action">操作</text>
        </view>
        <block v-if="list.length">
          <view v-for="item in list" :key="item.id" class="table-row">
            <view class="col col-id">
              <text class="conversation-id">{{ item.id }}</text>
              <text v-if="item.muted" class="muted-text">已免打扰</text>
            </view>
            <view class="col col-users">
              <view v-for="id in item.userIds" :key="id" class="user-line">
                <view class="mini-avatar" :style="{ background: getUser(id)?.avatarColor || '#c9cdd4' }">
                  {{ userName(id).slice(0, 1) }}
                </view>
                <text class="user-name">{{ userName(id) }}</text>
                <text class="user-id">{{ id }}</text>
              </view>
            </view>
            <view class="col col-relation">
              <text class="relation-tag" :class="{ friend: relation(item.userIds) === '互关好友' }">
                {{ relation(item.userIds) }}
              </text>
            </view>
            <text class="col col-message last-message">{{ item.lastMessage || '暂无消息' }}</text>
            <text class="col col-time time-text">{{ item.lastAt }}</text>
            <view class="col col-unread">
              <text class="unread-count" :class="{ active: item.unread > 0 }">{{ item.unread }}</text>
            </view>
            <view class="col col-action">
              <text class="link" @click="viewMessages(item.id)">查看消息</text>
            </view>
          </view>
        </block>
        <view v-else class="empty-row">
          <wd-icon name="search" size="64rpx" color="#c9cdd4" />
          <text class="empty-title">没有匹配的会话</text>
          <text class="empty-desc">请调整用户关键词或起止时间后重试</text>
          <wd-button plain type="primary" size="small" @click="resetFilter">清空筛选条件</wd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$primary: #165DFF; $primary-light: #eef4ff;
$text-main: #1d2129; $text-2: #4e5969; $muted: #86909c; $muted-2: #a9aeb8;
$rule: #e5e6eb; $bg-page: #f7f8fa;

.page { min-height: 100vh; background: $bg-page; padding: 24rpx 32rpx 40rpx 242rpx; box-sizing: border-box; }
.breadcrumb { display: flex; gap: 6rpx; font-size: 24rpx; color: $muted; .sep { color: $muted-2; } .cur { color: $text-main; } }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; margin: 24rpx 0 20rpx; }
.page-title { display: block; color: $text-main; font-size: 44rpx; font-weight: 700; }
.page-sub { display: block; margin-top: 10rpx; color: $muted; font-size: 24rpx; }
.filter-card { display: flex; align-items: center; gap: 24rpx; flex-wrap: wrap; margin-bottom: 20rpx; padding: 20rpx 24rpx; background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; }
.search-box { display: flex; align-items: center; gap: 12rpx; width: 460rpx; height: 64rpx; padding: 0 16rpx; border: 2rpx solid $rule; border-radius: 10rpx; }
.search-input { flex: 1; height: 100%; color: $text-main; font-size: 24rpx; }
.date-filter { display: flex; align-items: center; gap: 12rpx; }
.filter-label { color: $text-2; font-size: 24rpx; }
.date-input { width: 190rpx; height: 56rpx; padding: 0 12rpx; color: $text-main; font-size: 22rpx; border: 2rpx solid $rule; border-radius: 8rpx; box-sizing: border-box; }
.date-sep { color: $muted; font-size: 22rpx; }
.table-card { overflow: hidden; background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; }
.table-head, .table-row { display: flex; align-items: center; padding: 20rpx 16rpx; border-bottom: 2rpx solid $rule; }
.table-head { background: #fafbfc; color: $text-2; font-size: 22rpx; font-weight: 500; }
.table-row { min-height: 116rpx; color: $text-2; font-size: 22rpx; &:last-child { border-bottom: 0; } &:hover { background: #f7faff; } }
.col { flex-shrink: 0; padding: 0 10rpx; box-sizing: border-box; }
.col-id { width: 118rpx; }
.col-users { flex: 1.45; min-width: 270rpx; }
.col-relation { width: 150rpx; }
.col-message { flex: 1.35; min-width: 190rpx; }
.col-time { width: 230rpx; }
.col-unread { width: 76rpx; text-align: center; }
.col-action { width: 120rpx; }
.conversation-id { display: block; color: $primary; font-size: 24rpx; font-weight: 600; }
.muted-text { display: block; margin-top: 6rpx; color: $muted; font-size: 18rpx; }
.user-line { display: flex; align-items: center; gap: 8rpx; min-width: 0; & + .user-line { margin-top: 10rpx; } }
.mini-avatar { display: flex; flex-shrink: 0; align-items: center; justify-content: center; width: 36rpx; height: 36rpx; color: #fff; font-size: 18rpx; border-radius: 50%; }
.user-name { max-width: 130rpx; overflow: hidden; color: $text-main; font-size: 23rpx; text-overflow: ellipsis; white-space: nowrap; }
.user-id { color: $muted; font-size: 19rpx; }
.relation-tag { display: inline-block; padding: 4rpx 12rpx; color: #f77234; font-size: 20rpx; background: #fff7e8; border-radius: 20rpx; &.friend { color: #00b42a; background: #e8ffea; } }
.last-message { display: -webkit-box; overflow: hidden; color: $text-main; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.time-text { color: $muted; font-size: 20rpx; line-height: 1.5; }
.unread-count { color: $muted; font-size: 24rpx; &.active { display: inline-flex; align-items: center; justify-content: center; min-width: 36rpx; height: 36rpx; padding: 0 8rpx; color: #fff; background: #f53f3f; border-radius: 20rpx; box-sizing: border-box; } }
.link { color: $primary; font-size: 23rpx; cursor: pointer; }
.empty-row { display: flex; flex-direction: column; align-items: center; gap: 14rpx; padding: 70rpx 24rpx; color: $muted; }
.empty-title { color: $text-2; font-size: 26rpx; }
.empty-desc { margin-bottom: 8rpx; color: $muted; font-size: 22rpx; }
</style>
