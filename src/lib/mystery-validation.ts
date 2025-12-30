import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import mysterySchema from '../../schemas/mystery.schema.json';

// Singleton AJV instance for performance
let ajvInstance: Ajv | null = null;
let mysteryArrayValidator: ValidateFunction | null = null;
let singleMysteryValidator: ValidateFunction | null = null;

function getAjv(): Ajv {
  if (!ajvInstance) {
    ajvInstance = new Ajv({ allErrors: true, verbose: true });
  }
  return ajvInstance;
}

function getMysteryArrayValidator(): ValidateFunction {
  if (!mysteryArrayValidator) {
    mysteryArrayValidator = getAjv().compile(mysterySchema);
  }
  return mysteryArrayValidator;
}

function getSingleMysteryValidator(): ValidateFunction {
  if (!singleMysteryValidator) {
    // Extract the single mystery definition from the schema
    const singleMysterySchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "Mystery",
      ...mysterySchema.definitions.mystery
    };
    singleMysteryValidator = getAjv().compile(singleMysterySchema);
  }
  return singleMysteryValidator;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  details?: ErrorObject[];
}

/**
 * Validates a single mystery object against the JSON schema
 */
export function validateMystery(mystery: unknown): ValidationResult {
  const validate = getSingleMysteryValidator();
  const valid = validate(mystery);

  if (valid) {
    return { valid: true };
  }

  const errors = validate.errors?.map((e) => {
    const path = e.instancePath || 'root';
    return `${path}: ${e.message}`;
  }) || [];

  return {
    valid: false,
    errors,
    details: validate.errors || undefined,
  };
}

/**
 * Validates an array of mysteries against the JSON schema
 */
export function validateMysteryArray(mysteries: unknown): ValidationResult {
  const validate = getMysteryArrayValidator();
  const valid = validate(mysteries);

  if (valid) {
    return { valid: true };
  }

  const errors = validate.errors?.map((e) => {
    const path = e.instancePath || 'root';
    return `${path}: ${e.message}`;
  }) || [];

  return {
    valid: false,
    errors,
    details: validate.errors || undefined,
  };
}

/**
 * Validates an array of mysteries and returns detailed results
 */
export function validateMysteries(mysteries: unknown[]): {
  valid: boolean;
  results: Array<{ index: number; title?: string; valid: boolean; errors?: string[] }>;
} {
  const results = mysteries.map((mystery, index) => {
    const result = validateMystery(mystery);
    return {
      index,
      title: typeof mystery === 'object' && mystery !== null ? (mystery as any).title : undefined,
      valid: result.valid,
      errors: result.errors,
    };
  });

  return {
    valid: results.every((r) => r.valid),
    results,
  };
}

/**
 * Additional business logic validations beyond JSON schema
 */
export function validateMysteryBusinessRules(mystery: {
  title: string;
  character_sheets: Array<{ role: string }>;
}): ValidationResult {
  const errors: string[] = [];

  // Check for required roles
  const roles = mystery.character_sheets.map((c) => c.role);
  
  if (!roles.includes('investigator')) {
    errors.push('Mystery must have at least one investigator character');
  }
  
  if (!roles.includes('guilty')) {
    errors.push('Mystery must have exactly one guilty character');
  }
  
  const guiltyCount = roles.filter((r) => r === 'guilty').length;
  if (guiltyCount > 1) {
    errors.push(`Mystery has ${guiltyCount} guilty characters, but should have exactly 1`);
  }

  const investigatorCount = roles.filter((r) => r === 'investigator').length;
  if (investigatorCount > 1) {
    errors.push(`Mystery has ${investigatorCount} investigators, but should have exactly 1`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Full validation: schema + business rules
 */
export function validateMysteryFull(mystery: unknown): ValidationResult {
  // First validate schema
  const schemaResult = validateMystery(mystery);
  if (!schemaResult.valid) {
    return schemaResult;
  }

  // Then validate business rules
  const businessResult = validateMysteryBusinessRules(mystery as any);
  return businessResult;
}
