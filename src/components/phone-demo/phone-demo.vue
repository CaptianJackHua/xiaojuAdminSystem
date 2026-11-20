<template>
  <view class="phone-demo">
    <view class="phone-speaker" />
    <view class="phone-status">
      <text class="status-time">9:41</text>
      <view class="status-icons">
        <view class="signal"><view /><view /><view /><view /></view>
        <view class="wifi" />
        <view class="battery"><view class="battery-level" /></view>
      </view>
    </view>
    <view class="phone-content">
      <slot />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.phone-demo {
  width: 420px;
  height: 78vh;
  min-height: 560px;
  max-height: 840px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: #f7f8fa;
  border: 8px solid #1d2129;
  border-radius: 38px;
  box-shadow: 0 24px 64px rgba(29, 33, 41, 0.16), 0 4px 14px rgba(29, 33, 41, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.phone-speaker {
  position: absolute;
  z-index: 5;
  top: 9px;
  left: 50%;
  width: 76px;
  height: 5px;
  margin-left: -38px;
  border-radius: 4px;
  background: #1d2129;
}
.phone-status {
  height: 32px;
  flex-shrink: 0;
  box-sizing: border-box;
  padding: 8px 20px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  color: #1d2129;
  font-size: 11px;
  font-weight: 600;
}
.status-icons { display: flex; align-items: center; gap: 7px; }
.signal { height: 11px; display: flex; align-items: flex-end; gap: 2px; }
.signal view { display: block; width: 2px; border-radius: 1px; background: #1d2129; }
.signal view:nth-child(1) { height: 4px; }
.signal view:nth-child(2) { height: 6px; }
.signal view:nth-child(3) { height: 8px; }
.signal view:nth-child(4) { height: 10px; }
.wifi {
  width: 12px;
  height: 9px;
  box-sizing: border-box;
  border-top: 2px solid #1d2129;
  border-radius: 50%;
  position: relative;
}
.wifi::after {
  content: '';
  position: absolute;
  left: 4px;
  bottom: 0;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #1d2129;
}
.battery { width: 19px; height: 9px; padding: 1px; box-sizing: border-box; border: 1px solid #1d2129; border-radius: 2px; position: relative; }
.battery::after { content: ''; position: absolute; right: -3px; top: 2px; width: 2px; height: 4px; border-radius: 0 1px 1px 0; background: #1d2129; }
.battery-level { width: 80%; height: 100%; border-radius: 1px; background: #1d2129; }
.phone-content { flex: 1; min-height: 0; overflow: hidden; }
</style>
