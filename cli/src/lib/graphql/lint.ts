import * as log from 'src/lib/log';
import {
    GraphQLArgument,
    GraphQLSchema,
    buildSchema,
    isInputObjectType,
    isListType,
    isNonNullType,
    isObjectType,
    isUnionType,
} from 'graphql';
import { performance } from 'perf_hooks';

interface Segment {
    fieldName: string;
    type: string;
}

// Checks to see if the given type name is already a part of the path;
// i.e. if we have a cycle.
function isInPath(typeName: string, path: Segment[]): boolean {
    for (const segment of path) {
        if (segment.type === typeName) {
            return true;
        }
    }
    return false;
}

// Helper method to convert the list of path segments into a nicely
// formatted string, i.e. '[Type].field[Type].field[Type]'.
//
// Note that the first element on the path will only have the type and
// not the field name.
function pathStr(path: Segment[]): string {
    const p: string[] = [];
    for (const [i, s] of path.entries()) {
        if (i > 0) {
            p.push('.');
            // For the first item, we only want to print the type, not the
            // name.
            p.push(s.fieldName);
        }
        p.push(`[${s.type}]`);
    }
    return p.join('');
}

// Build a recursion error string from a list of path segments. This makes the
// following assumptions:
// - there will be a duplicated type in the path
// - the type of the final segment is that duplicated type
// - the "recursive type" is the _parent_ of the duplicated type and not the
//   duplicated type itself.
//
// Given this, it _only_ prints the path segments between the duplicated types,
// and flags the parent of the recursive type.
//
// The final output will look like this:
//    'Recursive type found: "A", cycle in path: [A].b[B].a[A]
//
// Look at lint.test.ts to see expected input/outputs under a variety of
// scenarios.
function recursionErrorStr(path: Segment[]): string {
    // Find the first place in the path where the repeated type appears.
    // We only want to get the path segment part that repeats.
    const firstPos = path.findIndex(
        (segment: Segment): boolean =>
            segment.type === path[path.length - 1].type
    );
    const recursiveTypePos = Math.max(0, path.length - 2);
    return `Recursive type found: "${
        path[recursiveTypePos].type
    }", cycle in path: ${pathStr(path.slice(firstPos))}`;
}

interface RecursiveGlobals {
    schema: GraphQLSchema;
    config: LintConfig;
    recursionErrors: { [key: string]: Segment[][] };
}

// Recursively checks to see if there are any cycles in the graphql
// spec, and adds error information to 'globals.recursionErrors' if so.
//
// Note that the same type cycle may occur multiple times if there are
// independent paths.
function recurseObjects(
    // The name of the current field relative to the parent object. This
    // must be passed in since it's not a property of the object itself.
    fieldName: string,
    // The current object, which may be any valid GraphQL object or null
    // or undefined. We do a bunch of testing to find out which of these
    // it is in the method itself, hence the 'any' designtation.
    cur: any,
    // Variables that are 'global' to the full recursion, i.e. schema,
    // config, and error aggregators.
    globals: RecursiveGlobals,
    // The current recursive stack path.
    path: Segment[]
): void {
    // Resolve list and non-nullable types by getting the underlying type.
    while (isListType(cur) || isNonNullType(cur)) {
        cur = cur.ofType;
    }
    // If this is a union, iterate through all the different concrete types
    // that could underly it.
    if (isUnionType(cur)) {
        for (const t of cur.getTypes()) {
            recurseObjects(fieldName, t, globals, path);
        }
        return;
    }

    // If this is any type other than an object type, we don't need to
    // worry about recursion.
    if (!isObjectType(cur) && !isInputObjectType(cur)) {
        return;
    }

    // If this is marked as a recursive type already, short-circuit.
    if (globals.recursionErrors[cur.name]) {
        return;
    }

    const segment = { fieldName, type: cur.name };
    if (isInPath(cur.name, path)) {
        const parentType = path[path.length - 1].type;
        if (!globals.config.allowedRecursiveTypes?.includes(parentType)) {
            globals.recursionErrors[parentType] = [
                ...(globals.recursionErrors[parentType] ?? []),
                [...path, segment],
            ];
        }
        return;
    }
    path = [...path, segment];
    // Look at fields.
    for (const [k, v] of Object.entries(cur.getFields())) {
        recurseObjects(k, v.type, globals, path);
        // Look at the arguments (if any). We need to do this here because the
        // GraphQLObjectType does not have arguments, so we need the
        // GraphQLFieldType.
        for (const arg of (v.args as GraphQLArgument[]) ?? []) {
            recurseObjects(arg.name, arg.type, globals, [
                ...path,
                // Must add the definition for 'v'!
                { fieldName: v.name, type: v.type.name },
            ]);
        }
    }
}

// checkRecursive is the root of the 'no recursive types' lint rule.
function checkRecursive(schema: GraphQLSchema, config: LintConfig): string[] {
    const globals = {
        schema,
        config,
        recursionErrors: {},
    };
    recurseObjects('query', schema.getQueryType(), globals, []);
    recurseObjects('mutation', schema.getMutationType(), globals, []);
    return Object.values<Segment[][]>(globals.recursionErrors).map<string>(
        (paths: Segment[][]): string => {
            return recursionErrorStr(paths[0]);
        }
    );
}

export interface LintConfig {
    // We have to grandfather in some allowed recursive types, since they
    // pre-exist our lint rule. This is where that is configured.
    allowedRecursiveTypes?: string[];
}

export function lint(schemaString: string, config: LintConfig): string[] {
    let errors: string[] = [];

    const t0 = performance.now();
    const schema = buildSchema(schemaString);
    const t1 = performance.now();
    errors = errors.concat(checkRecursive(schema, config));
    const t2 = performance.now();
    log.debug(`schema parse time: ${t1 - t0}ms`);
    log.debug(`lint time: ${t2 - t1}ms`);
    log.debug(`total time: ${t2 - t0}ms`);

    return errors;
}
