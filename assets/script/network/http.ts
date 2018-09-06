import { handler, gen_handler } from "../utils/handler"

export const HTTP_METHOD_GET: string = "GET";
export const HTTP_METHOD_POST: string = "POST";
const HTTP_TIME_OUT: number = 5000;
// const MAX_RETRY_TIMES = 3;


enum READY_STATE 
{
    UNSENT = 0,             //未打开,open()方法还未被调用.
    OPENED = 1,             //未发送,send()方法还未被调用.
    HEADERS_RECEIVED = 2,   //已获取响应头,send()方法已经被调用, 响应头和响应状态已经返回.
    LOADING = 3,            //正在下载响应体,响应体下载中; responseText中已经获取了部分数据.
    DONE = 4,               //请求完成,整个请求过程已经完毕.	
}

function status_is_ok(status: number): boolean 
{
    return status >= 200 && status < 300;
}


class http_request {
    url: string;
    full_url: string;
    method: string;
    params: any;
    timeout?: number;
    retry_times: number;
    cb?: handler;
    xhr: XMLHttpRequest;

    constructor(url: string, method: string, params: any, cb?: handler, timeout?: number) {
        this.full_url = this.url = url;
        this.method = method;
        this.timeout = timeout || HTTP_TIME_OUT;
        this.cb = cb;
        this.retry_times = 0;
        if (typeof (params) === "object") {
            this.params = JSON.stringify(params); //统一 json 格式
        }
        else {
            this.params = params;
        }        
    }

    toString(): String {
        return "http_request:" + this.full_url + ",method=" + this.method + ",timeout=" + this.timeout;
    }
    
    exec() {
        let _xhr: XMLHttpRequest = this.xhr;
        let data: any = null;
        if (!_xhr) {
            this.xhr = _xhr = new XMLHttpRequest();
        }
        if (this.method == HTTP_METHOD_POST) {
            data = this.params;
        }
        else {
            this.full_url += "?params=" + this.params; // TODO: 待定 
        }

        let self: http_request = this;
        _xhr.onreadystatechange = function (): void {
            if (_xhr.readyState === READY_STATE.DONE) {
                let status: number = _xhr.status;
                if (!status_is_ok(status)) {
                    cc.warn(self.toString(), "resp error, status code=", status);
                    return;
                }
                cc.log(self.toString(), "resp success! status code=", status, ",responseType=", _xhr.responseType, ",response=", _xhr.responseText);
                let resp = JSON.parse(_xhr.responseText);   //{resp_code, response}
                let success: boolean = resp.resp_code === 200;
                if (self.cb) {
                    self.cb.exec(success, resp);
                }
            }
        };
        _xhr.ontimeout = function (): void {
            cc.warn(self.toString(), "request ontimeout");
        }
        _xhr.onerror = function (): void {
            cc.error(self.toString(), "request onerror")
        }
        _xhr.onabort = function (): void {
            cc.warn(self.toString(), "request onabort")
        }

        _xhr.open(this.method, this.full_url, true);
        //setRequestHeader should be called after open
        if (cc.sys.isMobile) {
            _xhr.setRequestHeader("Accept-Encoding", "gzip,deflate");
        }
        if (this.method == HTTP_METHOD_POST) {
            _xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
        }
        // note: In Internet Explorer, the timeout property may be set only after calling the open()  
        // method and before calling the send() method.  
        _xhr.timeout = this.timeout || HTTP_TIME_OUT;
        //event binding should before send
        _xhr.send(data);
    }

}


type proto_listener = {
    cb: handler;
    cx: cc.Component;
}

//TODO:http_request对象池重用，HttpClient监听http_request对象事件, 统计request数量, 统一的http_error_handler处理
export  class HttpClient {
    private error_handler: handler;
    private proto_listeners: Map<string, proto_listener[]>;
    private context_protos: Map<cc.Component, string[]>;

    public constructor() {
        this.proto_listeners = new Map();
        this.context_protos = new Map();
        this.error_handler = gen_handler(this.handle_response_error, this);
        this.error_handler.retain();
    }


    public register_listener(proto_name: string, cb: handler, context: cc.Component) {
        //proto_name->listeners
        let listeners: proto_listener[] = this.proto_listeners.get(proto_name);
        if (!listeners) {
            listeners = [];
            this.proto_listeners.set(proto_name, listeners);
        }
        //持久化handler
        cb.retain();
        listeners.push({ cb: cb, cx: context })

        //context->proto_names
        let protos: string[] = this.context_protos.get(context);
        if (!protos) {
            protos = [];
            this.context_protos.set(context, protos);
        }
        protos.push(proto_name);
    }

    public unregister_listeners(context: cc.Component) {
        let protos: string[] = this.context_protos.get(context);
        if (!protos) {
            cc.log(context.name, "has no protos");
            return;
        }
        protos.forEach((proto_name: string): void => {
            let listeners: proto_listener[] = this.proto_listeners.get(proto_name);
            if (!listeners) {
                return;
            }
            for (let i: number = listeners.length - 1; i >= 0; i--) {
                if (listeners[i].cx === context) {
                    //释放handler
                    listeners[i].cb.release();
                    listeners.splice(i, 1);
                    cc.log(context.name, "remove listener");
                }
            }
        });
        this.context_protos.delete(context);
    }

    public unregister_all() {
        this.context_protos.forEach((value, key) => {
            this.unregister_listeners(key);
        });
    }

    public request(url: string, params: any, req_data: any, method: string, timeout?: number): void {
        cc.log('request:', url, "method:", method, "req_data:", req_data)
        let req: http_request = this.spawn_request(url, req_data, method, params, timeout);
        req.exec();
    }

    public register_error_handler(cb: handler) {
        this.error_handler = cb;
    }

    private handle_http_response(req_data: any, is_ok: boolean, resp: any) {
        let proto_name: string = req_data.method;
        cc.log("handle_http_response", proto_name);
        if (!is_ok) {
            this.error_handler.exec(resp.rescode, resp.resmsg);
            // if (resp.resp_code == 4) {
            //     // appdata.loadScene(Consts.SCENE_NAME.START);
            //     return;
            // }
        }
        let listeners: proto_listener[] = this.proto_listeners.get(proto_name);
        if (!listeners) {
            cc.log("++++++++++++not found proto_listener+++++++++++++++", proto_name)
            return;
        }
        listeners.forEach((listener: proto_listener, index: number): void => {
            if (!cc.isValid(listener.cx)) {
                return;
            }
            listener.cb.exec(is_ok, resp, req_data);
        });
    }

    private handle_response_error(rescode: number, resmsg: string) {
        // toast.show(Consts.MSG_ERROR[rescode] || resmsg);
    }

    private spawn_request(url: string, req_data: any, method: string, params: any, timeout?: number): http_request {
    let cb: handler = gen_handler(this.handle_http_response, this, req_data);
        return new http_request(url, method, params, cb, timeout);
    }

}