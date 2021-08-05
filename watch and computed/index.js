class MyVue {
    constructor(options) {
        const { data, computed = {} } = options;
        this._data = data.call(this);
        this.computed = computed;
        this.computedCallback = {};
        this.computedMap = {};
        this.init()
    }

    init() {
        this.initData();
        this.initComputed()
    }

    initData() {
        for (const key in this._data) {
            Object.defineProperty(this, key, {
                get() {
                    return this._data[key];
                },
                set(newVal) {
                    let oldVal = this._data[key];
                    this._data[key] = newVal;
                    if(oldVal !== newVal) {
                        this.computedCallback[key].forEach(fn => fn())
                    }
                }
            })
        }
    }

    initComputed() {
        for (const key in this.computed) {
            Object.defineProperty(this, key, {
                get() {
                    return this.computedMap[key].value;
                }
            })
        }
        this.computedMap = Object.keys(this.computed).reduce((result, key) => {
            const item = this.computed[key];
            result[key] = {
                key,
                fn: item.bind(this),
                value: item.call(this),
                dep: item.toString().match(/this\.(.+?)/g).map(it => it.replaceAll('this.', ''))
            }
            result[key].dep.forEach((it) => {
                !this.computedCallback[it] && (this.computedCallback[it] = []);
                this.computedCallback[it].push(() => result[key].value = result[key].fn());
            })
            return result;
        }, {})
    }
    
    initWatch() {
        
    }
}