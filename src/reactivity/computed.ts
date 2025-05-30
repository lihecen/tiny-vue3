import { ReactiveEffect } from "./effect";
class ComputedRefImpl {
    private _getter: any;
    private _dirty: boolean = true;
    private _value: any;
    private _effect: any;
    constructor(getter) {
        this._getter = getter;
        this._effect = new ReactiveEffect(getter, () => {
            if(!this._dirty) {
                this._dirty = true;
            }
        });
    }
    get value() {
        //调用完一次get()锁上即可
        //当依赖的响应式对象的值发生改变的时候 --> 调用get value() 时 _dirty属性应该变成true --> 引入effect
        if(this._dirty) {
            this._dirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
}
export function computed(getter) {
    return new ComputedRefImpl(getter);
}