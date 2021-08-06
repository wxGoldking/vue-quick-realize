/**
 * Vue
 * 
 * data -> data() -> vm.$data -> reactive -> vm.xx
 * 
 *      get vm[key] -> vm.$data[key]
 *      set vm[key] -> vm.$data[key] = value
 *          ? -> updateComputedProp -> value
 *          ? -> updateWatchProp -> callback
 * 
 * 
 * computed -> props -> {
 *      value -> get -> value
 *      get -> method
 *      dep -> [ a, b ]
 * }
 * 
 * watch -> props -> fn -> data set -> call fn
 * 
 * 
*/

function reactive(vm, __get__, __set__) {
    const _data = vm.$data;
    
    for (const key in _data) {
        Object.defineProperty(vm, key, {
            get() {
                __get__(key, _data[key]);
                return _data[key];
            },
            set(newVal) {
                const oldVal = _data[key];
                _data[key] = newVal;
                __set__(key, newVal, oldVal);
            }
        })
    }
}
class Computed {
    constructor(vm, computed) {
        /**
         * 
         *  total (newVal, oldVal) {
         *        return this.a + this.b;
         *         
         *   },
         * {
         *   key: total, 
         *   value: 3
         *   get: total fn,
         *   dep: [a, b]
         * }
         * 
         * 
         * 
        */
       this.computedData = []
       this.init(vm, computed)
    }
    init(vm, computed) {
        for (const key in computed) {
            const item = {
                key,
                get: computed[key].bind(vm),
                value: computed[key].call(vm),
                dep: computed[key].toString().match(/this\.(\w+?)/g).map(it => it.split('.')[1])
            };
            this.computedData.push(item)
            Object.defineProperty(vm, key, {
                get() {
                    return item.value;
                },
                set() {
                    item.value = item.get();
                }
            })
        }
    }
    update(key, watch) {
       const target = this.computedData.find(it => it.dep.includes(key));
       if(!target) return;
       const oldVal = target.value;
       target.value = target.get();
       watch(target.key, target.value, oldVal);
    }
}

class Watcher {
    /**
     *  watchers [
     *  {
     *      key,
     *      fn: key, fn
     *  }
     * 
     * 
     * ]
     * 
     */
    constructor(vm, watch) {
        this.watchers = [];
        this.init(vm, watch)
    }
    init(vm, watch) {
        for (const key in watch) {
            this.watchers.push({
                key,
                handler: watch[key].bind(vm)
            })
        }
    }
    update(key, newVal, oldVal) {
        const target = this.watchers.find(it => it.key === key);
        if(!target) return;
        target.handler(newVal, oldVal)
    }
}

class Vue {
    constructor(options) {
        const {data, computed, watch} = options;

        this.$data = data();

        this.init(this, computed, watch)
    }

    init(vm, computed, watch) {
        this.initData(vm);
        this.initComputed(vm, computed);
        this.initWatcher(vm, watch);
    }

    initData(vm) {
        // 数据响应式
        reactive(vm, (key, valye) => {

        }, (key, newVal, oldVal) => {
            if(newVal === oldVal) return;
            this.$computed(key, this.$watch);
            this.$watch(key, newVal, oldVal);
        })
    }

    initComputed(vm, computed) {
        // 枚举computed -> 增加computedData
        // 返回实例 -> 实例里有update -> 更新computedData的value 
        const computedIns = new Computed(vm, computed)
        this.$computed = computedIns.update.bind(computedIns);
    }

    initWatcher(vm, watch) {
        // 枚举watcher -> 增加侦听器
        // 返回实例 -> 实例里有调用侦听器的方法 -> 执行侦听器
        const watcherIns = new Watcher(vm, watch);
        this.$watch = watcherIns.update.bind(watcherIns);
    }
}