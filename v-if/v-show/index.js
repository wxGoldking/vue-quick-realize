class MyVue {
    // 1.代理数据和数据劫持

    // 2.初始化dom数据
    /**
     * 
     * 数据({{}}数据，v-if, v-show, v-model)与dom的依赖关系收集，建立联系 
     * {
     *  key: [
     *  {
     *    dom: 依赖数据的dom
     *    dir: 指令
     *  }
     * ]
     * 
     * }
     * 事件(@自定义事件，v-model)绑定
     * 
     * */
    // 3.处理渲染视图，包括初始化数据和data变化引起的视图变化

    constructor(options){
        const {el, data, methods} = options;
        this.$el = typeof el === 'string' ? document.querySelector(el) : el;
        this._data = data();
        this.dataDomPool = Object.keys(this._data).reduce((result, item) => {
            result[item] = [];
            return result;
        }, {})
        this.methods = methods;
        this.init()
    }
    init() {
        // 初始化数据-数据代理劫持
        this.initData();
        // 初始化视图，解析指令数据，收集数据与视图的关系，构建dataDomPool， 同时绑定事件；
        this.initDom(this.$el);
        // 初始化视图
        this.updataView();
    }
    initData() {
        for (const key in this._data) {
            Object.defineProperty(this, key, {
                get() {
                    return this._data[key];
                },
                set(newVal) {
                    this._data[key] = newVal;
                    this.updataView(key);
                }
            })
        }
    }
    initDom(el) {
        const childNodes = el.childNodes;
        if(!childNodes.length) {
            return;
        }
        childNodes.forEach(item => {
            // nodeType === 1 代表元素
            if(item.nodeType === 1) {
                const vShow = item.getAttribute('v-show');
                const vIf = item.getAttribute('v-if');
                const vClick = item.getAttribute('@click');
                if(vShow) {
                    this.dataDomPool[vShow].push({
                        dom: item,
                        dir: 'v-show'
                    })
                }
                if(vIf) {
                    this.dataDomPool[vIf].push({
                        dom: item,
                        dir: 'v-if'
                    })
                }
                if(vClick) {
                    this.initEvent(item, 'click', this.methods[vClick]);
                }
            }
            if(item.childNodes) {
                this.initDom(item);
            }
        })
    }
    // 为元素绑定事件
    initEvent(el, event, fn) {
        el.addEventListener(event, fn.bind(this), false);
    }
    // 根据key, 更新数据相关的dom视图
    updataView(dataKey) {
        if(!dataKey) {
            // 初始化视图
            for (const key in this.dataDomPool) {
                this.dataDomPool[key].forEach(item => {
                    if(item.dir === 'v-show') {
                        item.dom.style.display = this._data[key] ? 'block' : 'none';
                    } else if(item.dir === 'v-if') {
                        const value = this._data[key];
                        if(value && item.comment) {
                            item.comment.parentNode.replaceChild(item.dom, item.comment);
                        }else if(!value) {
                            item.comment = document.createComment('v-if');
                            item.dom.parentNode.replaceChild(item.comment, item.dom);
                        }
                    }
                })
            }
            return;
        }
        this.dataDomPool[dataKey].forEach(item => {
            if(item.dir === 'v-show') {
                item.dom.style.display = this._data[dataKey] ? 'block' : 'none';
            } else if(item.dir === 'v-if') {
                const value = this._data[dataKey];
                if(value && item.comment) {
                    item.comment.parentNode.replaceChild(item.dom, item.comment);
                }else if(!value) {
                    item.comment = document.createComment('v-if');
                    item.dom.parentNode.replaceChild(item.comment, item.dom);
                }
            }
        })
    }
}