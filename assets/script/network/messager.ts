import { RpcInfo } from "./RpcInfo"
import * as protobuf from "protobufjs"

// import * as path from "path"
// const protoPath = (dir, file) =>
//     path.resolve(path.join(dir, `${file}.proto`));



var msg_req_map = new Map()
var msg_resp_map = new Map()

var gamePBClient: [] = null
var gamePBServer: [] = null 

function ccloadres(path): any {
    return cc.sys.isNative ? cc.url.raw(path) : `res/raw-assets/${path}`;
}

function loadJSONProto() {
    let c = "resources/pb/gamePBClient.json"
    let cr = ccloadres(c);

    let s = "resources/pb/gamePBServer.json"
    let sr = ccloadres(s);

    cc.loader.load(cr, function (cerr, cres) {
        gamePBClient = cres;

        cc.loader.load(sr, function (serr, sres) {
            gamePBServer = sres;

            loadPBProto();
        })    

    })

}

function loadPBProto() {
    let protopath = "resources/pb/GamePB.proto"
    let pr = ccloadres(protopath);

    protobuf.load(pr, loadcb);
}

function loadcb(err: Error, root: protobuf.Root): void {
    if(err) {
        cc.log('+++++++++++++protobuf.load error+++++++++', err)
        throw err;
    }

    cc.log("++++++++++gamePBClient+++++++", gamePBClient)
    cc.log("++++++++++gamePBServer+++++++", gamePBServer)
    for(let entry in gamePBClient) {
        let req = root.lookupType(gamePBClient[entry]);
        msg_req_map.set(entry, req);
    }

    for (let entry in gamePBServer) {
        let resp = root.lookupType(gamePBServer[entry]);
        msg_resp_map.set(entry, resp);
    }

    // cc.log('+++++++++++++protobuf root+++++++++', root.toJSON())
    cc.log('+++++++++++++protobuf req Map+++++++++', msg_req_map)
    cc.log('+++++++++++++protobuf resp Map+++++++++', msg_resp_map)
}


export class Messager {

    public constructor() {
        loadJSONProto();
    }

    private getReqMessageProto(rpcId: RpcInfo): protobuf.Type {
        let t :protobuf.Type = msg_req_map.get(rpcId.toString())
        return t
    }

    private getRespMessageProto(rpcId: RpcInfo): protobuf.Type {
        let t: protobuf.Type = msg_resp_map.get(rpcId.toString())
        return t
    }

    public encoder(rpcId: RpcInfo, body: any): Uint8Array {
        let msgproto = this.getReqMessageProto(rpcId);
        let err = msgproto.verify(body);
        if(err) {
            throw Error(err);
        }

        let msg = msgproto.create(body);
        let buf = msgproto.encode(msg).finish();
        return buf;
    }

    public decoder(body: { rpcId: number, data: Uint8Array }): protobuf.Message<{}> {
        let msgproto = this.getRespMessageProto(body.rpcId);
        let err = msgproto.verify(body.data);
        if (err) {
            throw Error(err);
        }
        return msgproto.decode(body.data);
    }
}