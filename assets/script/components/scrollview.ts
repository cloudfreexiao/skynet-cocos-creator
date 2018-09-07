/**
 * scrollview扩展组件
 * 实现功能：
 * 1.增量添加子节点
 */
const { ccclass, property } = cc._decorator;
@ccclass
class ScrollviewEx extends cc.Component {
  @property(Number) limit = 3; // 限制显示的个数
  @property(cc.Prefab) itemPrefab = null; // 子节点预制
  @property content: cc.Node = null; // 内容节点
  dataArr: Array<any> = []; // 数据数组
  curLastIdx: number = -1; // 当前最后一个item的id
  itemBake: cc.Node = null; // 子节点备份
  itemRefreshDataFunc: Function = null; // 子节点数据刷新方法

  onLoad() {
    this.content = cc.find('view/content', this.node);
  }

  start() {
    this.itemBake = cc.instantiate(this.itemPrefab);
    this.renderUI();
  }

  // 设置当前最后一个id
  setCurLastIdx(idx: number) {
    this.curLastIdx = idx;
  }
  // 刷新UI
  renderUI() {
    const limitLen = this.curLastIdx;
    if (this.dataArr.length <= 0) {
      this.content.destroyAllChildren();
      return;
    }
    this.dataArr.forEach((itemData, idx) => {
      const tag = 9000 + idx;
      if (idx <= limitLen) {
        this.curLastIdx = idx;
        const item = this.addItem(tag);
        this.refreshItemData(item, itemData);
      } else {
        this.rmItem(tag);
      }
    });
  }
  // 设置子节点数据的刷新方法
  setItemRefreshDataFunc(cb) {
    this.itemRefreshDataFunc = cb;
  }
  // 刷新子节点数据
  refreshItemData(item, itemData) {
    this.itemRefreshDataFunc && this.itemRefreshDataFunc(item, itemData);
  }
  // 添加子节点
  addItem(tag) {
    let item = this.content.getChildByTag(tag);
    if (!cc.isValid(item)) {
      item = cc.instantiate(this.itemBake);
      item.tag = tag;
      this.content.addChild(item);
    }
    return item;
  }
  // 移除子节点
  rmItem(tag) {
    this.content.removeChildByTag(tag);
  }
  // 刷新数据
  refreshData(arr: Array<any>) {
    this.dataArr = arr;
    this.curLastIdx = this.limit - 1;
    this.renderUI();
  }
  // 添加监听
  onEnable() {
    this.node.on('bounce-bottom', this.bounceBottom, this);
  }
  // 注销监听
  onDisable() {
    this.node.off('bounce-bottom', this.bounceBottom, this);
  }
  // 检测是否需要继续添加
  check() {
    if (this.curLastIdx < this.dataArr.length - 1) {
      // console.log('need add item');
      this.curLastIdx += this.limit;
      this.renderUI();
      this.scheduleOnce(() => {
        this.node.getComponent(cc.ScrollView).scrollToBottom(2);
      }, 1);
    } else {
      // console.log('no need add item');
    }
  }

  bounceBottom = () => {
    // console.log('bounce-bottom');
    this.check();
  }
}

export default ScrollviewEx;
