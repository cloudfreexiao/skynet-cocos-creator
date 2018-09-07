export class Toast {

    private static _instance: Toast = null;
    public static get instance() {
        if (this._instance == null) {
            this._instance = new Toast();
        }
        return this._instance;
    }

    private toastNode: cc.Node = null;
    private bgSprite: cc.Sprite = null;
    private spriteFrame: cc.SpriteFrame = null;
    private textNode: cc.Node = null;
    private textLabel: cc.Label = null;
    private canvas: cc.Canvas = null;
    constructor() {
        this.toastNode = new cc.Node();
        this.toastNode.active = false;
        //设置节点的z值, 防止被其他节点覆盖
        this.toastNode.zIndex = 10000;
        this.canvas = cc.director.getScene().getComponentInChildren(cc.Canvas)
        this.canvas.node.addChild(this.toastNode);
        this.bgSprite = this.toastNode.addComponent(cc.Sprite);
        this.bgSprite.trim = true;
        //设置为九宫格模式
        this.bgSprite.type = cc.Sprite.Type.SLICED;
        let self = this;
        //加载背景图片uuid加载的是creator内置资源default_btn_pressed
        //另一种方式加载的是自己添加的图片
        // cc.loader.load({
        //     uuid: 'e9ec654c-97a2-4787-9325-e6a10375219a',
        //     type: 'uuid'
        // }, (err, res) => {
        cc.loader.loadRes('bg_gray', (err, res) => {
            if (err) {
                cc.error(err);
                return;
            }
            //通过uuid加载使用这一句
            //self.spriteFrame = res;
            //通过图片加载使用这一句
            self.spriteFrame = new cc.SpriteFrame(res);
            //设置九宫格上下左右边距
            // self.spriteFrame.insetBottom = 3;
            // self.spriteFrame.insetTop = 3;
            // self.spriteFrame.insetLeft = 4;
            // self.spriteFrame.insetRight = 4;
            self.bgSprite.spriteFrame = self.spriteFrame;
        });

        //添加一个widget组件, 方便定位
        let widget = this.toastNode.addComponent(cc.Widget);
        widget.isAlignBottom = true;
        widget.isAbsoluteBottom = false;
        widget.bottom = 0.1;
        widget.isAlignHorizontalCenter = true;
        widget.horizontalCenter = 0;
        widget.alignMode = cc.Widget.AlignMode.ONCE;

        //添加一个layout组件, 用来缩放背景
        let layout = this.toastNode.addComponent(cc.Layout);
        layout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        layout.padding = 5;

        //添加文字显示节点
        this.textNode = new cc.Node();
        this.toastNode.addChild(this.textNode);
        this.textNode.position = cc.Vec2.ZERO;
        this.textLabel = this.textNode.addComponent(cc.Label);
        this.textLabel.fontSize = 25;
        this.textLabel.lineHeight = 25;


    }

    /**
     * 使用类似Android的toast方法的效果显示文字
     * @param text 要显示的文字
     * @param duration 显示时间. 默认值为0.5秒
     */
    showText(text: string, duration = 0.5) {
        if (text.length * this.textLabel.fontSize > this.canvas.node.width * 0.8) {
            this.textLabel.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
            this.textLabel.node.width = this.canvas.node.width * 0.8;
        }
        this.textLabel.string = text;
        this.toastNode.active = true;
        this.toastNode.opacity = 200;
        this.toastNode.runAction(cc.sequence(
            cc.delayTime(duration),
            cc.fadeOut(0.2),
            cc.callFunc(() => { this.toastNode.active = false; }, this)
        ));
    }
}