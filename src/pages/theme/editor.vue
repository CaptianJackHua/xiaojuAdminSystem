<!--
  皮肤编辑器：
  - 左侧：色彩 / 图片 / 底部 Tab / 爱车页 / 骑行首页 / 我的页 / 贴图 / 装修位
  - 右侧：iOS/Android 切换 + 明/暗模式 + 多 Tab 预览（骑行/爱车/消息/我的）
  - 顶部：保存草稿 / 重置
-->
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { mockEditorGroups, EditorGroup, EditorItem, ASSET_BASE } from '@/theme/mock'

const resetDialog = useDialog('reset')

// 状态
const activeGroup = ref('color')
const dirty = ref(false)
const skinName = ref('夏日骑行·薄荷绿')
const skinCode = ref('summer-mint')

// 接收主题库新建皮肤后带入的名称与编码
onLoad((opt) => {
  if (opt?.name) skinName.value = safeDecode(opt.name as string)
  if (opt?.code) skinCode.value = safeDecode(opt.code as string)
})
function safeDecode(v: string) {
  try { return decodeURIComponent(v) } catch { return v }
}

// 配置值
const DEFAULT_GROUPS: EditorGroup[] = JSON.parse(JSON.stringify(mockEditorGroups))
const groups = reactive<EditorGroup[]>(JSON.parse(JSON.stringify(mockEditorGroups)))
function currentGroup() { return groups.find((g) => g.key === activeGroup.value) }

// 预览模式
type Platform = 'ios' | 'android'
type ThemeMode = 'light' | 'dark'
type PreviewTab = 'ride' | 'car' | 'message' | 'me'
const platform = ref<Platform>('ios')
const mode = ref<ThemeMode>('light')
const previewTab = ref<PreviewTab>('ride')

function updateItem(groupKey: string, itemKey: string, v: string) {
  const g = groups.find((g) => g.key === groupKey)
  const it = g?.items.find((i) => i.key === itemKey)
  if (it) it.value = v
  dirty.value = true
}

// 重置
async function resetGroup() {
  const g = currentGroup()
  if (!g) return
  try {
    await resetDialog.confirm({
      title: `重置「${g.name}」？`,
      msg: `将「${g.name}」分组的所有配置恢复为默认值，此操作不可撤销。`,
      confirmButtonText: '确认重置', cancelButtonText: '取消', icon: 'warning'
    })
    const src = DEFAULT_GROUPS.find((x) => x.key === g.key)
    if (src) g.items = JSON.parse(JSON.stringify(src.items))
    dirty.value = true
    uni.showToast({ title: '已重置当前分组', icon: 'success' })
  } catch { /* 用户取消 */ }
}
async function resetAll() {
  try {
    await resetDialog.confirm({
      title: '重置全部配置？',
      msg: '将所有分组恢复为默认值，此操作不可撤销。',
      confirmButtonText: '确认重置全部', cancelButtonText: '取消', icon: 'warning'
    })
    const fresh = JSON.parse(JSON.stringify(mockEditorGroups))
    groups.splice(0, groups.length, ...fresh)
    dirty.value = true
    uni.showToast({ title: '已重置全部', icon: 'success' })
  } catch { /* 用户取消 */ }
}

// 上传：每个位置独立上传，上传后回填服务器地址
function uploadMedia(groupKey: string, itemKey: string) {
  const g = groups.find((x) => x.key === groupKey)
  const it = g?.items.find((i) => i.key === itemKey)
  if (!g || !it) return
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const path = (res.tempFilePaths && res.tempFilePaths[0]) || ''
      const raw = path.split('/').pop() || ''
      const fileName = raw && raw.indexOf('blob:') === -1 ? raw : `${itemKey}-${Date.now()}.png`
      it.value = fileName
      it.url = `${ASSET_BASE}/theme/${skinCode.value}/${groupKey}/${fileName}`
      dirty.value = true
      uni.showToast({ title: '上传成功', icon: 'success' })
    },
    fail: () => { /* 用户取消 */ }
  })
}

// 复制服务器地址
function copyUrl(url?: string) {
  if (!url) return
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '已复制下载地址', icon: 'none' })
  })
}

// 下载 / 打开服务器资源
function openMedia(it: EditorItem) {
  if (!it.url) return
  // #ifdef H5
  ;(window as any).open(it.url, '_blank')
  // #endif
  // #ifndef H5
  copyUrl(it.url)
  // #endif
}

// 清空已上传内容
function clearMedia(groupKey: string, itemKey: string) {
  const g = groups.find((x) => x.key === groupKey)
  const it = g?.items.find((i) => i.key === itemKey)
  if (!it) return
  it.value = ''
  it.url = undefined
  dirty.value = true
  uni.showToast({ title: '已清空', icon: 'none' })
}

// 预览色值
function color(key: string, fb = '#165DFF') {
  for (const g of groups) {
    const it = g.items.find((i) => i.key === key)
    if (it && it.type === 'color') return it.value
  }
  return fb
}
function bg() { return mode.value === 'dark' ? '#141414' : color('bg', '#F7F8FA') }
function textMain() { return mode.value === 'dark' ? '#fff' : color('text', '#1D2129') }
function textSub() { return mode.value === 'dark' ? 'rgba(255,255,255,0.6)' : color('text-sub', '#4E5969') }
function primary() { return color('primary', '#165DFF') }
function secondary() { return color('secondary', '#4080FF') }
function tabActive() { return color('tab-active-color', '#165DFF') }
function tabInactive() { return color('tab-inactive-color', '#86909C') }

function saveAll() { dirty.value = false; uni.showToast({ title: '已保存草稿', icon: 'success' }) }
</script>

<template>
  <view class="shell">
    <app-sidebar active="theme-editor" />

    <view class="page">
      <view class="breadcrumb">
        <text>主题配置</text><text class="sep">/</text><text>皮肤编辑器</text><text class="sep">/</text><text class="cur">{{ skinName }}</text>
      </view>

      <view class="page-head">
        <view>
          <text class="page-title">皮肤编辑器</text>
          <text class="page-sub">左侧分组配置 · 右侧实时预览 · 配置项与预览位置一一对应</text>
        </view>
        <view class="head-btns">
          <wd-button plain size="small" @click="resetGroup">重置当前分组</wd-button>
          <wd-button plain size="small" @click="resetAll">重置全部</wd-button>
          <wd-button plain type="primary" size="small" :disabled="!dirty" @click="saveAll">保存草稿</wd-button>
          <wd-button type="primary" size="small" @click="saveAll">提交草稿到发布中心</wd-button>
        </view>
      </view>

      <view class="layout">
        <!-- 左侧分组导航 -->
        <view class="group-nav">
          <view class="skin-info">
            <input v-model="skinName" class="skin-name-input" placeholder="皮肤名称" placeholder-style="color:#c9cdd4" />
            <text class="skin-code">{{ skinCode }}</text>
          </view>
          <view
            v-for="g in groups"
            :key="g.key"
            class="group-item"
            :class="{ active: activeGroup === g.key }"
            @click="activeGroup = g.key"
          >
            <text class="group-name">{{ g.name }}</text>
            <text class="group-count">{{ g.items.length }}</text>
          </view>
        </view>

        <!-- 左侧配置面板 -->
        <view class="editor-panel">
          <view class="panel-head">
            <text class="panel-title">{{ currentGroup()?.name }}</text>
            <text class="panel-hint">配置即预览 · 改了参数右侧立即可见</text>
          </view>
          <view class="panel-body">
            <template v-for="it in currentGroup()?.items ?? []" :key="it.key">
              <view class="row" :class="{ 'row--media': it.type === 'media' }">
                <view class="row-label">
                  <text class="row-label__text">{{ it.label }}</text>
                  <text v-if="it.hint" class="row-label__hint">{{ it.hint }}</text>
                </view>

                <!-- 颜色 -->
                <view v-if="it.type === 'color'" class="row-control row-control--color">
                  <view class="color-swatch" :style="{ background: it.value }" />
                  <input
                    :value="it.value"
                    class="color-input"
                    type="text"
                    @blur="(e) => updateItem(currentGroup()!.key, it.key, (e.target as HTMLInputElement).value)"
                  />
                </view>

                <!-- 媒体资源：直接上传，展示服务器地址，可下载 -->
                <view v-else-if="it.type === 'media'" class="media-block">
                  <view class="media-line">
                    <view class="img-thumb" :style="{ background: primary() + '22' }">
                      <wd-icon :name="it.url ? 'check' : 'add'" size="32rpx" :color="primary()" />
                    </view>
                    <view class="media-info">
                      <text class="media-name">{{ it.url ? it.value : '未上传' }}</text>
                      <text v-if="it.url" class="media-url" @click="copyUrl(it.url)">{{ it.url }}</text>
                      <text v-else class="media-url media-url--empty">上传后自动生成服务器地址，可直接下载</text>
                    </view>
                  </view>
                  <view class="media-btns">
                    <wd-button
                      plain type="primary" size="mini"
                      @click="uploadMedia(currentGroup()!.key, it.key)"
                    >{{ it.url ? '重新上传' : '上传' }}</wd-button>
                    <wd-button v-if="it.url" plain size="mini" @click="openMedia(it)">下载</wd-button>
                    <wd-button v-if="it.url" plain type="error" size="mini" @click="clearMedia(currentGroup()!.key, it.key)">清空</wd-button>
                  </view>
                </view>

                <!-- select -->
                <view v-else-if="it.type === 'select'" class="row-control row-control--select">
                  <view class="text-pill">{{ it.value }}</view>
                </view>

                <!-- text -->
                <view v-else class="row-control">
                  <view class="text-pill">{{ it.value || '—' }}</view>
                </view>
              </view>
            </template>

            <view v-if="dirty" class="dirty-hint">
              <view class="dirty-dot" />
              <text>有未保存的修改</text>
            </view>
          </view>
        </view>

        <!-- 右侧预览列 -->
        <view class="preview-column">
          <!-- 双端 / 明暗 -->
          <view class="preview-toolbar">
            <view class="seg">
              <view class="seg-item" :class="{ active: platform === 'ios' }" @click="platform = 'ios'">
                <wd-icon name="phone" size="24rpx" :color="platform === 'ios' ? '#fff' : '#4e5969'" /><text>iOS</text>
              </view>
              <view class="seg-item" :class="{ active: platform === 'android' }" @click="platform = 'android'">
                <wd-icon name="phone" size="24rpx" :color="platform === 'android' ? '#fff' : '#4e5969'" /><text>Android</text>
              </view>
            </view>
            <view class="seg">
              <view class="seg-item" :class="{ active: mode === 'light' }" @click="mode = 'light'">
                <wd-icon name="sunny" size="24rpx" :color="mode === 'light' ? '#fff' : '#4e5969'" /><text>明</text>
              </view>
              <view class="seg-item" :class="{ active: mode === 'dark' }" @click="mode = 'dark'">
                <wd-icon name="moon" size="24rpx" :color="mode === 'dark' ? '#fff' : '#4e5969'" /><text>暗</text>
              </view>
            </view>
          </view>

          <!-- 预览 Tab：骑行 / 爱车 / 消息 / 我的 -->
          <view class="preview-tabs">
            <view
              v-for="t in (['ride','car','message','me'] as PreviewTab[])" :key="t"
              class="p-tab" :class="{ active: previewTab === t }"
              @click="previewTab = t"
            >
              <wd-icon :name="t === 'ride' ? 'play-circle' : t === 'car' ? 'car' : t === 'message' ? 'chat' : 'user'" size="22rpx" />
              <text>{{ t === 'ride' ? '骑行' : t === 'car' ? '爱车' : t === 'message' ? '消息' : '我的' }}</text>
            </view>
          </view>

          <!-- 手机预览 -->
          <view v-if="platform === 'ios'" class="phone-frame phone-frame--ios">
            <view class="phone-notch" />
            <view class="phone-status" :style="{ background: color('status-bar', primary()) }">
              <text>9:41</text><text class="phone-brand">iOS</text><text>●●●●●</text>
            </view>
            <view class="phone-body" :style="{ background: bg() }">
              <!-- 骑行 -->
              <template v-if="previewTab === 'ride'">
                <view class="phone-section-title" :style="{ color: textSub() }">骑行首页</view>
                <view class="phone-card phone-card--big" :style="{ background: primary() }">
                  <text class="card-label">当前速度</text>
                  <text class="card-value">42<span>km/h</span></text>
                </view>
                <view class="phone-row">
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">今日骑行</text>
                    <text class="mini-value" :style="{ color: textMain() }">32<span>km</span></text>
                  </view>
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">电量</text>
                    <text class="mini-value" :style="{ color: textMain() }">86<span>%</span></text>
                  </view>
                </view>
                <view class="phone-btn" :style="{ background: primary() }"><text>开始骑行</text></view>
              </template>

              <!-- 爱车 -->
              <template v-else-if="previewTab === 'car'">
                <view class="phone-section-title" :style="{ color: textSub() }">爱车页</view>
                <view class="phone-car-hero" :style="{ borderColor: color('car-frame', primary()) }">
                  <view class="phone-car-img" :style="{ background: secondary() + '55' }">
                    <wd-icon name="car" size="80rpx" :color="primary()" />
                  </view>
                </view>
                <text class="phone-car-name" :style="{ color: textMain() }">绿驹 小驹 GO</text>
                <view class="phone-row">
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">续航</text>
                    <text class="mini-value" :style="{ color: textMain() }">58<span>km</span></text>
                  </view>
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">总里程</text>
                    <text class="mini-value" :style="{ color: textMain() }">1,286<span>km</span></text>
                  </view>
                </view>
              </template>

              <!-- 消息 -->
              <template v-else-if="previewTab === 'message'">
                <view class="phone-section-title" :style="{ color: textSub() }">消息中心</view>
                <view class="phone-msg" v-for="n in 3" :key="n">
                  <view class="phone-avatar" :style="{ background: primary() }">
                    <text>{{ n === 1 ? '系' : n === 2 ? '活' : '车' }}</text>
                  </view>
                  <view class="phone-msg-body">
                    <text class="phone-msg-title" :style="{ color: textMain() }">
                      {{ n === 1 ? '系统通知' : n === 2 ? '活动推送' : '爱车状态' }}
                    </text>
                    <text class="phone-msg-sub" :style="{ color: textSub() }">这是一条消息预览，主题色影响头像和背景</text>
                  </view>
                </view>
              </template>

              <!-- 我的 -->
              <template v-else>
                <view class="phone-section-title" :style="{ color: textSub() }">我的页</view>
                <view class="phone-me-banner" :style="{ background: primary() }">
                  <view class="phone-me-avatar"><text>LJ</text></view>
                  <view class="phone-me-info">
                    <text class="phone-me-name">骑行达人</text>
                    <text class="phone-me-sub">Lv.8 · 累计 12,860 km</text>
                  </view>
                </view>
                <view class="phone-row">
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">积分</text>
                    <text class="mini-value" :style="{ color: textMain() }">8,620</text>
                  </view>
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">优惠券</text>
                    <text class="mini-value" :style="{ color: textMain() }">12</text>
                  </view>
                </view>
              </template>
            </view>
            <view class="phone-home-indicator" />

            <!-- Tabbar -->
            <view class="phone-tabbar" :style="{ background: color('tab-bg', '#fff') }">
              <view class="p-tab-item">
                <view class="p-tab-ico" :style="{ background: previewTab === 'ride' || previewTab === 'car' || previewTab === 'message' || previewTab === 'me' ? tabActive() : tabInactive() }" />
                <text :style="{ color: tabActive() }">首页</text>
              </view>
              <view class="p-tab-item">
                <view class="p-tab-ico" :style="{ background: previewTab === 'ride' ? tabActive() : tabInactive() }" />
                <text :style="{ color: previewTab === 'ride' ? tabActive() : tabInactive() }">骑行</text>
              </view>
              <view class="p-tab-item">
                <view class="p-tab-ico" :style="{ background: previewTab === 'car' ? tabActive() : tabInactive() }" />
                <text :style="{ color: previewTab === 'car' ? tabActive() : tabInactive() }">爱车</text>
              </view>
              <view class="p-tab-item">
                <view class="p-tab-ico" :style="{ background: previewTab === 'me' ? tabActive() : tabInactive() }" />
                <text :style="{ color: previewTab === 'me' ? tabActive() : tabInactive() }">我的</text>
              </view>
            </view>
          </view>

          <!-- Android 预览 -->
          <view v-else class="phone-frame phone-frame--android">
            <view class="phone-punch" />
            <view class="phone-status" :style="{ background: color('status-bar', primary()) }">
              <text>9:41 · Android</text><text>●●●●●</text>
            </view>
            <view class="phone-body" :style="{ background: bg() }">
              <template v-if="previewTab === 'ride'">
                <view class="phone-section-title" :style="{ color: textSub() }">骑行首页</view>
                <view class="phone-card phone-card--big" :style="{ background: primary() }">
                  <text class="card-label">当前速度</text>
                  <text class="card-value">42<span>km/h</span></text>
                </view>
                <view class="phone-row">
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">今日骑行</text>
                    <text class="mini-value" :style="{ color: textMain() }">32<span>km</span></text>
                  </view>
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">电量</text>
                    <text class="mini-value" :style="{ color: textMain() }">86<span>%</span></text>
                  </view>
                </view>
                <view class="phone-btn" :style="{ background: primary() }"><text>开始骑行</text></view>
              </template>
              <template v-else-if="previewTab === 'car'">
                <view class="phone-section-title" :style="{ color: textSub() }">爱车页</view>
                <view class="phone-car-hero" :style="{ borderColor: color('car-frame', primary()) }">
                  <view class="phone-car-img" :style="{ background: secondary() + '55' }">
                    <wd-icon name="car" size="80rpx" :color="primary()" />
                  </view>
                </view>
                <text class="phone-car-name" :style="{ color: textMain() }">绿驹 小驹 GO</text>
                <view class="phone-row">
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">续航</text>
                    <text class="mini-value" :style="{ color: textMain() }">58<span>km</span></text>
                  </view>
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">总里程</text>
                    <text class="mini-value" :style="{ color: textMain() }">1,286<span>km</span></text>
                  </view>
                </view>
              </template>
              <template v-else-if="previewTab === 'message'">
                <view class="phone-section-title" :style="{ color: textSub() }">消息中心</view>
                <view class="phone-msg" v-for="n in 3" :key="n">
                  <view class="phone-avatar" :style="{ background: primary() }">
                    <text>{{ n === 1 ? '系' : n === 2 ? '活' : '车' }}</text>
                  </view>
                  <view class="phone-msg-body">
                    <text class="phone-msg-title" :style="{ color: textMain() }">
                      {{ n === 1 ? '系统通知' : n === 2 ? '活动推送' : '爱车状态' }}
                    </text>
                    <text class="phone-msg-sub" :style="{ color: textSub() }">这是一条消息预览</text>
                  </view>
                </view>
              </template>
              <template v-else>
                <view class="phone-section-title" :style="{ color: textSub() }">我的页</view>
                <view class="phone-me-banner" :style="{ background: primary() }">
                  <view class="phone-me-avatar"><text>LJ</text></view>
                  <view class="phone-me-info">
                    <text class="phone-me-name">骑行达人</text>
                    <text class="phone-me-sub">Lv.8 · 累计 12,860 km</text>
                  </view>
                </view>
                <view class="phone-row">
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">积分</text>
                    <text class="mini-value" :style="{ color: textMain() }">8,620</text>
                  </view>
                  <view class="phone-card phone-card--mini" :style="{ background: secondary() + '40' }">
                    <text class="mini-label" :style="{ color: textSub() }">优惠券</text>
                    <text class="mini-value" :style="{ color: textMain() }">12</text>
                  </view>
                </view>
              </template>
            </view>
            <view class="phone-nav-bar"><view class="nav-dot" /></view>

            <view class="phone-tabbar" :style="{ background: color('tab-bg', '#fff') }">
              <view class="p-tab-item">
                <view class="p-tab-ico" :style="{ background: tabActive() }" />
                <text :style="{ color: tabActive() }">首页</text>
              </view>
              <view class="p-tab-item">
                <view class="p-tab-ico" :style="{ background: previewTab === 'ride' ? tabActive() : tabInactive() }" />
                <text :style="{ color: previewTab === 'ride' ? tabActive() : tabInactive() }">骑行</text>
              </view>
              <view class="p-tab-item">
                <view class="p-tab-ico" :style="{ background: previewTab === 'car' ? tabActive() : tabInactive() }" />
                <text :style="{ color: previewTab === 'car' ? tabActive() : tabInactive() }">爱车</text>
              </view>
              <view class="p-tab-item">
                <view class="p-tab-ico" :style="{ background: previewTab === 'me' ? tabActive() : tabInactive() }" />
                <text :style="{ color: previewTab === 'me' ? tabActive() : tabInactive() }">我的</text>
              </view>
            </view>
          </view>
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
.breadcrumb { font-size: 24rpx; color: $muted; display: flex; gap: 6rpx; align-items: center; .sep { color: $muted-2; } .cur { color: $text-main; } }
.page-head {
  display: flex; justify-content: space-between; align-items: flex-start; margin: 24rpx 0 20rpx; flex-wrap: wrap; gap: 16rpx;
  .page-title { display: block; font-size: 44rpx; font-weight: 700; color: $text-main; }
  .page-sub { display: block; font-size: 24rpx; color: $muted; margin-top: 10rpx; }
  .head-btns { display: flex; gap: 12rpx; flex-wrap: wrap; }
}

.layout { display: flex; gap: 20rpx; align-items: flex-start; }

/* 左侧分组导航 */
.group-nav { width: 200rpx; flex-shrink: 0; background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; padding: 12rpx; }
.skin-info { padding: 12rpx; border-bottom: 2rpx solid $rule; margin-bottom: 8rpx; }
.skin-name-input { width: 100%; height: 48rpx; border: 2rpx solid $rule; border-radius: 8rpx; padding: 0 10rpx; font-size: 22rpx; color: $text-main; }
.skin-code { display: block; margin-top: 6rpx; font-size: 18rpx; color: $muted; }
.group-item {
  display: flex; justify-content: space-between; align-items: center; height: 64rpx; padding: 0 16rpx;
  border-radius: 10rpx; font-size: 22rpx; color: $text-main; margin: 4rpx 0;
  &.active { background: $primary-light; color: $primary; font-weight: 500; }
}
.group-count { font-size: 18rpx; color: $muted; }

.editor-panel { flex: 1; min-width: 0; background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; padding: 24rpx; min-height: 1000rpx; }
.panel-head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12rpx; border-bottom: 2rpx solid $rule; margin-bottom: 16rpx; }
.panel-title { font-size: 28rpx; font-weight: 600; color: $text-main; }
.panel-hint { font-size: 20rpx; color: $muted; }

.row { display: flex; align-items: center; justify-content: space-between; padding: 14rpx 0; border-bottom: 2rpx solid #f2f3f5; }
.row-label { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2rpx; }
.row-label__text { font-size: 24rpx; color: $text-main; }
.row-label__hint { font-size: 20rpx; color: $muted; }
.row-control { display: flex; align-items: center; gap: 10rpx; }
.row-control--color { width: 260rpx; }
.row--media { flex-direction: column; align-items: stretch; gap: 10rpx; }
.color-swatch { width: 40rpx; height: 40rpx; border-radius: 6rpx; border: 2rpx solid #f2f3f5; flex-shrink: 0; }
.color-input { flex: 1; height: 52rpx; border: 2rpx solid $rule; border-radius: 6rpx; padding: 0 10rpx; font-size: 22rpx; color: $text-main; width: 100%; }
.img-thumb { width: 56rpx; height: 56rpx; border-radius: 8rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* 媒体上传块 */
.media-block { display: flex; flex-direction: column; gap: 10rpx; }
.media-line { display: flex; align-items: center; gap: 12rpx; }
.media-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2rpx; }
.media-name { font-size: 22rpx; color: $text-main; font-weight: 500; }
.media-url {
  font-size: 18rpx; color: $primary; word-break: break-all; line-height: 1.4;
  &--empty { color: $muted; }
}
.media-btns { display: flex; gap: 8rpx; flex-wrap: wrap; }
.text-pill { padding: 8rpx 16rpx; background: #f2f3f5; border-radius: 6rpx; font-size: 22rpx; color: $text-2; }
.dirty-hint { display: flex; align-items: center; gap: 8rpx; margin-top: 12rpx; font-size: 22rpx; color: #ff7d00; }
.dirty-dot { width: 12rpx; height: 12rpx; border-radius: 50%; background: #ff7d00; }

/* 预览列 */
.preview-column { width: 440rpx; flex-shrink: 0; background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; padding: 12rpx 12rpx 16rpx; }
.preview-toolbar { display: flex; justify-content: space-between; padding: 4rpx 4rpx 10rpx; border-bottom: 2rpx solid $rule; }
.seg { display: flex; background: #f2f3f5; border-radius: 8rpx; padding: 4rpx; gap: 4rpx; }
.seg-item {
  flex: 1; padding: 8rpx 14rpx; border-radius: 6rpx; font-size: 20rpx; color: $text-2;
  display: flex; align-items: center; justify-content: center; gap: 6rpx;
  &.active { background: $primary; color: #fff; font-weight: 500; }
}

.preview-tabs { display: flex; gap: 8rpx; margin: 12rpx 0; }
.p-tab {
  flex: 1; padding: 8rpx 0; border-radius: 6rpx; font-size: 20rpx; color: $text-2;
  display: flex; align-items: center; justify-content: center; gap: 6rpx; background: #f7f8fa;
  &.active { background: $primary-light; color: $primary; font-weight: 500; }
}

/* 手机框 */
.phone-frame { margin: 0 auto; width: 360rpx; border: 4rpx solid #1d2129; border-radius: 48rpx; overflow: hidden; background: #1d2129; position: relative; }
.phone-frame--ios { border-radius: 52rpx; }
.phone-notch { position: absolute; top: 8rpx; left: 50%; transform: translateX(-50%); width: 140rpx; height: 22rpx; border-radius: 12rpx; background: #000; z-index: 10; }
.phone-punch { position: absolute; top: 10rpx; right: 16rpx; width: 22rpx; height: 22rpx; border-radius: 50%; background: #000; z-index: 10; }
.phone-status { height: 40rpx; padding: 0 20rpx; color: #fff; font-size: 18rpx; display: flex; justify-content: space-between; align-items: center; }
.phone-brand { font-weight: 700; letter-spacing: 2rpx; }
.phone-body { padding: 14rpx; min-height: 480rpx; }
.phone-section-title { font-size: 18rpx; margin: 6rpx 4rpx 12rpx; }
.phone-card { border-radius: 14rpx; padding: 16rpx; color: #fff; }
.phone-card--big { margin-bottom: 12rpx; min-height: 140rpx; }
.phone-card--mini { flex: 1; border-radius: 10rpx; }
.phone-row { display: flex; gap: 10rpx; margin-bottom: 12rpx; }
.card-label { display: block; font-size: 18rpx; opacity: 0.8; }
.card-value { display: block; font-size: 64rpx; font-weight: 700; margin-top: 6rpx; }
.card-value span { font-size: 22rpx; margin-left: 4rpx; opacity: 0.8; }
.mini-label { font-size: 18rpx; display: block; }
.mini-value { font-size: 30rpx; font-weight: 600; display: block; margin-top: 4rpx; }
.mini-value span { font-size: 16rpx; margin-left: 2rpx; opacity: 0.7; }
.phone-btn { margin-top: 8rpx; height: 60rpx; border-radius: 30rpx; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 500; }

/* 爱车 */
.phone-car-hero {
  border-radius: 16rpx; border: 4rpx solid; padding: 20rpx; margin-bottom: 12rpx;
}
.phone-car-img { height: 160rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; }
.phone-car-name { display: block; font-size: 26rpx; font-weight: 600; margin-bottom: 12rpx; }

/* 消息 */
.phone-msg { display: flex; gap: 12rpx; padding: 12rpx 4rpx; border-bottom: 2rpx solid #f2f3f5; }
.phone-avatar { width: 56rpx; height: 56rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22rpx; flex-shrink: 0; }
.phone-msg-body { flex: 1; min-width: 0; }
.phone-msg-title { display: block; font-size: 24rpx; font-weight: 500; }
.phone-msg-sub { display: block; font-size: 18rpx; margin-top: 4rpx; }

/* 我的 */
.phone-me-banner { border-radius: 14rpx; padding: 16rpx; display: flex; gap: 14rpx; align-items: center; margin-bottom: 12rpx; }
.phone-me-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: #fff; color: $primary; font-size: 24rpx; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.phone-me-name { display: block; font-size: 24rpx; font-weight: 600; color: #fff; }
.phone-me-sub { display: block; font-size: 18rpx; color: rgba(255,255,255,0.85); margin-top: 4rpx; }

.phone-home-indicator { height: 14rpx; background: #1d2129; display: flex; align-items: center; justify-content: center; }
.phone-home-indicator::after { content: ''; width: 120rpx; height: 5rpx; border-radius: 3rpx; background: #fff; opacity: 0.55; }
.phone-nav-bar { height: 14rpx; background: #1d2129; display: flex; align-items: center; justify-content: center; }
.nav-dot { width: 24rpx; height: 4rpx; border-radius: 2rpx; background: #fff; opacity: 0.6; }

/* Tabbar */
.phone-tabbar { display: flex; height: 80rpx; padding: 0 8rpx; border-top: 2rpx solid #f2f3f5; }
.p-tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4rpx; font-size: 18rpx; }
.p-tab-ico { width: 28rpx; height: 28rpx; border-radius: 6rpx; }
</style>
