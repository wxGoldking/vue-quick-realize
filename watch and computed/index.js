/**
 * 简单实现computed和watch
 * 
 * 数据劫持，代理data到this
 * computed
 * 1. initComputed
 *   代理computed 的key到this
 * 
 *   生成computedMap
 * {
 *  key: { // computed的key
 *         fn: computed的handle绑定this,
 *         value: computed的handle.call(this)获取初始值，之后作为结果缓存
 *         dep: 分析出handle依赖的data的keys
 *      }
 *  ....
 * }
 *  
 * 生成computedMap同时生成computedCallback ( key为computedMap每项的dep ) 在数据set时执行对应的computedCallback[key]
 * 
 * {
 *  
 *  key(dep): [
 *          callback, ------dep对应的computedMap项的fn执行并更新value，同时执行watchCallback[key]的回调
 *          .....
 *      ] 
 * }
 *   
 * 
 * watch
 * 2. initWatch
 *  生成watchCallback  在数据set时执行对应的watchCallback[key]
 * { 
 *  key: [
 *          callback, ------ key对应的watch的fn.bind(this)
 *      ]
 * 
 * }
 * 
*/

class MyVue {
    constructor(options) {
        const { data, computed = {}, watch = {} } = options;
        this._data = data.call(this);
        this.computed = computed;
        this.watch = watch;

        this.computedCallback = {};
        this.computedMap = {};

        this.watchCallback = {};
        this.init()
    }

    init() {
        this.initData();
        this.initComputed();
        this.initWatch();
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
                        this.computedCallback[key].forEach(fn => fn());
                        this.watchCallback[key].forEach(fn => fn(newVal, oldVal));
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
                fn: item.bind(this),
                value: item.call(this),
                dep: item.toString().match(/this\.(\w+?)/g).map(it => it.replaceAll('this.', ''))
            }
            result[key].dep.forEach((it) => {
                !this.computedCallback[it] && (this.computedCallback[it] = []);
                this.computedCallback[it].push(() => {
                    const oldVal = result[key].value;
                    result[key].value = result[key].fn();
                    this.watchCallback[key].forEach(fn => fn(result[key].value, oldVal));
                });
            })
            return result;
        }, {})
    }
    initWatch() {
        Object.keys(this.watch).forEach((key) => {
            const fn = this.watch[key].bind(this);
            !this.watchCallback[key] && (this.watchCallback[key] = []);
            this.watchCallback[key].push((newVal, oldVal) => fn(newVal, oldVal));
        })
    }
}