<!--
  发布中心：
  - 四步标准流程：设计提交 → 运营配置 → 灰度观察 → 全量
  - 发布范围：车型 / 终端 / 渠道 / 人群
  - 定时发布 / 灰度放量 / 版本回滚 / 跳过灰度紧急全量
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { mockHistory, HistoryVersion, mockCarModels, mockTerminals } from '@/theme/mock'

const skipDialog = useDialog('skip-gray')
const rollbackDialog = useDialog('rollback')

// 主题
const skinName = ref('夏日骑行·薄荷绿')
const skinCode = ref('summer-mint')
const skinStatus = ref<'draft' | 'gray' | 'online' | 'offline'>('gray')

// 发布配置
const effectiveTime = ref('2026-11-15 00:00')
const grayRatio = ref(15)
const isScheduled = ref(false)
const scheduleTime = ref('2026-11-14 20:00')
const audienceType = ref('percent')
const whitelistText = ref('')
const tagText = ref('')

// 渠道
const channels = ref<string[]>(['Android', 'iOS'])
function toggleChannel(c: string) {
  const i = channels.value.indexOf(c)
  if (i === -1) channels.value.push(c)
  else channels.value.splice(i, 1)
}

// 发布范围：车型 / 终端
const scopeCars = ref<string[]>(['c-m1', 'c-m2', 'c-m4'])
const scopeTerminals = ref<string[]>(['t-1', 't-2', 't-3'])
function toggleCar(id: string) {
  const i = scopeCars.value.indexOf(id)
  if (i === -1) scopeCars.value.push(id)
  else scopeCars.value.splice(i, 1)
}
function toggleTerminal(id: string) {
  const i = scopeTerminals.value.indexOf(id)
  if (i === -1) scopeTerminals.value.push(id)
  else scopeTerminals.value.splice(i, 1)
}

const canSkipGray = ref(false)

// 四步流程（已去掉审核）
const steps = computed(() => {
  const all = [
    { key: 'design', label: '设计提交', desc: '皮肤 + 资源', done: false },
    { key: 'op', label: '运营配置', desc: '时间 · 灰度 · 人群', done: false },
    { key: 'gray', label: '灰度观察', desc: '指标正常逐步放量', done: false },
    { key: 'online', label: '全量', desc: '线上生效', done: false }
  ]
  const progress: Record<string, number> = { draft: 2, gray: 3, online: 4, offline: 4 }
  const p = progress[skinStatus.value] ?? 1
  return all.map((s, i) => ({ ...s, done: i + 1 <= p }))
})

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#86909c' },
  gray: { label: '灰度中', color: '#165DFF' },
  online: { label: '全量上线', color: '#00b42a' },
  offline: { label: '已下线', color: '#c9cdd4' }
}

// 底部操作
function doToGray() { skinStatus.value = 'gray'; uni.showToast({ title: '已进入灰度', icon: 'success' }) }
function doOnline() { skinStatus.value = 'online'; uni.showToast({ title: '已全量上线', icon: 'success' }) }
function doOffline() { skinStatus.value = 'offline'; uni.showToast({ title: '已下线', icon: 'success' }) }
function doResume() { skinStatus.value = 'gray'; uni.showToast({ title: '已恢复灰度', icon: 'success' }) }

async function askSkip() {
  if (!canSkipGray.value) return uni.showToast({ title: '仅管理员可执行此操作', icon: 'none' })
  try {
    const res = await skipDialog.prompt({
      title: '⚠ 跳过灰度直接全量',
      msg: '所有用户立即看到新皮肤，本次操作将记录到版本历史，请填写原因：',
      type: 'prompt',
      textareaProps: { placeholder: '例如：线上皮肤紧急 Bug 修复', maxlength: 200 },
      confirmButtonText: '确认跳过灰度', cancelButtonText: '取消', icon: 'warning'
    })
    if (String(res.value || '').trim()) {
      skinStatus.value = 'online'
      uni.showToast({ title: '已直接全量，原因已记录', icon: 'success' })
    }
  } catch { /* */ }
}

async function askRollback(v: HistoryVersion) {
  try {
    await rollbackDialog.confirm({
      title: `回滚到 v${v.version}`,
      msg: `将回滚到 v${v.version}（${v.action} · ${v.time}）。`,
      confirmButtonText: '确认回滚', cancelButtonText: '再想想'
    })
    uni.showToast({ title: `已回滚到 v${v.version}`, icon: 'success' })
  } catch { /* */ }
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="theme-release" />

    <view class="page">
      <view class="breadcrumb">
        <text>主题配置</text><text class="sep">/</text><text class="cur">发布中心</text>
      </view>

      <!-- 主题信息卡 -->
      <view class="skin-card">
        <view class="skin-cover" style="background: linear-gradient(135deg, #00B42A, #7BE188);">
          <text class="skin-cover-label">夏日骑行</text>
        </view>
        <view class="skin-meta">
          <text class="skin-name">{{ skinName }}</text>
          <text class="skin-desc">{{ skinCode }} · 季节 · 主色 #00B42A</text>
          <view class="skin-tags">
            <view class="tag tag--primary">适用 iOS + Android</view>
            <view class="tag">灰度 {{ grayRatio }}%</view>
            <view class="tag">车型 {{ scopeCars.length }} / 终端 {{ scopeTerminals.length }}</view>
          </view>
        </view>
        <view class="skin-status-wrap">
          <view class="skin-status" :style="{ background: STATUS_META[skinStatus].color }">
            {{ STATUS_META[skinStatus].label }}
          </view>
        </view>
      </view>

      <!-- 四步流程 -->
      <view class="flow-card">
        <view class="flow-title">
          <text>标准发布流程</text>
          <text class="flow-sub">共 4 步 · 当前节点高亮</text>
        </view>
        <view class="flow-steps">
          <template v-for="(s, i) in steps" :key="s.key">
            <view class="flow-step" :class="{ done: s.done, last: i === steps.length - 1 }">
              <view class="flow-node">
                <wd-icon v-if="s.done" name="check" size="26rpx" color="#fff" />
                <text v-else>{{ i + 1 }}</text>
              </view>
              <view class="flow-label">
                <text class="flow-label__name">{{ s.label }}</text>
                <text class="flow-label__desc">{{ s.desc }}</text>
              </view>
              <view v-if="i < steps.length - 1" class="flow-line" :class="{ done: steps[i + 1].done }" />
            </view>
          </template>
        </view>
      </view>

      <view class="main-grid">
        <!-- 左：发布配置 -->
        <view class="panel panel--left">
          <view class="panel-head">
            <text class="panel-title">发布配置</text>
            <view class="panel-tab" :class="{ active: !isScheduled }" @click="isScheduled = false">立即发布</view>
            <view class="panel-tab" :class="{ active: isScheduled }" @click="isScheduled = true">定时发布</view>
          </view>

          <view class="panel-body">
            <view v-if="isScheduled" class="row">
              <text class="row-label">定时时间</text>
              <input v-model="scheduleTime" class="date-input" placeholder="YYYY-MM-DD HH:mm" placeholder-style="color:#c9cdd4" />
            </view>
            <view class="row">
              <text class="row-label">生效时间</text>
              <input v-model="effectiveTime" class="date-input" placeholder="YYYY-MM-DD HH:mm" placeholder-style="color:#c9cdd4" />
            </view>

            <view class="row row--column">
              <text class="row-label">灰度比例</text>
              <view class="gray-control">
                <view class="gray-slider"><view class="gray-slider__fill" :style="{ width: grayRatio + '%' }" /></view>
                <view class="gray-input-wrap">
                  <wd-icon name="minus" size="28rpx" color="#4e5969" @click="grayRatio = Math.max(0, grayRatio - 5)" />
                  <text class="gray-value">{{ grayRatio }}%</text>
                  <wd-icon name="plus" size="28rpx" color="#4e5969" @click="grayRatio = Math.min(100, grayRatio + 5)" />
                </view>
              </view>
              <view class="gray-quicks">
                <view v-for="q in [5, 15, 40, 70, 100]" :key="q" class="quick"
                  :class="{ active: grayRatio === q }" @click="grayRatio = q">{{ q }}%</view>
              </view>
            </view>

            <view class="row row--column">
              <text class="row-label">人群范围</text>
              <view class="seg-row">
                <view class="seg-item" :class="{ active: audienceType === 'percent' }" @click="audienceType = 'percent'">按比例</view>
                <view class="seg-item" :class="{ active: audienceType === 'whitelist' }" @click="audienceType = 'whitelist'">白名单</view>
                <view class="seg-item" :class="{ active: audienceType === 'tag' }" @click="audienceType = 'tag'">按标签</view>
              </view>
              <input v-if="audienceType === 'whitelist'" v-model="whitelistText" class="wide-input"
                placeholder="open_id 逗号分隔" placeholder-style="color:#c9cdd4" />
              <input v-if="audienceType === 'tag'" v-model="tagText" class="wide-input"
                placeholder="如 活跃用户,内测用户" placeholder-style="color:#c9cdd4" />
            </view>

            <view class="row row--column">
              <text class="row-label">渠道</text>
              <view class="channels">
                <view v-for="c in ['Android', 'iOS', '小程序']" :key="c" class="channel"
                  :class="{ active: channels.includes(c) }" @click="toggleChannel(c)">
                  <view class="channel-check"><view v-if="channels.includes(c)" class="channel-tick" /></view>
                  <text>{{ c }}</text>
                </view>
              </view>
            </view>

            <!-- 发布范围：车型 -->
            <view class="row row--column">
              <text class="row-label">发布范围 - 车型</text>
              <view class="range-pills">
                <view
                  v-for="m in mockCarModels" :key="m.id"
                  class="range-pill"
                  :class="{ active: scopeCars.includes(m.id) }"
                  @click="toggleCar(m.id)"
                >
                  <text class="range-pill__name">{{ m.name }}</text>
                  <text class="range-pill__sub">{{ m.year }} · {{ m.tags.join('/') }}</text>
                </view>
              </view>
            </view>

            <!-- 发布范围：终端 -->
            <view class="row row--column">
              <text class="row-label">发布范围 - 终端</text>
              <view class="range-pills">
                <view
                  v-for="t in mockTerminals" :key="t.id"
                  class="range-pill"
                  :class="{ active: scopeTerminals.includes(t.id) }"
                  @click="toggleTerminal(t.id)"
                >
                  <text class="range-pill__name">{{ t.name }}</text>
                  <text class="range-pill__sub">{{ t.type }}</text>
                </view>
              </view>
            </view>

            <!-- 紧急跳过灰度 -->
            <view class="skip-box">
              <view class="skip-head">
                <wd-icon name="warning" size="28rpx" color="#F77234" />
                <text>紧急：跳过灰度直接全量</text>
                <wd-switch v-model="canSkipGray" size="small" color="#F53F3F" />
              </view>
              <text class="skip-note">启用后可一键全量，必须填写原因并记录到版本历史。仅限线上问题修复使用。</text>
              <wd-button v-if="canSkipGray" plain type="error" size="small" @click="askSkip">立即跳过灰度 → 全量</wd-button>
            </view>
          </view>
        </view>

        <!-- 右：版本历史 -->
        <view class="panel panel--right">
          <view class="panel-head">
            <text class="panel-title">历史版本</text>
            <text class="panel-sub">最近 {{ mockHistory.length }} 个 · 可一键回滚</text>
          </view>
          <view class="timeline">
            <view v-for="v in mockHistory" :key="v.version" class="tl-item"
              :class="{ latest: v.version === Math.max(...mockHistory.map(h => h.version)) }"
            >
              <view class="tl-dot" :style="{ background: v.version === 10 ? '#165DFF' : '#c9cdd4' }" />
              <view class="tl-body">
                <view class="tl-head">
                  <text class="tl-version">v{{ v.version }}</text>
                  <view class="tl-action">{{ v.action }}</view>
                </view>
                <text class="tl-remark">{{ v.remark }}</text>
                <text class="tl-meta">{{ v.time }} · {{ v.operator }}</text>
              </view>
              <text v-if="v.version < 10" class="tl-rollback" @click="askRollback(v)">回滚</text>
              <view v-else class="tl-latest-tag">当前</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="footer-bar">
        <view class="footer-left">
          <text class="tip">当前状态：</text>
          <view class="status-pill" :style="{ background: STATUS_META[skinStatus].color }">
            {{ STATUS_META[skinStatus].label }}
          </view>
        </view>
        <view class="footer-btns">
          <!-- draft -->
          <wd-button v-if="skinStatus === 'draft'" plain size="small">保存草稿</wd-button>
          <wd-button v-if="skinStatus === 'draft'" type="primary" size="small" @click="doToGray">提交运营配置</wd-button>
          <!-- gray -->
          <wd-button v-if="skinStatus === 'gray'" plain type="primary" size="small" @click="doOffline">提前下线</wd-button>
          <wd-button v-if="skinStatus === 'gray'" type="primary" size="small" @click="doOnline">确认全量</wd-button>
          <!-- online -->
          <wd-button v-if="skinStatus === 'online'" plain type="primary" size="small" @click="doOffline">下线</wd-button>
          <!-- offline -->
          <wd-button v-if="skinStatus === 'offline'" plain type="primary" size="small" @click="doResume">恢复灰度</wd-button>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$primary: #165DFF; $primary-light: #eef4ff;
$text-main: #1d2129; $text-2: #4e5969; $muted: #86909c; $muted-2: #a9aeb8;
$rule: #e5e6eb; $bg-page: #f7f8fa;

.page { min-height: 100vh; background: $bg-page; padding: 24rpx 32rpx 160rpx 242rpx; box-sizing: border-box; }
.breadcrumb { font-size: 24rpx; color: $muted; display: flex; gap: 6rpx; .sep { color: $muted-2; } .cur { color: $text-main; } }

.skin-card {
  background: #fff; border: 2rpx solid $rule; border-radius: 12rpx;
  padding: 20rpx; margin: 24rpx 0 16rpx; display: flex; align-items: center; gap: 20rpx;
}
.skin-cover { width: 120rpx; height: 120rpx; border-radius: 12rpx; flex-shrink: 0; display: flex; align-items: flex-end; padding: 8rpx; }
.skin-cover-label { font-size: 18rpx; color: #fff; background: rgba(0,0,0,0.3); padding: 2rpx 8rpx; border-radius: 4rpx; }
.skin-meta { flex: 1; min-width: 0; }
.skin-name { display: block; font-size: 30rpx; font-weight: 600; color: $text-main; }
.skin-desc { display: block; font-size: 20rpx; color: $muted; margin-top: 4rpx; }
.skin-tags { display: flex; gap: 10rpx; margin-top: 10rpx; flex-wrap: wrap; }
.tag { padding: 4rpx 12rpx; background: #f2f3f5; color: $text-2; font-size: 20rpx; border-radius: 6rpx; }
.tag--primary { background: $primary-light; color: $primary; }
.skin-status { padding: 8rpx 20rpx; border-radius: 20rpx; font-size: 22rpx; color: #fff; font-weight: 500; }

.flow-card { background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; padding: 20rpx 24rpx; margin-bottom: 16rpx; }
.flow-title { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12rpx; border-bottom: 2rpx solid $rule; font-size: 26rpx; font-weight: 500; color: $text-main; }
.flow-sub { font-size: 20rpx; color: $muted; font-weight: 400; }
.flow-steps { display: flex; padding: 24rpx 0; }
.flow-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx; position: relative; }
.flow-node {
  width: 44rpx; height: 44rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 20rpx; font-weight: 500; background: #f2f3f5; color: $muted; position: relative; z-index: 1;
  border: 3rpx solid #fff;
}
.flow-step.done .flow-node { background: $primary; color: #fff; }
.flow-label { text-align: center; }
.flow-label__name { display: block; font-size: 22rpx; color: $text-2; font-weight: 500; }
.flow-step.done .flow-label__name { color: $text-main; }
.flow-label__desc { display: block; font-size: 18rpx; color: $muted; margin-top: 2rpx; }
.flow-line { position: absolute; top: 22rpx; left: 50%; width: 100%; height: 4rpx; background: #f2f3f5; }
.flow-line.done { background: $primary; }
.flow-step.last .flow-line { display: none; }

.main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 16rpx; align-items: start; }
.panel { background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; padding: 20rpx 24rpx; }
.panel-head { display: flex; align-items: center; gap: 12rpx; padding-bottom: 12rpx; border-bottom: 2rpx solid $rule; margin-bottom: 16rpx; }
.panel-title { font-size: 28rpx; font-weight: 600; color: $text-main; flex-shrink: 0; }
.panel-sub { font-size: 18rpx; color: $muted; }
.panel-tab { padding: 6rpx 18rpx; border-radius: 20rpx; font-size: 20rpx; color: $text-2; background: #f7f8fa;
  &.active { background: $primary-light; color: $primary; font-weight: 500; } }

.panel-body { display: flex; flex-direction: column; gap: 16rpx; }
.row { display: flex; align-items: center; gap: 16rpx; }
.row--column { flex-direction: column; align-items: stretch; gap: 8rpx; }
.row-label { font-size: 22rpx; color: $text-2; flex-shrink: 0; font-weight: 500; }
.date-input { flex: 1; height: 52rpx; border: 2rpx solid $rule; border-radius: 6rpx; padding: 0 10rpx; font-size: 22rpx; color: $text-main; }
.wide-input { height: 52rpx; border: 2rpx solid $rule; border-radius: 6rpx; padding: 0 10rpx; font-size: 22rpx; color: $text-main; width: 100%; box-sizing: border-box; }

.gray-control { display: flex; align-items: center; gap: 16rpx; }
.gray-slider { flex: 1; height: 10rpx; border-radius: 5rpx; background: #f2f3f5; }
.gray-slider__fill { height: 100%; border-radius: 5rpx; background: $primary; }
.gray-input-wrap { display: flex; align-items: center; gap: 10rpx; padding: 0 10rpx; border: 2rpx solid $rule; border-radius: 6rpx; height: 52rpx; min-width: 160rpx; }
.gray-value { font-size: 22rpx; font-weight: 500; color: $text-main; min-width: 70rpx; text-align: center; }
.gray-quicks { display: flex; gap: 8rpx; }
.quick { padding: 4rpx 14rpx; border-radius: 4rpx; font-size: 20rpx; color: $text-2; background: #f7f8fa;
  &.active { background: $primary-light; color: $primary; font-weight: 500; } }

.seg-row { display: flex; gap: 6rpx; }
.seg-item { padding: 6rpx 16rpx; border-radius: 4rpx; font-size: 20rpx; color: $text-2; background: #f7f8fa;
  &.active { background: $primary-light; color: $primary; font-weight: 500; } }

.channels { display: flex; gap: 10rpx; flex-wrap: wrap; }
.channel { display: flex; align-items: center; gap: 6rpx; padding: 8rpx 14rpx; border: 2rpx solid $rule; border-radius: 6rpx; font-size: 22rpx; color: $text-2;
  &.active { border-color: $primary; background: $primary-light; color: $primary; } }
.channel-check { width: 22rpx; height: 22rpx; border-radius: 4rpx; border: 2rpx solid #c9cdd4; display: flex; align-items: center; justify-content: center; }
.channel.active .channel-check { border-color: $primary; background: $primary; }
.channel-tick { width: 10rpx; height: 5rpx; border-left: 2rpx solid #fff; border-bottom: 2rpx solid #fff; transform: rotate(-45deg) translate(0, -2rpx); }

.range-pills { display: flex; gap: 8rpx; flex-wrap: wrap; }
.range-pill {
  padding: 8rpx 14rpx; border-radius: 8rpx; border: 2rpx solid $rule;
  display: flex; flex-direction: column; gap: 2rpx; background: #fff;
  &.active { border-color: $primary; background: $primary-light; }
}
.range-pill__name { font-size: 22rpx; color: $text-main; font-weight: 500; }
.range-pill__sub { font-size: 18rpx; color: $muted; }
.range-pill.active .range-pill__name { color: $primary; }

.skip-box { border: 2rpx solid #FFE2D1; background: #FFF7E8; border-radius: 10rpx; padding: 14rpx 16rpx; }
.skip-head { display: flex; align-items: center; gap: 8rpx; font-size: 22rpx; color: #F77234; font-weight: 500; }
.skip-note { display: block; font-size: 18rpx; color: $text-2; margin: 6rpx 0 12rpx; line-height: 1.5; }

.timeline { display: flex; flex-direction: column; }
.tl-item { display: flex; gap: 12rpx; padding: 12rpx 0; border-bottom: 2rpx solid #f2f3f5; &:last-child { border-bottom: none; } }
.tl-item.latest { background: $primary-light; border-radius: 8rpx; padding: 12rpx 16rpx; margin: 0 -4rpx; }
.tl-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #c9cdd4; margin-top: 8rpx; flex-shrink: 0; }
.tl-body { flex: 1; min-width: 0; }
.tl-head { display: flex; align-items: center; gap: 8rpx; margin-bottom: 4rpx; }
.tl-version { font-size: 22rpx; font-weight: 600; color: $text-main; }
.tl-action { padding: 2rpx 10rpx; background: #eef4ff; color: $primary; font-size: 18rpx; border-radius: 4rpx; }
.tl-remark { display: block; font-size: 22rpx; color: $text-2; line-height: 1.5; }
.tl-meta { display: block; font-size: 18rpx; color: $muted; margin-top: 4rpx; }
.tl-rollback { font-size: 22rpx; color: $primary; align-self: center; flex-shrink: 0; }
.tl-latest-tag { padding: 2rpx 10rpx; background: $primary; color: #fff; font-size: 18rpx; border-radius: 10rpx; align-self: center; flex-shrink: 0; }

.footer-bar {
  position: fixed; bottom: 0; left: 210rpx; right: 0; background: #fff;
  border-top: 2rpx solid $rule; padding: 16rpx 32rpx calc(16rpx + env(safe-area-inset-bottom));
  display: flex; justify-content: space-between; align-items: center; z-index: 50;
}
.footer-left { display: flex; align-items: center; gap: 10rpx; font-size: 22rpx; color: $text-2; }
.status-pill { padding: 6rpx 20rpx; border-radius: 16rpx; font-size: 22rpx; color: #fff; font-weight: 500; }
.footer-btns { display: flex; gap: 10rpx; flex-wrap: wrap; }
</style>
