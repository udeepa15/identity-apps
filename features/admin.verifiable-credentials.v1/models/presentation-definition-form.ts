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

import { ConstraintOperator, ProofAlgorithm, VCFormat } from "../constants/presentation-definition-constants";

/**
 * Single claim constraint in a credential requirement.
 */
export interface ClaimConstraint {
    /** Unique ID for React keys */
    id: string;
    /** Field name in credentialSubject (e.g., "email", "dateOfBirth") */
    fieldName: string;
    /** Constraint operator */
    operator: ConstraintOperator;
    /** Value(s) for comparison */
    value?: string | string[];
    /** Whether this claim is required */
    isRequired: boolean;
}

/**
 * Single credential requirement (maps to input_descriptor).
 */
export interface CredentialRequirement {
    /** Unique ID for React keys and JSON generation */
    id: string;
    /** Display name for this requirement */
    name: string;
    /** VC type (e.g., "IdentityCredential") */
    credentialType: string;
    /** Purpose text for this specific credential */
    purpose?: string;
    /** VC format */
    format: VCFormat;
    /** Proof/signature algorithm */
    proofAlgorithm: ProofAlgorithm;
    /** Optional issuer DID filters (trusted issuers) */
    issuerDids?: string[];
    /** Claim-level constraints */
    claimConstraints: ClaimConstraint[];
}

/**
 * Main form data model for the wizard.
 * Independent of the final JSON structure.
 */
export interface PresentationDefinitionFormData {
    /** Display name for IS console */
    name: string;
    /** Internal description */
    description?: string;
    /** Global purpose text (used if not overridden per credential) */
    purpose: string;
    /** List of credential requirements */
    credentials: CredentialRequirement[];
}

/**
 * Validation error structure.
 */
export interface ValidationError {
    /** Field path (e.g., "credentials[0].credentialType") */
    field: string;
    /** Error message */
    message: string;
    /** Error severity */
    severity: "error" | "warning";
}

/**
 * Wizard state for managing step navigation.
 */
export interface WizardState {
    /** Current step index */
    currentStep: number;
    /** Whether each step has been completed */
    completedSteps: boolean[];
    /** Validation errors per step */
    stepErrors: ValidationError[][];
}

/**
 * Default values for a new claim constraint.
 */
export const DEFAULT_CLAIM_CONSTRAINT: Partial<ClaimConstraint> = {
    operator: ConstraintOperator.EXISTS,
    isRequired: true
};

/**
 * Default values for a new credential requirement.
 */
export const DEFAULT_CREDENTIAL_REQUIREMENT: Partial<CredentialRequirement> = {
    format: VCFormat.JWT_VC_JSON,
    proofAlgorithm: ProofAlgorithm.EDDSA,
    claimConstraints: []
};

/**
 * Default values for the entire form.
 */
export const DEFAULT_FORM_DATA: PresentationDefinitionFormData = {
    name: "",
    description: "",
    purpose: "Please share the requested credentials to proceed.",
    credentials: []
};

/**
 * Generates a unique ID for form elements.
 */
export function generateId(prefix: string = "item"): string {
    return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Creates a new credential requirement with default values.
 */
export function createCredentialRequirement(
    credentialType: string = ""
): CredentialRequirement {
    const id = generateId("cred");
    return {
        id,
        name: credentialType || "New Credential",
        credentialType,
        format: VCFormat.JWT_VC_JSON,
        proofAlgorithm: ProofAlgorithm.EDDSA,
        claimConstraints: []
    };
}

/**
 * Creates a new claim constraint with default values.
 */
export function createClaimConstraint(fieldName: string = ""): ClaimConstraint {
    return {
        id: generateId("claim"),
        fieldName,
        operator: ConstraintOperator.EXISTS,
        isRequired: true
    };
}
