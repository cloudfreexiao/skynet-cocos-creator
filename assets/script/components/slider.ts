/**
 * slider滑动条的扩展类
 */

const { ccclass, property, executeInEditMode } = cc._decorator;
@ccclass
@executeInEditMode
export default class SliderEx extends cc.Component {
  @property(cc.Node) bar = null; // 进度条节点
  @property(Number) barLen = 0; // 进度条长度
  barProgress = 0; // 进度条长度
  sliderComponent: cc.Slider = null; // 滑动条组件

  onLoad() {
    this.bar = this.node.getChildByName('bar');
    this.sliderComponent = this.node.getComponent(cc.Slider);
    this.setBarSize(this.sliderComponent.progress);
  }
  start() {
    this.renderBar();
  }
  // 设置bar进度
  setBarSize(progress) {
    this.barProgress = progress;
  }
  // 渲染bar
  renderBar() {
    this.bar.width = this.barProgress * this.barLen;
  }
  onEnable() {
    this.node.on('slider', this.onSlide, this);
  }
  onDisable() {
    this.node.off('slider', this.onSlide, this);
  }
  onSlide() {
    this.setBarSize(this.sliderComponent.progress.toFixed(1));
    this.renderBar();
  }
}
