import { WS } from "../network/ws"
import { RpcInfo } from "../network/RpcInfo"
import { handler, gen_handler } from "../utils/handler"
import * as Consts from "../consts/consts"
// import * as crypto from 'crypto'

// var md5 = crypto.createHash('md5');

// var result = md5.update('a').digest('hex');


export default class WSProxy extends puremvc.Proxy implements puremvc.IProxy {
    public static NAME: string = "WSProxy";

    private ws: WS;

    public constructor() {
        super(WSProxy.NAME);
        this.ws = new WS(Consts.SERVER_URL.wsurl);
    }

    public wsTest() {
        this.connect(gen_handler(this.connectFunc, this));
    }

    private connectFunc() {
        cc.log("========connect ws ok=========");
        this.send(RpcInfo.authWSLobby, { openID: "1000000", secret: "8888888", faceID: "1", })
    }

    public register_listener(rpcId: RpcInfo, cb: handler, context: cc.Component) {
        this.ws.register_listener(rpcId, cb, context);
    }

    public unregister_listeners(context: cc.Component) {
        this.ws.unregister_listeners(context);
    }

    public unregister_all() {
        this.ws.unregister_all();
    }

    public register_error_handler(cb: handler) {
        this.ws.register_error_handler(cb);
    }

    public send(rpcId: RpcInfo, body :any) {
        this.ws.send(rpcId, body);
    }

    public connect(cb ?: handler) {
        this.ws.connect(cb);
    }

    public disconnect() {
        this.ws.disconnect();
    }


}