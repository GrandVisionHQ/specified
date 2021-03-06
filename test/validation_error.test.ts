import * as chai from "chai";
import { Type, verify, ValidationError, either } from "..";


describe("validation error", () => {
    const nestedSpec = Type.object({
        objArray: Type.array(Type.object({
            a: Type.number
        })),
        arrayMap: Type.map(Type.string, Type.array(Type.number))
    });

    describe("generate report json", () => {

        it("generates a json-able report", () => {
            const data = {
                objArray: [{ a: 123 }, { b: 456 }, { a: "nan" }],
                arrayMap: { x: [1, 2, 3], y: "NotAnArray", z: [7, "eight", 9] }
            };
            const result = verify(nestedSpec, data);
            chai.expect(result.err).to.be.instanceof(ValidationError);
            chai.expect(result.err && result.err.generateReportJson()).to.eql({
				msg: "Object validation failed.",
				nested: [
					{
						key: "objArray",
						msg: "Evaluation of attribute \"objArray\" failed.",
						nested: [
							{
								msg: "Array validation failed.",
								nested: [
									{
										key: 1,
										msg: "Evaluation of array element at index \"1\" failed.",
										nested: [{ msg: "Data has attributes that are not part of the schema: \"b\"." }]
									},
									{
										key: 2,
										msg: "Evaluation of array element at index \"2\" failed.",
										nested: [
											{
												msg: "Object validation failed.",
												nested: [
													{
														key: "a",
														msg: "Evaluation of attribute \"a\" failed.",
														nested: [{ msg: "Not a number." }]
													}
												]
											}
										]
									}
								]
							}
						]
					},
					{
						key: "arrayMap",
						msg: "Evaluation of attribute \"arrayMap\" failed.",
						nested: [
							{
								msg: "Map validation failed.",
								nested: [
									{
										key: "y",
										msg: "Evaluation of map value for key \"y\" failed.",
										nested: [{ msg: "Not an array." }]
									},
									{
										key: "z",
										msg: "Evaluation of map value for key \"z\" failed.",
										nested: [
											{
												msg: "Array validation failed.",
												nested: [
													{
														key: 1,
														msg: "Evaluation of array element at index \"1\" failed.",
														nested: [{ msg: "Not a number." }]
													}
												]
											}
										]
									}
								]
							}
						]
					}
				]
            });
        });

    });

    describe("generate error path list", () => {

		it("generates an list of error paths with its messages", () => {
			const data = {
				objArray: [{ a: 123 }, { b: 456 }, { a: "nan" }],
				arrayMap: { x: [1, 2, 3], y: "NotAnArray", z: [7, "eight", 9] }
			};
			const result = verify(nestedSpec, data);
			chai.expect(result.err).to.be.instanceof(ValidationError);
			chai.expect(result.err && result.err.generateErrorPathList()).to.eql([
                {
                    msg: "Data has attributes that are not part of the schema: \"b\".",
                    path: ["objArray", 1]
                },
                {
                    msg: "Not a number.",
                    path: ["objArray", 2, "a"]
                },
                {
                    msg: "Not an array.",
                    path: ["arrayMap", "y"]
                },
                {
                    msg: "Not a number.",
                    path: ["arrayMap", "z", 1]
                }
			]);
		});

        it("generates an empty path for non-nested specs", () => {
            const result = verify(Type.number, "bla");
			chai.expect(result.err && result.err.generateErrorPathList()).to.eql([
                {
                    msg: "Not a number.",
                    path: []
                }
            ]);
        });

        it("generates no nested paths for an either-spec", () => {
            const objectEitherSpec = Type.object({
                a: either(Type.number, Type.string)
            });
            const result = verify(objectEitherSpec, { a: [] });
			chai.expect(result.err && result.err.generateErrorPathList()).to.eql([
                {
                    msg: "Not a number.",
                    path: ["a"]
                },
                {
                    msg: "Not a string.",
                    path: ["a"]
                }
            ]);
        });

    });

});

