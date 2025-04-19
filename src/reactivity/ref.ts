import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";
import { hasChanged, isObject } from "./shared";
class RefImpl {
   private _value: any;
   private _rawValue: any;
   public dep;
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