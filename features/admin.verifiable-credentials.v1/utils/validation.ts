/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
    DID_PATTERN,
    FORMAT_ALGORITHM_MATRIX,
    ProofAlgorithm,
    VCFormat
} from "../constants/presentation-definition-constants";
import {
    CredentialRequirement,
    PresentationDefinitionFormData,
    ValidationError
} from "../models/presentation-definition-form";

/**
 * Validates the entire form and returns all errors.
 */
export function validateForm(form: PresentationDefinitionFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    // V001: Name validation
    if (!form.name || form.name.trim().length < 3) {
        errors.push({
            field: "name",
            message: "Name is required (minimum 3 characters)",
            severity: "error"
        });
    } else if (form.name.length > 100) {
        errors.push({
            field: "name",
            message: "Name must not exceed 100 characters",
            severity: "error"
        });
    }

    // V002: At least one credential
    if (!form.credentials || form.credentials.length === 0) {
        errors.push({
            field: "credentials",
            message: "Add at least one credential requirement",
            severity: "error"
        });
    }

    // V008: Purpose recommended
    if (!form.purpose || form.purpose.trim().length === 0) {
        errors.push({
            field: "purpose",
            message: "Purpose text is recommended for user consent",
            severity: "warning"
        });
    }

    // Validate each credential
    form.credentials.forEach((cred, index) => {
        errors.push(...validateCredentialRequirement(cred, index));
    });

    // V007: Check for duplicate IDs
    const ids = form.credentials.map(c => c.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicates.length > 0) {
        errors.push({
            field: "credentials",
            message: `Duplicate credential IDs found: ${duplicates.join(", ")}`,
            severity: "error"
        });
    }

    return errors;
}

/**
 * Validates a single credential requirement.
 */
export function validateCredentialRequirement(
    cred: CredentialRequirement,
    index: number
): ValidationError[] {
    const errors: ValidationError[] = [];
    const prefix = `credentials[${index}]`;

    // V003: Credential type required
    if (!cred.credentialType || cred.credentialType.trim().length === 0) {
        errors.push({
            field: `${prefix}.credentialType`,
            message: "Credential type is required",
            severity: "error"
        });
    }

    // V004: Format-algorithm compatibility
    if (!isValidFormatAlgorithmCombination(cred.format, cred.proofAlgorithm)) {
        errors.push({
            field: `${prefix}.proofAlgorithm`,
            message: `Algorithm "${cred.proofAlgorithm}" is not compatible with format "${cred.format}"`,
            severity: "error"
        });
    }

    // V005: Issuer DID validation (if provided)
    if (cred.issuerDids && cred.issuerDids.length > 0) {
        cred.issuerDids.forEach((did, didIndex) => {
            if (!isValidDid(did)) {
                errors.push({
                    field: `${prefix}.issuerDids[${didIndex}]`,
                    message: `Invalid DID format: "${did}". Expected: did:method:identifier`,
                    severity: "error"
                });
            }
        });
    }

    // V009: SD-JWT warning
    if (cred.format === VCFormat.SD_JWT_VC) {
        errors.push({
            field: `${prefix}.format`,
            message: "SD-JWT format may not be supported by all wallets",
            severity: "warning"
        });
    }

    // Validate claim constraints
    cred.claimConstraints.forEach((claim, claimIndex) => {
        // V006: Valid field names
        if (!claim.fieldName || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(claim.fieldName)) {
            errors.push({
                field: `${prefix}.claimConstraints[${claimIndex}].fieldName`,
                message: "Field name must be a valid identifier (letters, numbers, underscores)",
                severity: "error"
            });
        }
    });

    return errors;
}

/**
 * Checks if a format-algorithm combination is valid.
 */
export function isValidFormatAlgorithmCombination(
    format: VCFormat,
    algorithm: ProofAlgorithm
): boolean {
    const validAlgorithms = FORMAT_ALGORITHM_MATRIX[format];
    return validAlgorithms?.includes(algorithm) ?? false;
}

/**
 * Gets valid algorithms for a given format.
 */
export function getValidAlgorithmsForFormat(format: VCFormat): ProofAlgorithm[] {
    return FORMAT_ALGORITHM_MATRIX[format] || [];
}

/**
 * Validates a DID string.
 */
export function isValidDid(did: string): boolean {
    return DID_PATTERN.test(did);
}

/**
 * Checks if form has any blocking errors (not warnings).
 */
export function hasBlockingErrors(errors: ValidationError[]): boolean {
    return errors.some(e => e.severity === "error");
}

/**
 * Filters errors for a specific step.
 */
export function getErrorsForStep(
    errors: ValidationError[],
    step: number
): ValidationError[] {
    switch (step) {
        case 0: // Basic Info
            return errors.filter(e =>
                e.field === "name" ||
                e.field === "description" ||
                e.field === "purpose"
            );
        case 1: // Credentials
            return errors.filter(e =>
                e.field === "credentials" ||
                e.field.includes(".credentialType") ||
                e.field.includes(".name")
            );
        case 2: // Format & Proof
            return errors.filter(e =>
                e.field.includes(".format") ||
                e.field.includes(".proofAlgorithm") ||
                e.field.includes(".issuerDids")
            );
        case 3: // Constraints
            return errors.filter(e =>
                e.field.includes(".claimConstraints")
            );
        default:
            return errors;
    }
}

/**
 * Validates just the basic info step.
 */
export function validateBasicInfoStep(form: PresentationDefinitionFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!form.name || form.name.trim().length < 3) {
        errors.push({
            field: "name",
            message: "Name is required (minimum 3 characters)",
            severity: "error"
        });
    }

    if (!form.purpose || form.purpose.trim().length === 0) {
        errors.push({
            field: "purpose",
            message: "Purpose text is recommended",
            severity: "warning"
        });
    }

    return errors;
}

/**
 * Validates just the credentials step.
 */
export function validateCredentialsStep(form: PresentationDefinitionFormData): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!form.credentials || form.credentials.length === 0) {
        errors.push({
            field: "credentials",
            message: "Add at least one credential requirement",
            severity: "error"
        });
    }

    form.credentials.forEach((cred, index) => {
        if (!cred.credentialType || cred.credentialType.trim().length === 0) {
            errors.push({
                field: `credentials[${index}].credentialType`,
                message: "Credential type is required",
                severity: "error"
            });
        }
    });

    return errors;
}
