/**
 * 该组件用于控制editor的默认字体大小与设置的不一致问题
 */
const { ccclass, property } = cc._decorator;
@ccclass
export default class EditboxFormatFontEx extends cc.Component {
  @property(cc.Node) edit = null;
  onLoad() {
    this.edit = this.node.getComponent(cc.EditBox);
  }
  onEnable() {
    this.edit && this.edit._sgNode._renderCmd._updateDOMFontStyle();
  }
}
