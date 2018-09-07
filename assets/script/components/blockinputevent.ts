/**
 * 吞噬触摸事件
 */
const { ccclass, property } = cc._decorator;
@ccclass
export default class BlockInputEvent extends cc.Component {
  onEnable() {
    this.node.on(cc.Node.EventType.TOUCH_START, this._swallowTouch, this);
  }
  onDisable() {
    this.node.off(cc.Node.EventType.TOUCH_START, this._swallowTouch, this);
  }
  _swallowTouch(event) {
    event.stopPropagation(); // 阻止事件向下传递
  }
}
