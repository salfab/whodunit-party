import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import mysterySchema from '../../schemas/mystery.schema.json';

// Singleton AJV instance for performance
let ajvInstance: Ajv | null = null;
let singleMysteryValidator: ValidateFunction | null = null;

function getAjv(): Ajv {
  if (!ajvInstance) {
    ajvInstance = new Ajv({ allErrors: true, verbose: true });
  }
  return ajvInstance;
}

function getSingleMysteryValidator(): ValidateFunction {
  if (!singleMysteryValidator) {
    // Extract the single mystery definition from the schema
    const singleMysterySchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
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
 * Validates a mystery against JSON schema
 */
function validateSchema(mystery: unknown): ValidationResult {
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
 * Validates business rules (role requirements)
 */
function validateBusinessRules(mystery: {
  title: string;
  character_sheets: Array<{ role: string }>;
}): ValidationResult {
  const errors: string[] = [];

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
 * Validates a mystery: schema + business rules
 */
export function validateMystery(mystery: unknown): ValidationResult {
  // First validate schema
  const schemaResult = validateSchema(mystery);
  if (!schemaResult.valid) {
    return schemaResult;
  }

  // Then validate business rules
  return validateBusinessRules(mystery as any);
}

/** @deprecated Use validateMystery instead */
export const validateMysteryFull = validateMystery;
