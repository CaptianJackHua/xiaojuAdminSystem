<script setup lang="ts">
import { computed } from 'vue'
import { BlockItem, User } from '@/message/mock'
import { currentUser, getUser, messageState, unblockUser } from '@/message/store'

interface BlockRow {
  item: BlockItem
  user: User
}

const me = computed(() => currentUser())
const rows = computed<BlockRow[]>(() => {
  const result: BlockRow[] = []
  messageState.blocks.forEach((item) => {
    if (item.ownerId !== me.value.id) return
    const user = getUser(item.targetId)
    if (user) result.push({ item, user })
  })
  return result
})

function unblock(row: BlockRow) {
  unblockUser(me.value.id, row.user.id)
  uni.showToast({ title: `已解除对${row.user.nickname}的拉黑`, icon: 'none' })
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="msg-app-blocks" />
    <view class="page">
      <view class="breadcrumb">
        <text>私信管理</text><text class="sep">/</text><text>APP 演示</text><text class="sep">/</text><text class="cur">拉黑列表</text>
      </view>
      <view class="page-head">
        <view>
          <text class="page-title">拉黑管理</text>
          <text class="page-sub">当前账号已拉黑 {{ rows.length }} 人，解除后恢复私信能力</text>
        </view>
      </view>

      <view class="demo-stage">
        <phone-demo>
          <view class="app-screen">
            <view class="mobile-title">
              <text class="mobile-heading">拉黑列表</text>
              <text class="mobile-caption">{{ rows.length }} 人</text>
            </view>
            <scroll-view scroll-y class="block-scroll">
              <view v-if="rows.length" class="block-list">
                <view v-for="row in rows" :key="row.item.id" class="block-item">
                  <view class="avatar" :style="{ backgroundColor: row.user.avatarColor }">{{ row.user.nickname.charAt(0) }}</view>
                  <view class="block-main">
                    <text class="nickname">{{ row.user.nickname }}</text>
                    <text class="block-time">拉黑时间 · {{ row.item.createdAt }}</text>
                  </view>
                  <view class="unblock-button" @click="unblock(row)">解除拉黑</view>
                </view>
              </view>
              <view v-else class="empty-state">
                <view class="empty-shield"><view class="shield-check" /></view>
                <text class="empty-title">拉黑列表为空</text>
                <text class="empty-desc">在会话列表左滑即可屏蔽用户</text>
              </view>
            </scroll-view>
          </view>
        </phone-demo>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 24rpx 32rpx 40rpx 242rpx; box-sizing: border-box; background: #f7f8fa; }
.breadcrumb { display: flex; gap: 6rpx; color: #86909c; font-size: 24rpx; .sep { color: #c9cdd4; } .cur { color: #1d2129; } }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin: 24rpx 0 20rpx; }
.page-title { display: block; color: #1d2129; font-size: 44rpx; font-weight: 700; }
.page-sub { display: block; margin-top: 10rpx; color: #86909c; font-size: 24rpx; }
.demo-stage { display: flex; justify-content: center; padding: 12rpx 0 32rpx; }

.app-screen { height: 100%; display: flex; flex-direction: column; color: #1d2129; background: #f7f8fa; }
.mobile-title { height: 60px; flex-shrink: 0; padding: 0 18px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #f2f3f5; }
.mobile-heading { font-size: 20px; font-weight: 700; }
.mobile-caption { color: #86909c; font-size: 12px; }
.block-scroll { flex: 1; min-height: 0; }
.block-list { padding: 10px 14px; }
.block-item { margin-bottom: 10px; padding: 14px 12px; box-sizing: border-box; display: flex; align-items: center; border: 1px solid #f2f3f5; border-radius: 12px; background: #fff; }
.avatar { width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 17px; font-weight: 600; }
.block-main { flex: 1; min-width: 0; margin-left: 11px; }
.nickname { display: block; font-size: 14px; font-weight: 600; }
.block-time { display: block; margin-top: 6px; color: #a9aeb8; font-size: 9px; white-space: nowrap; }
.unblock-button { height: 28px; margin-left: 8px; padding: 0 10px; box-sizing: border-box; border: 1px solid #165DFF; border-radius: 14px; color: #165DFF; font-size: 10px; line-height: 26px; white-space: nowrap; }
.empty-state { height: 390px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-shield { width: 54px; height: 62px; position: relative; border: 2px solid #c9cdd4; border-radius: 24px 24px 30px 30px; }
.shield-check { position: absolute; left: 17px; top: 20px; width: 18px; height: 10px; box-sizing: border-box; border-left: 2px solid #c9cdd4; border-bottom: 2px solid #c9cdd4; transform: rotate(-45deg); }
.empty-title { margin-top: 24px; color: #4e5969; font-size: 15px; }
.empty-desc { margin-top: 8px; color: #a9aeb8; font-size: 12px; }
</style>
