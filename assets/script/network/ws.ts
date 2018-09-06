import * as Consts from "../consts/consts"
import { handler, gen_handler } from "../utils/handler"
import { RpcInfo } from "./RpcInfo"
import { Messager } from './messager'
import * as protobuf from "protobufjs"


type cmd_listener = {
    cb: handler;
    ctx: cc.Component;
}

export class WS
{
    // private static inst: WS;
    private error_handler: handler;
    private cmd_listeners: Map<RpcInfo, cmd_listener[]>;
    private ctx_cmds: Map<cc.Component, RpcInfo[]>;
    // private session_data: Map<number, Uint8Array>;
    private ws: WebSocket;
    private wsurl: string;

    private session: number;
    public is_connected: boolean;
    private is_connecting: boolean;
    private connected_cb: handler;
    private messager: Messager;

    public constructor(wsurl) {
        this.error_handler = gen_handler(this.handle_response_error, this);
        this.error_handler.retain();
        this.cmd_listeners = new Map();     //测试发现Map索引[]和get, delete不能混用，否则会出现取不到值。
        this.ctx_cmds = new Map();      //例如session_data[key] = value, session_data.get(key)会为null;
        // this.session_data = new Map();      //Map只能通过foreach遍历
        // this.session = 0;                   //send函数使session从1开始，服务器推送的数据包session默认为0
        this.wsurl = wsurl;
        this.messager = new Messager()
    }

    connect(cb ?: handler)
    {
        if(this.is_connected)
        {
            cc.info("socket is alreay connected");
            cb && cb.exec();
            return;
        }

        if(this.is_connecting)
        {
            cc.info("socket is connecting");
            return;
        }

        this.is_connecting = true;
        this.connected_cb = cb;

        this.ws = new WebSocket(this.wsurl);
        this.ws.binaryType = "arraybuffer";
        this.ws.onopen = this.on_ws_open.bind(this);
        this.ws.onerror = this.on_ws_error.bind(this);
        this.ws.onmessage = this.on_ws_message.bind(this);
        this.ws.onclose = this.on_ws_close.bind(this);
    }

    disconnect()
    {
        if (!this.is_connected) 
        {
            return;
        }
        //调用close方法会触发on_ws_close
        this.ws.close();
    }

    private on_ws_open(event: Event): any {
        cc.log("socket connected, addr=", this.wsurl);
        this.is_connected = true;
        if (this.connected_cb) {
            this.connected_cb.exec();
        }
    }

    private on_ws_error(event: Event): any {
        cc.log("socket error", event);
        // TODO:
        // toast.show("网络连接异常，请稍后重试");
    }

    private on_ws_close(event: CloseEvent): any {
        //code定义见https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
        cc.log("socket closed, code=", event.code);
        this.is_connected = false;
        this.is_connecting = false;
        // toast.show("网络连接断开，请重新登录");

        //退出登录
        if (cc.director.getScene().name != Consts.SCENE_NAME.START) {
            // appdata.loadScene(consts.SCENE_NAME.START);
        }
    }

    IntToUint8Array(num: number, Bits: number): number[] {
        let resArry = [];
        let xresArry = [];
        let binaryStr: string = num.toString(2);
        for (let i = 0; i < binaryStr.length; i++)
            resArry.push(parseInt(binaryStr[i]));

        if (Bits) {
            for (let r = resArry.length; r < Bits; r++) {
                resArry.unshift(0);
            }
        }

        let resArryStr = resArry.join("");
        for (let j = 0; j < Bits; j += 8)
        {
            xresArry.push(parseInt(resArryStr.slice(j, j + 8), 2));
        }

        return xresArry;
    }

    public send(rpcId: RpcInfo, req: any) {
        if (!this.is_connected) {
            cc.warn("socket is not connected, readyState=", this.ws.readyState);
            return;
        }
        this.session++;

        let body = this.messager.encoder(rpcId, req);
        let msg_buff = this.pack(rpcId, body)
        this.ws.send(msg_buff.buffer);

        cc.log("socket send msg:", rpcId, msg_buff.length);
    }

    private pack(rpcId: RpcInfo, body: Uint8Array): Uint8Array {
        let msgid: number = rpcId;

        let msg_buff = new Uint8Array(body.length + 4);
        let tagBinary = this.IntToUint8Array(msgid, 32);
        let tagUnit8 = new Uint8Array(tagBinary);

        msg_buff.set(tagUnit8, 0);
        msg_buff.set(body, 4);
        return msg_buff
    }

    // /**
    //  * Uint8Array[]转int
    //  * 相当于二进制加上4位。同时，使用|=号拼接数据，将其还原成最终的int数据
    //  * @param uint8Ary Uint8Array类型数组
    //  * @return int数字
    // //  */
    // Uint8ArrayToInt(uint8Ary: Uint8Array) {
    //     cc.log("=======Uint8ArrayToInt========", uint8Ary, uint8Ary.length)
    //     let buf = new ArrayBuffer(uint8Ary.length);
    //     let view = new DataView(buf);
    //     uint8Ary.forEach(function (b, i) {
    //         cc.log("++++Uint8ArrayToInt+++++", i, b)
    //         view.setUint8(i, b)
    //     })

    //     return new DataView(view.buffer).getInt32(0, false)
    //     // let retInt: number = 0;
    //     // for (let i = 0; i < uint8Ary.length; i++) {
    //     //     cc.log("++++Uint8ArrayToInt+++++", i, uint8Ary[i])
    //     //     retInt |= (uint8Ary[i] << (8 * (uint8Ary.length - i - 1)));
    //     // }

    //     // return retInt;
    // }

    private unpack(array_buf: ArrayBuffer, len: number): { rpcId: number, data: Uint8Array } {
        let byteBuffer = new DataView(array_buf);
        let rpcId: number = byteBuffer.getInt32(0, false);
        let databa: Uint8Array = new Uint8Array(array_buf, 4, len - 4);

        return { rpcId: rpcId, data: databa };
    }

    private on_ws_message(ev: MessageEvent): any {
        let data = null;

        if(!ev.data) {
            cc.log('Ping')
        } else {
            if (ev.data instanceof ArrayBuffer) {
                data = this.unpack(ev.data, ev.data.byteLength);
            } else if (ev.data instanceof Blob) {
                cc.log("------------Blob WS Message-----")
            } else {
                cc.log("***********Unknow WS Message*********")
            }
        }

        if (data) {
            let resp = this.messager.decoder(data);
            this.handle_response(data.rpcId, resp);
        } else {
            cc.log("Recv Message But Unpack Data is null")
        }

    }

    private handle_response(rpcId: number, resp: protobuf.Message<{}>) {
        cc.log("handle_response rpcId", rpcId, " resp:", resp);
        let is_ok: boolean = true;
        if(resp['res']) {
            if (resp['res'] != 0 && resp['res'] != 100) {
                is_ok = false;
            }
        }

        if (!is_ok) {
            this.error_handler.exec(resp['res']);
            return;
        }

        // TODO:ping pong 消息 可以直接发送回复
        // if (msg.cmd == pb.Command.KPing) {
        //     this.send({ cmd: pb.Command.KPong });
        //     return;
        // }
        // 
        //执行协议回调
        let listeners: cmd_listener[] = this.cmd_listeners.get(rpcId);
        if (!listeners) {
            return;
        }

        let req_data: Uint8Array;
        // if (respMsg.session > 0) {
        //     req_data = this.session_data.get(respMsg.session);
        //     this.session_data.delete(respMsg.session);
        // }
        listeners.forEach((listener: cmd_listener, index: number): void => {
            if (!cc.isValid(listener.ctx)) {
                return;
            }
            if (req_data) {
                listener.cb.exec(is_ok, resp, ...req_data);
            } else {
                listener.cb.exec(is_ok, resp);
            }
        });
    }

    private handle_response_error(code: number, errmsg: string) 
    {
        // toast.show(Consts.MSG_ERROR[code] || errmsg);
    }

    public register_listener(cmd: RpcInfo, cb: handler, context: cc.Component) 
    {
        //cmd->listeners
        let listeners: cmd_listener[] = this.cmd_listeners.get(cmd);
        if (!listeners) {
            listeners = [];
            this.cmd_listeners.set(cmd, listeners);
        }
        //持久化handler
        cb.retain();
        listeners.push({ cb: cb, ctx: context })

        //context->cmds
        let cmds: RpcInfo[] = this.ctx_cmds.get(context);
        if (!cmds) {
            cmds = [];
            this.ctx_cmds.set(context, cmds);
        }
        cmds.push(cmd);
    }

    public unregister_listeners(context: cc.Component) {
        let cmds: RpcInfo[] = this.ctx_cmds.get(context);
        if (!cmds) {
            cc.info(context.name, "has no cmds");
            return;
        }
        cmds.forEach((cmd: RpcInfo): void => {
            let listeners: cmd_listener[] = this.cmd_listeners.get(cmd);
            if (!listeners) {
                return;
            }
            for (let i: number = listeners.length - 1; i >= 0; i--) {
                if (listeners[i].ctx === context) {
                    //释放handler
                    listeners[i].cb.release();
                    listeners.splice(i, 1);
                    cc.info(context.name, "remove listener");
                }
            }
        });
        this.ctx_cmds.delete(context);
    }

    public unregister_all() {
        this.ctx_cmds.forEach((value, key) => {
            this.unregister_listeners(key);
        });
    }

    public register_error_handler(cb: handler) {
        this.error_handler = cb;
    }


}