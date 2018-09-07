let handler_pool: handler[] = [];
// let handler_pool_size = 10;

//用于绑定回调函数this指针
export class handler {
    private cb: Function;
    private host: any;
    private args: any[];
    private times: number;
    private is_persist: boolean;

    constructor() { }

    init(cb: Function, host: any = null, ...args: any[]): void {
        this.cb = cb;
        this.host = host;
        this.args = args;
        this.times = 0;
        this.is_persist = false;
    }

    exec(...extras: any[]): void {
        //持久的handler, exec可能会执行多次，每次执行前要清理一下旧参数
        if (this.is_persist && this.times > 0) {
            this.args = [];
            cc.log("handler exec", this.times, "times, clear prev args");
        }

        this.args = this.args.concat(extras);
        this.cb.apply(this.host, this.args);
        this.times++;

        //临时的用完回收
        if (!this.is_persist) {
            this.release();
        }
    }

    retain() {
        this.is_persist = true;
    }

    release() {
        // this.cb = null;
        // this.host = null;
        // this.args = null;
        // this.times = null;
        // this.is_persist = false;
        // if(handler_pool.length < handler_pool_size)
        // {
        //     handler_pool.push(this);
        // }
    }
}

/**注意区分一次性和持久的handler */
export function gen_handler(cb: Function, host: any = null, ...args: any[]): handler {
    let single_handler: handler = handler_pool.length < 0 ? handler_pool.pop() : new handler()
    //这里要展开args, 否则会将args当数组传给wrapper, 导致其args参数变成2维数组[[]]
    single_handler.init(cb, host, ...args);
    return single_handler;
}
