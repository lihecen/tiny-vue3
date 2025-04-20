import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "../shared";
class RefImpl {
   private _value: any;
   private _rawValue: any;
   public dep;
   public __v_isRef = true;
   constructor(value) {
      this._rawValue = value;
      this._value = convert(value);
      //如果value值为一个对象，则应该转化为reactive进行处理
      this.dep = new Set();
   }
   get value() {
      trackRefValue(this);
      return this._value;
   }
   set value(newValue) {
      //先修改value值再去触发依赖
      //hasChanged
      //对比的时候会不同，一个是新传入的对象，一个是转换成Proxy的对象
      if(hasChanged(newValue, this._rawValue)) {
         this._rawValue = newValue;
         this._value = convert(newValue);
         triggerEffects(this.dep);
      }
   }
}

function convert(value) {
   return isObject(value) ? reactive(value) : value;
}

function trackRefValue(ref) {
   if(isTracking()) {
      trackEffects(ref.dep);
   }
}

export function ref(value) {
   return new RefImpl(value);
}

export function isRef(ref) {
   return !!ref.__v_isRef;
}

export function unRef(ref) {
   //判断是否为ref，如果是则返回ref.value, 否则直接返回ref
   return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
   //get | set
   return new Proxy(objectWithRefs, {
      get(target, key) {
         //调用get()，如果age属性为ref，则返回age.value, 否则返回本身的value
         return unRef(Reflect.get(target, key));
      },
      set(target, key, value) {
         //调用set(), 如果原来的值是ref属性并且新传入的值不是ref属性，则把新的值赋给原来的值，否则直接返回
         if(isRef(target[key]) && !isRef(value)) {
            return target[key].value = value;
         }else {
            return Reflect.set(target, key, value);
         }
      }
   })
}