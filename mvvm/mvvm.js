
// 一个简单的数据双向绑定实现
/**
 * 
 * 1. 处理数据 -> 响应式数据 Object.defineProperty Proxy
 *    在set方法中处理数据引起的dom改变
 * 
 * 2. 处理文本dom -> 解析{{xxx}}数据模板，替换模板的同时收集依赖数据的dom，为之后set更新dom做准备
 * 
 * 3. 处理表单dom -> 解析v-model指令 根据数据初始化设置value，同时收集依赖数据的dom，绑定事件处理
 * 
 * 
 */
class MVVM {
    constructor({el, data}) {
        this.$el = typeof el === 'string' ? document.querySelector(el) : el;
        this._data = data.call(this);
        // 一个data的key与dom的映射， 在对应属性更改时，设置dom展示数据
        this.domPool = {};
        // 一个data的key与form表单元素的映射， 在对应属性更改时，设置form表单元素展示数据
        this.formDomPool = {};
        // 初始化
        this.init();
    }

    init() {
        //数据初始化
        this.initData();
        this.initDom();
    }

    initDom() {
        // 初始化文本dom
        this.bindTextDom(this.$el);
        // 初始化表单dom
        this.bindFormDom(this.$el);
    }

    initData() {
        const _this = this;
        const definePropertyFnCreater = function (vm, key) {
            return {
                get () {
                    return vm._data[key];
                },
                set (newVal) {
                    vm._data[key] = newVal;
                    if(vm.domPool[key]) {
                        vm.domPool[key].forEach(item => item.innerHTML = newVal);
                    }
                    if(vm.formDomPool[key]) {
                        vm.formDomPool[key].forEach(item => item.value = newVal);
                    }
                }
            }
        }
        this.$data = {};
        for (const key in this._data) {
            // 将$data代理到_data, 并处理为响应式数据
            // // 1.使用Object.defineProperty
            // Object.defineProperty(this.$data, key, definePropertyFnCreater(this, key));
            
            // 对于_data的key值代理到vm(this)实例上
            Object.defineProperty(this, key, definePropertyFnCreater(this, key));
        }
        // 2. 使用Proxy
        this.$data = new Proxy(this._data, {
            get(target, key) {
                return Reflect.get(target, key);
            },
            set(target, key, val) {
                if(_this.domPool[key]) {
                    _this.domPool[key].forEach(item => item.innerHTML = val);
                }
                if(_this.formDomPool[key]) {
                    _this.formDomPool[key].forEach(item => item.value = val);
                }
                return Reflect.set(target, key, val);
            }
        })
    }

    bindTextDom(el) {
        const childNodes = el.childNodes;
        childNodes.forEach(item => {
          if(item.nodeType === 3) { // 判断出文本节点nodeType === 3
              const _value = item.nodeValue;
              // 判断出非换行的文本节的
              if (_value.trim().length) {
                  // 匹配模板
                  let _isValid = /\{\{(.+?)\}\}/.test(_value);
                  if(_isValid) {
                      const _key = _value.match(/\{\{(.+?)\}\}/)[1].trim();
                      if(!this.domPool[_key]) {
                        this.domPool[_key] = [];
                      }
                      this.domPool[_key].push(item.parentNode);
                      // 数据模板初始化赋值
                      item.parentNode.innerText = this.$data[_key];
                  }
              }
          }
          if(item.childNodes.length){
              this.bindTextDom(item)
          }
        })
    }

    bindFormDom(el) {
        // 初始化表单dom，包括解析指令v-model和绑定输入事件
        const formItems = el.querySelectorAll('[v-model]');
        
        formItems.forEach(item => {
            const _vModel = item.getAttribute('v-model');
            if(_vModel) {
                if(!this.formDomPool[_vModel]) {
                    this.formDomPool[_vModel] = [];
                }
                item.value = this.$data[_vModel];
                this.formDomPool[_vModel].push(item);
                item.addEventListener('input', this.formHandleInput.bind(this, _vModel, item), false);
            }
        })
    }

    formHandleInput(key, item) {
        const _value = item.value;
        this.$data[key] = _value;
    }
}

