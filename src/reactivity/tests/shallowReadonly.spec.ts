import { isReadonly, shallowReadonly } from "../reactive";
describe("shallowReadonly", () => {
    test("should not make non-reactive properties reactive", () => {
        //外层为isReadonly, 内层则为正常的正常的对象
        const props = shallowReadonly({n : { foo: 1 }});
        expect(isReadonly(props)).toBe(true);
        expect(isReadonly(props.n)).toBe(false);
    });
    it("should call console.warn when set", () => {
            //console.warn()
            //mock
            console.warn = jest.fn()
            const user = shallowReadonly({
                age: 10,
            });
            user.age = 11;
            expect(console.warn).toHaveBeenCalled();
        });
})