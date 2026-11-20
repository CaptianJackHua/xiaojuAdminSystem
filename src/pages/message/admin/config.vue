<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { messageState, resetMessageDemo } from '@/message/store'

const resetDialog = useDialog('message-admin-config')
const form = reactive({
  initialLimit: '',
  replyBonus: '',
  recallSeconds: '',
  retentionDays: '',
  teenMessageEnabled: true
})

function syncForm() {
  form.initialLimit = String(messageState.config.initialLimit)
  form.replyBonus = String(messageState.config.replyBonus)
  form.recallSeconds = String(messageState.config.recallSeconds)
  form.retentionDays = String(messageState.config.retentionDays)
  form.teenMessageEnabled = messageState.config.teenMessageEnabled
}
syncForm()

const ruleSummary = computed(() => {
  const config = messageState.config
  const recall = config.recallSeconds % 60 === 0
    ? `${config.recallSeconds / 60} 分钟`
    : `${config.recallSeconds} 秒`
  return [
    { label: '陌生人消息', value: `未回复前可发 ${config.initialLimit} 条，回复后追加 ${config.replyBonus} 条` },
    { label: '陌生人总上限', value: `对方已回复时共 ${config.initialLimit + config.replyBonus} 条（互关好友不限）` },
    { label: '消息撤回', value: config.recallSeconds === 0 ? '发送后不可撤回' : `发送后 ${recall} 内可撤回` },
    { label: '消息保存', value: config.retentionDays === 0 ? '永久保存' : `保存最近 ${config.retentionDays} 天的消息` },
    { label: '青少年私信', value: config.teenMessageEnabled ? '已开启，仅限互关好友私信' : '已关闭，涉及青少年账号时不可发送' }
  ]
})

function saveConfig() {
  const rawValues = [form.initialLimit, form.replyBonus, form.recallSeconds, form.retentionDays]
  const numberValues = rawValues.map((value) => Number(value))
  if (rawValues.some((value) => !value.trim()) || numberValues.some((value) => !Number.isInteger(value) || value < 0)) {
    uni.showToast({ title: '请填写非负整数', icon: 'none' })
    return
  }
  Object.assign(messageState.config, {
    initialLimit: numberValues[0],
    replyBonus: numberValues[1],
    recallSeconds: numberValues[2],
    retentionDays: numberValues[3],
    teenMessageEnabled: form.teenMessageEnabled
  })
  uni.showToast({ title: '配置已保存并生效', icon: 'success' })
}

async function resetDemo() {
  try {
    await resetDialog.confirm({
      title: '确认重置演示数据？',
      msg: '将恢复全部用户、会话、聊天记录、举报工单和私信配置，APP 端也会同步恢复。此操作不可撤销。',
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      icon: 'warning'
    })
    resetMessageDemo()
    syncForm()
    uni.showToast({ title: '演示数据已重置', icon: 'success' })
  } catch { /* 用户取消 */ }
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="msg-admin-config" />
    <view class="page">
      <view class="breadcrumb">
        <text>私信管理</text><text class="sep">/</text><text class="cur">私信配置</text>
      </view>
      <view class="page-head">
        <view>
          <text class="page-title">私信配置</text>
          <text class="page-sub">配置陌生人消息、撤回、保存周期与青少年规则 · 保存后即时联动 APP</text>
        </view>
        <wd-button plain type="error" size="small" @click="resetDemo">重置演示数据</wd-button>
      </view>

      <view class="config-grid">
        <view class="panel form-panel">
          <view class="panel-head">
            <view>
              <text class="panel-title">规则配置</text>
              <text class="panel-sub">所有数值仅支持非负整数，修改仅在保存后生效</text>
            </view>
            <text class="local-tag">本地表单副本</text>
          </view>

          <view class="form-section">
            <view class="section-title">陌生人私信</view>
            <view class="form-row">
              <view class="form-item">
                <text class="form-label">陌生人初始条数</text>
                <view class="input-wrap">
                  <input v-model="form.initialLimit" class="form-input" type="digit" placeholder="请输入非负整数" placeholder-style="color:#c9cdd4" />
                  <text class="input-unit">条</text>
                </view>
                <text class="form-hint">对方尚未回复时，陌生人最多可发送的消息数</text>
              </view>
              <view class="form-item">
                <text class="form-label">回复追加条数</text>
                <view class="input-wrap">
                  <input v-model="form.replyBonus" class="form-input" type="digit" placeholder="请输入非负整数" placeholder-style="color:#c9cdd4" />
                  <text class="input-unit">条</text>
                </view>
                <text class="form-hint">对方回复后，在初始条数基础上增加的发送额度</text>
              </view>
            </view>
          </view>

          <view class="form-section">
            <view class="section-title">消息管理</view>
            <view class="form-row">
              <view class="form-item">
                <text class="form-label">撤回时长</text>
                <view class="input-wrap">
                  <input v-model="form.recallSeconds" class="form-input" type="digit" placeholder="请输入非负整数" placeholder-style="color:#c9cdd4" />
                  <text class="input-unit">秒</text>
                </view>
                <text class="form-hint">消息发送后允许撤回的时长，0 表示不可撤回</text>
              </view>
              <view class="form-item">
                <text class="form-label">消息保存周期</text>
                <view class="input-wrap">
                  <input v-model="form.retentionDays" class="form-input" type="digit" placeholder="请输入非负整数" placeholder-style="color:#c9cdd4" />
                  <text class="input-unit">天</text>
                </view>
                <text class="form-hint">仅展示保存周期内的消息，0 表示永久保存</text>
              </view>
            </view>
          </view>

          <view class="form-section teen-section">
            <view class="teen-copy">
              <text class="section-title">青少年私信开关</text>
              <text class="form-hint">关闭后，涉及青少年账号的会话不可发送；开启时仍仅限互关好友私信</text>
            </view>
            <view class="switch-wrap">
              <text class="switch-label" :class="{ enabled: form.teenMessageEnabled }">{{ form.teenMessageEnabled ? '已开启' : '已关闭' }}</text>
              <wd-switch v-model="form.teenMessageEnabled" color="#165DFF" />
            </view>
          </view>

          <view class="form-footer">
            <text class="save-tip">保存后立即更新 messageState.config，并联动 APP 发送、撤回和消息保存规则</text>
            <wd-button type="primary" size="small" @click="saveConfig">保存配置</wd-button>
          </view>
        </view>

        <view class="panel summary-panel">
          <view class="panel-head">
            <view>
              <text class="panel-title">当前规则摘要</text>
              <text class="panel-sub">展示已保存并正在生效的配置</text>
            </view>
            <text class="effective-tag">生效中</text>
          </view>
          <view class="summary-list">
            <view v-for="(item, index) in ruleSummary" :key="item.label" class="summary-item">
              <view class="summary-index">{{ index + 1 }}</view>
              <view class="summary-content">
                <text class="summary-label">{{ item.label }}</text>
                <text class="summary-value">{{ item.value }}</text>
              </view>
            </view>
          </view>
          <view class="summary-note">
            <wd-icon name="info" size="26rpx" color="#165DFF" />
            <text>互关好友不受陌生人条数限制；账号被封禁或限制私信时不可发送消息。</text>
          </view>
        </view>
      </view>
    </view>
    <wd-dialog selector="message-admin-config" />
  </view>
</template>

<style lang="scss" scoped>
$primary: #165DFF; $primary-light: #eef4ff;
$text-main: #1d2129; $text-2: #4e5969; $muted: #86909c; $muted-2: #a9aeb8;
$rule: #e5e6eb; $bg-page: #f7f8fa;

.page { min-height: 100vh; padding: 24rpx 32rpx 40rpx 242rpx; background: $bg-page; box-sizing: border-box; }
.breadcrumb { display: flex; gap: 6rpx; color: $muted; font-size: 24rpx; .sep { color: $muted-2; } .cur { color: $text-main; } }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; margin: 24rpx 0 20rpx; }
.page-title { display: block; color: $text-main; font-size: 44rpx; font-weight: 700; }
.page-sub { display: block; margin-top: 10rpx; color: $muted; font-size: 24rpx; }
.config-grid { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(360rpx, 0.75fr); gap: 16rpx; align-items: start; }
.panel { min-width: 0; padding: 22rpx 24rpx; background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; }
.panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12rpx; padding-bottom: 16rpx; border-bottom: 2rpx solid $rule; }
.panel-title { display: block; color: $text-main; font-size: 28rpx; font-weight: 600; }
.panel-sub { display: block; margin-top: 6rpx; color: $muted; font-size: 20rpx; }
.local-tag, .effective-tag { flex-shrink: 0; padding: 4rpx 12rpx; color: $text-2; font-size: 19rpx; background: #f2f3f5; border-radius: 20rpx; }
.effective-tag { color: #00b42a; background: #e8ffea; }
.form-section { padding: 22rpx 0; border-bottom: 2rpx solid #f2f3f5; }
.section-title { display: block; margin-bottom: 16rpx; color: $text-main; font-size: 25rpx; font-weight: 600; }
.form-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22rpx; }
.form-item { min-width: 0; }
.form-label { display: block; margin-bottom: 8rpx; color: $text-2; font-size: 22rpx; font-weight: 500; }
.input-wrap { display: flex; align-items: center; height: 64rpx; overflow: hidden; border: 2rpx solid $rule; border-radius: 8rpx; &:focus-within { border-color: $primary; } }
.form-input { flex: 1; min-width: 0; height: 100%; padding: 0 14rpx; color: $text-main; font-size: 25rpx; }
.input-unit { padding: 0 16rpx; color: $muted; font-size: 22rpx; border-left: 2rpx solid #f2f3f5; }
.form-hint { display: block; margin-top: 8rpx; color: $muted; font-size: 19rpx; line-height: 1.5; }
.teen-section { display: flex; align-items: center; justify-content: space-between; gap: 24rpx; }
.teen-copy { flex: 1; .section-title { margin-bottom: 6rpx; } .form-hint { margin-top: 0; } }
.switch-wrap { display: flex; flex-shrink: 0; align-items: center; gap: 12rpx; }
.switch-label { color: $muted; font-size: 22rpx; &.enabled { color: $primary; } }
.form-footer { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; padding-top: 20rpx; }
.save-tip { max-width: 70%; color: $muted; font-size: 19rpx; line-height: 1.5; }
.summary-list { padding-top: 8rpx; }
.summary-item { display: flex; gap: 14rpx; padding: 20rpx 0; border-bottom: 2rpx solid #f2f3f5; }
.summary-index { display: flex; flex-shrink: 0; align-items: center; justify-content: center; width: 36rpx; height: 36rpx; margin-top: 2rpx; color: $primary; font-size: 19rpx; background: $primary-light; border-radius: 50%; }
.summary-content { flex: 1; min-width: 0; }
.summary-label { display: block; color: $text-main; font-size: 23rpx; font-weight: 500; }
.summary-value { display: block; margin-top: 6rpx; color: $text-2; font-size: 21rpx; line-height: 1.55; }
.summary-note { display: flex; align-items: flex-start; gap: 10rpx; margin-top: 20rpx; padding: 14rpx; color: $text-2; font-size: 20rpx; line-height: 1.55; background: $primary-light; border-radius: 8rpx; }
</style>
