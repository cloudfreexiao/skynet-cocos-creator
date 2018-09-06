import { HttpClient, HTTP_METHOD_GET, HTTP_METHOD_POST } from "../network/http"

import { handler, gen_handler } from "../utils/handler"
import * as Consts from "../consts/consts"
// import * as crypto from 'crypto'

// var md5 = crypto.createHash('md5');

// var result = md5.update('a').digest('hex');


export default class HttpProxy extends puremvc.Proxy implements puremvc.IProxy {
    public static NAME: string = "HttpProxy";

    private httpclient: HttpClient;

    private loginurl: string; 

    public constructor() {
        super(HttpProxy.NAME);
        this.httpclient = new HttpClient();
        // TODO:设置
        this.loginurl = Consts.SERVER_URL.loginurl;
    }

    public register_listener(proto_name: string, cb: handler, context: cc.Component) {
        this.httpclient.register_listener(proto_name, cb, context);
    }

    public unregister_listeners(context: cc.Component) {
        this.httpclient.unregister_listeners(context);
    }

    public unregister_all() {
        this.httpclient.unregister_all();
    }

    public register_error_handler(cb: handler) {
        this.httpclient.register_error_handler(cb);
    }

    /*
        URL 只有 一个 api
        只能是 post 请求
        参数格式为  { server_ca, module, method, parms } json 串
        其中要注意的是 parms 也是个 json 串
        回复的格式 { err = "OK", response = {} }   的json串
    */
    public TestLogin() {
        // this.GET(loginurl, )
        let h = gen_handler(this.testLoginFunc, this);
        let p = "logintest"
        let ctx: cc.Component = new cc.Component()
        this.register_listener(p, h, ctx)

        let parms = JSON.stringify({ openId: "111111111", loginSdk: 1, pf: 1, faceID: 1, userdata: "testccccssfr"})
        let body = {
            server_ca: "ABCDEFGHIJKLMN111111",
            module: "login_api_auth",
            method: "login",
            parms: parms,
        }

        this.POST(this.loginurl, body, { method: p, } )
    }

    private testLoginFunc(is_ok: boolean, resp: any, req_data: any) {
        cc.log("========testLoginFunc ok=========");

        cc.log("+++++resp+++", JSON.stringify(resp) )
    }


    public GET(url: string, params: any, req_data: any): void {
        this.request(url, params, req_data, HTTP_METHOD_GET)
    }

    public POST(url: string, params: any, req_data: any): void {
        this.request(url, params, req_data, HTTP_METHOD_POST)
    }

    private request(url: string, params: any, req_data: any, method: string): void {
        this.httpclient.request(url, params, req_data, method);
    }



}