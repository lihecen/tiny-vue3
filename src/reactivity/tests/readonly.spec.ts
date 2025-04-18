import { isReadonly, readonly } from "../reactive";
describe("readonly", () => {
    it("should make nested values readonly", () => {
        //不可以被改写
        const original = { foo: 1, bar: { baz: 2}};
        const wrapped = readonly(original);
        expect(original).not.toBe(wrapped);
        expect(wrapped.foo).toBe(1);
        expect(isReadonly(wrapped)).toBe(true);
        expect(isReadonly(original)).toBe(false);
    });
    it("warn then call set", () => {
        //console.warn()
        //mock
        console.warn = jest.fn()
        const user = readonly({
            age: 10,
        });
        user.age = 11;
        expect(console.warn).toHaveBeenCalled();
    });
});