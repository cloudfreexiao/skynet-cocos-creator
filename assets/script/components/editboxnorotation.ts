/**
 * @class EditboxNoRotationEx
 * 该组件用于控制editor所在页面不旋转
 */
const ccclass = cc._decorator.ccclass;
@ccclass
export default class EditboxNoRotationEx extends cc.Component {
  start() {
    cc.view.resizeWithBrowserSize(false);
  }

  onDestroy() {
    cc.view.resizeWithBrowserSize(true);
  }
}
