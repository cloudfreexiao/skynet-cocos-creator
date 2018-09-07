
	/*
	ObjectPool - yer basic ObjectPool
	 */
export class ObjectPool {

    pool = [];
    name: string;
    _stat: ObjectPoolReporter;

    //function to get a new object
    //optional function to destruct obsolete/ditched/unwantend object
    //optional function to refresh unpooled object
    //lets count/report stuff
    //TODO funkyfy arguments
    constructor(public creator: Function, public destructor?: (object: any) => void, public refresh?: (object: any) => void, public repool?: (object: any) => void) {
        if (!creator) {
            throw new Error('ObjectPool needs a creator function');
        }
        this._stat = new ObjectPoolReporter(this);
    }

    getObject(): any {
        var object: any;
        if (this.pool.length > 0) {
            object = this.pool.pop();
            if (this.refresh) {
                this.refresh(object);
            }
            this._stat.reused();
            //console.log(['ObjectPool.getObject reused', this.stat.getReport()]);
        }
        else {
            object = this.creator();
            //save reference for pool identification and easy returning of object
            object._pool = this;

            if (this.refresh) {
                this.refresh(object);
            }
            this._stat.created();
            //console.log(['ObjectPool.ge1tObject created', this.stat.getReport()]);
        }
        return object;
    }

    returnObject(object: any): bool {
        if (!object) {
            throw new Error('ObjectPool.returnObject null object');
        }

        if (object._pool === this) {
            //TODO add some pool size limit?
            this.pool.push(object);
            if (this.repool) {
                this.repool(object);
            }
            this._stat.returned();
            //console.log(['ObjectPool.getObject returned', this.stat.getReport()])
            return true;
        }
        throw new Error('ObjectPool.returnObject object does not belong here');
    }

    clear() {
        //console.log(['ObjectPool.getObject clear', this.stat.getReport()]);
        var obj, i, ii = this.pool.length;
        if (this.destructor) {
            for (i = 0; i < ii; i++) {
                obj = this.pool[i];
                obj._pool = null;
                this.destructor(obj);
            }
        }
        else {
            for (i = 0; i < ii; i++) {
                this.pool[i]._pool = null;
            }
        }
        this.pool = [];
        this._stat.reset();
    }
}

/*
ObjectPoolStat - simple map id to pools
    */
export class ObjectPoolMap {

    private map = new Map();

    constructor() {
    }

    setPool(id: string, pool: ObjectPool) {
        console.log(['ObjectPool.setPool', id]);
        if (this.map.has(id)) {
            throw new Error('ObjectPoolMap.setPool cannot redefine pool id "' + id + '"');
        }
        pool.name = id;
        this.map.set(id, pool);
        return pool;
    }

    hasPool(id: string): boolean {
        return this.map.has(id);
    }

    getPool(id: string): ObjectPool {
        if (!this.map.has(id)) {
            throw new Error('ObjectPoolMap.getPool unknown pool id "' + id + '"');
        }
        return this.map.get(id);
    }

    releasePool(id: string) {
        if (!this.map.has(id)) {
            throw new Error('ObjectPoolMap.releasePool pool id "' + id + '"');
        }
        this.map.get(id).clear();
        this.map.delete(id);
    }
}

export class ObjectPoolReporter {

    private pool: ObjectPool;
    private stat: ObjectPoolStat;

    constructor(pool: ObjectPool) {
        this.pool = pool;
        this.stat = new ObjectPoolStat(this.pool.name);
    }

    reused() {
        this.stat.reused++;
    }
    returned() {
        this.stat.returned++;
    }
    created() {
        this.stat.created++;
    }

    reset() {
        this.stat.reset();
        return this;
    }

    getReport(): ObjectPoolStat {
        var ret: ObjectPoolStat = new ObjectPoolStat();
        if (this.pool.name) {
            ret.id = this.pool.name;
        }
        ret.created = this.stat.created;
        ret.returned = this.stat.returned;
        ret.reused = this.stat.reused;
        ret.trimmed = this.stat.trimmed;
        //this should be ret.wet :)
        ret.inpool = this.pool.pool ? this.pool.pool.length : 0;
        ret.wild = this.stat.created - this.pool.pool.length;
        return ret;
    }

    getReportStr(sep: string = '\n'): string {
        var ret: string[] = [];
        if (this.pool.name) {
            ret.push('name: ' + this.pool.name);
        }
        ret.push('created: ' + this.stat.created);
        ret.push('returned: ' + this.stat.returned);
        ret.push('reused: ' + this.stat.reused);
        ret.push('pool: ' + this.pool.pool.length);
        ret.push('wild: ' + (this.stat.created - this.pool.pool.length));
        return ret.join(sep);
    }
}
export class ObjectPoolStat {

    created = 0;
    returned = 0;
    reused = 0;
    inpool = 0;
    wild = 0;
    trimmed = 0;

    constructor(public id?: string) {

    }

    add(stat: ObjectPoolStat) {
        this.created += stat.created;
        this.reused += stat.reused;
        this.returned += stat.returned;
        this.trimmed += stat.trimmed;
        this.inpool += stat.inpool;
        this.wild += stat.wild;
        return this;
    }

    reset() {
        this.created = 0;
        this.reused = 0;
        this.returned = 0;
        this.trimmed = 0;
        this.inpool = 0;
        this.wild = 0;
        return this;
    }

}
