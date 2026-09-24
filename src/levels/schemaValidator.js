// Interprets the subset of JSON Schema used by level.schema.json. Hand-rolled on
// purpose: schema compilers like ajv use new Function(), which the production
// Content-Security-Policy (script-src 'self', no unsafe-eval) forbids.

const typeOf = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
};

const matchesType = (value, type) => {
  const actual = typeOf(value);
  return actual === type || (type === 'number' && actual === 'integer');
};

const joinPath = (base, key) => (typeof key === 'number' ? `${base}[${key}]` : base ? `${base}.${key}` : key);

function resolveRef(ref, root) {
  if (!ref.startsWith('#/')) throw new Error(`Unsupported schema reference ${ref}`);
  return ref
    .slice(2)
    .split('/')
    .reduce((node, part) => node?.[part], root);
}

export function validateAgainstSchema(value, schema, root = schema, path = '') {
  if (schema.$ref) return validateAgainstSchema(value, resolveRef(schema.$ref, root), root, path);
  const errors = [];
  const at = path || '(root)';

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => matchesType(value, type))) {
      return [{ path: at, message: `must be ${types.join(' or ')}` }];
    }
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({ path: at, message: `must be one of ${schema.enum.join(', ')}` });
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) errors.push({ path: at, message: 'must be a finite number' });
    if (schema.minimum !== undefined && value < schema.minimum) errors.push({ path: at, message: `must be >= ${schema.minimum}` });
    if (schema.maximum !== undefined && value > schema.maximum) errors.push({ path: at, message: `must be <= ${schema.maximum}` });
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      errors.push({ path: at, message: `must be > ${schema.exclusiveMinimum}` });
    }
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push({ path: at, message: `must have at least ${schema.minLength} characters` });
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push({ path: at, message: `must have at most ${schema.maxLength} characters` });
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push({ path: at, message: 'has an invalid format' });
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push({ path: at, message: `must have at least ${schema.minItems} items` });
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push({ path: at, message: `must have at most ${schema.maxItems} items` });
    if (schema.items) {
      value.forEach((item, index) => errors.push(...validateAgainstSchema(item, schema.items, root, joinPath(path, index))));
    }
  }

  if (typeOf(value) === 'object') {
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push({ path: joinPath(path, key), message: 'is required' });
    }
    const properties = schema.properties ?? {};
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) errors.push(...validateAgainstSchema(child, properties[key], root, joinPath(path, key)));
      else if (schema.additionalProperties === false) errors.push({ path: joinPath(path, key), message: 'is not an allowed property' });
    }
  }
  return errors;
}
