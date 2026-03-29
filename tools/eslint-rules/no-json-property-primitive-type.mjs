/**
 * ESLint rule: no-json-property-primitive-type
 *
 * Bans @JsonProperty({ type: String }), @JsonProperty({ type: Number }),
 * and @JsonProperty({ type: Boolean }).
 *
 * These pass the TypeScript build but break production deserialization.
 * The typescript-json-serializer `type` option expects class constructors,
 * not JavaScript primitive constructors.
 *
 * Correct usage:
 *   @JsonProperty()                      — for primitive arrays (string[], number[], boolean[])
 *   @JsonProperty({ type: MyDtoClass })  — for class types only
 */
const BANNED_PRIMITIVES = ['String', 'Number', 'Boolean'];

const rule = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Ban @JsonProperty({ type: String/Number/Boolean }) — breaks production deserialization',
        },
        messages: {
            noPrimitiveType:
                '@JsonProperty({ type: {{ primitive }} }) breaks production deserialization. ' +
                'For primitive arrays (string[], number[], boolean[]), use @JsonProperty() with ' +
                'no type parameter. The type option is only for class types: ' +
                '@JsonProperty({ type: MyDtoClass }).',
        },
        schema: [],
    },
    create(context) {
        return {
            CallExpression(node) {
                if (node.callee.name !== 'JsonProperty') return;
                const arg = node.arguments[0];
                if (!arg || arg.type !== 'ObjectExpression') return;
                for (const prop of arg.properties) {
                    if (
                        prop.key?.name === 'type' &&
                        prop.value?.type === 'Identifier' &&
                        BANNED_PRIMITIVES.includes(prop.value.name)
                    ) {
                        context.report({
                            node: prop,
                            messageId: 'noPrimitiveType',
                            data: { primitive: prop.value.name },
                        });
                    }
                }
            },
        };
    },
};

export default rule;
