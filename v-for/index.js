/**
 * 
 * v-for的简单实现，无法处理嵌套指令和循环嵌套
 * 1. 将v-for元素处理为模板，分析出模板中依赖的data数据(为了简化采用{{}}, v-for的item数据采用{})，建立关系保存到domDataPool；
 * {
 *  dom： v-for元素的父节点，
 *  dir: 'v-for',
 *  template: v-for的字符串模板，数据变化时重新编译模板替换element
 *  dataKey: v-for依赖的data数据key值
 * }
 *      
 * 2. 在依赖数据更新及初始化时编译模板
 * 
*/
class MyVue {
    constructor(options) {
        const {el, data} = options;
        this.$el = typeof el === 'string' ? document.querySelector(el) : el;
        this._data = data.call(this);
        this.domDataPool = Object.keys(this._data).reduce((result, key) => {
            result[key] = [];
            return result;
        }, {})
        this.init();
    }
    init() {
        this.initData();
        this.initDom(this.$el);
        this.updateView();
    }

    initData() {
        for (const key in this._data) {
            Object.defineProperty(this, key, {
                get() {
                    return this._data[key];
                },
                set(newVal) {
                    this._data[key] = newVal;
                    this.updateView(key);
                }
            })
        }
    }
    initDom(el) {
        const childNodes = el.childNodes;
        if(!childNodes.length) return;
        childNodes.forEach((item) => {
            if(item.nodeType === 1) {
                const vfor = item.getAttribute('v-for');
                if(vfor) {
                    const arr = vfor.split(' ');
                    // 循环数据单项形参
                    const param = arr[0];
                    // 解析出引用到的data数据
                    const key = arr[arr.length - 1];
                    let template = item.outerHTML;
                    const keys = template.match(/\{\{(.+)\}\}/g).map(it => it.match(/\{\{(.+)\}\}/)[1].trim());
                    keys.push(key);

                    // 转化为字符串模板
                    template = template.replace(/\{\{(.+)\}\}/g, '');
                    // 保存data-dom关系
                    keys.forEach(it => {
                        this.domDataPool[it].push({
                            dom: item.parentNode,
                            dataKey: key,
                            dir: 'v-for',
                            template: item.outerHTML.replaceAll(`${param}.`, '')
                        })
                    })
                }
            }
            if(item.childNodes) {
                this.initDom(item);
            }
        })
    }
    updateView(dataKey){
        if(!dataKey){
            for (const key in this.domDataPool) {
                this.domDataPool[key].forEach((item) => {
                    if(item.dir === 'v-for') {
                        const fragment = document.createDocumentFragment();
                        this[item.dataKey].forEach(it => {
                            let tem = item.template.replace(/\{\{(.+)\}\}/g, (a, b) => {
                                const key = b.trim();
                                return this[key];
                            })
                            tem = tem.replace(/\{(.+)\}/g, (a, b) => {
                                const key = b.trim();
                                return it[key]
                            })
                            const div = document.createElement('div');
                            div.innerHTML = tem;
                            fragment.appendChild(div.childNodes[0]);
                        })
                        item.dom.innerHTML = '';
                        item.dom.appendChild(fragment);
                    }
                })
            }
            return;
        }
        this.domDataPool[dataKey].forEach((item) => {
            if(item.dir === 'v-for') {
                // 生成文档片段
                const fragment = document.createDocumentFragment();
                this[item.dataKey].forEach(it => {
                    // 处理data数据
                    let tem = item.template.replace(/\{\{(.+)\}\}/g, (a, b) => {
                        const key = b.trim();
                        return this[key];
                    })
                    // 处理循环数据
                    tem = tem.replace(/\{(.+)\}/g, (a, b) => {
                        const key = b.trim();
                        return it[key];
                    })
                    // 模板转化为dom
                    const div = document.createElement('div');
                    div.innerHTML = tem;
                    // 塞入文档片段
                    fragment.appendChild(div.childNodes[0]);
                })
                // 更新dom
                item.dom.innerHTML = '';
                item.dom.appendChild(fragment);
            }
        })
    }
} 